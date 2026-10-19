import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { clean, database, ensureLearningSchema, requireAdmin } from "../_shared";

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    if (body.type === "blob.generate-client-token" && !await requireAdmin()) {
      return Response.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
    }
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith("resources/")) throw new Error("허용되지 않은 파일 경로입니다.");
        if (!clientPayload) throw new Error("배정 정보가 없습니다.");
        const data = JSON.parse(clientPayload);
        if (!Number(data.studentId) || !clean(data.title, 120) || !clean(data.assignmentKey, 100)) throw new Error("학생·제목 정보가 올바르지 않습니다.");
        return { allowedContentTypes: ["video/*", "audio/*", "application/pdf", "image/*", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], maximumSizeInBytes: 500 * 1024 * 1024, addRandomSuffix: true, tokenPayload: clientPayload };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const data = JSON.parse(tokenPayload);
        const assignmentKey = clean(data.assignmentKey, 100), studentId = Number(data.studentId), title = clean(data.title, 120);
        if (!assignmentKey || !studentId || !title) return;
        const db = database();
        await ensureLearningSchema(db);
        await db.prepare("INSERT INTO learning_resources(student_id,title,description,resource_url,file_key,file_name,content_type,file_size,assignment_key) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT (assignment_key) WHERE assignment_key <> '' DO NOTHING RETURNING id").bind(studentId,title,clean(data.description,1000),clean(data.resourceUrl,1000),blob.pathname,clean(data.fileName,200),clean(data.contentType,160),Number(data.fileSize)||0,assignmentKey).run();
        console.log("[resource-upload] assignment completed", { assignmentKey, studentId, pathname: blob.pathname });
      },
    });
    return Response.json(response);
  } catch (error) {
    console.error("[resource-upload] client upload failed", error);
    const detail = error instanceof Error ? error.message : String(error);
    const suspended = /store has been suspended|blob.*suspended/i.test(detail);
    return Response.json({ error: suspended ? "Vercel 동영상 저장소가 중지되었습니다. 저장소를 재활성화하거나 인강 링크를 등록해 주세요." : "동영상 업로드 준비에 실패했습니다." }, { status: suspended ? 503 : 400 });
  }
}
