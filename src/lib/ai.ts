import Anthropic from "@anthropic-ai/sdk";

// Claude wrapper with graceful fallback: AI features are only enabled when
// ANTHROPIC_API_KEY is set. Model is overridable via AI_MODEL.
let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function generate({
  system,
  prompt,
  maxTokens = 600,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const c = getClient();
  if (!c) throw new Error("AI is not configured. Add ANTHROPIC_API_KEY to your .env.");

  const msg = await c.messages.create({
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
