import OpenAI from "openai";               // OpenAI SDK
import { NextResponse } from "next/server";  // Next.js response helper

// Initialize OpenAI client with hardcoded API key
const openai = new OpenAI({
  apiKey: "none"
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
