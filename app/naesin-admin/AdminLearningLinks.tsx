"use client";
import { upload } from "@vercel/blob/client";
import { FormEvent, useCallback, useEffect, useState } from "react";
type S = { id: number; name: string; school: string; grade: string };
type R = {
  id: number;
  studentName: string;
  title: string;
  description: string;
  resourceUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
};

export default function AdminLearningLinks() {
  const [students, setStudents] = useState<S[]>([]),
    [studentId, setStudentId] = useState(0),
    [items, setItems] = useState<R[]>([]),
    [msg, setMsg] = useState(""),
    [saving, setSaving] = useState(false),
    [progress, setProgress] = useState(0),
    [updated, setUpdated] = useState("");
  const load = useCallback(async (id: number) => {
    const r = await fetch(`/api/admin/learning/resources?studentId=${id}`, {
      cache: "no-store",
    });
    if (r.ok) setItems((await r.json()).items || []);
    setUpdated(
      new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, []);
  useEffect(() => {
    fetch("/api/admin/learning/students", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const rows = d.items || [];
        setStudents(rows);
        if (rows[0]) setStudentId((x) => x || rows[0].id);
      });
  }, []);
  useEffect(() => {
    if (!studentId) return;
    void load(studentId);
    const t = setInterval(() => void load(studentId), 3000);
    return () => clearInterval(t);
  }, [studentId, load]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!studentId) return setMsg("배정할 학생을 선택해 주세요.");
    const form = e.currentTarget,
      data = new FormData(form),
      rawUrl = String(data.get("resourceUrl") || "").trim(),
      url = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl,
      file = data.get("file");
    if (!url && (!(file instanceof File) || !file.size))
      return setMsg("인강 링크 또는 학습 파일 중 하나를 등록해 주세요.");
    if (file instanceof File && file.size > 500 * 1024 * 1024)
      return setMsg("동영상과 학습 파일은 500MB 이하로 올려 주세요.");
    setSaving(true);
    setProgress(0);
    setMsg(
      file instanceof File && file.size
        ? "파일을 안전하게 업로드하고 있습니다…"
        : "학생에게 배정하고 있습니다…",
    );
    try {
      const assignmentKey = crypto.randomUUID();
      data.set("resourceUrl", url);
      // A pasted link always wins. This prevents a previously selected file from
      // retrying the suspended Blob upload and blocking a valid link assignment.
      if (url) data.delete("file");
      if (!url && file instanceof File && file.size) {
        try {
          const blob = await upload(`resources/${studentId}/${file.name}`, file, {
            access: "private",
            handleUploadUrl: "/api/admin/learning/resource-upload",
            clientPayload: JSON.stringify({
              assignmentKey,
              studentId,
              title: String(data.get("title") || "").trim(),
              description: String(data.get("description") || "").trim(),
              resourceUrl: url,
              fileName: file.name,
              contentType: file.type || "application/octet-stream",
              fileSize: file.size,
            }),
            multipart: file.size > 10 * 1024 * 1024,
            onUploadProgress: (x) => setProgress(Math.round(x.percentage)),
          });
          data.delete("file");
          data.set("uploadedPath", blob.pathname);
          data.set("uploadedName", file.name);
          data.set("uploadedType", file.type || "application/octet-stream");
          data.set("uploadedSize", String(file.size));
        } catch (uploadError) {
          const detail = uploadError instanceof Error ? uploadError.message : String(uploadError);
          const storeSuspended = /store has been suspended|blob.*suspended/i.test(detail);
          if (storeSuspended && file.size <= 4 * 1024 * 1024) {
            setMsg("대용량 저장소가 중지되어 작은 파일용 안전 저장 방식으로 전환합니다…");
            setProgress(50);
          } else if (storeSuspended) {
            throw new Error("Vercel 동영상 저장소가 중지되어 파일을 올릴 수 없습니다. Vercel Blob 저장소를 재활성화하거나, 영상을 Google Drive·YouTube 등에 올린 뒤 왼쪽의 인강 링크로 배정해 주세요.");
          } else {
            throw uploadError;
          }
        }
      }
      data.set("studentId", String(studentId));
      data.set("assignmentKey", assignmentKey);
      const r = await fetch("/api/admin/learning/resources", {
          method: "POST",
          body: data,
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "배정하지 못했습니다.");
      setMsg(`${d.message} 학생 화면에서 바로 확인할 수 있습니다.`);
      form.reset();
      setProgress(100);
      await load(studentId);
    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : "업로드 또는 배정에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="learning-links-admin">
      <div>
        <span>VIDEO &amp; FILE ASSIGNMENT</span>
        <h2>학생별 인강·학습자료 배정</h2>
        <p>학생을 선택하고 동영상·파일 또는 링크를 등록하세요. 대용량 동영상은 저장소로 직접 전송됩니다.</p>
        <p className="resource-storage-note">저장소가 중지된 동안에는 4MB 이하 파일 또는 Google Drive·YouTube 인강 링크를 배정할 수 있습니다.</p>
      </div>
      <div className="resource-live-line">
        <i /> 실시간 반영 · {updated || "학생 선택 중"}
      </div>
      <select
        value={studentId}
        onChange={(e) => setStudentId(Number(e.target.value))}
      >
        <option value="0">학생을 선택하세요</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.school} {s.grade}
          </option>
        ))}
      </select>
      <form onSubmit={submit}>
        <input required name="title" placeholder="인강·자료 제목" />
        <input
          type="text"
          inputMode="url"
          name="resourceUrl"
          placeholder="Google Drive·YouTube 인강 링크 (입력 시 파일보다 우선)"
        />
        <label>
          인강 동영상·학습 파일 (선택)
          <input
            type="file"
            name="file"
            accept="video/*,.mp4,.mov,.m4v,.webm,audio/*,application/pdf,image/*,.docx,.pptx,.xlsx"
          />
        </label>
        <textarea
          name="description"
          placeholder="시청 범위, 학습 방법, 완료 날짜"
        />
        {saving && (
          <div className="resource-upload-progress">
            <i style={{ width: `${progress}%` }} />
            <span>{progress ? `업로드 ${progress}%` : "배정 준비 중…"}</span>
          </div>
        )}
        <button
          type="submit"
          className={studentId ? "assignment-ready" : ""}
          disabled={!studentId || saving}
        >
          {saving
            ? progress
              ? `업로드 ${progress}% 진행 중`
              : "배정 중…"
            : studentId
              ? "선택 학생에게 인강 배정"
              : "학생을 먼저 선택하세요"}
        </button>
      </form>
      {msg && <p className="resource-assign-message">{msg}</p>}
      <div>
        {items.map((x) => (
          <article className="admin-resource-card" key={x.id}>
            <div className="admin-resource-info"><b>{x.studentName} · {x.title}</b>
            <p>{x.description || "학습 안내 없음"}</p>
            <small>{x.fileName || "링크 자료"}{x.fileSize ? ` · ${(x.fileSize / 1024 / 1024).toFixed(1)}MB` : ""} · 배정 {String(x.createdAt || "").replace("T", " ").slice(0, 16)}</small></div>
            {x.contentType?.startsWith("video/") && <video className="admin-assigned-video" controls playsInline preload="metadata" src={`/api/admin/learning/resources?fileId=${x.id}`}>동영상을 재생할 수 없습니다.</video>}
            {x.resourceUrl && (
              <a href={x.resourceUrl} target="_blank" rel="noreferrer">
                링크 열기
              </a>
            )}
            {x.fileName && (
              <a
                href={`/api/admin/learning/resources?fileId=${x.id}`}
                target="_blank"
              >
                배정 파일 확인
              </a>
            )}
            <button
              onClick={async () => {
                await fetch(`/api/admin/learning/resources?id=${x.id}`, {
                  method: "DELETE",
                });
                await load(studentId);
              }}
            >
              삭제
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
