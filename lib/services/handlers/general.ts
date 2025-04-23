import { generateChatCompletion } from "@/lib/adapters/openai/api";
import {
  HARPER_FALLBACK_RESPONSE,
  HARPER_SYSTEM_PROMPT,
} from "@/lib/config/harper";
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
    { role: "system", content: HARPER_SYSTEM_PROMPT },
    { role: "user", content: context.message },
  ]);

  return {
    text: content || HARPER_FALLBACK_RESPONSE,
  };
}
