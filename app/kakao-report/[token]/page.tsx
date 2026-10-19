import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { database } from "../../api/admin/learning/_shared";
import "../report.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "학습 피드백 자세히 보기 | 벌교미래엔영어",
  robots: { index: false, follow: false },
};

type ShareLink = { student_name: string; image_url: string };

function safeToken(value: string) {
  return /^[a-f0-9]{32}$/i.test(value) ? value : "";
}

export default async function SavedKakaoReportPage({ params }: { params: Promise<{ token: string }> }) {
  const token = safeToken((await params).token);
  if (!token) notFound();
  const db = database();
  await db.prepare("CREATE TABLE IF NOT EXISTS learning_share_links (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, student_id INTEGER NOT NULL, student_name TEXT NOT NULL, image_url TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await db.prepare("ALTER TABLE learning_share_links ADD COLUMN IF NOT EXISTS id BIGSERIAL UNIQUE").run();
  const result = await db.prepare("SELECT student_name,image_url FROM learning_share_links WHERE token=? LIMIT 1").bind(token).all<ShareLink>();
  const report = result.results[0];
  if (!report) notFound();
  return (
    <main className="kakao-report-page">
      <header>
        <span>BEOLGYO MIRAE-N ENGLISH</span>
        <h1>{report.student_name} 학생 전체 학습 피드백</h1>
        <p>그래프와 학습 피드백 전체 내용을 한 장으로 확인할 수 있습니다.</p>
      </header>
      <section className="kakao-report-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={report.image_url} alt={`${report.student_name} 학생 전체 학습 피드백`} />
        <a href={report.image_url} target="_blank" rel="noreferrer">원본 이미지 크게 보기</a>
      </section>
      <footer>벌교미래엔영어 · 따뜻하게 격려하고 정확하게 분석합니다.</footer>
    </main>
  );
}
