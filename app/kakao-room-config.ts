export type KakaoRooms = Record<string, string>;

export function validateKakaoRooms(value: unknown): KakaoRooms {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("연결 정보를 확인해 주세요.");
  const entries = Object.entries(value);
  if (entries.length > 500) throw new Error("한 번에 저장할 연결은 500개 이하여야 합니다.");
  const rooms: KakaoRooms = Object.create(null);
  for (const [key, room] of entries) {
    if (!key.trim() || key.length > 120 || /[\x00-\x1f\x7f]/.test(key) || ["__proto__", "constructor", "prototype"].includes(key)) throw new Error("학생 연결 식별자를 확인해 주세요.");
    if (typeof room !== "string" || !room.trim() || room.trim().length > 120 || /[\x00-\x1f\x7f]/.test(room)) throw new Error("대화방 이름을 120자 이내로 정확히 입력해 주세요.");
    rooms[key] = room.trim();
  }
  return rooms;
}

export function mergeKakaoRoomSources(local: KakaoRooms, shared: KakaoRooms): KakaoRooms {
  return { ...local, ...shared };
}

export function kakaoRoomConflicts(requested: KakaoRooms, shared: KakaoRooms): string[] {
  return Object.keys(requested).filter(key => shared[key] !== undefined && shared[key] !== requested[key]);
}
