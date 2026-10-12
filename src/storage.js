// 새로고침해도 하던 활동을 이어 가도록 브라우저에 잠깐 기억해 둡니다. (실패해도 앱은 정상 동작)
export function remember(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* 저장소를 쓸 수 없는 환경 */
  }
}

export function recall(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
