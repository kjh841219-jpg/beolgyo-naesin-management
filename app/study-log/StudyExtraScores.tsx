"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";

const tasksByStage:Record<string,string[]>={
 "4주 전 · 기초 정리":["첫 번째 단원 단어 암기","첫 번째 단원 대화문 암기","첫 번째 단원 본문 암기"],
 "3주 전 · 본문 암기·서술형":["첫 번째 단원 문법 설명","첫 번째 단원 문법 정리","문제풀이","오답노트"],
 "2주 전 · 실전 서술형":["두 번째 단원 및 교과서 외부지문 단어 암기","두 번째 단원 및 교과서 외부지문 대화문 암기","두 번째 단원 및 교과서 외부지문 본문 암기"],
 "1주 전 · 최종 마무리":["두 번째 단원 문법 설명","두 번째 단원 문법 정리","문제풀이","오답노트","마지막 학교 프린트물 점검"],
};

export default function StudyExtraScores(){
 const[host,setHost]=useState<HTMLElement|null>(null),[stage,setStage]=useState("4주 전 · 기초 정리"),[scores,setScores]=useState<Record<string,number>>({});
 useEffect(()=>{let element:HTMLDivElement|null=null,select:HTMLSelectElement|null=null;const reset=(value:string)=>{setStage(value);setScores({});window.dispatchEvent(new CustomEvent("study-week-task-scores-change",{detail:{}}))};const onStage=()=>{if(select)reset(select.value)};const onCard=(event:Event)=>{const value=(event as CustomEvent<{value?:string}>).detail?.value;if(value)reset(value)};const mount=()=>{if(element?.isConnected)return;const scoreArea=document.querySelector<HTMLElement>(".study-record-form .self-scores");select=document.querySelector<HTMLSelectElement>(".study-record-form .study-basic select");if(!scoreArea||!select)return;scoreArea.classList.add("week-task-mode");element=document.createElement("div");element.className="study-extra-scores";scoreArea.appendChild(element);select.addEventListener("change",onStage);setStage(select.value);setHost(element)};window.addEventListener("study-week-selected",onCard);mount();const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});return()=>{observer.disconnect();window.removeEventListener("study-week-selected",onCard);select?.removeEventListener("change",onStage);element?.parentElement?.classList.remove("week-task-mode");element?.remove()}},[]);
 function change(task:string,value:number){const next={...scores,[task]:value};setScores(next);window.dispatchEvent(new CustomEvent("study-week-task-scores-change",{detail:next}))}
 if(!host)return null;
 return createPortal(<>{(tasksByStage[stage]||[]).map(task=><label key={task}><div><b>{task}</b><span>{scores[task]||0}%</span></div><input aria-label={`${task} 완성도`} type="range" min="0" max="100" step="5" value={scores[task]||0} onChange={event=>change(task,Number(event.target.value))}/></label>)}</>,host);
}
