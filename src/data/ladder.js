export const CORE_QUESTION =
  "고려 사람들이 남긴 자료를 살펴보면, 사람들은 신분, 성별, 종교, 교류에 따라 어떻게 다르게 살았을까?";

export const LADDER = [
  { level: 1, name: "사실적", hint: "무엇? 어디? 누구?" },
  { level: 2, name: "개념적", hint: "왜? 어떤 관계?" },
  { level: 3, name: "논쟁적", hint: "옳을까? 필요할까?" },
  { level: 4, name: "실제적", hint: "우리는 어떻게?" },
];

export const CHECKS = [
  { key: "core", label: "핵심 질문과 이어져요" },
  { key: "source", label: "자료로 답을 찾을 수 있어요" },
  { key: "open", label: "깊이 생각할 수 있어요" },
  { key: "views", label: "생각에 따라 답이 달라질 수 있어요" },
];

export function ladderName(level) {
  return LADDER.find((l) => l.level === level)?.name || "-";
}
