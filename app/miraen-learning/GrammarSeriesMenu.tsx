"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function GrammarSeriesMenu() {
  const [learningMenu, setLearningMenu] = useState<Element | null>(null);
  const [quizMenu, setQuizMenu] = useState<Element | null>(null);
  const [seriesMenu, setSeriesMenu] = useState<Element | null>(null);

  useEffect(() => {
    const locate = () => {
      setLearningMenu(document.querySelector(".ml-shell > header nav"));
      setQuizMenu(document.querySelector(".ml-quiz > aside"));
      setSeriesMenu(document.querySelector(".ml-series-tabs"));
    };
    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {learningMenu && createPortal(
        <>
          <a className="room-section-link homework-primary" href="/homework-submit">숙제 제출</a>
          <a className="room-section-link" href="#library">교재 선택</a>
          <a className="room-section-link" href="#quiz">퀴즈 풀기</a>
          <a className="room-section-link" href="#monthly">월말평가</a>
          <a className="room-section-link" href="/miraen-learning">학습실로 돌아가기</a>
        </>,
        learningMenu,
      )}
      {quizMenu && createPortal(<a className="ml-monthly-aside-link" href="#monthly">월말평가</a>, quizMenu)}
      {seriesMenu && createPortal(
        <>
          <a className="ml-series-route" href="/grammar-quiz">Grammar Town · Fun</a>
          <a className="ml-series-route" href="/phonics-quiz">Phonics 학습</a>
        </>,
        seriesMenu,
      )}
    </>
  );
}
