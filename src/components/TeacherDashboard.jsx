import { useEffect, useState } from "react";
import { RefreshCcw, Printer, X, ChevronRight, Download } from "lucide-react";
import { PALETTE } from "../palette.js";
import { fetchAll } from "../services/sessions.js";
import { ladderName, CHECKS } from "../data/ladder.js";
import { ErrorBox } from "./Shared.jsx";

function formatTime(ts) {
  if (!ts) return "-";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeacherDashboard() {
  return <Dashboard />;
}

function Dashboard() {
  const [tab, setTab] = useState("coach");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(null);

  async function load(kind = tab) {
    setLoading(true);
    setLoadError("");
    try {
      setRows(await fetchAll(kind));
    } catch (e) {
      setLoadError(e.message || "목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelected(null);
    load(tab);
  }, [tab]);

  function exportCsv() {
    if (tab === "coach") {
      downloadCsv("질문다듬기_기록.csv", [
        ["이름", "모둠", "상태", "처음 질문", "처음 칸", "최종 질문", "최종 칸", "고쳐 쓴 횟수", "받아들인 것", "받아들이지 않은 것과 이유"],
        ...rows.map((r) => {
          const v = r.versions || [];
          const first = v[0];
          const last = v[v.length - 1];
          return [
            r.studentName,
            r.group,
            r.status === "completed" ? "완성" : "진행중",
            first?.question,
            ladderName(first?.feedback?.level),
            r.finalQuestion || last?.question,
            ladderName(r.finalLevel || last?.feedback?.level),
            Math.max(0, v.length - 1),
            r.reflection?.accepted,
            r.reflection?.rejected,
          ];
        }),
      ]);
    } else {
      const out = [["모둠", "인물", "기자", "순서", "질문", "답"]];
      rows.forEach((r) => {
        const m = r.messages || [];
        let n = 0;
        for (let i = 0; i < m.length; i++) {
          if (m[i].role !== "user") continue;
          n += 1;
          const ans = m[i + 1]?.role === "assistant" ? m[i + 1].text : "";
          out.push([r.group, r.personaName, r.reporters, n, m[i].text, ans]);
        }
      });
      downloadCsv("기자회견_기록.csv", out);
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: PALETTE.paper }}>
      <div className="w-full flex justify-center no-print" style={{ backgroundColor: PALETTE.ink }}>
        <div className="w-full max-w-5xl flex items-center justify-between px-5 py-3.5">
          <span className="sayeon-serif text-sm font-bold" style={{ color: PALETTE.paper }}>
            질문 편집실 · 교사 취합 화면
          </span>
          <div className="flex items-center gap-4">
            <button onClick={exportCsv} className="flex items-center gap-1.5 text-xs font-bold" style={{ color: PALETTE.goldSoft }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={() => load()} className="flex items-center gap-1.5 text-xs font-bold" style={{ color: PALETTE.goldSoft }}>
              <RefreshCcw size={13} /> 새로고침
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-5 py-6">
        <div className="flex gap-2 mb-5 no-print">
          {[
            ["coach", "질문 다듬기 (4차시)"],
            ["interview", "기자회견 (6차시)"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 rounded-full text-sm font-bold"
              style={{
                backgroundColor: tab === key ? PALETTE.ink : "white",
                color: tab === key ? PALETTE.paper : PALETTE.text,
                border: `1px solid ${PALETTE.paperDeep}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loadError && <ErrorBox message={loadError} />}
        {loading ? (
          <p className="text-sm" style={{ color: PALETTE.textMuted }}>불러오는 중...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm" style={{ color: PALETTE.textMuted }}>아직 기록이 없어요.</p>
        ) : tab === "coach" ? (
          <CoachTable rows={rows} onOpen={setSelected} />
        ) : (
          <InterviewTable rows={rows} onOpen={setSelected} />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 flex items-start justify-center overflow-y-auto py-10 px-4" style={{ backgroundColor: "rgba(38,34,29,0.5)" }}>
          <div className="w-full max-w-xl rounded-lg p-6" style={{ backgroundColor: PALETTE.paper }}>
            <div className="flex justify-end gap-3 mb-2 no-print">
              <button onClick={() => window.print()} className="flex items-center gap-1 text-xs font-bold" style={{ color: PALETTE.textMuted }}>
                <Printer size={14} /> 인쇄
              </button>
              <button onClick={() => setSelected(null)}>
                <X size={18} style={{ color: PALETTE.textMuted }} />
              </button>
            </div>
            {tab === "coach" ? <CoachDetail s={selected} /> : <InterviewDetail s={selected} />}
          </div>
        </div>
      )}
    </div>
  );
}

const th = "text-left px-3 py-2.5 font-bold";
const td = "px-3 py-2.5 align-top";

function CoachTable({ rows, onOpen }) {
  return (
    <div className="rounded-lg border overflow-x-auto" style={{ borderColor: PALETTE.paperDeep }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: PALETTE.paperDeep, color: PALETTE.text }}>
            <th className={th}>모둠</th>
            <th className={th}>학생</th>
            <th className={th}>처음 질문</th>
            <th className={th}>최종 질문</th>
            <th className={th}>사다리</th>
            <th className={th}>고친 횟수</th>
            <th className={th}>상태</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const v = r.versions || [];
            const first = v[0];
            const last = v[v.length - 1];
            return (
              <tr key={r.id} className="border-t" style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white", color: PALETTE.text }}>
                <td className={td}>{r.group}</td>
                <td className={td}>{r.studentName}</td>
                <td className={td}>{first?.question}</td>
                <td className={td}>{r.finalQuestion || last?.question}</td>
                <td className={td + " whitespace-nowrap"}>
                  {first?.feedback?.level || "-"} → {r.finalLevel || last?.feedback?.level || "-"}
                </td>
                <td className={td}>{Math.max(0, v.length - 1)}회</td>
                <td className={td}>{r.status === "completed" ? "완성" : "진행중"}</td>
                <td className={td}>
                  <button onClick={() => onOpen(r)} className="flex items-center text-xs font-bold" style={{ color: PALETTE.gold }}>
                    자세히 <ChevronRight size={13} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CoachDetail({ s }) {
  return (
    <div>
      <h2 className="sayeon-serif text-lg font-bold mb-1" style={{ color: PALETTE.text }}>
        {s.group}모둠 · {s.studentName}
      </h2>
      <p className="text-xs mb-4" style={{ color: PALETTE.textMuted }}>
        {s.status === "completed" ? "완성" : "진행중"} · 마지막 수정 {formatTime(s.updatedAt)}
      </p>
      <div className="flex flex-col gap-4">
        {(s.versions || []).map((v, i) => (
          <div key={i} className="border-t pt-3" style={{ borderColor: PALETTE.paperDeep }}>
            <p className="text-xs font-bold mb-1" style={{ color: PALETTE.gold }}>
              {i + 1}번째 질문 · {v.feedback?.level}칸 {ladderName(v.feedback?.level)}
            </p>
            <p className="sayeon-serif mb-2" style={{ color: PALETTE.text }}>{v.question}</p>
            <ul className="text-xs leading-relaxed" style={{ color: PALETTE.textMuted }}>
              {v.feedback?.good_point && <li>· 잘한 점: {v.feedback.good_point}</li>}
              {v.feedback?.level_reason && <li>· 사다리 판단: {v.feedback.level_reason}</li>}
              <li>
                · 조건:{" "}
                {CHECKS.map((c) => `${v.feedback?.checks?.[c.key] ? "✔" : "○"} ${c.label}`).join("  ")}
              </li>
              <li style={{ color: PALETTE.detective }}>· 되묻기: {v.feedback?.coach_question}</li>
            </ul>
          </div>
        ))}
        {s.reflection && (
          <div className="border-t pt-3 text-sm" style={{ borderColor: PALETTE.paperDeep, color: PALETTE.text }}>
            <p><b>받아들인 것</b> {s.reflection.accepted || "-"}</p>
            <p className="mt-1"><b>받아들이지 않은 것과 이유</b> {s.reflection.rejected || "-"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InterviewTable({ rows, onOpen }) {
  return (
    <div className="rounded-lg border overflow-x-auto" style={{ borderColor: PALETTE.paperDeep }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: PALETTE.paperDeep, color: PALETTE.text }}>
            <th className={th}>모둠</th>
            <th className={th}>인물</th>
            <th className={th}>기자</th>
            <th className={th}>질문 수</th>
            <th className={th}>마지막 질문</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t" style={{ borderColor: PALETTE.paperDeep, backgroundColor: "white", color: PALETTE.text }}>
              <td className={td}>{r.group}</td>
              <td className={td}>{r.personaName}</td>
              <td className={td}>{r.reporters}</td>
              <td className={td}>{(r.messages || []).filter((m) => m.role === "user").length}개</td>
              <td className={td}>{formatTime(r.updatedAt)}</td>
              <td className={td}>
                <button onClick={() => onOpen(r)} className="flex items-center text-xs font-bold" style={{ color: PALETTE.gold }}>
                  자세히 <ChevronRight size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InterviewDetail({ s }) {
  return (
    <div>
      <h2 className="sayeon-serif text-lg font-bold mb-1" style={{ color: PALETTE.text }}>
        {s.group}모둠 기자회견 · {s.personaName}
      </h2>
      <p className="text-xs mb-4" style={{ color: PALETTE.textMuted }}>기자: {s.reporters}</p>
      <div className="flex flex-col gap-2">
        {(s.messages || []).map((m, i) => (
          <p
            key={i}
            className="text-sm leading-relaxed rounded-md px-3 py-2"
            style={m.role === "user" ? { backgroundColor: PALETTE.detectiveSoft } : { backgroundColor: "white" }}
          >
            <b>{m.role === "user" ? "기자" : "고려 사람"}</b> {m.text}
          </p>
        ))}
      </div>
    </div>
  );
}
