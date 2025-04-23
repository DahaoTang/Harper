import { OpenAI } from "openai";

/**
 * Initialize the OpenAI client
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generate a chat completion using OpenAI
 */
export async function generateChatCompletion(
  messages: Array<{ role: string; content: string }>,
  model: string = "gpt-4o-mini"
) {
  const completion = await openai.chat.completions.create({
    model,
    messages: messages.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    })),
  });

  return completion.choices[0].message.content;
}
