"use client";

import { defaultLandingContent } from "./content";
import { useLandingContent } from "./useLandingContent";

const qrFor = (url: string, fallback: string) => url === fallback
  ? undefined
  : `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=420&margin=2&dark=183713&light=ffffff&ecLevel=H`;

export function SocialSection() {
  const content = useLandingContent();
  const socialChannels = [
    {
    type: "NAVER BLOG",
    title: "벌교미래엔영어학원 블로그",
    description: "수업 소식, 학습 정보와 학원 공지를 블로그에서 자세히 확인하세요.",
    url: content.blogUrl,
    displayUrl: content.blogUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    qr: qrFor(content.blogUrl, defaultLandingContent.blogUrl) ?? "/social/naver-blog-qr.png",
    qrAlt: "벌교미래엔영어학원 네이버 블로그 QR 코드",
    className: "blog-channel",
    mark: "B",
  },
  {
    type: "INSTAGRAM",
    title: "벌교미래엔영어학원 인스타그램",
    description: "학생들의 성장 순간과 생생한 학원 일상을 인스타그램에서 만나보세요.",
    url: content.instagramUrl,
    displayUrl: content.instagramUrl.includes("instagram.com/") ? `@${content.instagramUrl.split("instagram.com/")[1].replaceAll("/", "")}` : content.instagramUrl,
    qr: qrFor(content.instagramUrl, defaultLandingContent.instagramUrl) ?? "/social/instagram-qr.png",
    qrAlt: "벌교미래엔영어학원 인스타그램 QR 코드",
    className: "instagram-channel",
    mark: "IG",
  },
  ];
  return (
    <section className="social-section" id="social">
      <div className="social-heading">
        <div>
          <p className="section-label">FOLLOW OUR CLASSROOM</p>
          <h2>{content.socialTitle.split(" ").slice(0, 3).join(" ")}<br /><strong>{content.socialTitle.split(" ").slice(3).join(" ") || "아이들의 성장 이야기"}</strong></h2>
        </div>
        <p>{content.socialDescription}</p>
      </div>

      <div className="social-channel-grid">
        {socialChannels.map((channel) => (
          <a
            className={`social-channel-card ${channel.className}`}
            href={channel.url}
            target="_blank"
            rel="noreferrer"
            key={channel.type}
            aria-label={`${channel.title} 새 창에서 열기`}
          >
            <div className="social-channel-copy">
              <span className="social-channel-type"><i>{channel.mark}</i>{channel.type}</span>
              <h3>{channel.title}</h3>
              <p>{channel.description}</p>
              <strong>{channel.displayUrl}<b>↗</b></strong>
            </div>
            <div className="social-qr-wrap">
              <img src={channel.qr} alt={channel.qrAlt} loading="lazy" />
              <span>SCAN ME</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
