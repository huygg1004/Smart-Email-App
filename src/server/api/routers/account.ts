import { createTRPCRouter, privateProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client"; // Ensure this is imported if using Prisma types

export const authoriseAccountAccess = async (
  accountId: string,
  userId: string,
) => {
  console.log("authoriseAccountAccess called with:", { accountId, userId });
  const account = await db.account.findFirst({
    where: {
      id: accountId,
      //   userId,
    },
    select: {
      id: true,
      emailAddress: true,
      name: true,
      accessToken: true,
    },
  });
  if (!account) throw new Error("Account not found");
  return account;
};

export const accountRouter = createTRPCRouter({
  getAccounts: privateProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      select: {
        id: true,
        emailAddress: true,
        name: true,
      },
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
    .input(
      z.object({
        accountId: z.string(),
        tab: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      let filter: Prisma.ThreadWhereInput = {};
      console.log("Received tab for getNumThreads:", input.tab);

      if (input.tab === "inbox") {
        filter.inboxStatus = true;
      } else if (input.tab === "draft") {
        filter.draftStatus = true;
      } else if (input.tab === "sent") {
        filter.sentStatus = true;
      }

      return await ctx.db.thread.count({
        where: {
          accountId: account.id,
          ...filter,
        },
      });
    }),

  getThreads: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      let filter: Prisma.ThreadWhereInput = {};

      if (input.tab === "inbox") {
        filter.inboxStatus = true;
      } else if (input.tab === "draft") {
        filter.draftStatus = true;
      } else if (input.tab === "sent") {
        filter.sentStatus = true;
      }
      filter.done = {
        equals: input.done,
      };

      return await ctx.db.thread.findMany({
        where: filter,
        include: {
          emails: {
            orderBy: {
              sentAt: "asc",
            },
            select: {
              from: true,
              body: true,
              bodySnippet: true,
              emailLabel: true,
              subject: true,
              sysLabels: true,
              id: true,
              sentAt: true,
            },
          },
        },
        take: 15,
        orderBy: {
          lastMessageDate: "desc",
        },
      });
    }),

  getSuggestions: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      return await ctx.db.emailAddress.findMany({
        where: {
          accountId: account.id,
        },
        select: {
          address: true,
          name: true,
        },
      });
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
        .find((email) => email.from.id !== account.id);

      if (!lastExternalEmail) {
        throw new Error("No external email found in thread");
      }

      const format = (people: { name: string | null; address: string }[]) =>
        people
          .filter((p) => p.address !== account.emailAddress) // exclude sender
          .map((p) => ({
            label: p.name ?? p.address,
            value: p.address,
          }));

      if (input.replyType === "reply") {
        return {
          to: format([
            {
              name: lastExternalEmail.from.name,
              address: lastExternalEmail.from.address,
            },
          ]),
          cc: [],
          subject: lastExternalEmail.subject,
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
              .filter((addr) => addr.id !== account.id)
              .map((addr) => ({ name: addr.name, address: addr.address })),
          ]),
          cc: format(
            lastExternalEmail.cc
              .filter((addr) => addr.id !== account.id)
              .map((addr) => ({ name: addr.name, address: addr.address })),
          ),
          subject: lastExternalEmail.subject,
          id: lastExternalEmail.internetMessageId,
        };
      }
    }),
});
