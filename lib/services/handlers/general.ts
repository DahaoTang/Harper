import { generateChatCompletion } from "@/lib/adapters/openai/api";
import { IntentContext, IntentResponse } from "@/lib/types/intent";

/**
 * Handles general conversational intent
 */
export async function handleGeneralIntent(
  context: IntentContext
): Promise<IntentResponse> {
  // Log for debugging purposes
  console.log(
    `Handling general intent from ${context.channel}: ${context.message}`
  );

  const content = await generateChatCompletion([
    { role: "user", content: context.message },
  ]);

  return {
    text: content || "I'm not sure how to respond to that.",
  };
}
