"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export const getAurinkoAuthUrl = async (
  serviceType: "Google" | "Office365",
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const params = new URLSearchParams({
    clientId: process.env.AURINKO_CLIENT_ID as string,
    serviceType,
    scopes: "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All",
    responseType: "code",
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`
  });
  console.log(`https://api.aurinko.io/v1/auth/authorize?${params.toString()}`);
  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};

export const exchangeCodeForAccessToken = async (code: string) => {
  try {
    const tokenUrl = `https://api.aurinko.io/v1/auth/token/${encodeURIComponent(code)}`;
    console.log("Exchanging code for token at:", tokenUrl);

    const response = await axios.post(
      tokenUrl,
      {},
      {
        auth: {
          username: process.env.AURINKO_CLIENT_ID as string,
          password: process.env.AURINKO_CLIENT_SECRET as string,
        },
      },
    );

    return response.data as {
      accountId: number;
      accessToken: string;
      userId: string;
      userSession: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Aurinko OAuth callback error:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    } else {
      console.error("Unexpected error during token exchange:", error);
    }
    throw error;
  }
};

export const getAccountDetails = async (accessToken: string) => {
  try {
    const response = await axios.get("https://api.aurinko.io/v1/account", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data as {
      email: string;
      name: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching account details:", error.response?.data);
    } else {
      console.error("Unexpected error fetching account details:", error);
    }

    throw new Error("Failed to fetch account details");
  }
};
