"use client";

import React from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useThreads from "@/hooks/use-threads";
import { turndown } from "@/lib/turndown";
import { generateEmailContent } from "./ai-generate-util"; // Import the new utility

type Props = {
  onGenerate: (token: string) => void;
  isComposing?: boolean;
};

const AIComposeButton = (props: Props) => {
  const [open, setOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("Write a professional reply to the email in context.");
  const { threads, threadId, account } = useThreads();
  const thread = threads?.find((t) => t.id === threadId);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleAiGenerate = async () => {
    let context: string | undefined = "";

    if (props.isComposing) {
      for (const email of thread?.emails ?? []) {
        const content = `
        Subject: ${email.subject}
        From: ${email.from.address}
        Sent: ${new Date(email.sentAt).toLocaleString()}
        Body: ${turndown.turndown(email.body ?? email.bodySnippet ?? "")}
        `;
        context += content;
      }
    }
    context += `My name is ${account?.name} and my email is ${account?.emailAddress}`;

    setIsGenerating(true);
    console.log("[AIComposeButton] Starting AI generation...");

    // Call the shared utility function
    await generateEmailContent(
      context,
      prompt,
      props.onGenerate,
      () => setIsGenerating(false), // Callback to set loading state to false
      () => setOpen(false) // Callback to close dialog
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiGenerate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
        >
          <Bot className="size-5" />
          Use AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Compose</DialogTitle>
          <DialogDescription>
            AI will compose an email based on the context of your previous
            emails.
          </DialogDescription>

          <Textarea
            placeholder="What would you like to compose?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />

          <Button
            onClick={handleAiGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AIComposeButton;