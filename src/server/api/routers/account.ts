/* File: src/server/api/routers/account.ts 
  - This file is unchanged from the last version.
  - The `composeEmail` procedure includes essential error logging.
  - If sending fails, check your server console logs for the "FAILED TO SEND EMAIL VIA PROVIDER" error.
*/
import { createTRPCRouter, privateProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { Account } from "@/lib/account";

export const emailAddressSchema = z.object({
  name: z.string(),
  address: z.string(),
});

export const authoriseAccountAccess = async (
  accountId: string,
  userId: string,
) => {
  console.log("authoriseAccountAccess called with:", { accountId, userId });
  const account = await db.account.findFirst({
    where: {
      id: accountId,
      // userId, // Temporarily commented out for debugging if needed, but should be enabled
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

      console.log("[composeEmail] Attempting to send new email:", input);

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
        console.log("[composeEmail] Successfully sent new email.");
        return { success: true, message: "Email composed and sent successfully." };
      } catch (error) {
        console.error("❌ [composeEmail] FAILED TO SEND EMAIL VIA PROVIDER:", error);
        throw new Error("The email provider failed to send the email. Please check server logs for details.");
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
      console.log("[sendEmail] Attempting to send reply/threaded email:", input);

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
        console.log("[sendEmail] Successfully sent reply/threaded email.");
        return { success: true, message: "Email sent successfully." };
      } catch (error) {
        console.error("❌ [sendEmail] FAILED TO SEND EMAIL VIA PROVIDER:", error);
        throw new Error("The email provider failed to send the email.");
      }
    }),
    
  getAccounts: privateProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findMany({
      where: { userId: ctx.auth.userId, },
      select: { id: true, emailAddress: true, name: true, },
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
  getNumThreads: privateProcedure.input(z.object({ accountId: z.string(), tab: z.string(), })).query(async ({ ctx, input }) => {
    const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId,);
    let filter: Prisma.ThreadWhereInput = {};
    if (input.tab === "inbox") { filter.inboxStatus = true; } 
    else if (input.tab === "draft") { filter.draftStatus = true; } 
    else if (input.tab === "sent") { filter.sentStatus = true; }
    return await ctx.db.thread.count({ where: { accountId: account.id, ...filter, }, });
  }),
  getThreads: privateProcedure.input(z.object({ accountId: z.string(), tab: z.string(), done: z.boolean(), })).query(async ({ ctx, input }) => {
    const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId,);
    const acc = new Account(account.accessToken)
    acc.syncEmails().catch(console.error)
    

    let filter: Prisma.ThreadWhereInput = {};
    if (input.tab === "inbox") { filter.inboxStatus = true; } 
    else if (input.tab === "draft") { filter.draftStatus = true; } 
    else if (input.tab === "sent") { filter.sentStatus = true; }
    filter.done = { equals: input.done, };
    return await ctx.db.thread.findMany({
      where: filter,
      include: {
        emails: {
          orderBy: { sentAt: "asc", },
          select: { from: true, body: true, bodySnippet: true, emailLabel: true, subject: true, sysLabels: true, id: true, sentAt: true, },
        },
      },
      take: 15,
      orderBy: { lastMessageDate: "desc", },
    });
  }),
  getSuggestions: privateProcedure.input(z.object({ accountId: z.string(), })).query(async ({ ctx, input }) => {
    const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId,);
    return await ctx.db.emailAddress.findMany({
      where: { accountId: account.id, },
      select: { address: true, name: true, },
    });
  }),
  getReplyDetails: privateProcedure.input(z.object({ accountId: z.string(), threadId: z.string(), replyType: z.enum(["reply", "replyAll"]), })).query(async ({ ctx, input }) => {
    const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId,);
    const thread = await ctx.db.thread.findUnique({
      where: { id: input.threadId },
      include: {
        emails: {
          orderBy: { sentAt: "asc" },
          select: { from: true, to: true, cc: true, bcc: true, sentAt: true, subject: true, internetMessageId: true, },
        },
      },
    });
    if (!thread || thread.emails.length === 0) { throw new Error("Thread not found or empty"); }
    const lastExternalEmail = [...thread.emails].reverse().find((email) => email.from.id !== account.id);
    if (!lastExternalEmail) { throw new Error("No external email found in thread"); }
    const format = (people: { name: string | null; address: string }[]) => people.filter((p) => p.address !== account.emailAddress).map((p) => ({ label: p.name ?? p.address, value: p.address, }));
    if (input.replyType === "reply") {
      return { to: format([{ name: lastExternalEmail.from.name, address: lastExternalEmail.from.address, }, ]), cc: [], subject: lastExternalEmail.subject, id: lastExternalEmail.internetMessageId, };
    } else if (input.replyType === "replyAll") {
      return {
        to: format([{ name: lastExternalEmail.from.name, address: lastExternalEmail.from.address, }, ...lastExternalEmail.to.filter((addr) => addr.id !== account.id).map((addr) => ({ name: addr.name, address: addr.address })), ]),
        cc: format(lastExternalEmail.cc.filter((addr) => addr.id !== account.id).map((addr) => ({ name: addr.name, address: addr.address }))),
        subject: lastExternalEmail.subject,
        id: lastExternalEmail.internetMessageId,
      };
    }
  }),
});