import { type AnyOrama, create, insert, search } from "@orama/orama";
import { db } from "@/server/db";
import { restore, persist } from "@orama/plugin-data-persistence";

export class OramaClient {
    private orama!: AnyOrama;
    private accountId: string;

    constructor(accountId: string) {
        this.accountId = accountId;
    }

    async saveIndex() {
        try {
            const index = await persist(this.orama, 'json');
            await db.account.update({
                where: {
                    id: this.accountId
                },
                data: {
                    oramaIndex: index
                }
            });
            console.log('Orama index saved successfully for account:', this.accountId);
        } catch (error) {
            console.error('Failed to save Orama index:', error);
        }
    }

    async initialize() {
        const account = await db.account.findUnique({
            where: {
                id: this.accountId,
            },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        try {
            if (account.oramaIndex) {
                console.log('Restoring existing Orama index for account:', this.accountId);
                this.orama = await restore("json", account.oramaIndex as any);
            } else {
                console.log('Creating new Orama index for account:', this.accountId);
                this.orama = await create({
                    schema: {
                        subject: "string",
                        body: "string",
                        rawBody: "string",
                        from: "string",
                        to: "string[]",
                        sentAt: "string",
                        threadId: "string",
                        emailId: "string", // Add email ID for better tracking
                    },
                });
                await this.populateIndex(); // Populate with existing emails
                await this.saveIndex();
            }
        } catch (error) {
            console.error('Failed to initialize Orama:', error);
            // Fallback: create new index if restore fails
            this.orama = await create({
                schema: {
                    subject: "string",
                    body: "string",
                    rawBody: "string",
                    from: "string",
                    to: "string[]",
                    sentAt: "string",
                    threadId: "string",
                    emailId: "string",
                },
            });
            await this.populateIndex();
            await this.saveIndex();
        }
    }

    // Add method to populate index with existing emails
    async populateIndex() {
        try {
            console.log('Populating Orama index with existing emails...');
            
            const emails = await db.email.findMany({
                where: {
                    thread: {
                        accountId: this.accountId
                    }
                },
                include: {
                    from: true,
                    to: true,
                    thread: true,
                },
                take: 1000, // Limit to prevent memory issues
                orderBy: {
                    sentAt: 'desc'
                }
            });

            console.log(`Found ${emails.length} emails to index`);

            for (const email of emails) {
                const document = {
                    subject: email.subject || '',
                    body: email.body || '',
                    rawBody: email.bodySnippet || '',
                    from: email.from?.address || '',
                    to: email.to?.map(addr => addr.address) || [],
                    sentAt: email.sentAt?.toISOString() || new Date().toISOString(),
                    threadId: email.threadId || '',
                    emailId: email.id,
                };

                await insert(this.orama, document);
            }

            console.log(`Successfully indexed ${emails.length} emails`);
        } catch (error) {
            console.error('Failed to populate Orama index:', error);
        }
    }

    async search(term: string) {
        if (!term || term.trim().length === 0) {
            return { hits: [] };
        }

        try {
            console.log('Searching for term:', term);
            
            const results = await search(this.orama, {
                term: term.trim(),
                properties: ["subject", "body", "rawBody", "from"],
                limit: 50,
                boost: {
                    subject: 3,
                    from: 2,
                    body: 1,
                },
                threshold: 0.1, // Lower threshold for more results
            });
            
            console.log(`Search for "${term}" returned ${results.hits?.length || 0} results`);
            return results;
        } catch (error) {
            console.error('Search failed:', error);
            return { hits: [] };
        }
    }

    async insert(document: any) {
        try {
            // Validate and clean document structure
            const validatedDoc = {
                subject: (document.subject || '').toString(),
                body: (document.body || '').toString(),
                rawBody: (document.rawBody || document.bodySnippet || '').toString(),
                from: (document.from || '').toString(),
                to: Array.isArray(document.to) ? 
                    //@ts-ignore
                    document.to.filter(Boolean).map(t => t.toString()) : 
                    [document.to].filter(Boolean).map(t => t.toString()),
                sentAt: document.sentAt || new Date().toISOString(),
                threadId: (document.threadId || '').toString(),
                emailId: (document.emailId || document.id || '').toString(),
            };

            await insert(this.orama, validatedDoc);
            console.log('Document inserted successfully:', validatedDoc.subject || validatedDoc.emailId);
        } catch (error) {
            console.error('Failed to insert document:', error);
            throw error;
        }
    }

    // Add method to rebuild index
    async rebuildIndex() {
        try {
            console.log('Rebuilding Orama index...');
            
            this.orama = await create({
                schema: {
                    subject: "string",
                    body: "string", 
                    rawBody: "string",
                    from: "string",
                    to: "string[]",
                    sentAt: "string",
                    threadId: "string",
                    emailId: "string",
                },
            });

            await this.populateIndex();
            await this.saveIndex();
            
            console.log('Index rebuilt successfully');
        } catch (error) {
            console.error('Failed to rebuild index:', error);
            throw error;
        }
    }
}