"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";

const weeks=[
 {week:"1주차",value:"4주 전 · 기초 정리",title:"첫 번째 단원 암기",tasks:["단어 암기","대화문 암기","본문 암기"]},
 {week:"2주차",value:"3주 전 · 본문 암기·서술형",title:"첫 번째 단원 문법",tasks:["문법 설명","문법 정리","문제풀이","오답노트"]},
 {week:"3주차",value:"2주 전 · 실전 서술형",title:"두 번째 단원·외부지문",tasks:["단어 암기","대화문 암기","본문 암기"]},
 {week:"4주차",value:"1주 전 · 최종 마무리",title:"두 번째 단원·최종 점검",tasks:["문법 설명","문법 정리","문제풀이","오답노트","학교 프린트물 점검"]},
];

export default function StudyWeekStructure(){
 const[target,setTarget]=useState<Element|null>(null),[selected,setSelected]=useState(weeks[0].value);
 useEffect(()=>{
  let connectedSelect:HTMLSelectElement|null=null;
  const syncSelection=()=>{if(connectedSelect)setSelected(connectedSelect.value)};
  const connect=()=>{
   const form=document.querySelector(".study-record-form"),basic=form?.querySelector(".study-basic"),select=basic?.querySelector("select") as HTMLSelectElement|null;
   if(!form||!basic||!select)return false;
   if(connectedSelect!==select){connectedSelect?.removeEventListener("change",syncSelection);connectedSelect=select;connectedSelect.addEventListener("change",syncSelection)}
   let host=form.querySelector(".study-week-portal");
   if(!host){host=document.createElement("div");host.className="study-week-portal";form.insertBefore(host,basic)}
   setTarget(host);setSelected(select.value);return true;
  };
  if(connect())return()=>connectedSelect?.removeEventListener("change",syncSelection);
  const observer=new MutationObserver(()=>{if(connect())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});
  return()=>{observer.disconnect();connectedSelect?.removeEventListener("change",syncSelection)};
 },[]);
 function choose(value:string){
  const select=document.querySelector(".study-record-form .study-basic select") as HTMLSelectElement|null;
  if(!select)return;
  const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value")?.set;
  setter?.call(select,value);select.dispatchEvent(new Event("change",{bubbles:true}));window.dispatchEvent(new CustomEvent("study-week-selected",{detail:{value}}));setSelected(value);
 }
 if(!target)return null;
 return createPortal(<section className="study-week-structure"><div className="study-week-title"><span>4-WEEK STUDY RECORD</span><h3>기록할 학습 주차를 선택하세요</h3><p>주차와 학습내용을 함께 선택하면 아래 기록 항목이 자동으로 설정됩니다.</p></div><div className="study-week-tabs">{weeks.map(item=><button key={item.week} type="button" aria-pressed={selected===item.value} className={selected===item.value?"active":""} onClick={()=>choose(item.value)}><b>{item.week}</b><strong>{item.title}</strong><small>{item.tasks.map(task=><span key={task}>✓ {task}</span>)}</small><i>{selected===item.value?"선택됨":"이 주차 기록하기"}</i></button>)}</div></section>,target)
}
