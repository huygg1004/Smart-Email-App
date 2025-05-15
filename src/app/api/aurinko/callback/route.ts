import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";

export const GET = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const params = req.nextUrl.searchParams;

  console.log("Request URL", req.nextUrl.toString())
  console.log("First few parameters", params)

  const status = params.get("status");

//   if (status != "success")
//     return NextResponse.json(
//       { message: "Failed to link account" },
//       { status: 400 },
//     );

  const code = params.get("code");
  if (!code)
    return NextResponse.json({ message: "No Code Provided" }, { status: 400 });

  try {
    console.log("Aurinko code received:", code);

    // Use your aurinko.ts helper to exchange code for token
    
    const token = await exchangeCodeForAccessToken(code);
    console.log(token);

    console.log("Token received:", token);

    // Use your aurinko.ts helper to get account details
    const accountDetails = await getAccountDetails(token.accessToken);

    // Save or update in DB
    await db.account.upsert({
      where: { id: token.accountId.toString() },
      update: {
        accessToken: token.accessToken,
      },
      create: {
        id: token.accountId.toString(),
        userId,
        emailAddress: accountDetails.email,
        name: accountDetails.name,
        accessToken: token.accessToken,
      },
    });

    return NextResponse.redirect(new URL("/mail", req.url));
  } catch (error) {
    console.error("Aurinko OAuth callback error:", error);
    return NextResponse.json(
      { message: "Internal server error during Aurinko OAuth callback" },
      { status: 500 },
    );
  }
};