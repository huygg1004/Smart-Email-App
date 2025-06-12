/* File: src/server/lib/orama.ts */
import { type AnyOrama, create, insert, search, count } from "@orama/orama";
import { db } from "@/server/db";
import { restore, persist } from "@orama/plugin-data-persistence";


const oramaSchema = {
  id: { type: "string" },
  subject: { type: "string" },
  body: { type: "string" },
  rawBody: { type: "string" },
  from: { type: "string" },
  to: { type: "string" }, // Flatten to comma-separated string or something similar
  sentAt: { type: "string" },
  threadId: { type: "string" },
} as const;

export class OramaClient {
  private orama!: AnyOrama;
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  async saveIndex() {
    try {
      // NOTE: In a high-concurrency environment, you might want to use a distributed lock (e.g., Redis)
      // before saving to prevent race conditions.
      const index = await persist(this.orama, 'json');
      await db.account.update({
        where: { id: this.accountId },
        data: { oramaIndex: index },
      });
      console.log(`Orama index saved successfully for account: ${this.accountId}`);
    } catch (error) {
      console.error(`Failed to save Orama index for account ${this.accountId}:`, error);
    }
  }

  async initialize() {
    const account = await db.account.findUnique({
      where: { id: this.accountId },
    });

    if (!account) {
      throw new Error(`Account not found: ${this.accountId}`);
    }

    try {
      if (account.oramaIndex) {
        console.log(`Restoring existing Orama index for account: ${this.accountId}`);
        this.orama = await restore("json", account.oramaIndex as any);
      } else {
        console.log(`Creating new Orama index for account: ${this.accountId}`);
        this.orama = await create({ schema: oramaSchema });
        await this.populateIndex();
        await this.saveIndex();
      }
    } catch (error) {
      console.error(`Failed to initialize Orama for account ${this.accountId}. Rebuilding index.`, error);
      // Fallback: create new index if restore fails
      await this.rebuildIndex();
    }
  }

  async populateIndex() {
    try {
      console.log(`Populating Orama index for account ${this.accountId} with existing emails...`);
      const emails = await db.email.findMany({
        where: {
          thread: { accountId: this.accountId }
        },
        include: { from: true, to: true, thread: true, },
        take: 1000, // Process in chunks if necessary
        orderBy: { sentAt: 'desc' }
      });

      console.log(`Found ${emails.length} emails to index`);

      const documents = emails.map(email => ({
        id: email.id,
        subject: email.subject || '',
        body: email.body || '',
        rawBody: email.bodySnippet || '',
        from: email.from?.address || '',
        to: email.to?.map(addr => addr.address) || [],
        sentAt: email.sentAt?.toISOString() || new Date().toISOString(),
        threadId: email.threadId || '',
      }));

      await insert(this.orama, documents);
      console.log(`Successfully indexed ${await count(this.orama)} total documents.`);
    } catch (error) {
      console.error(`Failed to populate Orama index for account ${this.accountId}:`, error);
    }
  }

  async search(term: string) {
    if (!term || term.trim().length === 0) {
      return { hits: [], count: 0 };
    }

    try {
      console.log(`Searching for term: "${term}"`);
      const results = await search(this.orama, {
        term: term.trim(),
        properties: ["subject", "body", "from"],
        limit: 50,
        boost: { subject: 3, from: 2, body: 1 },
        threshold: 0.2, // Adjust threshold for relevance
      });
      console.log(`Search for "${term}" returned ${results.count} results`);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return { hits: [], count: 0 };
    }
  }

  async insert(document: any) {
    try {
      const validatedDoc = {
        id: (document.id || document.emailId).toString(), // ✅ Ensure ID is present
        subject: (document.subject || '').toString(),
        body: (document.body || '').toString(),
        rawBody: (document.rawBody || document.bodySnippet || '').toString(),
        from: (document.from?.address || document.from || '').toString(),
        //@ts-ignore
        to: Array.isArray(document.to) ? document.to.map(t => (t.address || t).toString()) : [],
        sentAt: document.sentAt?.toISOString() || new Date().toISOString(),
        threadId: (document.threadId || '').toString(),
      };
      await insert(this.orama, validatedDoc);
    } catch (error) {
      console.error('Failed to insert document:', { id: document.id, error });
    }
  }

  async rebuildIndex() {
    try {
      console.log(`Rebuilding Orama index for account ${this.accountId}...`);
      //@ts-ignore
      this.orama = await create({ schema: oramaSchema });
      await this.populateIndex();
      await this.saveIndex();
      console.log('Index rebuilt successfully');
    } catch (error) {
      console.error('Failed to rebuild index:', error);
      throw error;
    }
  }
}