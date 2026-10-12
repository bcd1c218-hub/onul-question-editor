import { coachPrompt, extractJson, normalizeCoach } from "../lib/prompts.js";
import { callClaude } from "../lib/anthropic.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, previous } = req.body || {};
  const q = typeof question === "string" ? question.trim() : "";
  if (!q) return res.status(400).json({ error: "질문을 적어 주세요." });
  if (q.length > 300) return res.status(400).json({ error: "질문이 너무 길어요. 한두 문장으로 줄여 주세요." });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않아요." });
  }

  const prev = Array.isArray(previous)
    ? previous.filter((p) => typeof p === "string" && p.trim()).slice(-5).map((p) => p.slice(0, 300))
    : [];

  try {
    const raw = await callClaude({
      messages: [{ role: "user", content: coachPrompt(q, prev) }],
      maxTokens: 800,
    });
    return res.status(200).json(normalizeCoach(extractJson(raw)));
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "알 수 없는 오류가 발생했어요.", detail: e.detail });
  }
}
