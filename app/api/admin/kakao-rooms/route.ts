import { isAdminAuthenticated } from "@/app/admin-auth";
import { getKakaoRoomSettings, saveKakaoRoomSettings } from "@/app/record-store";
import { kakaoRoomConflicts, validateKakaoRooms } from "@/app/kakao-room-config";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ message: "관리자 로그인이 필요합니다." }, { status: 401, headers });
  try { return Response.json({ rooms: await getKakaoRoomSettings() }, { headers }); }
  catch { return Response.json({ message: "공통 대화방 연결을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요." }, { status: 503, headers }); }
}

async function save(request: Request, replace: boolean) {
  if (!await isAdminAuthenticated()) return Response.json({ message: "관리자 로그인이 필요합니다." }, { status: 401, headers });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ message: "관리자페이지에서 다시 저장해 주세요." }, { status: 403, headers });
  let rooms: Record<string, string>;
  try {
    const body = await request.text();
    if (body.length > 64000) throw new Error("저장할 연결 정보가 너무 큽니다.");
    rooms = validateKakaoRooms((JSON.parse(body) as { rooms?: unknown }).rooms);
    if (replace && Object.keys(rooms).length !== 1) throw new Error("변경할 대화방 한 개를 선택해 주세요.");
  } catch (error) { return Response.json({ message: error instanceof Error ? error.message : "연결 정보를 확인해 주세요." }, { status: 400, headers }); }
  try {
    const shared = await saveKakaoRoomSettings(rooms, replace);
    const conflicts = replace ? [] : kakaoRoomConflicts(rooms, shared);
    return Response.json({ rooms: shared, conflicts, message: conflicts.length ? `${conflicts.length}개 연결의 방 이름이 달라 기존 공통 연결을 유지했습니다. 해당 학생의 대화방 변경에서 직접 확인해 주세요.` : "공통 연결을 저장했습니다. 다른 브라우저의 관리자페이지에서도 불러옵니다." }, { headers });
  } catch { return Response.json({ message: "공통 연결을 저장하지 못했습니다. 기존 연결은 삭제하지 않았습니다." }, { status: 503, headers }); }
}
export async function POST(request: Request) { return save(request, false); }
export async function PUT(request: Request) { return save(request, true); }
