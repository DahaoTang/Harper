import { generateChatCompletion } from "@/lib/adapters/openai/api";
import { IntentType } from "@/lib/types/intent";

/**
 * Detects the intent type from a message using OpenAI
 */
export async function detectIntentType(message: string): Promise<IntentType> {
  const prompt = `Classify the following Slack message into one of: "general", "linear", or "github".
  
Message: "${message}"
Intent:`;

  const result = await generateChatCompletion(
    [{ role: "user", content: prompt }],
    "gpt-4"
  );

  const intentText = result?.toLowerCase().trim() || "";

  if (intentText.includes("linear")) return "linear";
  if (intentText.includes("github")) return "github";
  return "general";
}
