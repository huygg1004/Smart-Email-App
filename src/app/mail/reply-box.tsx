"use client";
import React, { useEffect, useState } from "react";
import EmailEditor from "./email-editor";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";

const ReplyBox = () => {
  const [subject, setSubject] = useState("");
  const [toValues, setToValues] = useState<{ label: string; value: string }[]>([]);
  const [ccValues, setCcValues] = useState<{ label: string; value: string }[]>([]);
  const [isSending, setIsSending] = useState(false);

  const { threadId, accountId } = useThreads();

  const { data, isLoading } = api.account.getReplyDetails.useQuery(
    {
      threadId: threadId as string,
      accountId: accountId as string,
      replyType: "replyAll",
    },
    {
      enabled: !!threadId && !!accountId,
    }
  );

  useEffect(() => {
    if (data) {
      setToValues(data.to);
      setCcValues(data.cc);

      const rawSubject = data.subject || "";
      const normalizedSubject = rawSubject.trim().toLowerCase();
      const isReply = normalizedSubject.startsWith("re:");
      const replySubject = isReply ? data.subject : `Re: ${data.subject}`;
      setSubject(replySubject);
    }
  }, [data]);

  const handleSend = (value: string) => {
    setIsSending(true);
    console.log("Sending:", value);
    setTimeout(() => setIsSending(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 border border-gray-200 rounded-md bg-white shadow-sm">
        <p className="text-base font-semibold text-gray-600">
          Preparing your reply editor...
        </p>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-20 bg-gray-200 rounded w-full" />
          <div className="h-10 bg-gray-300 rounded w-24 mt-4" />
        </div>
      </div>
    );
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
        isSending={isSending}
        defaultToolbarExpanded={true}
      />
    </div>
  );
};

export default ReplyBox;
