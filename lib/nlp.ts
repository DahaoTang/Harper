// lib/nlp.ts

import { OpenAI } from "openai";
import { handleGeneralIntent } from "./intents/general";
// import { handleTrelloIntent } from './intents/trello'
// import { handleGitHubIntent } from './intents/github'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type IntentType = "general" | "trello" | "github";

export async function handleIntent(message: string, channel: string) {
  const intentType = await detectIntentType(message);

  switch (intentType) {
    case "trello":
      // return handleTrelloIntent(message, channel)
      return {
        text: "Trello handling is not yet enabled.",
      };
    case "github":
      // return handleGitHubIntent(message, channel)
      return {
        text: "GitHub handling is not yet enabled.",
      };
    default:
      return handleGeneralIntent(message, channel);
  }
}

async function detectIntentType(message: string): Promise<IntentType> {
  const prompt = `Classify the following Slack message into one of: "general", "trello", or "github".\n\nMessage: "${message}"\nIntent:`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  const result = completion.choices[0].message.content?.toLowerCase().trim();
  if (result?.includes("trello")) return "trello";
  if (result?.includes("github")) return "github";
  return "general";
}
