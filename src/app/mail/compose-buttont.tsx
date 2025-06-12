/* File: src/components/ComposeButton.tsx
  - This file is unchanged and correctly calls the `composeEmail` mutation.
*/
"use client";
import React, { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import EmailEditor from "./email-editor";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";
import { toast } from "react-hot-toast";

type Recipient = {
  label: string;
  value: string;
};

const ComposeButton = () => {
  const [toValues, setToValues] = useState<Recipient[]>([]);
  const [ccValues, setCcValues] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const { accountId } = useThreads();
  
  const composeEmailMutation = api.account.composeEmail.useMutation();

  const { data: account } = api.account.getById.useQuery(
    { id: accountId as string },
    { enabled: !!accountId },
  );

  const handleSend = async (value: string) => {
    if (!accountId) {
      toast.error("Account ID is missing");
      return;
    }
    if (!account?.emailAddress) {
      toast.error("Account email address is missing");
      return;
    }
    const contentWithoutTags = value.replace(/<[^>]*>/g, "").trim();
    if (contentWithoutTags === "") {
      toast.error("Please write some content before sending");
      return;
    }
    if (toValues.length === 0) {
      toast.error("At least one recipient is required");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    const emailData = {
      accountId: accountId,
      body: value,
      subject: subject.trim(),
      from: {
        address: account.emailAddress,
        name: account.name || "",
      },
      to: toValues.map((to) => ({
        address: to.value,
        name: to.label || to.value,
      })),
      cc: ccValues.map((cc) => ({
        address: cc.value,
        name: cc.label || cc.value,
      })),
      replyTo: {
        address: account.emailAddress,
        name: account.name || "",
      },
    };

    console.log("✅ Sending payload to `composeEmail`:", emailData);

    composeEmailMutation.mutate(emailData, {
        onSuccess: (data) => {
            console.log("✅ Email sent successfully!", data);
            toast.success(data.message || "Email sent successfully!");
            setSubject("");
            setToValues([]);
            setCcValues([]);
            setIsOpen(false);
        },
        onError: (error) => {
            console.error("❌ Error sending email:", error);
            toast.error(`Failed to send email: ${error.message}`);
        }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSubject("");
      setToValues([]);
      setCcValues([]);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Pencil className="mr-1 size-4" />
          Compose
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Compose Email</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <EmailEditor
            toValues={toValues}
            ccValues={ccValues}
            subject={subject}
            setToValues={setToValues}
            setCcValues={setCcValues}
            setSubject={setSubject}
            to={toValues.map((to) => to.value)}
            handleSend={handleSend}
            isSending={composeEmailMutation.isPending}
            defaultToolbarExpanded={true}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ComposeButton;