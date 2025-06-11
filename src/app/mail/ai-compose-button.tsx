// ai-compose-button.tsx
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
import { generateEmail } from "./action"; // Assuming action.ts exists and provides generateEmail
import { readStreamableValue } from "ai/rsc";

type Props = {
  onGenerate: (token: string) => void;
  isComposing?: boolean;
};

const AIComposeButton = (props: Props) => {
  const [open, setOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const aiGenerate = async () => {
    if (!prompt.trim()) {
      console.log("[AIComposeButton] Prompt is empty, returning.");
      return;
    }

    setIsGenerating(true);
    console.log("[AIComposeButton] Starting AI generation...");
    try {
      console.log("[AIComposeButton] Calling generateEmail server action with prompt:", prompt);
      const { output } = await generateEmail("", prompt);
      console.log("[AIComposeButton] Server action returned. Type of output:", typeof output, "Value:", output);

      // Check if output is truly a streamable value before iterating
      if (output) { // More robust check
        console.log("[AIComposeButton] Attempting to read streamable value...");
        let receivedAnyToken = false;
        for await (const token of readStreamableValue(output)) {
          // *** CRUCIAL CLIENT-SIDE LOG FOR RAW TOKEN RECEPTION ***
          // Log with quotes to clearly see empty strings, spaces, or non-printable characters.
          console.log("[AIComposeButton] Raw token from stream:", `"${token}"`);
          if (token) { // Only call onGenerate if the token is not empty
            receivedAnyToken = true;
            props.onGenerate(token);
          } else {
            console.log("[AIComposeButton] Received empty/null token from stream.");
          }
        }
        if (!receivedAnyToken) {
          console.log("[AIComposeButton] Stream finished, but no non-empty tokens were received.");
        } else {
          console.log("[AIComposeButton] Stream finished, tokens were received.");
        }
      } else {
        console.error("[AIComposeButton] 'output' is not a valid streamable value. Cannot read stream.");
      }

    } catch (error) {
      console.error("[AIComposeButton] AI generate error during stream consumption:", error);
    } finally {
      setIsGenerating(false);
      setOpen(false);
      setPrompt(""); // Clear prompt on close
      console.log("[AIComposeButton] AI generation process finished.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" onClick={() => setOpen(true)}>
          <Bot className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Compose</DialogTitle>
          <DialogDescription>
            AI will compose an email based on the context of your previous emails.
          </DialogDescription>

          <Textarea
            placeholder="What would you like to compose?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />

          <Button
            onClick={aiGenerate}
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