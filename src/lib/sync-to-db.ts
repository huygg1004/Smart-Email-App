/* File: src/server/lib/sync-emails-to-database.ts */
import { db } from "@/server/db";
import type {
  EmailMessage,
  EmailAddress,
  EmailAttachment,
} from "@/types";
import { OramaClient } from "./orama";
import { Prisma } from "@prisma/client";

/**
 * Main function to synchronize a batch of emails from a provider to the local database and search index.
 * @param emails - An array of email messages to be synced.
 * @param accountId - The ID of the account these emails belong to.
 */
export async function syncEmailsToDatabase(
  emails: EmailMessage[],
  accountId: string,
) {
  // 1. Initialize the Orama client for the specific account.
  // This will either create a new index or restore the existing one from the database.
  const orama = new OramaClient(accountId);
  await orama.initialize();

  console.log(`Syncing ${emails.length} emails for account ${accountId}`);

  try {
    for (const email of emails) {
      // 2. For each email, upsert its data into the relational database (Prisma).
      await upsertEmail(email, accountId);

      // 3. Concurrently, insert a structured document for the email into the in-memory Orama index.
      await orama.insert({
        id: email.id, // Pass the email's unique ID for idempotent inserts
        subject: email.subject || '',
        body: email.body || '',
        rawBody: email.bodySnippet || '',
        from: email.from?.address || '',
        to: email.to?.map(to => to.address) || [],
        sentAt: email.sentAt,
        threadId: email.threadId || ''
      });
    }

    // 4. ✅ CRITICAL FIX: After processing all emails in the batch, persist the updated
    // in-memory Orama index back to the database.
    await orama.saveIndex();

    console.log(`Email sync and index persistence completed successfully for ${emails.length} emails.`);
  } catch (error) {
    console.error("Error during the email sync process:", error);
    // Depending on requirements, you might want to re-throw or handle it.
    throw error;
  }
}

/**
 * Upserts a single email message and its related data (addresses, thread, etc.) into the database.
 * @param email - The email message object.
 * @param accountId - The ID of the parent account.
 */
async function upsertEmail(
  email: EmailMessage,
  accountId: string,
) {
  try {
    let emailLabelType: "inbox" | "sent" | "draft" = "inbox";

    if (email.sysLabels.includes("sent")) {
      emailLabelType = "sent";
    } else if (email.sysLabels.includes("draft")) {
      emailLabelType = "draft";
    }

    // 1. Collect all unique email addresses from the email to avoid redundant DB operations.
    const addressesToUpsert = new Map<string, EmailAddress>();
    const allRawAddresses = [
      email.from,
      ...(email.to ?? []),
      ...(email.cc ?? []),
      ...(email.bcc ?? []),
      ...(email.replyTo ?? []),
    ];

    for (const address of allRawAddresses) {
      if (address?.address) {
        addressesToUpsert.set(address.address, address);
      }
    }

    // Upsert all unique addresses and create a map of `address string -> DB record`.
    const upsertedAddresses = await Promise.all(
      Array.from(addressesToUpsert.values()).map(addr => upsertEmailAddress(addr, accountId))
    );

    const addressMap = new Map(
      upsertedAddresses
        .filter(Boolean)
        .map((address) => [address!.address, address!]),
    );

    const fromAddress = addressMap.get(email.from.address);
    if (!fromAddress) {
      console.warn(`Could not find or create 'from' address for email ID ${email.id}. Skipping.`);
      return;
    }

    // Map relation IDs
    const toAddresses = (email.to ?? []).map((addr) => addressMap.get(addr.address)).filter(Boolean);
    const ccAddresses = (email.cc ?? []).map((addr) => addressMap.get(addr.address)).filter(Boolean);
    const bccAddresses = (email.bcc ?? []).map((addr) => addressMap.get(addr.address)).filter(Boolean);
    const replyToAddresses = (email.replyTo ?? []).map((addr) => addressMap.get(addr.address)).filter(Boolean);

    // 2. Upsert the Thread
    const threadParticipantIds = [
      ...new Set([
        fromAddress.id,
        ...toAddresses.map((a) => a!.id),
        ...ccAddresses.map((a) => a!.id),
        ...bccAddresses.map((a) => a!.id),
      ]),
    ];

    const thread = await db.thread.upsert({
      where: { id: email.threadId },
      update: {
        subject: email.subject,
        lastMessageDate: new Date(email.sentAt),
        participantIds: threadParticipantIds,
      },
      create: {
        id: email.threadId,
        accountId,
        subject: email.subject,
        done: false,
        draftStatus: emailLabelType === "draft",
        inboxStatus: emailLabelType === "inbox",
        sentStatus: emailLabelType === "sent",
        lastMessageDate: new Date(email.sentAt),
        participantIds: threadParticipantIds,
      },
    });

    // 3. Upsert the Email itself
    await db.email.upsert({
      where: { id: email.id },
      update: {
        // Fields that can change
        lastModifiedTime: new Date(),
        sysLabels: email.sysLabels,
        keywords: email.keywords,
        hasAttachments: email.hasAttachments,
        body: email.body,
        bodySnippet: email.bodySnippet,
        // Relations
        to: { set: toAddresses.map((a) => ({ id: a!.id })) },
        cc: { set: ccAddresses.map((a) => ({ id: a!.id })) },
        bcc: { set: bccAddresses.map((a) => ({ id: a!.id })) },
        replyTo: { set: replyToAddresses.map((a) => ({ id: a!.id })) },
      },
      create: {
        id: email.id,
        emailLabel: emailLabelType,
        threadId: thread.id,
        createdTime: new Date(email.createdTime),
        lastModifiedTime: new Date(),
        sentAt: new Date(email.sentAt),
        receivedAt: new Date(email.receivedAt),
        internetMessageId: email.internetMessageId,
        subject: email.subject,
        sysLabels: email.sysLabels,
        internetHeaders: (email.internetHeaders as any) ?? Prisma.JsonNull,
        keywords: email.keywords,
        fromId: fromAddress.id,
        hasAttachments: email.hasAttachments,
        body: email.body,
        bodySnippet: email.bodySnippet,
        // Connect relations
        to: { connect: toAddresses.map((a) => ({ id: a!.id })) },
        cc: { connect: ccAddresses.map((a) => ({ id: a!.id })) },
        bcc: { connect: bccAddresses.map((a) => ({ id: a!.id })) },
        replyTo: { connect: replyToAddresses.map((a) => ({ id: a!.id })) },
      },
    });

    // 4. Upsert any Attachments
    if (email.attachments && email.attachments.length > 0) {
      await Promise.all(
          email.attachments.map(attachment => upsertAttachment(email.id, attachment))
      );
    }

  } catch (error) {
    console.error(
      `Error upserting email (ID: ${email.id}) for account ${accountId}:`,
      error,
    );
  }
}

/**
 * Finds an existing EmailAddress or creates a new one.
 * @param address - The address object.
 * @param accountId - The ID of the parent account.
 */
async function upsertEmailAddress(address: EmailAddress, accountId: string) {
  try {
    return await db.emailAddress.upsert({
      where: {
        accountId_address: {
          accountId,
          address: address.address,
        },
      },
      update: {
        name: address.name,
      },
      create: {
        address: address.address,
        name: address.name,
        raw: address.raw,
        accountId,
      },
    });
  } catch (error) {
    console.error(`Failed to upsert email address '${address.address}':`, error);
    throw error;
  }
}

/**
 * Upserts an email attachment record.
 * @param emailId - The ID of the parent email.
 * @param attachment - The attachment object.
 */
async function upsertAttachment(emailId: string, attachment: EmailAttachment) {
  try {
    await db.emailAttachment.upsert({
      where: { id: attachment.id ?? "" },
      update: {
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
      },
      create: {
        id: attachment.id,
        emailId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
        // Note: 'content' is often too large for a DB record and should be stored in blob storage.
        // content: attachment.content,
      },
    });
  } catch (error) {
    console.log(`Failed to upsert attachment for email ${emailId}:`, error);
  }
}