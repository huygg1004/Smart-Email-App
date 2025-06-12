"use server";

import { createStreamableValue } from "ai/rsc";
import OpenAI from "openai";

const openai = new OpenAI({
  // Change: Use environment variable for API key
  apiKey: 'nonenone' // Use environment variable instead of hardcoded key
});

export async function generateEmail(context: string, prompt: string) {
  const stream = createStreamableValue("");
  console.log("[generateEmail] Creating stream...");

  const now = new Date().toLocaleString();

  const fullPrompt = `
You are an AI email assistant embedded in a smart email client app. Your role is to help the user **compose** professional, relevant, and well-written emails.

The current date and time is: ${now}

Start of context block:
${context}
End of context block.

User prompt:
${prompt}

== INSTRUCTIONS ==

1. Respond with the full email body only — do **not** include subject, headers, or meta-comments.
2. Be helpful, clever, and articulate.
3. Use the provided context block to inform your response. If context is missing, generate a polite and professional draft that requests any missing information.
4. Do **not** invent or speculate on details not explicitly mentioned in the context or user prompt.
5. Focus solely on the user’s intent and their writing goal. Avoid off-topic responses.
6. Never include meta comments like “Here’s your email” or “Hope this helps.”
7. Match the tone and level of formality to the email thread when possible.
8. Keep language clear, concise, and natural — avoid fluff or generic AI filler.
9. If the user is replying to an email, write in a natural reply format, referring to the context where appropriate.

Only return the email body.
`.trim();

  (async () => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: fullPrompt },
        ],
        stream: true,
      });

      // Process the streaming response
      for await (const part of response) {
        const textPart = part.choices?.[0]?.delta?.content;
        if (textPart) {
          console.log("[generateEmail] Token:", textPart);
          // Update the stream with individual tokens
          stream.update(textPart);
        }
      }

    } catch (err) {
      console.error("[generateEmail] Error reading stream:", err);
    } finally {
      stream.done();
      console.log("[generateEmail] Stream finished");
    }
  })();

  // Return the stream itself, not stream.value
  return { output: stream.value };
}