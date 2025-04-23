import { NextRequest, NextResponse } from "next/server";
import { routeIntent } from "@/lib/services/intent/router";
import { postMessage } from "@/lib/adapters/slack/api";

// Simple in-memory cache to track processed events
const processedEvents = new Map<string, number>();
// Set expiration time for cached events (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

// Clean up old events from cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [eventId, timestamp] of processedEvents.entries()) {
    if (now - timestamp > CACHE_EXPIRY_MS) {
      processedEvents.delete(eventId);
    }
  }
}, CACHE_EXPIRY_MS);

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

  // Check for duplicate events using event_id or event_ts
  const eventId = body.event_id || event.event_ts;
  if (eventId) {
    // If we've already processed this event, ignore it
    if (processedEvents.has(eventId)) {
      console.log(`Ignoring duplicate event: ${eventId}`);
      return NextResponse.json({ status: "duplicate" });
    }

    // Mark this event as processed
    processedEvents.set(eventId, Date.now());
  }

  const userText = event.text;
  const channel = event.channel;
  const userId = event.user;

  // Process the message through our intent router
  const result = await routeIntent({
    message: userText,
    channel,
    userId,
  });

  // Post the response back to Slack
  if (result?.text) {
    await postMessage(channel, result.text);
  }

  return NextResponse.json({ status: "ok" });
}
