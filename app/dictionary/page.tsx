import type { Metadata } from "next";
import DictionaryClient from "./DictionaryClient";
import "./dictionary.css";
import "./study-tools.css";
import "./korean-first.css";
import "./inline-title.css";
import "./responsive-word-title.css";

export const metadata: Metadata = { title: "영어사전 | 벌교미래엔영어", description: "영어 단어의 뜻과 발음을 검색하는 학습 사전" };
export default function DictionaryPage(){ return <DictionaryClient/>; }
