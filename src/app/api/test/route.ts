import OpenAI from "openai";               // OpenAI SDK
import { NextResponse } from "next/server";  // Next.js response helper

// Initialize OpenAI client with hardcoded API key
const openai = new OpenAI({
  apiKey: "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",
});

export async function GET() {
  console.log("[GET] /api/test - Request received");
  console.log("[OpenAI] Using API key starting with:", openai.apiKey.slice(0, 10));

  try {
    const prompt = "Write a short poem about coffee.";
    console.log(`[OpenAI] Calling OpenAI chat.completions.create with prompt: "${prompt}"`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("OpenAI returned empty response");
    }

    console.log("[OpenAI] Received text:", text);

    return NextResponse.json({ result: text });

  } catch (error) {
    console.error("[OpenAI Error]", error);
    return NextResponse.json({ error: "OpenAI call failed" }, { status: 500 });
  }
}
