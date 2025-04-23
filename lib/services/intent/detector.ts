import { generateChatCompletion } from "@/lib/adapters/openai/api";
import { IntentType } from "@/lib/types/intent";

/**
 * Detects the intent type from a message using OpenAI
 */
export async function detectIntentType(message: string): Promise<IntentType> {
  // Quick pattern matching for clear Linear card operations
  const linearPatterns = [
    /linear\s+card/i,
    /create\s+(a\s+)?(new\s+)?linear/i,
    /add\s+(a\s+)?(new\s+)?linear/i,
    /update\s+linear/i,
    /move\s+linear/i,
    /change\s+linear/i,
    /delete\s+linear/i,
    /remove\s+linear/i,
    /find\s+linear/i,
    /search\s+linear/i,
    /show\s+linear/i,
    /linear\s+issue/i,
    /linear\s+task/i,
    /linear\s+ticket/i,
  ];

  // Quick check for GitHub patterns
  const githubPatterns = [
    /github\s+issue/i,
    /github\s+pr/i,
    /github\s+pull\s+request/i,
    /github\s+repo/i,
    /github\s+repository/i,
  ];

  // Check for Linear patterns first
  for (const pattern of linearPatterns) {
    if (pattern.test(message)) {
      return "linear";
    }
  }

  // Check for GitHub patterns
  for (const pattern of githubPatterns) {
    if (pattern.test(message)) {
      return "github";
    }
  }

  // If no clear patterns, use AI classification for more nuanced messages
  const prompt = `Classify the following Slack message into one of: "general", "linear", or "github".
  
Linear refers to the Linear issue tracking system (cards, tasks, tickets, etc.)
GitHub refers to GitHub-related operations (issues, pull requests, repositories, etc.)
General is anything conversational or not related to Linear or GitHub.
  
Message: "${message}"
Intent:`;

  const result = await generateChatCompletion(
    [{ role: "user", content: prompt }],
    "gpt-4o-mini"
  );

  const intentText = result?.toLowerCase().trim() || "";

  if (intentText.includes("linear")) return "linear";
  if (intentText.includes("github")) return "github";
  return "general";
}
