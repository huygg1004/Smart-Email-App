import {
  type SyncUpdatedResponse,
  type SyncResponse,
  type EmailMessage,
} from "@/types";

import axios from "axios";
import { db } from "@/server/db";
import { syncEmailsToDatabase } from "./sync-to-db";

export class Account {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async startSync() {
    const response = await axios.post<SyncResponse>(
      "https://api.aurinko.io/v1/email/sync",

      {},

      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },

        params: {
          daysWithin: 2,

          bodyType: "html",
        },
      },
    );

    return response.data;
  }

  async getUpdatedEmails({
    deltaToken,

    pageToken,
  }: {
    deltaToken?: string;

    pageToken?: string;
  }) {
    console.log("Entering getUpdatedEmails API Call.......");

    let params: Record<string, string> = {};

    if (deltaToken) params.deltaToken = deltaToken;

    if (pageToken) params.pageToken = pageToken;

    console.log("delta token display: ", params.deltaToken);

    console.log("page  token display: ", params.pageToken);

    console.log("Sending request to getUpdatedEmails with:", {
      deltaToken,

      pageToken,
    });

    console.log("Access token ", this.token);

    const response = await axios.get<SyncUpdatedResponse>(
      "https://api.aurinko.io/v1/email/sync/updated",

      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },

        params,
      },
    );

    return response.data;
  }
async syncEmails() {
  const account = await db.account.findUnique({
    where: { accessToken: this.token },
  });
  if (!account) throw new Error("Account not found");
  if (!account.nextDeltaToken) throw new Error("Account not ready for sync");

  let response = await this.getUpdatedEmails({
    deltaToken: account.nextDeltaToken,
  });

  let storedDeltaToken = response.nextDeltaToken ?? account.nextDeltaToken;
  let allEmails: EmailMessage[] = response.records ?? [];

  while (response.nextPageToken) {
    response = await this.getUpdatedEmails({ pageToken: response.nextPageToken });
    allEmails = allEmails.concat(response.records ?? []);
    storedDeltaToken = response.nextDeltaToken ?? storedDeltaToken;
  }

  try {
    await syncEmailsToDatabase(allEmails, account.id);
  } catch (error) {
    console.error('Error during sync: ', error);
    // You might want to rethrow or handle retry logic here
  }

  await db.account.update({
    where: { id: account.id },
    data: {
      nextDeltaToken: storedDeltaToken
    }
  });

  return {
    emails: allEmails,
    deltaToken: storedDeltaToken
  };
}


  async performInitialSync() {
    try {
      let syncResponse = await this.startSync();

      while (!syncResponse.ready) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        syncResponse = await this.startSync();
      } //logging sync response

      console.log(
        "Raw Initial sync response: ",
        JSON.stringify(syncResponse, null, 2),
      );
      let storedDeltaToken: string = syncResponse.syncUpdatedToken;

      let updatedResponse = await this.getUpdatedEmails({
        deltaToken: storedDeltaToken,
      });

      if (updatedResponse.nextDeltaToken) {
        storedDeltaToken = updatedResponse.nextDeltaToken;
      }

      let allEmails: EmailMessage[] = updatedResponse.records;

      while (updatedResponse.nextPageToken) {
        updatedResponse = await this.getUpdatedEmails({
          pageToken: updatedResponse.nextPageToken,
        });

        allEmails = allEmails.concat(updatedResponse.records);

        if (updatedResponse.nextDeltaToken) {
          storedDeltaToken = updatedResponse.nextDeltaToken;
        }
      }

      console.log(
        "initial sync completed, we have synced",

        allEmails.length,

        "emails",
      );

      return {
        emails: allEmails,

        deltaToken: storedDeltaToken,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Axios error config:",

          JSON.stringify(error.config, null, 2),
        );

        console.error(
          "Axios error response data:",

          JSON.stringify(error.response?.data, null, 2),
        );

        console.error("Axios error status:", error.response?.status);
      } else {
        console.error("Unknown error during sync", error);
      }
    }
  }
  async sendEmail({
    from,
    subject,
    body,
    inReplyTo,
    references,
    threadId,
    to,
    cc,
    bcc,
    replyTo,
  }: {
    from: EmailAddress;
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string;
    threadId?: string;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    replyTo?: EmailAddress;
  }) {
    try {
      const response = await axios.post(
        "https://api.aurinko.io/v1/email/messages",
        {
          from,
          subject,
          body,
          inReplyTo,
          references,
          threadId,
          to,
          cc,
          bcc,
          replyTo: replyTo ? [replyTo] : undefined,
        },
        {
          params: {
            returnIds: true,
          },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      console.log("sendmail", response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error sending email:",
          JSON.stringify(error.response?.data, null, 2),
        );
      } else {
        console.error("Error sending email:", error);
      }
      throw error;
    }
  }
}

type EmailAddress = {
  name: string;
  address: string;
};
