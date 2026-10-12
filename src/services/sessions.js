import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";

const QUESTIONS = "questionSessions";
const INTERVIEWS = "interviewSessions";

// ---------- 질문 다듬기 ----------
export async function createQuestionSession({ studentName, group, version }) {
  const ref = await addDoc(collection(db, QUESTIONS), {
    studentName,
    group,
    status: "in_progress",
    versions: [version],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveQuestionVersions({ id, versions }) {
  await updateDoc(doc(db, QUESTIONS, id), { versions, updatedAt: serverTimestamp() });
}

export async function finishQuestionSession({ id, finalQuestion, finalLevel, reflection }) {
  await updateDoc(doc(db, QUESTIONS, id), {
    status: "completed",
    finalQuestion,
    finalLevel,
    reflection,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function loadQuestionSession(id) {
  const snap = await getDoc(doc(db, QUESTIONS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// 같은 이름·모둠으로 아직 끝내지 않은 가장 최근 질문 기록을 찾습니다. (기기가 바뀌어도 이어 쓰기)
export async function findOpenQuestionSession({ studentName, group }) {
  const snap = await getDocs(query(collection(db, QUESTIONS), where("studentName", "==", studentName)));
  const open = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.group === group && s.status !== "completed" && Array.isArray(s.versions) && s.versions.length);
  const time = (s) => (s.updatedAt?.toMillis ? s.updatedAt.toMillis() : 0);
  open.sort((a, b) => time(b) - time(a));
  return open[0] || null;
}

// ---------- 기자회견 ----------
export async function createInterview({ group, reporters, personaId, personaName, messages }) {
  const ref = await addDoc(collection(db, INTERVIEWS), {
    group,
    reporters,
    personaId,
    personaName,
    messages,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveInterviewMessages({ id, messages }) {
  await updateDoc(doc(db, INTERVIEWS, id), { messages, updatedAt: serverTimestamp() });
}

export async function loadInterview(id) {
  const snap = await getDoc(doc(db, INTERVIEWS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------- 교사 화면 ----------
export async function fetchAll(kind) {
  const name = kind === "interview" ? INTERVIEWS : QUESTIONS;
  const snap = await getDocs(query(collection(db, name), orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
