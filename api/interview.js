import { interviewSystem } from "../lib/personas.js";
import { callClaude } from "../lib/anthropic.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { personaId, messages } = req.body || {};
  const system = interviewSystem(personaId);
  if (!system) return res.status(400).json({ error: "인터뷰할 인물을 찾지 못했어요." });
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "질문을 적어 주세요." });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않아요." });
  }

  // 최근 대화 20개만 보내고, 역할과 길이를 정리합니다.
  const cleaned = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 500) }));
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  // 같은 역할이 연달아 나오면(답을 못 받고 다시 물은 경우) 하나로 합칩니다.
  for (let i = cleaned.length - 1; i > 0; i--) {
    if (cleaned[i].role === cleaned[i - 1].role) {
      cleaned[i - 1].content += "\n" + cleaned[i].content;
      cleaned.splice(i, 1);
    }
  }
  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
    return res.status(400).json({ error: "마지막에 학생 질문이 있어야 해요." });
  }

  try {
    const answer = await callClaude({ system, messages: cleaned, maxTokens: 500 });
    return res.status(200).json({ answer: answer.trim() });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "알 수 없는 오류가 발생했어요.", detail: e.detail });
  }
}
