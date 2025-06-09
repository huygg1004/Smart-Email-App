import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { Account } from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";

export const POST = async (req: NextRequest) => {
  console.log("Entering Initial-sync api......");
  const body = await req.json();
  const { accountId, userId } = body;

  console.log("accountId:", accountId);
  console.log("userId:", userId);
  
  if (!accountId || !userId)
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  const dbAccount = await db.account.findUnique({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!dbAccount)
    return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });

  const account = new Account(dbAccount.accessToken);
  const response = await account.performInitialSync();

  if (!response)
    return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });

  console.log("User Account found", userId);
  console.log("Database Account found and details: ", dbAccount);

  const { emails, deltaToken } = response;

  await db.account.update({
    where: {
      id: accountId,
    },
    data: {
      nextDeltaToken: deltaToken,
    },
  });
  console;

  // console.log("emails list: ", emails);

  await syncEmailsToDatabase(emails, accountId);

  console.log("sync completed", deltaToken);

  return NextResponse.json({ success: true }, { status: 200 });
};
