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
});
