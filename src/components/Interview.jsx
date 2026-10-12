import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { PALETTE } from "../palette.js";
import { PERSONA_LIST, findPersona } from "../data/personas.js";
import { ErrorBox, Loading, PrimaryButton } from "./Shared.jsx";
import { requestInterview } from "../api.js";
import { createInterview, saveInterviewMessages, loadInterview } from "../services/sessions.js";
import { remember, recall } from "../storage.js";

export default function Interview({ studentName, group, onExit }) {
  const [phase, setPhase] = useState("restoring"); // restoring | pick | chat
  const [persona, setPersona] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  // 기록 저장은 화면을 멈추지 않도록 뒤에서 순서대로 처리합니다.
  const saveChain = useRef(Promise.resolve());
  const idRef = useRef(null);

  function queueSave(next, p) {
    saveChain.current = saveChain.current
      .then(async () => {
        if (!idRef.current) {
          const id = await createInterview({
            group,
            reporters: studentName,
            personaId: p.id,
            personaName: p.name,
            messages: next,
          });
          idRef.current = id;
          setSessionId(id);
          remember("qe:interview", { id });
        } else {
          await saveInterviewMessages({ id: idRef.current, messages: next });
        }
      })
      .catch(() => {
        /* 저장 실패 무시 */
      });
  }

  useEffect(() => {
    const saved = recall("qe:interview");
    if (!saved?.id) {
      setPhase("pick");
      return;
    }
    loadInterview(saved.id)
      .then((s) => {
        const p = s && findPersona(s.personaId);
        if (p) {
          setPersona(p);
          setSessionId(s.id);
          idRef.current = s.id;
          setMessages(Array.isArray(s.messages) ? s.messages : []);
          setPhase("chat");
        } else {
          remember("qe:interview", null);
          setPhase("pick");
        }
      })
      .catch(() => setPhase("pick"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, waiting]);

  function pick(p) {
    setPersona(p);
    setSessionId(null);
    idRef.current = null;
    saveChain.current = Promise.resolve();
    setMessages([]);
    setError("");
    remember("qe:interview", null);
    setPhase("chat");
  }

  async function ask() {
    const text = input.trim();
    if (!text || waiting) return;
    setError("");
    const withQuestion = [...messages, { role: "user", text, at: new Date().toISOString() }];
    setMessages(withQuestion);
    setInput("");
    setWaiting(true);
    try {
      const answer = await requestInterview({ personaId: persona.id, messages: withQuestion });
      const next = [...withQuestion, { role: "assistant", text: answer, at: new Date().toISOString() }];
      setMessages(next);
      queueSave(next, persona);
    } catch (e) {
      // 답을 못 받은 질문은 다시 입력창으로 돌려놓습니다.
      setMessages(messages);
      setInput(text);
      setError(e.message || "고려 사람에게 질문을 전하지 못했어요. 다시 보내 주세요.");
    } finally {
      setWaiting(false);
    }
  }

  function backToPick() {
    remember("qe:interview", null);
    idRef.current = null;
    setPhase("pick");
  }

  const questionCount = messages.filter((m) => m.role === "user").length;

  return (
    <div>
      <button
        onClick={phase === "chat" ? backToPick : onExit}
        className="flex items-center gap-1 text-xs font-bold mb-4"
        style={{ color: PALETTE.textMuted }}
      >
        <ChevronLeft size={14} /> {phase === "chat" ? "인물 다시 고르기" : "활동 다시 고르기"}
      </button>

      <div className="rounded-md px-4 py-3 mb-5 text-sm leading-relaxed" style={{ backgroundColor: "#FBEFE0", color: PALETTE.text }}>
        📝 고려 사람은 <b>교과서 기록을 바탕으로 AI가 연기</b>해요. 자료와 다른 말을 할 수도 있으니 그대로 믿지 말고,
        의심되는 답은 활동지에 <b>?</b> 표시를 해 두세요!
      </div>

      <ErrorBox message={error} />

      {phase === "restoring" && <Loading text="하던 기자회견이 있는지 확인하고 있어요..." />}

      {phase === "pick" && (
        <div>
          <h2 className="sayeon-serif text-xl font-bold mb-1" style={{ color: PALETTE.text }}>
            {group}모둠이 인터뷰할 고려 사람은?
          </h2>
          <p className="text-sm mb-5" style={{ color: PALETTE.textMuted }}>
            선생님이 정해 준 인물을 골라 주세요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONA_LIST.map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p)}
                className="flex items-start gap-3 p-4 rounded-lg border text-left transition-transform hover:-translate-y-0.5"
                style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white" }}
              >
                <span className="text-2xl leading-none">{p.emoji}</span>
                <span>
                  <span className="block text-sm font-bold" style={{ color: PALETTE.text }}>{p.name}</span>
                  <span className="block text-xs mt-1 leading-snug" style={{ color: PALETTE.textMuted }}>{p.intro}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "chat" && persona && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{persona.emoji}</span>
              <div>
                <p className="sayeon-serif font-bold" style={{ color: PALETTE.text }}>{persona.name}</p>
                <p className="text-xs" style={{ color: PALETTE.textMuted }}>{persona.intro}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: PALETTE.paperDeep, color: PALETTE.text }}>
              질문 {questionCount}개
            </span>
          </div>

          <div className="flex flex-col gap-3 rounded-lg p-3 min-h-[300px]" style={{ backgroundColor: "white", border: `1px solid ${PALETTE.paperDeep}` }}>
            <Bubble role="assistant" emoji={persona.emoji}>
              어서 오세요, 기자님들. 고려에서 사는 나에게 무엇이든 물어보세요.
            </Bubble>
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} emoji={persona.emoji}>
                {m.text}
              </Bubble>
            ))}
            {waiting && (
              <Bubble role="assistant" emoji={persona.emoji}>
                <span style={{ color: PALETTE.textMuted }}>생각하는 중...</span>
              </Bubble>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 mt-3 sticky bottom-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="기자 질문을 적어 주세요"
              className="flex-1 p-3 rounded-md text-base border"
              style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white", color: PALETTE.text }}
            />
            <PrimaryButton disabled={!input.trim() || waiting} onClick={ask} className="flex items-center gap-1.5 self-stretch">
              <Send size={15} /> 질문
            </PrimaryButton>
          </div>
          <p className="text-xs mt-2" style={{ color: PALETTE.textMuted }}>
            준비한 질문 5개를 하고, 답을 듣고 떠오른 후속 질문도 2개 이상 해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}

function Bubble({ role, emoji, children }) {
  const mine = role === "user";
  return (
    <div className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && <span className="text-xl leading-none mt-1">{emoji}</span>}
      <div
        className="max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
        style={
          mine
            ? { backgroundColor: PALETTE.ink, color: PALETTE.paper }
            : { backgroundColor: PALETTE.paper, color: PALETTE.text, border: `1px solid ${PALETTE.paperDeep}` }
        }
      >
        {children}
      </div>
    </div>
  );
}
