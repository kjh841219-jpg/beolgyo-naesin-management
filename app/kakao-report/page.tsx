import type { Metadata } from "next";
import "./report.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "학습 피드백 자세히 보기 | 벌교미래엔영어",
  robots: { index: false, follow: false },
};

function safeKakaoImage(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const kakaoHost = url.hostname === "kakaocdn.net" || url.hostname.endsWith(".kakaocdn.net");
    return url.protocol === "https:" && kakaoHost ? url.toString() : "";
  } catch {
    return "";
  }
}

export default async function KakaoReportPage({
  searchParams,
}: {
  searchParams: Promise<{ image?: string; student?: string }>;
}) {
  const params = await searchParams;
  const image = safeKakaoImage(params.image);
  const student = (params.student || "학생").slice(0, 30);

  return (
    <main className="kakao-report-page">
      <header>
        <span>BEOLGYO MIRAE-N ENGLISH</span>
        <h1>{student} 학생 전체 학습 피드백</h1>
        <p>그래프와 학습 피드백 전체 내용을 한 장으로 확인할 수 있습니다.</p>
      </header>
      {image ? (
        <section className="kakao-report-image">
          {/* 카카오 공유 SDK가 생성한 HTTPS 이미지 주소만 허용합니다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`${student} 학생 전체 학습 피드백`} />
          <a href={image} target="_blank" rel="noreferrer">원본 이미지 크게 보기</a>
        </section>
      ) : (
        <section className="kakao-report-error">
          <h2>이미지를 불러올 수 없습니다.</h2>
          <p>관리자 페이지에서 카톡 보내기를 다시 실행해 주세요.</p>
        </section>
      )}
      <footer>벌교미래엔영어 · 따뜻하게 격려하고 정확하게 분석합니다.</footer>
    </main>
  );
}
