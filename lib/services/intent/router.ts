import { IntentContext, IntentResponse } from "@/lib/types/intent";
import { detectIntentType } from "./detector";
import { handleGeneralIntent } from "@/lib/services/handlers/general";
import { handleLinearIntent } from "@/lib/services/handlers/linear";
import { handleWelcomeIntent } from "@/lib/services/handlers/welcome";

/**
 * Routes a message to the appropriate intent handler
 */
export async function routeIntent(
  context: IntentContext
): Promise<IntentResponse> {
  const intentType = await detectIntentType(context.message);

  switch (intentType) {
    case "welcome":
      return handleWelcomeIntent(context);
    case "linear":
      return handleLinearIntent(context);
    case "github":
      return {
        text: "GitHub handling is not yet implemented.",
      };
    default:
      return handleGeneralIntent(context);
  }
}
