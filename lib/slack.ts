export async function postSlackMessage(channel: string, text: string) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("Slack API error:", data);
  }
}
