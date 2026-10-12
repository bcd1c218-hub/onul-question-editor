import { useState } from "react";
import { ArrowRight, PenLine, Mic } from "lucide-react";
import { PALETTE } from "../palette.js";
import { TopBar, PrimaryButton } from "./Shared.jsx";
import QuestionCoach from "./QuestionCoach.jsx";
import Interview from "./Interview.jsx";
import { remember, recall } from "../storage.js";

const GROUPS = [1, 2, 3, 4, 5, 6, 7];

export default function StudentFlow() {
  const saved = recall("qe:student") || {};
  const [studentName, setStudentName] = useState(saved.name || "");
  const [group, setGroup] = useState(saved.group || "");
  const [mode, setMode] = useState(recall("qe:mode") || null);
  const [entered, setEntered] = useState(Boolean(saved.name && saved.group));

  function enter() {
    remember("qe:student", { name: studentName.trim(), group });
    setEntered(true);
  }

  function chooseMode(m) {
    remember("qe:mode", m);
    setMode(m);
  }

  function goHome() {
    remember("qe:mode", null);
    setMode(null);
  }

  function changeStudent() {
    remember("qe:student", null);
    remember("qe:mode", null);
    remember("qe:qsession", null);
    remember("qe:interview", null);
    setStudentName("");
    setGroup("");
    setMode(null);
    setEntered(false);
  }

  const subtitle = entered ? `${group}모둠 · ${studentName}` : null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center" style={{ backgroundColor: PALETTE.paper }}>
      <TopBar subtitle={subtitle} onHome={entered ? goHome : undefined} />
      <div className="w-full max-w-2xl px-4 py-8 flex-1">
        {!entered && (
          <div className="flex flex-col items-center text-center pt-6">
            <h1 className="sayeon-serif text-3xl font-bold mb-3" style={{ color: PALETTE.text }}>
              오늘의 질문 편집실
            </h1>
            <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: PALETTE.textMuted }}>
              고려 사람들의 삶이 궁금한가요?
              <br />
              질문을 다듬고, 고려 사람을 직접 인터뷰해 봐요.
            </p>
            <div className="w-full max-w-xs flex flex-col gap-4 text-left">
              <label className="text-xs font-bold" style={{ color: PALETTE.textMuted }}>
                이름
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="이름을 적어 주세요"
                  className="mt-1.5 w-full px-4 py-3 rounded-md text-sm border font-normal"
                  style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white", color: PALETTE.text }}
                />
              </label>
              <div className="text-xs font-bold" style={{ color: PALETTE.textMuted }}>
                모둠
                <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                  {GROUPS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGroup(g)}
                      className="py-2.5 rounded-md text-sm font-bold border"
                      style={{
                        borderColor: group === g ? PALETTE.ink : PALETTE.paperDeep,
                        backgroundColor: group === g ? PALETTE.ink : "white",
                        color: group === g ? PALETTE.paper : PALETTE.text,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <PrimaryButton className="mt-8 flex items-center gap-2" disabled={!studentName.trim() || !group} onClick={enter}>
              편집실 들어가기 <ArrowRight size={15} />
            </PrimaryButton>
          </div>
        )}

        {entered && !mode && (
          <div className="pt-2">
            <h2 className="sayeon-serif text-xl font-bold mb-1" style={{ color: PALETTE.text }}>
              {studentName} 기자님, 오늘은 무엇을 할까요?
            </h2>
            <p className="text-sm mb-6" style={{ color: PALETTE.textMuted }}>
              선생님이 알려 준 활동을 골라 주세요.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeCard
                icon={<PenLine size={22} style={{ color: PALETTE.gold }} />}
                title="질문 다듬기"
                desc="내가 만든 질문을 편집자 AI와 함께 더 깊은 질문으로 다듬어요."
                onClick={() => chooseMode("coach")}
              />
              <ModeCard
                icon={<Mic size={22} style={{ color: PALETTE.gold }} />}
                title="기자회견"
                desc="모둠이 함께 고려 사람을 인터뷰해요. (모둠에 폰 한 대)"
                onClick={() => chooseMode("interview")}
              />
            </div>
            <button onClick={changeStudent} className="mt-8 text-xs underline" style={{ color: PALETTE.textMuted }}>
              내가 아니에요 (이름 다시 쓰기)
            </button>
          </div>
        )}

        {entered && mode === "coach" && <QuestionCoach studentName={studentName.trim()} group={group} onExit={goHome} />}
        {entered && mode === "interview" && <Interview studentName={studentName.trim()} group={group} onExit={goHome} />}
      </div>
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 p-5 rounded-lg border text-left transition-transform hover:-translate-y-0.5"
      style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white" }}
    >
      {icon}
      <span className="text-base font-bold" style={{ color: PALETTE.text }}>{title}</span>
      <span className="text-xs leading-relaxed" style={{ color: PALETTE.textMuted }}>{desc}</span>
    </button>
  );
}
