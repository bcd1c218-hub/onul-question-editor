async function post(url, body, fallback) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // 서버가 JSON이 아닌 응답을 보낸 경우
  }
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

export function requestCoach({ question, previous }) {
  return post("/api/question-coach", { question, previous }, "질문 편집자에게 질문을 보내는 중 문제가 생겼어요.");
}

export async function requestInterview({ personaId, messages }) {
  const data = await post("/api/interview", { personaId, messages }, "고려 사람에게 질문을 전하지 못했어요.");
  return data.answer;
}
