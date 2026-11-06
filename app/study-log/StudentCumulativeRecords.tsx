"use client";

import {useEffect,useMemo,useState,type CSSProperties} from "react";
import {createPortal} from "react-dom";

type RecordItem={id:number;studyDate:string;examWeek:string;taskScores?:string|Record<string,number>;textbook:number;grammar:number;schoolPrint:number;vocabulary:number;writing:number;problemSolving:number;wrongNotebook:number;mistakes:string;nextAction:string};
const legacyLabels:Record<string,string>={textbook:"본문 암기",grammar:"문법",schoolPrint:"학교 프린트",vocabulary:"단어·숙어",writing:"서술형",problemSolving:"문제풀이",wrongNotebook:"오답노트"};

function scores(record:RecordItem):Record<string,number>{
 if(record.taskScores){try{const value=typeof record.taskScores==="string"?JSON.parse(record.taskScores):record.taskScores;if(value&&Object.keys(value).length)return value as Record<string,number>}catch{}}
 return Object.fromEntries(Object.entries(legacyLabels).map(([key,label])=>[label,Number(record[key as keyof RecordItem]||0)]).filter(([,value])=>Number(value)>0)) as Record<string,number>;
}
function average(record:RecordItem){const all=scores(record),explicit=Number(all._overall);if(Number.isFinite(explicit))return Math.max(0,Math.min(100,Math.round(explicit)));const values=Object.entries(all).filter(([key])=>!key.startsWith("_")).map(([,value])=>value);return values.length?Math.round(values.reduce((sum,value)=>sum+Number(value),0)/values.length):0;}
function latestByStudyDate(items:RecordItem[]){const dates=new Set<string>();return items.filter(item=>{if(dates.has(item.studyDate))return false;dates.add(item.studyDate);return true})}
const dayMs=86400000;
function relativeWeek(studyDate:string,anchorDate:string){const diff=Math.max(0,Math.floor((Date.parse(`${anchorDate}T00:00:00Z`)-Date.parse(`${studyDate}T00:00:00Z`))/dayMs));return Math.floor(diff/7)+1}
function weekRange(anchorDate:string,week:number){if(!anchorDate)return"";const end=new Date(`${anchorDate}T00:00:00Z`);end.setUTCDate(end.getUTCDate()-(week-1)*7);const start=new Date(end);start.setUTCDate(start.getUTCDate()-6);const short=(value:Date)=>`${String(value.getUTCMonth()+1).padStart(2,"0")}.${String(value.getUTCDate()).padStart(2,"0")}`;return`${short(start)}~${short(end)}`}

export default function StudentCumulativeRecords(){
 const[host,setHost]=useState<HTMLElement|null>(null),[records,setRecords]=useState<RecordItem[]>([]);
 useEffect(()=>{let element:HTMLDivElement|null=null;const mount=()=>{if(element?.isConnected)return;const dashboard=document.querySelector<HTMLElement>(".study-dashboard");if(!dashboard)return;element=document.createElement("div");element.className="student-cumulative-host";dashboard.appendChild(element);setHost(element)};mount();const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});return()=>{observer.disconnect();element?.remove()}},[]);
 useEffect(()=>{if(!host)return;let active=true;const load=()=>fetch("/api/student/records",{cache:"no-store"}).then(response=>response.ok?response.json():null).then(data=>{if(active&&data)setRecords(data.items||[])}).catch(()=>{});load();const timer=window.setInterval(load,5000);window.addEventListener("focus",load);return()=>{active=false;clearInterval(timer);window.removeEventListener("focus",load)}},[host]);
 const datedRecords=useMemo(()=>latestByStudyDate(records),[records]);
 const totalAverage=useMemo(()=>datedRecords.length?Math.round(datedRecords.reduce((sum,item)=>sum+average(item),0)/datedRecords.length):0,[datedRecords]);
 const dailySeries=useMemo(()=>datedRecords.slice(0,14).reverse(),[datedRecords]);
 const anchorDate=datedRecords[0]?.studyDate||"";
 const weekSeries=useMemo(()=>[1,2,3,4].map(week=>{const items=datedRecords.filter(record=>relativeWeek(record.studyDate,anchorDate)===week);return{week,range:weekRange(anchorDate,week),count:items.length,rate:items.length?Math.round(items.reduce((sum,item)=>sum+average(item),0)/items.length):0}}),[datedRecords,anchorDate]);
 if(!host)return null;
 return createPortal(
  <section className="student-cumulative">
   <header><div><p>MY ACCUMULATED RECORDS</p><h2>매일 누적되는 학습기록</h2><span>저장할 때마다 기존 기록은 유지되고 새로운 날짜별 기록이 계속 쌓입니다.</span></div><strong>{totalAverage}%<small>누적 평균</small></strong></header>
   <section className="student-week-graph"><div><b>1~4주차별 누적 학습량</b><span>가장 최근 기록일을 1주차 기준으로 자동 계산</span></div><div>{weekSeries.map(item=><article key={item.week}><i style={{"--rate":`${item.rate*3.6}deg`} as CSSProperties}><b>{item.rate}%</b></i><strong>{item.week}주차</strong><small>{item.range}{item.count?` · ${item.count}일`:" · 기록 없음"}</small></article>)}</div></section>
   {dailySeries.length>0&&<section className="daily-accumulation-chart"><div><b>최근 일자별 학습량 변화</b><span>최근 {dailySeries.length}일 기록</span></div><div className="daily-chart-bars" role="img" aria-label="최근 날짜별 누적 학습량 그래프">{dailySeries.map(record=>{const rate=average(record);return <article key={record.studyDate} title={`${record.studyDate} ${rate}%`}><b>{rate}%</b><i><em style={{height:`${Math.max(3,rate)}%`}}/></i><span>{record.studyDate.slice(5)}</span><small>최신</small></article>})}</div></section>}
   {records.length?<div className="cumulative-list">{records.map(record=><details key={record.id}><summary><span>{record.studyDate}</span><b>{record.examWeek}</b><strong>{average(record)}%</strong></summary><div className="cumulative-scores">{Object.entries(scores(record)).filter(([label])=>!label.startsWith("_")).map(([label,value])=><div key={label}><span>{label}</span><i><em style={{width:`${Math.max(0,Math.min(100,Number(value)))}%`}}/></i><b>{value}%</b></div>)}</div><div className="cumulative-notes"><p><b>어려웠거나 틀린 부분</b>{record.mistakes||"기록 없음"}</p><p><b>다음에 내가 할 일</b>{record.nextAction||"기록 없음"}</p></div></details>)}</div>:<p className="cumulative-empty">저장된 학습기록이 아직 없습니다.</p>}
  </section>,host);
}
