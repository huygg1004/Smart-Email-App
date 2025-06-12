/* File: src/lib/embedding.ts */
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, " "),
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error("Embedding not found in OpenAI response.");
    }

    // Optional: Validate embedding length
    if (embedding.length !== 1536) {
        console.warn(`Expected embedding length 1536, but got ${embedding.length}`);
    }


    return embedding as number[];
  } catch (error) {
    console.error("Error calling OpenAI embeddings API:", error);
    throw error;
  }
}

// Example usage to test the function
(async () => {
  try {
    const embeddings = await getEmbeddings('hello world');
    console.log(embeddings.length);
  } catch (error) {
    console.error("Failed to get embeddings:", error);
  }
})();