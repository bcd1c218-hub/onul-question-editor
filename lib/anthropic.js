// Anthropic API 호출을 한곳에 모았습니다. 원고편집실과 같은 모델을 씁니다.
export const MODEL = "claude-sonnet-4-6";

export async function callClaude({ system, messages, maxTokens }) {
  const body = { model: MODEL, max_tokens: maxTokens, messages };
  if (system) body.system = system;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    const err = new Error("AI와 연결하지 못했어요.");
    err.status = 502;
    err.detail = detail;
    throw err;
  }
  const data = await response.json();
  const block = (data.content || []).find((b) => b.type === "text");
  if (!block) {
    const err = new Error("AI의 응답을 읽지 못했어요.");
    err.status = 502;
    throw err;
  }
  return block.text;
}
