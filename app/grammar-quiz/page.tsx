import type { Metadata } from "next";
import GrammarQuiz from "./GrammarQuiz";
import "./grammar-quiz.css";
import "./word-pronunciation.css";
import "./landing-theme.css";
import "./choice-polish.css";
import "./unit-select.css";
import "../miraen-learning/voice.css";

export const metadata: Metadata = {
  title: "Grammar Fun 단원별 퀴즈 | 벌교미래엔영어",
  description: "Grammar Fun 1·2 교재의 유닛별 단어, 영작, 문법 문제 학습",
};

export default function Page() {
  return <GrammarQuiz />;
}
