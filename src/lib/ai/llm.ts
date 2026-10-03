import "server-only";

/**
 * One small client for OpenAI-compatible chat APIs. No SDK needed.
 *
 * Provider is chosen by which key is set (first match wins):
 *   GROQ_API_KEY  -> Groq Cloud   (keys start with "gsk_")  model: GROQ_MODEL, default openai/gpt-oss-20b
 *   XAI_API_KEY   -> xAI Grok     (keys start with "xai-")   model: XAI_MODEL,  default grok-3-mini
 * Without any key every AI feature falls back to rules/templates.
 */
type Provider = { name: "groq" | "xai"; url: string; key: string; model: string };

function provider(): Provider | null {
  if (process.env.GROQ_API_KEY) {
    return {
      name: "groq", url: "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    };
  }
  if (process.env.XAI_API_KEY) {
    return { name: "xai", url: "https://api.x.ai/v1/chat/completions", key: process.env.XAI_API_KEY, model: process.env.XAI_MODEL || "grok-3-mini" };
  }
  return null;
}

export const aiEnabled = () => provider() !== null;
export const aiProviderName = () => provider()?.name ?? null;

export async function chat(system: string, user: string, maxTokens = 400): Promise<string> {
  const p = provider();
  if (!p) throw new Error("No AI key configured");
  const res = await fetch(p.url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${p.key}` },
    body: JSON.stringify({
      model: p.model,
      max_tokens: maxTokens,
      temperature: 0.2,
      // gpt-oss models on Groq "think" first; keep it short so answers stay fast and cheap
      ...(p.name === "groq" && p.model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${p.name} ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}
