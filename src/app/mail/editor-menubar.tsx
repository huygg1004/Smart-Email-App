import React from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
} from "lucide-react";
import { Editor } from "@tiptap/react";

type Props = {
  editor: Editor;
};

const EditorMenuBar = ({ editor }: Props) => {
  if (!editor) return null;

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const color = e.target.value;
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border p-2">
      {/* Basic formatting */}
      <button onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={18} />
      </button>

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={18} />
      </button>

      {/* Lists & blockquote */}
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={18} />
      </button>

      {/* Undo/Redo */}
      <button onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={18} />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={18} />
      </button>

      {/* Alignment */}
      <button onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={18} />
      </button>

      {/* Color dropdown */}
      <div className="flex items-center gap-1">
        <Palette size={18} />
        <select
          onChange={handleColorChange}
          defaultValue=""
          className="rounded border px-1 py-0.5 text-sm"
        >
          <option value="">🎨 Text Color</option>
          <option value="#000000">⬛ Black</option>
          <option value="#ef4444">🟥 Red</option>
          <option value="#3b82f6">🟦 Blue</option>
          <option value="#22c55e">🟩 Green</option>
          <option value="#eab308">🟨 Yellow</option>
          <option value="#6b7280">⬜ Gray</option>
          <option value="#ffffff">⬜ White</option>
        </select>
      </div>
    </div>
  );
};

export default EditorMenuBar;
