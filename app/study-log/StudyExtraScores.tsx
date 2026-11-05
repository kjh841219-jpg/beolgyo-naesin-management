"use client";

import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";

const tasksByStage:Record<string,string[]>={
 "4주 전 · 기초 정리":["첫 번째 단원 단어 암기","첫 번째 단원 대화문 암기","첫 번째 단원 본문 암기"],
 "3주 전 · 본문 암기·서술형":["첫 번째 단원 문법 설명","첫 번째 단원 문법 정리","문제풀이","오답노트"],
 "2주 전 · 실전 서술형":["두 번째 단원 및 교과서 외부지문 단어 암기","두 번째 단원 및 교과서 외부지문 대화문 암기","두 번째 단원 및 교과서 외부지문 본문 암기"],
 "1주 전 · 최종 마무리":["두 번째 단원 문법 설명","두 번째 단원 문법 정리","문제풀이","오답노트","마지막 학교 프린트물 점검"],
};
const commonTasks=[...new Set(Object.values(tasksByStage).flat())];
type WeekEntry={selected:string[];scores:Record<string,number>};

export default function StudyExtraScores(){
 const[host,setHost]=useState<HTMLElement|null>(null),[stage,setStage]=useState("4주 전 · 기초 정리"),[selected,setSelected]=useState<string[]>(tasksByStage["4주 전 · 기초 정리"]),[scores,setScores]=useState<Record<string,number>>({}),[customTask,setCustomTask]=useState("");
 const savedByStage=useRef<Record<string,WeekEntry>>({});
 useEffect(()=>{savedByStage.current[stage]={selected,scores};window.dispatchEvent(new CustomEvent("study-week-task-scores-change",{detail:scores}))},[stage,selected,scores]);
 useEffect(()=>{
  let element:HTMLDivElement|null=null,select:HTMLSelectElement|null=null;
  const openStage=(value:string)=>{const remembered=savedByStage.current[value],defaults=tasksByStage[value]||[];setStage(value);setSelected(remembered?.selected||defaults);setScores(remembered?.scores||{});setCustomTask("")};
  const onStage=()=>{if(select)openStage(select.value)};
  const onCard=(event:Event)=>{const value=(event as CustomEvent<{value?:string}>).detail?.value;if(value)openStage(value)};
  const mount=()=>{if(element?.isConnected)return;const scoreArea=document.querySelector<HTMLElement>(".study-record-form .self-scores");select=document.querySelector<HTMLSelectElement>(".study-record-form .study-basic select");if(!scoreArea||!select)return;scoreArea.classList.add("week-task-mode");element=document.createElement("div");element.className="study-extra-scores";scoreArea.appendChild(element);select.addEventListener("change",onStage);openStage(select.value);setHost(element)};
  window.addEventListener("study-week-selected",onCard);mount();const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});return()=>{observer.disconnect();window.removeEventListener("study-week-selected",onCard);select?.removeEventListener("change",onStage);element?.parentElement?.classList.remove("week-task-mode");element?.remove()};
 },[]);
 function toggle(task:string){const removing=selected.includes(task);setSelected(items=>removing?items.filter(item=>item!==task):[...items,task]);if(removing)setScores(values=>{const next={...values};delete next[task];return next})}
 function change(task:string,value:number){setScores(values=>({...values,[task]:value}))}
 function addCustom(){const task=customTask.trim().slice(0,60);if(!task)return;setSelected(items=>items.includes(task)?items:[...items,task]);setCustomTask("")}
 if(!host)return null;
 return createPortal(<>
  <section className="study-task-picker"><div><b>이 주차에 기록할 항목을 직접 선택하세요</b><span>추천항목은 미리 선택되어 있으며 자유롭게 추가하거나 뺄 수 있어요.</span></div><div className="study-task-options">{commonTasks.map(task=><label key={task} className={selected.includes(task)?"selected":""}><input type="checkbox" checked={selected.includes(task)} onChange={()=>toggle(task)}/><span>{task}</span></label>)}</div><div className="study-task-add"><input value={customTask} onChange={event=>setCustomTask(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();addCustom()}}} placeholder="다른 학습항목 직접 입력" maxLength={60}/><button type="button" onClick={addCustom}>항목 추가</button></div></section>
  {selected.length?<div className="study-selected-scores">{selected.map(task=><label key={task}><div><b>{task}</b><span>{scores[task]||0}%</span></div><input aria-label={`${task} 완성도`} type="range" min="0" max="100" step="5" value={scores[task]||0} onChange={event=>change(task,Number(event.target.value))}/></label>)}</div>:<p className="study-task-empty">기록할 학습항목을 한 개 이상 선택해 주세요.</p>}
 </>,host);
}
