import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { waitUntil } from "@vercel/functions";
import axios from "axios";

//Sends the received authorization code to Aurinko in exchange for an access token

export const GET = async (req: NextRequest) => {
  // authenticating user
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;

  const status = params.get("status");

  const code = params.get("code");

  if (!code)
    return NextResponse.json({ message: "No Code Provided" }, { status: 400 });

  try {
    console.log("Aurinko code received:", code);

    const token = await exchangeCodeForAccessToken(code);
    console.log("1. Raw token from exchangeCodeForAccessToken:", token); // CRITICAL LOG 1
    console.log("1a. Extracted accountId from token:", token.accountId); // CRITICAL LOG 1a
    const accountDetails = await getAccountDetails(token.accessToken);
    console.log("2. Account details from getAccountDetails:", accountDetails); // Helpful for verification

    // Save or update in DB
    await db.account.upsert({
      where: { userId: userId },
      update: {
        accessToken: token.accessToken,
        id: token.accountId.toString(),
      },
      create: {
        id: token.accountId.toString(),
        userId,
        emailAddress: accountDetails.email,
        name: accountDetails.name,
        accessToken: token.accessToken,
      },
    });
        const dbAccountAfterUpsert = await db.account.findUnique({
      where: { userId: userId }, // Use userId for lookup since it's unique
    });
    console.log("3. DB Account entry after upsert:", dbAccountAfterUpsert);
    if (dbAccountAfterUpsert) {
      console.log("3a. Account ID stored in DB:", dbAccountAfterUpsert.id); // Check stored ID
    } else {
      console.error("3b. Account was not found in DB immediately after upsert, something is wrong.");
    }

    console.log(
      "Insert/update account completed! now calling initial-sync api",
    );
        // CRITICAL LOG 4: Confirm the accountId being sent to initial-sync
    const accountIdToSend = token.accountId.toString();
    console.log("4. accountId being sent to /api/initial-sync:", accountIdToSend);

    waitUntil(
      axios
        .post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
          userId,
          accountId:accountIdToSend,
        })
        .then((response) => {
          console.log("Initial sync triggered", response.data);
        })
        .catch((error) => {
          console.error("Failed to trigger initial sync", error);
        }),
    );

    return NextResponse.redirect(new URL("/mail", req.url));
  } catch (error) {
    console.error("Aurinko OAuth callback error:", error);
    return NextResponse.json(
      { message: "Internal server error during Aurinko OAuth callback" },
      { status: 500 },
    );
  }
};
