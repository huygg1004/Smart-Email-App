/* File: src/components/EmailEditor.tsx
  - [FIXED] I have removed the `readOnly={true}` property from the Subject input field.
  - [FIXED] I also removed the gray background and cursor-not-allowed styling.
  - The subject is now fully editable in both the Compose and Reply views.
*/
"use client";
import React, { useMemo, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Extension } from "@tiptap/core";
import EditorMenuBar from "./editor-menubar";
import { Separator } from "@radix-ui/react-separator";
import { Button } from "@/components/ui/button";
import TagInput from "./tag-input";
import { Input } from "@/components/ui/input";
import AIComposeButton from "./ai-compose-button";
import { generateEmailContent } from "./ai-generate-util";
import useThreads from "@/hooks/use-threads";
import { turndown } from "@/lib/turndown";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {
  subject: string;
  setSubject: (value: string) => void;
  toValues: { label: string; value: string }[];
  setToValues: (value: { label: string; value: string }[]) => void;
  ccValues: { label: string; value: string }[];
  setCcValues: (value: { label: string; value: string }[]) => void;
  to: string[];
  handleSend: (value: string) => void;
  isSending: boolean;
  defaultToolbarExpanded?: boolean;
};

const EmailEditor = ({
  subject,
  setSubject,
  toValues,
  setToValues,
  ccValues,
  setCcValues,
  to,
  handleSend,
  isSending,
  defaultToolbarExpanded,
}: Props) => {
  const [value, setValue] = React.useState<string>("");
  const [expanded, setExpanded] = React.useState<boolean>(
    defaultToolbarExpanded ?? true,
  );

  const [isAiAutocompleting, setIsAiAutocompleting] = React.useState(false);

  const { threads, threadId, account } = useThreads();
  const thread = threads?.find((t) => t.id === threadId);

  const handleAiAutoComplete = useCallback(
    async (editor: any) => {
      if (!editor || isAiAutocompleting) return;

      const currentContent = editor.getText();
      let context: string = "";

      if (thread?.emails && thread.emails.length > 0) {
        for (const email of thread.emails) {
          const emailContent = `
  Subject: ${email.subject}
  From: ${email.from.address}
  Sent: ${new Date(email.sentAt).toLocaleString()}
  Body: ${turndown.turndown(email.body ?? email.bodySnippet ?? "")}
  `;
          context += emailContent;
        }
      }

      if (subject) context += `\nCurrent email subject: ${subject}`;
      if (to.length > 0) context += `\nCurrent email recipients: ${to.join(", ")}`;
      if (account) context += `\nMy name is ${account.name} and my email is ${account.emailAddress}`;
      context += `\nCurrent draft content: ${currentContent}`;
      setIsAiAutocompleting(true);

      try {
        await generateEmailContent(
          context,
          "Continue writing this email naturally based on the context. Complete the thought or add the next logical part of the email. Do not repeat what's already written.",
          (token: string) => {
            if (editor && !editor.isDestroyed) {
              editor.chain().focus().insertContent(token).run();
            }
          },
          () => setIsAiAutocompleting(false),
          (error) => {
            console.error("[EmailEditor] AI Autocomplete Error:", error);
            setIsAiAutocompleting(false);
          },
        );
      } catch (error) {
        console.error("[EmailEditor] AI Autocomplete Error:", error);
        setIsAiAutocompleting(false);
      }
    },
    [isAiAutocompleting, thread, subject, to, account],
  );

  const AiAutocompleteExtension = useMemo(() => {
    return Extension.create({
      name: "aiAutocomplete",
      addKeyboardShortcuts() {
        return {
          "Alt-j": ({ editor }) => {
            handleAiAutoComplete(editor);
            return true;
          },
        };
      },
    });
  }, [handleAiAutoComplete]);

  const editor = useEditor({
    autofocus: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      AiAutocompleteExtension,
    ],
    content: "",
    onUpdate: ({ editor }) => setValue(editor.getHTML()),
  });

  const onGenerate = useCallback(
    (token: string) => {
      if (editor && !editor.isDestroyed) {
        try {
          editor.chain().focus().insertContent(token).run();
        } catch (err) {
          console.error("[EmailEditor] Error inserting content:", err);
        }
      }
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden rounded-lg border shadow-sm">
      <div className="border-b bg-gray-50 px-4 py-2">
        <EditorMenuBar editor={editor} />
      </div>

      <div className="space-y-3 bg-white p-4">
        {expanded && (
          <>
            <TagInput label="To" onChange={setToValues} placeholder="Add recipients" value={toValues} />
            <TagInput label="Cc" onChange={setCcValues} placeholder="Add recipients" value={ccValues} />
            <Input
              id="subject"
              className="font-bold text-md"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </>
        )}
        <div className="flex items-center justify-between">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <span className="font-medium text-green-600">Draft</span>
            <span className="truncate">to {to.length > 0 ? to.join(", ") : "nobody"}</span>
            <svg className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-4 py-3">
        <EditorContent editor={editor} className="prose tiptap max-w-none" />
      </div>

      <Separator />

      <div className="flex flex-col items-center justify-between gap-4 border-t bg-gray-50 px-4 py-3 sm:flex-row">
        <div className="flex w-full justify-start gap-2 sm:w-auto">
          <AIComposeButton isComposing={defaultToolbarExpanded} onGenerate={onGenerate} />
          <Button
            onClick={async () => {
              const emailContent = editor?.getHTML() || value || "";
              const contentWithoutTags = emailContent.replace(/<[^>]*>/g, "").trim();
              if (!emailContent || emailContent === "<p></p>" || contentWithoutTags === "") {
                toast.error("Please write something before sending");
                return;
              }
              try {
                await handleSend(emailContent);
                editor?.commands.clearContent();
              } catch (error) {
                console.error("❌ Failed to send email:", error);
              }
            }}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
        <span className="w-full text-right text-xs text-gray-500 sm:w-auto">
          Tip: Press{" "}
          <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-800">
            Alt + J
          </kbd>{" "}
          for AI autocomplete{" "}
          {isAiAutocompleting && (<span className="animate-pulse text-blue-600"> (AI is thinking...)</span>)}
        </span>
      </div>
    </div>
  );
};

export default EmailEditor;
