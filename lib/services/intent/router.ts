import { IntentContext, IntentResponse } from "@/lib/types/intent";
import { detectIntentType } from "./detector";
import { handleGeneralIntent } from "@/lib/services/handlers/general";

/**
 * Routes a message to the appropriate intent handler
 */
export async function routeIntent(
  context: IntentContext
): Promise<IntentResponse> {
  const intentType = await detectIntentType(context.message);

  switch (intentType) {
    case "linear":
      return {
        text: "Linear handling is not yet implemented.",
      };
    case "github":
      return {
        text: "GitHub handling is not yet implemented.",
      };
    default:
      return handleGeneralIntent(context);
  }
}
