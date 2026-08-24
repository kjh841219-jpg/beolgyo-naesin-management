import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "벌교미래엔영어학원 | 초등·중등 영어성장 시스템",
    description:
      "N-TELS 진단부터 수준별 수업, 평가와 복습, 학부모 피드백까지. 아이에게 맞는 출발점에서 영어 자신감을 키웁니다.",
    keywords: ["벌교 영어학원", "보성 영어학원", "초등 영어", "중등 영어", "미래엔영어"],
    openGraph: {
      title: "벌교미래엔영어학원",
      description: "현재 수준부터 정확히 살피고, 필요한 단계부터 시작하는 초·중등 영어교육",
      type: "website",
      locale: "ko_KR",
      images: [{ url: imageUrl, width: 1734, height: 910, alt: "벌교미래엔영어학원" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "벌교미래엔영어학원",
      description: "아이에게는 영어 자신감을, 부모님에게는 교육 방향에 대한 확신을.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
