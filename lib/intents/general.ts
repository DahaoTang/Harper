import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handleGeneralIntent(message: string, channel: string) {
  // Just to make TS happy...
  console.log(`Message from ${channel}: ${message}`);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }],
  });

  return {
    text: completion.choices[0].message.content,
  };
}
