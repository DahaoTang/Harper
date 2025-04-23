import { IntentContext, IntentResponse } from "@/lib/types/intent";
import { HARPER_INTRODUCTION } from "@/lib/config/harper";

/**
 * Handles welcome messages when users first interact with Harper
 */
export async function handleWelcomeIntent(
  context: IntentContext
): Promise<IntentResponse> {
  console.log(`Sending welcome message to ${context.channel}`);

  return {
    text: HARPER_INTRODUCTION,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: HARPER_INTRODUCTION,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "I can help you with:",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• *General questions* about the ProteHome project\n• *Linear tasks* - create, find, update, or delete cards\n• And more capabilities coming soon!",
        },
      },
    ],
  };
}
