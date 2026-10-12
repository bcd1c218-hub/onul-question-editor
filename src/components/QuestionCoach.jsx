import { useEffect, useRef, useState } from "react";
import { Sparkles, MessageCircleQuestion, Check, Circle, ChevronLeft, RotateCcw } from "lucide-react";
import { PALETTE } from "../palette.js";
import { CORE_QUESTION, CHECKS, ladderName } from "../data/ladder.js";
import { ErrorBox, Loading, Ladder, PrimaryButton } from "./Shared.jsx";
import { requestCoach } from "../api.js";
import { createQuestionSession, saveQuestionVersions, finishQuestionSession, loadQuestionSession, findOpenQuestionSession } from "../services/sessions.js";
import { remember, recall } from "../storage.js";

export default function QuestionCoach({ studentName, group, onExit }) {
  const [phase, setPhase] = useState("restoring"); // restoring | write | loading | feedback | reflect | done
  const [sessionId, setSessionId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState("");
  const [rejected, setRejected] = useState("");
  // 기록 저장은 화면을 멈추지 않도록 뒤에서 순서대로 처리합니다.
  const saveChain = useRef(Promise.resolve());
  const idRef = useRef(null);

  function queueSave(task) {
    saveChain.current = saveChain.current.then(task).catch(() => {
      /* 저장 실패 무시 */
    });
    return saveChain.current;
  }

  // 새로고침하거나 다른 기기로 와도, 같은 이름·모둠이면 하던 질문을 이어 갑니다.
  useEffect(() => {
    function restore(s) {
      setSessionId(s.id);
      idRef.current = s.id;
      remember("qe:qsession", s.id);
      setVersions(s.versions);
      setDraft(s.versions[s.versions.length - 1].question);
      setPhase("feedback");
    }
    async function load() {
      const savedId = recall("qe:qsession");
      try {
        if (savedId) {
          const s = await loadQuestionSession(savedId);
          if (s && s.status !== "completed" && Array.isArray(s.versions) && s.versions.length) return restore(s);
          remember("qe:qsession", null);
        }
        const found = await findOpenQuestionSession({ studentName, group });
        if (found) return restore(found);
      } catch (e) {
        /* 못 찾으면 새로 시작 */
      }
      setPhase("write");
    }
    load();
  }, []);

  const last = versions[versions.length - 1];
  const first = versions[0];

  async function send() {
    const question = draft.trim();
    if (!question) return;
    setError("");
    setPhase("loading");
    try {
      const feedback = await requestCoach({ question, previous: versions.map((v) => v.question) });
      const version = { question, feedback, at: new Date().toISOString() };
      const next = [...versions, version];
      setVersions(next);
      setPhase("feedback");
      // 기록 저장은 실패해도 수업은 계속됩니다.
      queueSave(async () => {
        if (!idRef.current) {
          const id = await createQuestionSession({ studentName, group, version });
          idRef.current = id;
          setSessionId(id);
          remember("qe:qsession", id);
        } else {
          await saveQuestionVersions({ id: idRef.current, versions: next });
        }
      });
    } catch (e) {
      setError(e.message || "질문 편집자에게 질문을 보내는 중 문제가 생겼어요.");
      setPhase("write");
    }
  }

  async function finish() {
    const reflection = { accepted: accepted.trim(), rejected: rejected.trim() };
    const finalQuestion = last.question;
    const finalLevel = last.feedback?.level || null;
    queueSave(async () => {
      if (idRef.current) await finishQuestionSession({ id: idRef.current, finalQuestion, finalLevel, reflection });
    });
    remember("qe:qsession", null);
    setPhase("done");
  }

  function startAnother() {
    remember("qe:qsession", null);
    setSessionId(null);
    idRef.current = null;
    saveChain.current = Promise.resolve();
    setVersions([]);
    setDraft("");
    setAccepted("");
    setRejected("");
    setError("");
    setPhase("write");
  }

  return (
    <div>
      <button onClick={onExit} className="flex items-center gap-1 text-xs font-bold mb-4" style={{ color: PALETTE.textMuted }}>
        <ChevronLeft size={14} /> 활동 다시 고르기
      </button>

      <div className="rounded-lg px-4 py-3 mb-5 text-sm leading-relaxed" style={{ backgroundColor: PALETTE.paperDeep, color: PALETTE.text }}>
        <span className="font-bold">핵심 질문 </span>
        {CORE_QUESTION}
      </div>

      <ErrorBox message={error} />

      {phase === "restoring" && <Loading text="하던 질문이 있는지 확인하고 있어요..." />}

      {phase === "write" && (
        <div>
          <h2 className="sayeon-serif text-lg font-bold mb-1" style={{ color: PALETTE.text }}>
            {versions.length ? "질문 고쳐 쓰기" : "내 질문 적기"}
          </h2>
          <p className="text-sm mb-3" style={{ color: PALETTE.textMuted }}>
            {versions.length
              ? "편집자의 되묻기를 생각하며 질문을 직접 고쳐 써 보세요."
              : "활동지에 적은 처음 질문 중 하나를 그대로 적어 보세요."}
          </p>
          <div className="mb-3">
            <Ladder level={last?.feedback?.level} />
          </div>
          {last && (
            <div className="rounded-md px-3 py-2 mb-3 text-sm" style={{ backgroundColor: PALETTE.detectiveSoft, color: PALETTE.text }}>
              <span className="font-bold">편집자의 되묻기 </span>
              {last.feedback?.coach_question}
            </div>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="예) 고려 사람들은 ...?"
            className="w-full p-4 rounded-md text-base leading-7 border sayeon-serif"
            style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white", color: PALETTE.text }}
          />
          <div className="flex justify-between items-center mt-3">
            {versions.length > 0 ? (
              <button onClick={() => setPhase("feedback")} className="text-sm font-bold" style={{ color: PALETTE.textMuted }}>
                의견 다시 보기
              </button>
            ) : (
              <span />
            )}
            <PrimaryButton disabled={!draft.trim()} onClick={send}>
              편집자에게 보내기
            </PrimaryButton>
          </div>
        </div>
      )}

      {phase === "loading" && <Loading text="질문 편집자가 질문을 읽고 있어요..." />}

      {phase === "feedback" && last && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg p-4 border" style={{ backgroundColor: "white", borderColor: PALETTE.paperDeep }}>
            <p className="text-xs font-bold mb-1" style={{ color: PALETTE.gold }}>
              {versions.length}번째 질문
            </p>
            <p className="sayeon-serif text-base leading-7" style={{ color: PALETTE.text }}>
              {last.question}
            </p>
          </div>

          {last.feedback.off_topic ? (
            <Card tone="detective" icon={<MessageCircleQuestion size={16} />} title="편집자의 한마디">
              {last.feedback.coach_question}
            </Card>
          ) : (
            <>
              {last.feedback.good_point && (
                <Card tone="gold" icon={<Sparkles size={16} />} title="잘한 점">
                  {last.feedback.good_point}
                </Card>
              )}

              <div className="rounded-lg p-4" style={{ backgroundColor: "white", border: `1px solid ${PALETTE.paperDeep}` }}>
                <p className="text-xs font-bold mb-2" style={{ color: PALETTE.ink }}>
                  질문 사다리 · 지금은 {last.feedback.level}칸 ({ladderName(last.feedback.level)})
                </p>
                <Ladder level={last.feedback.level} />
                {last.feedback.level_reason && (
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: PALETTE.textMuted }}>
                    {last.feedback.level_reason}
                  </p>
                )}
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {CHECKS.map((c) => {
                    const ok = last.feedback.checks?.[c.key];
                    return (
                      <li key={c.key} className="flex items-center gap-2 text-sm" style={{ color: ok ? PALETTE.copyedit : PALETTE.textMuted }}>
                        {ok ? <Check size={15} /> : <Circle size={13} />}
                        {c.label}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Card tone="detective" icon={<MessageCircleQuestion size={16} />} title="편집자의 되묻기">
                <span className="text-base font-bold">{last.feedback.coach_question}</span>
              </Card>
            </>
          )}

          {versions.length > 1 && <History versions={versions} />}

          <div className="flex justify-between items-center mt-1">
            <button onClick={() => setPhase("write")} className="text-sm font-bold underline" style={{ color: PALETTE.textMuted }}>
              질문 고쳐 쓰기
            </button>
            <PrimaryButton
              disabled={last.feedback.off_topic}
              onClick={() => setPhase("reflect")}
              className={last.feedback.ready ? "ring-4 ring-amber-300" : ""}
            >
              이 질문으로 정하기
            </PrimaryButton>
          </div>
          <p className="text-xs" style={{ color: PALETTE.textMuted }}>
            고쳐 쓴 질문과 그 이유는 활동지에도 꼭 적어 두세요.
          </p>
        </div>
      )}

      {phase === "reflect" && last && (
        <div className="flex flex-col gap-4">
          <h2 className="sayeon-serif text-lg font-bold" style={{ color: PALETTE.text }}>
            마지막으로 돌아보기
          </h2>
          <Compare first={first} last={last} />
          <label className="text-sm font-bold" style={{ color: PALETTE.text }}>
            편집자의 말 중 받아들인 것
            <textarea
              value={accepted}
              onChange={(e) => setAccepted(e.target.value)}
              rows={2}
              className="mt-1.5 w-full p-3 rounded-md text-sm border font-normal"
              style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white", color: PALETTE.text }}
            />
          </label>
          <label className="text-sm font-bold" style={{ color: PALETTE.text }}>
            받아들이지 않은 것과 그 이유
            <textarea
              value={rejected}
              onChange={(e) => setRejected(e.target.value)}
              rows={2}
              className="mt-1.5 w-full p-3 rounded-md text-sm border font-normal"
              style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white", color: PALETTE.text }}
            />
          </label>
          <div className="flex justify-between items-center">
            <button onClick={() => setPhase("feedback")} className="text-sm font-bold" style={{ color: PALETTE.textMuted }}>
              뒤로
            </button>
            <PrimaryButton onClick={finish}>질문 완성!</PrimaryButton>
          </div>
        </div>
      )}

      {phase === "done" && last && (
        <div className="flex flex-col items-center gap-5 pt-2">
          <h2 className="sayeon-serif text-xl font-bold" style={{ color: PALETTE.text }}>
            질문이 완성됐어요!
          </h2>
          <Compare first={first} last={last} />
          <div className="flex gap-4">
            <button onClick={startAnother} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: PALETTE.ink }}>
              <RotateCcw size={14} /> 다른 질문 다듬기
            </button>
            <button onClick={onExit} className="text-sm font-bold" style={{ color: PALETTE.textMuted }}>
              처음으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ tone, icon, title, children }) {
  const bg = tone === "gold" ? PALETTE.goldSoft + "55" : PALETTE.detectiveSoft;
  const fg = tone === "gold" ? PALETTE.gold : PALETTE.detective;
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-2 mb-1.5" style={{ color: fg }}>
        {icon}
        <span className="text-xs font-bold" style={{ color: PALETTE.ink }}>{title}</span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: PALETTE.text }}>{children}</p>
    </div>
  );
}

function History({ versions }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: "white", border: `1px solid ${PALETTE.paperDeep}` }}>
      <p className="text-xs font-bold mb-2" style={{ color: PALETTE.ink }}>내 질문의 변화</p>
      <ol className="flex flex-col gap-1.5">
        {versions.map((v, i) => (
          <li key={i} className="text-sm flex gap-2" style={{ color: PALETTE.text }}>
            <span className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: PALETTE.paperDeep }}>
              {v.feedback?.level || "-"}칸
            </span>
            <span>{v.question}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Compare({ first, last }) {
  return (
    <div className="w-full grid grid-cols-1 gap-2">
      <div className="rounded-lg p-4" style={{ backgroundColor: "white", border: `1px solid ${PALETTE.paperDeep}` }}>
        <p className="text-xs font-bold mb-1" style={{ color: PALETTE.textMuted }}>
          처음 질문 · {first.feedback?.level}칸 {ladderName(first.feedback?.level)}
        </p>
        <p className="sayeon-serif" style={{ color: PALETTE.text }}>{first.question}</p>
      </div>
      <div className="rounded-lg p-4" style={{ backgroundColor: "white", border: `2px solid ${PALETTE.gold}` }}>
        <p className="text-xs font-bold mb-1" style={{ color: PALETTE.gold }}>
          완성한 질문 · {last.feedback?.level}칸 {ladderName(last.feedback?.level)}
        </p>
        <p className="sayeon-serif font-bold" style={{ color: PALETTE.text }}>{last.question}</p>
      </div>
    </div>
  );
}
