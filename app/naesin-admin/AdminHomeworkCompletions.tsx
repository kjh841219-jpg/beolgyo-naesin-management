"use client";
import { useCallback, useEffect, useState } from "react";

type Homework={id:number;studentName:string;school:string;grade:string;homeworkDate:string;title:string;completedItems:string;studentNote:string;emailSent:number;createdAt:string};

export default function AdminHomeworkCompletions(){
 const[items,setItems]=useState<Homework[]>([]),[updated,setUpdated]=useState(""),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{const r=await fetch("/api/admin/learning/homework",{cache:"no-store"});if(!r.ok)return;const d=await r.json();setItems(d.items??[]);setUpdated(new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));setLoading(false)},[]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),5000);const visible=()=>{if(document.visibilityState==="visible")void load()};document.addEventListener("visibilitychange",visible);return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",visible)}},[load]);
 return <section className="admin-homework-live" id="homework-live"><div className="homework-live-head"><div><p>LIVE HOMEWORK</p><h2>학생 숙제 완료 현황</h2><small>학생 제출 후 5초 이내 자동으로 반영됩니다.</small></div><button type="button" onClick={()=>void load()}><i/> 실시간 연결 · {updated||"확인 중"}</button></div><div className="homework-live-list">{loading?<p className="homework-live-empty">숙제 기록을 불러오는 중입니다…</p>:items.length?items.map(x=><article key={x.id}><div className="homework-live-date"><b>{x.homeworkDate.slice(5)}</b><span>{x.createdAt?.slice(11,16)||""}</span></div><div className="homework-live-student"><b>{x.studentName}</b><span>{x.school} {x.grade}</span></div><div className="homework-live-detail"><b>{x.title}</b><span>{x.completedItems.split("|").join(" · ")}</span>{x.studentNote&&<small>학생 메모 · {x.studentNote}</small>}</div><em className={x.emailSent?"mail-sent":"mail-pending"}>{x.emailSent?"메일 전송":"메일 대기"}</em></article>):<p className="homework-live-empty">아직 제출된 숙제 완료 기록이 없습니다.</p>}</div></section>
}
