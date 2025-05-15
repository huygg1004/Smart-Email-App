import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";


export const POST = async (req: NextRequest) => {
  const { accessToken, accountId, userId, userSession } = await req.json();

  try {
    // Use the token to fetch account info from Aurinko
    const accountDetails = await getAccountDetails(accessToken);

    await db.account.upsert({
      where: { id: accountId.toString() },
      update: {
        accessToken,
        emailAddress: accountDetails.email,
        name: accountDetails.name,
      },
      create: {
        id: accountId.toString(),
        userId: userId || "unknown",
        emailAddress: accountDetails.email,
        name: accountDetails.name,
        accessToken,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save Aurinko token:", error);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
};
