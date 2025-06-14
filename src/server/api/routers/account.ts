/* File: src/server/api/routers/account.ts */
import { createTRPCRouter, privateProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { Account } from "@/lib/account";
import { OramaClient } from "@/lib/orama";

export const emailAddressSchema = z.object({
  name: z.string(),
  address: z.string(),
});

export const authoriseAccountAccess = async (
  accountId: string,
  userId: string,
) => {
  const account = await db.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
    select: {
      id: true,
      emailAddress: true,
      name: true,
      accessToken: true,
    },
  });
  if (!account) throw new Error("Account not found or access denied.");
  return account;
};

export const accountRouter = createTRPCRouter({
  // ✅ ADDED: New procedure to fetch a single thread by ID
  getThreadById: privateProcedure
    .input(z.object({ accountId: z.string(), threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const thread = await db.thread.findUnique({
        where: { id: input.threadId, accountId: input.accountId },
        include: {
          emails: {
            orderBy: { sentAt: "asc" },
            select: {
              from: true,
              to: true,
              cc: true,
              bcc: true,
              body: true,
              bodySnippet: true,
              subject: true,
              sysLabels: true,
              id: true,
              sentAt: true,
              internetMessageId: true,
            },
          },
        },
      });
      if (!thread) {
        throw new Error("Thread not found.");
      }
      return thread;
    }),

  searchEmails: privateProcedure
    .input(z.object({ accountId: z.string(), query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.query.trim().length < 2) {
        return { hits: [], count: 0 };
      }
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const orama = new OramaClient(input.accountId);
      await orama.initialize();
      const results = await orama.search(input.query);
      return results;
    }),

  getById: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.account.findUnique({
        where: { id: input.id },
        select: { id: true, emailAddress: true, name: true },
      });
      if (!account) {
        throw new Error("Account not found");
      }
      return account;
    }),

  composeEmail: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        to: z.array(emailAddressSchema),
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        replyTo: emailAddressSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      const emailClient = new Account(account.accessToken);
      try {
        await emailClient.sendEmail({
          body: input.body,
          subject: input.subject,
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          from: input.from,
          replyTo: input.replyTo,
        });
        return {
          success: true,
          message: "Email composed and sent successfully.",
        };
      } catch (error) {
        console.error(
          "❌ [composeEmail] FAILED TO SEND EMAIL VIA PROVIDER:",
          error,
        );
        throw new Error(
          "The email provider failed to send the email. Please check server logs for details.",
        );
      }
    }),

  sendEmail: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        to: z.array(emailAddressSchema),
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        replyTo: emailAddressSchema,
        inReplyTo: z.string().optional(),
        threadId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      const emailClient = new Account(account.accessToken);
      try {
        await emailClient.sendEmail({
          body: input.body,
          subject: input.subject,
          threadId: input.threadId,
          to: input.to,
          bcc: input.bcc,
          cc: input.cc,
          replyTo: input.replyTo,
          from: input.from,
          inReplyTo: input.inReplyTo,
        });
        return { success: true, message: "Email sent successfully." };
      } catch (error) {
        console.error(
          "❌ [sendEmail] FAILED TO SEND EMAIL VIA PROVIDER:",
          error,
        );
        throw new Error("The email provider failed to send the email.");
      }
    }),

  getAccounts: privateProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findMany({
      where: { userId: ctx.auth.userId },
      select: { id: true, emailAddress: true, name: true },
    });
  }),

  getAccountIdByUser: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const account = await ctx.db.account.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!account) throw new Error("Account not found");
    return account.id;
  }),

  getNumThreads: privateProcedure
    .input(z.object({ accountId: z.string(), tab: z.string() }))
    .query(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      let filter: Prisma.ThreadWhereInput = {};
      if (input.tab === "inbox") {
        filter.inboxStatus = true;
      } else if (input.tab === "draft") {
        filter.draftStatus = true;
      } else if (input.tab === "sent") {
        filter.sentStatus = true;
      }
      return await ctx.db.thread.count({
        where: { accountId: input.accountId, ...filter },
      });
    }),

  getThreads: privateProcedure
    .input(
      z.object({ accountId: z.string(), tab: z.string(), done: z.boolean() }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      const acc = new Account(account.accessToken);
      acc.syncEmails().catch(console.error);

      let filter: Prisma.ThreadWhereInput = {};
      if (input.tab === "inbox") {
        filter.inboxStatus = true;
      } else if (input.tab === "draft") {
        filter.draftStatus = true;
      } else if (input.tab === "sent") {
        filter.sentStatus = true;
      }
      filter.done = { equals: input.done };
      return await ctx.db.thread.findMany({
        where: { accountId: account.id, ...filter },
        include: {
          emails: {
            orderBy: { sentAt: "asc" },
            select: {
              from: true,
              to: true,
              cc: true,
              bcc: true,
              body: true,
              bodySnippet: true,
              emailLabel: true,
              subject: true,
              sysLabels: true,
              id: true,
              sentAt: true,
              internetMessageId: true,
            },
          },
        },
        take: 15,
        orderBy: { lastMessageDate: "desc" },
      });
    }),

  getSuggestions: privateProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      return await ctx.db.emailAddress.findMany({
        where: { accountId: input.accountId },
        select: { address: true, name: true },
      });
    }),
  rebuildSearchIndex: privateProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const orama = new OramaClient(input.accountId);
      await orama.rebuildIndex();
      return { success: true, message: "Search index rebuilt successfully" };
    }),

  debugSearchIndex: privateProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const orama = new OramaClient(input.accountId);
      await orama.initialize();

      // Debug database emails
      const dbStats = await orama.debugDatabaseEmails();

      // Get index stats
      const indexStats = await orama.getIndexStats();

      // Test searches
      await orama.testSearch();

      return {
        databaseEmailCount: dbStats.emailCount,
        indexDocumentCount: indexStats.totalCount,
        message: "Check server logs for detailed debug information",
      };
    }),

  testSearch: privateProcedure
    .input(z.object({ accountId: z.string(), term: z.string() }))
    .query(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const orama = new OramaClient(input.accountId);
      await orama.initialize();

      const results = await orama.search(input.term);
      return {
        term: input.term,
        count: results.count,
        hits: results.hits.map((hit) => ({
          id: hit.document.id,
          subject: hit.document.subject,
          from: hit.document.from,
          score: hit.score,
        })),
      };
    }),

  getReplyDetails: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(["reply", "replyAll"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          emails: {
            orderBy: { sentAt: "asc" },
            select: {
              from: true,
              to: true,
              cc: true,
              bcc: true,
              sentAt: true,
              subject: true,
              internetMessageId: true,
            },
          },
        },
      });
      if (!thread || thread.emails.length === 0) {
        throw new Error("Thread not found or empty");
      }
      const lastExternalEmail = [...thread.emails]
        .reverse()
        .find((email) => email.from.address !== account.emailAddress);
      if (!lastExternalEmail) {
        throw new Error("No external email found in thread");
      }
      const format = (people: { name: string | null; address: string }[]) =>
        people
          .filter((p) => p.address !== account.emailAddress)
          .map((p) => ({ label: p.name ?? p.address, value: p.address }));
      if (input.replyType === "reply") {
        return {
          to: format([
            {
              name: lastExternalEmail.from.name,
              address: lastExternalEmail.from.address,
            },
          ]),
          cc: [],
          subject: lastExternalEmail.subject ?? "No Subject",
          id: lastExternalEmail.internetMessageId,
        };
      } else if (input.replyType === "replyAll") {
        return {
          to: format([
            {
              name: lastExternalEmail.from.name,
              address: lastExternalEmail.from.address,
            },
            ...lastExternalEmail.to
              .filter((addr) => addr.address !== account.emailAddress)
              .map((addr) => ({ name: addr.name, address: addr.address })),
          ]),
          cc: format(
            lastExternalEmail.cc
              .filter((addr) => addr.address !== account.emailAddress)
              .map((addr) => ({ name: addr.name, address: addr.address })),
          ),
          subject: lastExternalEmail.subject ?? "No Subject",
          id: lastExternalEmail.internetMessageId,
        };
      }
    }),
  debugSearchIndexDetailed: privateProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const orama = new OramaClient(input.accountId);
      await orama.initialize();

      // Run detailed debugging
      const structureDebug = await orama.debugIndexStructure();
      const dbStats = await orama.debugDatabaseEmails();

      return {
        indexStructure: structureDebug,
        databaseStats: dbStats,
        message: "Check server logs for detailed debug information",
      };
    }),

  // Complete rebuild and test
  rebuildSearchIndexWithTest: privateProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const orama = new OramaClient(input.accountId);

      const result = await orama.rebuildAndTest();
      return result;
    }),

  // Enhanced search with debugging
  searchEmailsWithDebug: privateProcedure
    .input(z.object({ accountId: z.string(), query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.query.trim().length < 2) {
        return { hits: [], count: 0 };
      }
      await authoriseAccountAccess(input.accountId, ctx.auth.userId);
      const orama = new OramaClient(input.accountId);
      await orama.initialize();

      // Use the debug search method
      const results = await orama.searchWithDebug(input.query);
      return results;
    }),
});
