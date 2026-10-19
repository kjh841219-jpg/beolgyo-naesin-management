import type { Metadata } from "next";
import MiraenLearning from "./MiraenLearning";
import GrammarSeriesMenu from "./GrammarSeriesMenu";
import "./style.css";
import "./voice.css";
import "./series-route.css";

export const metadata: Metadata = {
  title: "미래엔영어학습 | 벌교미래엔영어",
  description: "Grammar Fun, Reading Town, Reading Builder 교재의 유닛별 영어학습",
};

export default function Page() {
  return <><GrammarSeriesMenu /><MiraenLearning /></>;
}
