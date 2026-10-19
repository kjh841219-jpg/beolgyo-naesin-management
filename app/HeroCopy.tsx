"use client";

import { Fragment } from "react";
import { useLandingContent } from "./useLandingContent";

function Lines({ value }: { value: string }) {
  return value.split("\n").map((line, index) => <Fragment key={`${line}-${index}`}>{index > 0 && <br />}{line}</Fragment>);
}

export function HeroCopy() {
  const content = useLandingContent();
  return (
    <div className="hero-copy">
      <p className="eyebrow"><span /> {content.heroEyebrow}</p>
      <h1>
        <Lines value={content.heroTitleBefore} />
        <br />
        <strong>{content.heroTitleAccent}</strong>
        <br />
        {content.heroTitleAfter}
      </h1>
      <p className="hero-description">{content.heroDescription}</p>
      <div className="hero-actions">
        <a className="button button-dark" href="#level-test">무료 레벨테스트 <span>→</span></a>
        <a className="button button-light" href="#consult">학생 상담예약</a>
          <a className="button learning-button" href="https://beolgyo-miraen-learning.vercel.app/miraen-learning">미래엔영어학습 <span>→</span></a>
        <a className="button management-button" href="https://vercel-deploy-mauve-one-18.vercel.app/naesin?v=20260911">내신학습앱 <span>→</span></a>
        <a className="button dictionary-button" href="/dictionary">영어사전 <span>→</span></a>
      </div>
      <div className="hero-stats" aria-label="학원 핵심 정보">
        <div><strong>15년+</strong><span>영어교육 경력</span></div>
        <div><strong>6영역</strong><span>수준별 영어 학습</span></div>
        <div><strong>3단계</strong><span>목표부터 안심까지</span></div>
      </div>
    </div>
  );
}
