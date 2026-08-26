"use client";
import {useEffect,useState} from "react";

type Student={id:number;name:string;school:string;grade:string};
export default function StudentLiveQuiz(){
 const[students,setStudents]=useState<Student[]>([]),[studentId,setStudentId]=useState(0),[query,setQuery]=useState(""),[data,setData]=useState<any>({liveProgress:[],completions:[]});
 useEffect(()=>{fetch("/api/admin/learning/students",{cache:"no-store"}).then(r=>r.json()).then(d=>{setStudents(d.items||[]);if(d.items?.[0])setStudentId((v:number)=>v||d.items[0].id)})},[]);
 useEffect(()=>{if(!studentId)return;let active=true;const load=()=>fetch(`/api/admin/learning/quiz-results?studentId=${studentId}`,{cache:"no-store"}).then(r=>r.json()).then(d=>{if(active)setData(d)}).catch(()=>undefined);void load();const timer=window.setInterval(load,2000);return()=>{active=false;window.clearInterval(timer)}},[studentId]);
 const visible=students.filter(s=>`${s.name} ${s.school} ${s.grade}`.includes(query));
 return <section className="student-live-quiz"><header><div><p>LIVE QUIZ PROGRESS</p><h2>학생 퀴즈 실시간 학습량</h2><span>퀴즈를 중간에 멈춰도 푼 문제 수와 정답률이 약 2초마다 반영됩니다.</span></div><label>학생 검색<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="학생 이름·학교 검색"/><select value={studentId} onChange={e=>setStudentId(Number(e.target.value))}>{visible.map(s=><option value={s.id} key={s.id}>{s.name} · {s.school} {s.grade}</option>)}</select></label></header><div className="student-live-list">{data.liveProgress?.length?data.liveProgress.map((x:any)=>{const solved=Number(x.progress?.solved||0),score=Number(x.progress?.score||0),rate=solved?Math.round(score/solved*100):0;return <article key={x.quizArea}><strong>{x.quizArea==="word"?"단어퀴즈":x.quizArea==="blank"?"본문 빈칸":"본문퀴즈"}</strong><b>{solved}<small>문제 학습</small></b><span>{score}문제 정답 · 정답률 {rate}%</span><em>{String(x.updatedAt||"").replace("T"," ").slice(0,16)} 저장</em></article>}):<p>선택한 학생의 진행 중인 퀴즈 기록이 아직 없습니다.</p>}</div></section>
}
