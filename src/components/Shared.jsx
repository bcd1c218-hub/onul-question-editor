import { AlertCircle, Loader2, HelpCircle } from "lucide-react";
import { PALETTE } from "../palette.js";
import { LADDER } from "../data/ladder.js";

export function TopBar({ subtitle, onHome }) {
  return (
    <div className="w-full flex justify-center" style={{ backgroundColor: PALETTE.ink }}>
      <div className="w-full max-w-2xl flex items-center justify-between px-4 py-3.5">
        <button onClick={onHome} className="flex items-center gap-2" disabled={!onHome}>
          <HelpCircle size={18} style={{ color: PALETTE.goldSoft }} />
          <span className="sayeon-serif text-sm font-bold" style={{ color: PALETTE.paper }}>
            오늘의 질문 편집실
          </span>
        </button>
        {subtitle && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: PALETTE.inkSoft, color: PALETTE.goldSoft }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-md text-sm" style={{ backgroundColor: "#F3E3E1", color: PALETTE.signal }}>
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function Loading({ text }) {
  return (
    <div className="flex flex-col items-center pt-16 gap-3">
      <Loader2 size={26} className="animate-spin" style={{ color: PALETTE.gold }} />
      <p className="text-sm" style={{ color: PALETTE.textMuted }}>{text}</p>
    </div>
  );
}

// 질문 사다리. level이 있으면 그 칸을 강조합니다.
export function Ladder({ level, compact }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {LADDER.map((l) => {
        const on = l.level === level;
        return (
          <div
            key={l.level}
            className="rounded-md px-2 py-2 text-center"
            style={{
              backgroundColor: on ? PALETTE.gold : "white",
              border: `1px solid ${on ? PALETTE.gold : PALETTE.paperDeep}`,
              color: on ? "white" : PALETTE.text,
            }}
          >
            <div className="text-xs font-bold">
              {l.level} {l.name}
            </div>
            {!compact && (
              <div className="text-[11px] mt-0.5" style={{ color: on ? "white" : PALETTE.textMuted }}>
                {l.hint}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PrimaryButton({ children, disabled, onClick, className = "" }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-3 rounded-md text-sm font-bold transition-opacity ${className}`}
      style={{ backgroundColor: PALETTE.ink, color: PALETTE.paper, opacity: disabled ? 0.35 : 1 }}
    >
      {children}
    </button>
  );
}
