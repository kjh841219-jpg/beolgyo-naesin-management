"use client";

import { useLandingContent } from "./useLandingContent";

export function LiteracySection() {
  const content = useLandingContent();
  return <section className="literacy-section" id="literacy">
    <div className="literacy-orbit orbit-one" aria-hidden="true" /><div className="literacy-orbit orbit-two" aria-hidden="true" />
    <div className="literacy-inner">
      <div className="literacy-heading"><div><p className="section-label literacy-label"><span /> ENGLISH LITERACY</p><h2>{content.literacyTitle}</h2><p>{content.literacyIntro}</p></div><div className="literacy-statement"><span>READ · THINK · APPLY</span><strong>{content.literacyStatement}</strong><i>{content.literacyBridge}</i></div></div>
      <div className="literacy-grid">
        {content.literacyCards.map((card, index) => <article className={`literacy-card ${index === 1 ? "literacy-card-featured" : ""} ${index === 3 ? "literacy-card-dark" : ""}`} key={`${card.eyebrow}-${index}`}><div className="literacy-card-top"><span>0{index + 1}</span><em>{card.eyebrow}</em></div><h3>{card.title}</h3><p>{card.description}</p><b className="literacy-card-mark">0{index + 1}</b></article>)}
      </div>
      <div className="literacy-cta"><p>우리 아이 영어 문해력, 현재 위치부터 확인해 보세요.</p><div><a className="button button-dark" href="#level-test">{content.literacyCta} <span>→</span></a><a className="button button-light" href="#consult">{content.literacyCtaSecondary}</a></div></div>
    </div>
  </section>;
}
