/* File: src/components/ReplyBox.tsx */
"use client";
import React, { useEffect, useState } from "react";
import EmailEditor from "./email-editor";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";
import { toast } from "sonner";

type Recipient = {
  label: string;
  value: string;
};

// ✅ ADDED: Define props for the component
type ReplyBoxProps = {
  onClose: () => void;
};

const ReplyBox = ({ onClose }: ReplyBoxProps) => { // ✅ MODIFIED: Accept and destructure onClose prop
  const [subject, setSubject] = useState("");
  const [toValues, setToValues] = useState<Recipient[]>([]);
  const [ccValues, setCcValues] = useState<Recipient[]>([]);
  const [inReplyTo, setInReplyTo] = useState<string | undefined>(undefined);

  const { threadId, accountId } = useThreads();

  const { data: replyDetails, isLoading } = api.account.getReplyDetails.useQuery(
    {
      threadId: threadId as string,
      accountId: accountId as string,
      replyType: "replyAll",
    },
    {
      enabled: !!threadId && !!accountId,
    },
  );

  useEffect(() => {
    if (replyDetails) {
      setToValues(replyDetails.to);
      setCcValues(replyDetails.cc);
      setInReplyTo(replyDetails.id);
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

  if (!account) return null;

  const handleSend = async (body: string) => {
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
        inReplyTo: inReplyTo,
      },
      {
        onSuccess: () => {
          toast.success("Reply sent successfully!");
          onClose(); // ✅ ADDED: Close the reply box on success
        },
        onError: (error) => {
          toast.error(`Failed to send reply: ${error.message}`);
        },
      },
    );
  };

  if (isLoading) {
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
        onClose={onClose} // ✅ ADDED: Pass onClose prop to EmailEditor
      />
    </div>
  );
};

export default ReplyBox;