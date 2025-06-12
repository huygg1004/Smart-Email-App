// ai-generate-util.ts (or ai-generate-util.tsx)
import { readStreamableValue } from "ai/rsc";
import { generateEmail } from "./action"; // Assuming action.ts exists and provides generateEmail

type OnGenerateCallback = (token: string) => void;
type OnFinishCallback = () => void;
type OnErrorCallback = (error: any) => void;

/**
 * Handles the AI email generation process, streaming tokens to a callback.
 *
 * @param context The contextual information for the AI (e.g., previous email content).
 * @param prompt The user's specific prompt for the AI.
 * @param onGenerate Callback to receive each generated token.
 * @param onFinish Optional callback to execute when the generation stream finishes (success or error).
 * @param onError Optional callback to execute if an error occurs during generation.
 */
export const generateEmailContent = async (
  context: string,
  prompt: string,
  onGenerate: OnGenerateCallback,
  onFinish?: OnFinishCallback,
  onError?: OnErrorCallback
) => {
  console.log("[AIUtil] Starting AI content generation...");
  try {
    console.log("[AIUtil] Calling generateEmail server action with prompt:", prompt);
    const { output } = await generateEmail(context, prompt);

    if (output) {
      console.log("[AIUtil] Attempting to read streamable value...");
      let receivedAnyToken = false;
      for await (const token of readStreamableValue(output)) {
        console.log("[AIUtil] Raw token from stream:", `"${token}"`);
        if (token) {
          receivedAnyToken = true;
          onGenerate(token);
        } else {
          console.log("[AIUtil] Received empty/null token from stream.");
        }
      }
      if (!receivedAnyToken) {
        console.log("[AIUtil] Stream finished, but no non-empty tokens were received.");
      } else {
        console.log("[AIUtil] Stream finished, tokens were received.");
      }
    } else {
      console.error(
        "[AIUtil] 'output' is not a valid streamable value. Cannot read stream.",
      );
      onError?.(new Error("AI output stream is invalid."));
    }
  } catch (error) {
    console.error("[AIUtil] AI generate error during stream consumption:", error);
    onError?.(error);
  } finally {
    onFinish?.();
    console.log("[AIUtil] AI content generation process finished.");
  }
};