"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AIChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "👋 How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "⚠️ Failed to get response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[250px] max-w-md flex-col rounded-xl border border-gray-300 bg-white shadow-md dark:bg-gray-900 dark:border-gray-700">
      <div className="p-2 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
        💬 AI Assistant
      </div>

      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-tight whitespace-pre-wrap ${
              msg.role === "user"
                ? "ml-auto bg-blue-100 text-gray-900 dark:bg-blue-600 dark:text-white"
                : "mr-auto bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input box */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm outline-none focus:border-blue-400 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          type="text"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
