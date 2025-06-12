// src/components/ReplyBox.tsx (Corrected)

"use client";
import React, { useEffect, useState } from "react";
import EmailEditor from "./email-editor";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";
import { toast } from "react-hot-toast";

// Define the type for recipient values for clarity
type Recipient = {
  label: string;
  value: string;
};

const ReplyBox = () => {
  const [subject, setSubject] = useState("");
  const [toValues, setToValues] = useState<Recipient[]>([]);
  const [ccValues, setCcValues] = useState<Recipient[]>([]);
  const [inReplyTo, setInReplyTo] = useState<string | undefined>(undefined);

  const { threadId, accountId } = useThreads();

  // Fetch reply-all details once to populate the editor
  const { data: replyDetails, isLoading } = api.account.getReplyDetails.useQuery(
    {
      threadId: threadId as string,
      accountId: accountId as string,
      replyType: "replyAll", // Use 'replyAll' to pre-fill To and Cc fields correctly
    },
    {
      enabled: !!threadId && !!accountId,
    },
  );

  useEffect(() => {
    if (replyDetails) {
      setToValues(replyDetails.to);
      setCcValues(replyDetails.cc);
      setInReplyTo(replyDetails.id); // Store the message ID for the 'In-Reply-To' header

      // Ensure the subject starts with "Re:"
      const rawSubject = replyDetails.subject || "";
      const isReply = rawSubject.trim().toLowerCase().startsWith("re:");
      setSubject(isReply ? rawSubject : `Re: ${rawSubject}`);
    }
  }, [replyDetails]);

  const sendEmailMutation = api.account.sendEmail.useMutation();
  const { data: account } = api.account.getById.useQuery(
    { id: accountId as string },
    { enabled: !!accountId },
  );

  if (!account) return null; // Or a loading/error state

  const handleSend = async (body: string) => {
    // Validate required fields before sending
    if (!accountId || !account.emailAddress) {
      toast.error("Account information is missing.");
      return;
    }
    if (toValues.length === 0) {
      toast.error("At least one recipient is required.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject is required.");
      return;
    }

    sendEmailMutation.mutate(
      {
        accountId,
        threadId: threadId ?? "",
        body,
        // USE THE STATE, NOT the original replyDetails
        subject: subject,
        from: {
          address: account.emailAddress,
          name: account.name || "",
        },
        to: toValues.map((to) => ({ address: to.value, name: to.label })),
        cc: ccValues.map((cc) => ({ address: cc.value, name: cc.label })),
        replyTo: {
          address: account.emailAddress,
          name: account.name || "",
        },
        inReplyTo: inReplyTo, // Use the stored message ID
      },
      {
        onSuccess: () => {
          toast.success("Reply sent successfully!");
        },
        onError: (error) => {
          toast.error(`Failed to send reply: ${error.message}`);
        },
      },
    );
  };

  if (isLoading) {
    // Your loading skeleton UI here...
    return <div>Preparing your reply editor...</div>;
  }

  return (
    <div>
      <EmailEditor
        subject={subject}
        setSubject={setSubject}
        toValues={toValues}
        setToValues={setToValues}
        ccValues={ccValues}
        setCcValues={setCcValues}
        to={toValues.map((v) => v.value)}
        handleSend={handleSend}
        isSending={sendEmailMutation.isPending}
        defaultToolbarExpanded={true}
      />
    </div>
  );
};

export default ReplyBox;