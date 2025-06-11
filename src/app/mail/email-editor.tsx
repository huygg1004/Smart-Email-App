// email-editor.tsx
"use client";
import React, { useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Text } from "@tiptap/extension-text";
import EditorMenuBar from "./editor-menubar"; // Assuming this path is correct
import { Separator } from "@radix-ui/react-separator"; // Assuming this path is correct
import { Button } from "@/components/ui/button"; // Assuming this path is correct
import TagInput from "./tag-input"; // Assuming this path is correct
import { Input } from "@/components/ui/input"; // Assuming this path is correct
import AIComposeButton from "./ai-compose-button"; // Assuming this path is correct

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
  const [expanded, setExpanded] = React.useState<boolean>(false);

  const CustomText = useMemo(
    () =>
      Text.extend({
        addKeyboardShortcuts() {
          return {
            "Meta-j": () => {
              console.log("[EmailEditor] Meta-j pressed");
              return true;
            },
          };
        },
      }),
    [],
  );

  const editor = useEditor({
    autofocus: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CustomText,
    ],
    content: "<p>Hello, start typing here...</p>",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setValue(html); // keep it in sync
    },
  });

  const onGenerate = (token: string) => {
    // *** CRUCIAL CLIENT-SIDE LOG FOR TOKEN RECEIVED BY EDITOR COMPONENT ***
    // Log with quotes to clearly see empty strings, spaces, or non-printable characters.
    console.log("[EmailEditor] onGenerate called with token:", `"${token}"`);
    if (editor) {
      console.log("[EmailEditor] Editor is available, attempting to insert content...");
      try {
        editor.commands.insertContent(token);
        // Crucial for streamed content: ensure editor is focused and cursor is at the end
        // This helps append tokens sequentially and keeps them visible.
        editor.commands.focus('end');
        console.log("[EmailEditor] Successfully called insertContent with token:", `"${token}"`);
      } catch (insertError) {
        console.error("[EmailEditor] Error inserting content into editor:", insertError);
      }
    } else {
      console.warn("[EmailEditor] Editor is null/undefined when onGenerate was called. Cannot insert content.");
    }
  };

  if (!editor) {
    console.log("[EmailEditor] Editor not initialized yet.");
    return null;
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden">
      <div className="shrink-0 flex-grow-0 overflow-hidden border p-4">
        <EditorMenuBar editor={editor} />
        <div className="space-y-2 overflow-hidden p-4 pb-0">
          {expanded && (
            <>
              <TagInput
                label="To: "
                onChange={setToValues}
                placeholder="Add Recipients"
                value={toValues}
              />
              <TagInput
                label="Cc: "
                onChange={setCcValues}
                placeholder="Add Recipients"
                value={ccValues}
              />
              <Input
                id="subject"
                className="w-full"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </>
          )}
          <div
            onClick={() => setExpanded(!expanded)}
            className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100"
          >
            <span className="font-semibold text-green-600">Draft</span>
            <span className="truncate">
              to {to.length > 0 ? to.join(", ") : "nobody"}
            </span>
            <svg
              className={`ml-1 h-4 w-4 text-gray-500 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <AIComposeButton
            isComposing={defaultToolbarExpanded}
            onGenerate={onGenerate}
          />
        </div>

        <div className="prose mt-4 max-w-none flex-1 overflow-y-auto">
          <EditorContent editor={editor} className="tiptap" />
        </div>
      </div>
      <Separator />
      <div className="flex shrink-0 flex-grow-0 items-center justify-between px-4 py-3">
        <span className="text-sm">
          Tip: Press{" "}
          <kbd className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800">
            Cmd + J
          </kbd>{" "}
          for AI autocomplete
        </span>
        <Button
          onClick={async () => {
            editor?.commands?.clearContent();
            await handleSend(value);
          }}
          disabled={isSending}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default EmailEditor;