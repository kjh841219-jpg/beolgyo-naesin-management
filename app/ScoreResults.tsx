"use client";

import { useEffect, useRef, useState } from "react";
import { useLandingContent } from "./useLandingContent";

export function ScoreResults() {
  const content = useLandingContent();
  const scoreResults = content.scoreStories;
  const sectionRef = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scores, setScores] = useState<number[]>(scoreResults.map((result) => result.before));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setScores(scoreResults.map((result) => result.after)); setIsRevealed(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setIsRevealed(true);
      const startedAt = performance.now();
      const duration = 1250;
      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setScores(scoreResults.map((result) => Math.round(result.before + (result.after - result.before) * eased)));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, { threshold: 0.22 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [JSON.stringify(scoreResults)]);

  return <section ref={sectionRef} className={`score-results-section ${isRevealed ? "is-revealed" : ""}`} id="score-results">
    <div className="score-results-glow glow-one" /><div className="score-results-glow glow-two" />
    <div className="score-energy-beam" aria-hidden="true" /><div className="score-motion-lines" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
    <div className="score-live-ticker" aria-hidden="true"><div><span>SCORE UP</span><b>●</b><span>{content.scoreTitle}</span><b>●</b><span>MAX +40</span><b>●</b><span>SCORE UP</span><b>●</b><span>{content.scoreTitle}</span><b>●</b><span>MAX +40</span><b>●</b></div></div>
    <div className="score-results-inner">
      <div className="score-results-heading">
        <div><p className="score-kicker"><span /> REAL SCORE UP · MIDDLE SCHOOL</p><h2><span>{content.scoreTitle}</span><br /><strong>{content.scoreHeadline}</strong></h2></div>
        <div className="score-summary"><span>실제 성적 향상 사례</span><strong><b>최대</b> +{Math.max(...scoreResults.map((result) => result.gain), 0)}<small>점</small></strong><p>{content.scoreSummary}</p></div>
      </div>
      <div className="score-proof-bar">
        <div><span>{scoreResults.length}</span><p><b>명 모두</b><small>성적 상승 기록</small></p></div><i /><div><span>+{(scoreResults.reduce((sum, result) => sum + result.gain, 0) / Math.max(scoreResults.length, 1)).toFixed(1)}</span><p><b>점</b><small>평균 상승폭</small></p></div><a href="#consult">{content.scoreCta} <b>→</b></a>
      </div>
      <div className="score-overview-chart">
        <div className="score-overview-head">
          <div><span>SCORE COMPARISON GRAPH</span><h3>학생별 시험 점수 변화</h3></div>
          <div className="score-chart-legend"><span><i className="legend-before" />수강 전</span><span><i className="legend-after" />최근 점수</span></div>
        </div>
        <div className="score-overview-body">
          {scoreResults.map((result, index) => (
            <div className="score-overview-row" key={`chart-${result.school}-${result.before}-${result.after}`}>
              <div className="overview-student"><b>{result.school}</b><span>{result.grade} {result.student}</span></div>
              <div className="overview-bars" aria-label={`${result.before}점에서 ${result.after}점으로 향상`}>
                <div><span>수강 전</span><i className="overview-before-bar" style={{ "--overview-width": `${result.before}%` } as React.CSSProperties}><b>{result.before}</b></i></div>
                <div><span>최근</span><i className="overview-after-bar" style={{ "--overview-width": `${result.after}%`, "--overview-delay": `${index * 90}ms` } as React.CSSProperties}><b>{scores[index]}</b></i></div>
              </div>
              <strong>+{result.gain}<small>점</small></strong>
            </div>
          ))}
        </div>
      </div>
      <div className="score-results-grid">
        {scoreResults.map((result, index) => <article className="score-result-card" key={`${result.school}-${result.before}-${result.after}`}>
          <div className="score-card-top"><span className="result-number">0{index + 1}</span><span className="gain-badge">+{result.gain}점 <b>폭풍 향상</b></span></div>
          <div className="student-identity"><p><strong>{result.school}</strong> {result.grade}</p><span>{result.student}</span></div>
          <div className="score-jump" aria-label={`${result.before}점에서 ${result.after}점으로 ${result.gain}점 향상`}>
            <div className="score-before"><small>BEFORE</small><strong>{result.before}</strong><span>점</span></div><div className="score-arrow"><i /><b>UP</b></div><div className="score-after"><small>AFTER</small><strong>{scores[index]}</strong><span>점</span></div>
          </div>
          <div className="score-chart" aria-hidden="true"><div className="chart-grid"><i /><i /><i /></div><div className="chart-bar before-bar" style={{ height: `${result.before}%` }}><span>{result.before}</span></div><div className="chart-bar after-bar" style={{ "--score-height": `${result.after}%` } as React.CSSProperties}><span>{result.after}</span></div></div>
          <p className="score-card-caption">약점을 정확히 찾고<br /><strong>점수로 연결한 학습의 변화</strong></p><div className="score-sparkles" aria-hidden="true"><i /><i /><i /></div>
        </article>)}
      </div>
      <div className="score-results-footnote"><p>※ 위 사례는 실제 학생의 시험 성적을 바탕으로 하며, 개인정보 보호를 위해 이름을 익명 처리했습니다. 학습 결과는 학생의 시작 수준, 출석, 과제 수행과 학습 태도에 따라 달라질 수 있습니다.</p><a href="#consult">최근 시험지로 취약 영역 진단받기 <span>→</span></a></div>
    </div>
    <div className="score-bottom-ticker" aria-hidden="true"><div><span>BEFORE</span><b>→</b><strong>AFTER</strong><i>REAL CHANGE</i><span>BEFORE</span><b>→</b><strong>AFTER</strong><i>REAL CHANGE</i></div></div>
  </section>;
}
