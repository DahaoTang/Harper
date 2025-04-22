import { NextRequest, NextResponse } from "next/server";
import { handleIntent } from "@/lib/nlp";
import { postSlackMessage } from "@/lib/slack";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Handle Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  const event = body.event;

  // Ignore bot messages and non-app_mention events
  if (
    !event ||
    event.subtype === "bot_message" ||
    event.type !== "app_mention"
  ) {
    return NextResponse.json({ status: "ignored" });
  }

  const userText = event.text;
  const channel = event.channel;

  // Respond immediately to Slack to prevent retries
  const response = NextResponse.json({ status: "ok" });

  // Process the event asynchronously
  (async () => {
    const result = await handleIntent(userText, channel);
    if (result?.text) {
      await postSlackMessage(channel, result.text);
    }
  })();

  return response;
}
