/* File: src/lib/orama.ts - Clean Version */
import { type AnyOrama, create, insert, search, count } from "@orama/orama";
import { db } from "@/server/db";
import { restore, persist } from "@orama/plugin-data-persistence";

const oramaSchema = {
  id: "string",
  subject: "string",
  body: "string",
  rawBody: "string",
  from: "string",
  threadId: "string",
  sentAt: "string",
} as const;

export class OramaClient {
  private orama!: AnyOrama;
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  private validateDocument(document: any) {
    const doc = {
      id: (document.id || "").toString(),
      subject: (document.subject || "").toString().trim(),
      body: (document.body || "").toString().trim(),
      rawBody: (document.rawBody || document.body || "").toString().trim(),
      from: (document.from?.address || document.from || "").toString().trim(),
      threadId: (document.threadId || "").toString(),
      sentAt: document.sentAt ? new Date(document.sentAt).toISOString() : new Date().toISOString(),
    };

    if (!doc.id || !doc.threadId) {
      return null;
    }

    if (!doc.subject && !doc.body && !doc.from) {
      return null;
    }

    // Add default content if empty
    if (!doc.subject) doc.subject = "(No Subject)";
    if (!doc.body) doc.body = "(No Body)";
    if (!doc.rawBody) doc.rawBody = doc.body;
    if (!doc.from) doc.from = "(Unknown Sender)";

    return doc;
  }

  async saveIndex() {
    try {
      const index = await persist(this.orama, "json");
      await db.account.update({
        where: { id: this.accountId },
        data: { oramaIndex: index },
      });
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
      this.orama = await create({ schema: oramaSchema });
      await this.populateIndex();
      await this.saveIndex();
    } catch (error) {
      console.error(`Failed to initialize Orama for account ${this.accountId}:`, error);
      throw error;
    }
  }

  async getIndexStats() {
    try {
      const totalCount = await count(this.orama);
      return { totalCount };
    } catch (error) {
      console.error("Failed to get index stats:", error);
      return { totalCount: 0 };
    }
  }

  async populateIndex() {
    try {
      const emails = await db.email.findMany({
        where: {
          thread: { accountId: this.accountId },
        },
        include: {
          from: true,
          thread: {
            select: {
              id: true,
            }
          }
        },
        take: 100,
        orderBy: { sentAt: "desc" },
      });

      if (emails.length === 0) {
        return;
      }

      for (const email of emails) {
        const doc = this.validateDocument({
          id: email.id,
          subject: email.subject,
          body: email.body,
          rawBody: email.bodySnippet || email.body,
          from: email.from,
          threadId: email.thread?.id,
          sentAt: email.sentAt,
        });

        if (doc) {
          await insert(this.orama, doc);
        }
      }
    } catch (error) {
      console.error(`Failed to populate Orama index:`, error);
      throw error;
    }
  }

  async search(term: string) {
    if (!term || term.trim().length === 0) {
      return { hits: [], count: 0 };
    }

    const stats = await this.getIndexStats();
    
    if (stats.totalCount === 0) {
      return { hits: [], count: 0 };
    }

    try {
      const searchConfigs = [
        {
          term: term.trim(),
          properties: "*",
          limit: 10,
        },
        {
          term: term.trim(),
          properties: "*",
          limit: 10,
          threshold: 0,
        },
        {
          term: term.trim(),
          properties: "*",
          limit: 10,
          exact: true,
        }
      ];

      for (const config of searchConfigs) {
        try {
          const results = await search(this.orama, config);
          
          if (results.hits.length > 0) {
            return results;
          }
        } catch (searchError) {
          continue;
        }
      }

      return { hits: [], count: 0 };
      
    } catch (error) {
      console.error("Search failed:", error);
      return { hits: [], count: 0 };
    }
  }

  async insert(document: any) {
    try {
      const validatedDoc = this.validateDocument(document);
      
      if (!validatedDoc) {
        return;
      }

      await insert(this.orama, validatedDoc);
    } catch (error) {
      console.error(`Failed to insert document ${document.id}:`, error);
    }
  }

  async rebuildIndex() {
    try {
      this.orama = await create({ schema: oramaSchema });
      await this.populateIndex();
      await this.saveIndex();
    } catch (error) {
      console.error("Failed to rebuild index:", error);
      throw error;
    }
  }

  // Debug methods
  async debugDatabaseEmails() {
    try {
      const emailCount = await db.email.count({
        where: { thread: { accountId: this.accountId } },
      });

      return { emailCount };
    } catch (error) {
      console.error("Failed to debug database emails:", error);
      return { emailCount: 0 };
    }
  }

  async testSearch() {
    const stats = await this.getIndexStats();
    const testTerms = ["test", "email", "a", "the"];
    const results = {};
    
    for (const term of testTerms) {
      const searchResults = await this.search(term);
      results[term] = searchResults.count;
    }
    
    return results;
  }

  async debugIndexStructure() {
    const stats = await this.getIndexStats();
    return {
      totalDocuments: stats.totalCount,
      schema: Object.keys(oramaSchema),
    };
  }

  async rebuildAndTest() {
    await this.rebuildIndex();
    const results = await this.testSearch();
    return {
      success: true,
      message: "Index rebuilt and tested",
      testResults: results
    };
  }

  async searchWithDebug(term: string) {
    return await this.search(term);
  }
}