import { generateChatCompletion } from "@/lib/adapters/openai/api";
import { IntentContext, IntentResponse } from "@/lib/types/intent";
import { LinearOperation } from "@/lib/types/linear";
import {
  createCard,
  findCard,
  updateCard,
  deleteCard,
} from "@/lib/adapters/linear/api";

/**
 * Main handler for Linear intents
 */
export async function handleLinearIntent(
  context: IntentContext
): Promise<IntentResponse> {
  // Log for debugging purposes
  console.log(
    `Handling Linear intent from ${context.channel}: ${context.message}`
  );

  // Parse the operation from the message directly (no conversation state)
  const operation = await parseLinearOperation(context.message);

  // Execute the appropriate operation
  try {
    switch (operation.type) {
      case "create":
        return await handleCreateCard(operation);
      case "find":
        return await handleFindCard(operation);
      case "update":
        return await handleUpdateCard(operation);
      case "delete":
        return await handleDeleteCard(operation);
      case "unknown":
        // Return the error message if we couldn't parse the operation
        return {
          text: `❓ ${
            operation.error ||
            "I'm not sure what Linear operation you want to perform. Please try again with clearer instructions."
          }`,
        };
      default:
        return formatHelpResponse();
    }
  } catch (error) {
    console.error("Linear operation failed:", error);
    return {
      text: `❌ Failed to perform Linear operation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Convert priority number to readable label
 */
function getPriorityLabel(priority?: number): string {
  const priorityLabels = ["No Priority", "Urgent", "High", "Medium", "Low"];
  return priority !== undefined &&
    priority >= 0 &&
    priority < priorityLabels.length
    ? priorityLabels[priority]
    : "Unknown";
}

/**
 * Handle creating a new Linear card
 */
async function handleCreateCard(
  operation: LinearOperation
): Promise<IntentResponse> {
  if (!operation.title) {
    return { text: "Please provide a title for the card." };
  }

  try {
    // Construct a unified input string from all available fields
    let cardInput = operation.title;

    if (operation.description) {
      cardInput += `\n${operation.description}`;
    }

    // Add any additional fields if explicitly provided
    if (operation.status) {
      cardInput += ` status: ${operation.status}`;
    }

    if (operation.assignee) {
      cardInput += ` assignee: ${operation.assignee}`;
    }

    if (operation.priority) {
      cardInput += ` priority: ${operation.priority}`;
    }

    // Pass all input to the unified createCard function
    const card = await createCard(
      cardInput,
      undefined // teamId (using default)
    );

    return {
      text: `✅ Created new Linear card *${card.identifier}*: ${card.title}\n${
        card.description ? `Description: ${card.description}\n` : ""
      }Status: ${card.state?.name || "Todo"} | Assignee: ${
        card.assignee?.displayName || "Unassigned"
      } | Priority: ${getPriorityLabel(card.priority)}\nView in Linear: ${
        card.url
      }`,
    };
  } catch (error) {
    console.error("Error creating card:", error);
    return {
      text: `❌ Failed to create card: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Handle finding Linear cards by ID or search term
 */
async function handleFindCard(
  operation: LinearOperation
): Promise<IntentResponse> {
  if (!operation.searchTerm && !operation.cardId) {
    return { text: "Please provide a card ID or search term." };
  }

  const searchTerm = operation.cardId || operation.searchTerm || "";
  const cards = await findCard(searchTerm);

  if (cards.length === 0) {
    return {
      text: `No Linear cards found matching "${searchTerm}"`,
    };
  }

  if (cards.length === 1) {
    // Single card found - provide detailed info
    const card = cards[0];
    return {
      text: `📋 Linear card *${card.identifier}*: ${card.title}\n${
        card.description ? `${card.description}\n` : ""
      }Status: ${card.state?.name || "Not set"} | Assignee: ${
        card.assignee?.displayName || "Unassigned"
      } | Priority: ${getPriorityLabel(card.priority)}\nCreated: ${new Date(
        card.createdAt || ""
      ).toLocaleDateString()} | Updated: ${new Date(
        card.updatedAt || ""
      ).toLocaleDateString()}\nView in Linear: ${card.url}`,
    };
  } else {
    // Format multiple search results as text
    const cardsList = cards
      .map(
        (card) =>
          `• *${card.identifier}*: ${card.title}${
            card.state ? ` | Status: ${card.state.name}` : ""
          }${card.assignee ? ` | Assignee: ${card.assignee.displayName}` : ""}${
            card.priority !== undefined
              ? ` | Priority: ${getPriorityLabel(card.priority)}`
              : ""
          }\n  ${card.url}`
      )
      .join("\n\n");

    return {
      text: `🔍 Found ${cards.length} Linear card(s) matching "${searchTerm}":\n\n${cardsList}`,
    };
  }
}

/**
 * Handle updating a Linear card
 */
async function handleUpdateCard(
  operation: LinearOperation
): Promise<IntentResponse> {
  if (!operation.cardId) {
    return { text: "Please provide the card ID to update (e.g., PRO-16)." };
  }

  if (!operation.field || !operation.value) {
    return {
      text: "Please specify both the field to update (title, description, status, assignee, or priority) and the new value.",
    };
  }

  try {
    const card = await updateCard(
      operation.cardId,
      operation.field,
      operation.value
    );

    return {
      text: `✅ Updated Linear card *${card.identifier}*: ${card.title}\nUpdated ${operation.field} to "${operation.value}"\nView in Linear: ${card.url}`,
    };
  } catch (error) {
    return {
      text: `❌ Failed to update card: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Handle deleting a Linear card
 */
async function handleDeleteCard(
  operation: LinearOperation
): Promise<IntentResponse> {
  if (!operation.cardId) {
    return { text: "Please provide the card ID to delete (e.g., PRO-16)." };
  }

  try {
    const success = await deleteCard(operation.cardId);

    if (success) {
      return {
        text: `✅ Successfully deleted Linear card ${operation.cardId}`,
      };
    } else {
      return {
        text: `❌ Failed to delete Linear card ${operation.cardId}`,
      };
    }
  } catch (error) {
    return {
      text: `❌ Failed to delete card: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Format help response
 */
function formatHelpResponse(): IntentResponse {
  return {
    text:
      "*Linear commands help*\n\nHere are the supported Linear commands:\n" +
      "• *Create a card*: `create a linear card [your card details]`\n" +
      "      - Intelligently extracts title, description, status, assignee, and priority\n" +
      "      - Example: `create card Fix login bug that's blocking users, assign to Sarah, high priority`\n" +
      "      - Or with explicit fields: `create card title: Fix login bug status: In Progress assignee: Jane priority: High`\n" +
      "• *Find card by ID*: `find linear card [id like PRO-16]`\n" +
      "• *Find cards by text*: `find linear cards with [text]`\n" +
      "• *Update card*: `update linear card [id like PRO-16] status to In Progress`\n" +
      "      - Intelligently interprets what field you want to update\n" +
      "      - Matches your values to what's available in Linear\n" +
      "• *Delete card*: `delete linear card [id like PRO-16]`",
  };
}

/**
 * Parse a Linear operation from a message
 */
async function parseLinearOperation(message: string): Promise<LinearOperation> {
  const prompt = `
You are a bot that helps users interact with Linear. Parse the following message and extract the Linear operation details in JSON format.

Only extract these specific operations and fields:
1. Create: extract title, description, status, assignee, and priority
2. Find: extract cardId OR searchTerm (one of them)
3. Update: extract cardId, field, and value
4. Delete: extract cardId

Be flexible in understanding user intent - they may use different terms for these operations.
For creation, look for words like "create", "add", "new", "make", etc.
For finding, look for "find", "search", "get", "show", "lookup", etc.
For updating, watch for "update", "change", "edit", "modify", "set", etc.
For deleting, detect "delete", "remove", "trash", etc.

For creation operations, look for field-specific content like:
- status/state: "in progress", "todo", "done", etc.
- assignee: names like "John", "Sarah", etc.
- priority: "high", "urgent", "low", etc.

Message: "${message}"

Response format:
{
  "type": "create" | "find" | "update" | "delete" | "unknown",
  ... relevant fields for each type
}

For create operations, extract as many fields as possible, but don't worry if some are missing.

Keep types strictly to these operations. If you can't determine the operation type, use "unknown".
`;

  try {
    const completion = await generateChatCompletion(
      [{ role: "user", content: prompt }],
      "gpt-4o-mini"
    );

    if (!completion) {
      throw new Error("Failed to parse Linear operation");
    }

    // Extract the JSON from the response
    const jsonMatch = completion.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : "{}";

    try {
      const parsedOperation = JSON.parse(jsonString) as LinearOperation;

      // Check if the operation type is unknown or not clearly determined
      if (parsedOperation.type === "unknown" || !parsedOperation.type) {
        return {
          type: "unknown",
          error:
            "I'm not sure what Linear operation you want to perform. Please try again with clearer instructions.",
        } as LinearOperation;
      }

      return parsedOperation;
    } catch (jsonError) {
      console.error("Failed to parse JSON from completion:", jsonError);
      return {
        type: "unknown",
        error:
          "I couldn't understand your request. Please use a clearer format for Linear operations.",
      } as LinearOperation;
    }
  } catch (error) {
    console.error("Error parsing Linear operation:", error);
    return {
      type: "unknown",
      error:
        "I encountered an error while processing your request. Please try again with clearer instructions.",
    } as LinearOperation;
  }
}
