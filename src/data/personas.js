// 학생 화면에 보여 줄 인물 정보. (AI에게 주는 설정은 서버의 lib/personas.js에 있어요)
export const PERSONA_LIST = [
  { id: "official", emoji: "📜", name: "과거에 합격한 관리", intro: "지방 출신이지만 과거 시험에 합격해 개경의 관리가 되었어요." },
  { id: "pyeongryang", emoji: "🌾", name: "평량", intro: "노비였지만 재산을 모아 양인이 되고 관직까지 얻었어요." },
  { id: "mother", emoji: "🏠", name: "나익희의 어머니", intro: "여섯 남매에게 재산을 나누어 주려는 어머니예요." },
  { id: "monk", emoji: "🪷", name: "절에 머무는 승려", intro: "절에서 수행하며 오가는 사람들을 맞이해요." },
  { id: "daejang", emoji: "🪵", name: "대장경을 만드는 관리", intro: "몽골이 쳐들어온 때, 팔만대장경 만드는 일을 맡았어요." },
  { id: "merchant", emoji: "⛵", name: "벽란도의 상인", intro: "벽란도에서 여러 나라 상인과 물건을 사고팔아요." },
  { id: "farmer", emoji: "🛡️", name: "강감찬 군대의 농민", intro: "농사짓다가 거란이 쳐들어오자 고려군에 합류했어요." },
];

export function findPersona(id) {
  return PERSONA_LIST.find((p) => p.id === id) || null;
}
