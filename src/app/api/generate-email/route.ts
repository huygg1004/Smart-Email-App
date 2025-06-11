// app/api/generate-email/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Try edge if you're using Edge


export async function GET() {
    console.log("[ENV] OPENAI_API_KEY:", process.env.OPENAI_API_KEY?.slice(0, 10));
  const { textStream } = await streamText({
    model: openai("gpt-4o"),
    prompt: "Write a short poem about coffee.",
  });

  const reader = textStream.getReader();

  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += value;
  }

  return NextResponse.json({ result });
}
