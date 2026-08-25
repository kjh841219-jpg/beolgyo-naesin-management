"use client";
import {useEffect,useMemo,useState} from "react";

type Student={id:number;name:string;school:string;grade:string;total:number;correct:number;accuracy:number;lastStudyDate:string};
type Daily={studentId:number;name:string;studyDate:string;total:number;correct:number;accuracy:number};
type TypeRow={studentId:number;name:string;quizType:string;total:number;correct:number;accuracy:number};
type Recent={id:number;studentId:number;name:string;publisher:string;grade:string;lesson:string;passage:string;quizType:string;questionIndex:number;correct:number;studyDate:string};
type Data={students:Student[];daily:Daily[];types:TypeRow[];recent:Recent[]};
const labels:Record<string,string>={translation:"해석 쓰기",ordering:"본문 순서 배열",full_translation:"전체 해석 보고 쓰기",translate:"해석 쓰기",order:"본문 순서 배열",write:"전체 해석 보고 쓰기",blank:"본문 전체 랜덤 빈칸","word-meaning":"단어 뜻쓰기","word-spelling":"뜻 보고 단어쓰기","word-mixed":"단어 혼합 테스트"};
const empty:Data={students:[],daily:[],types:[],recent:[]};

export default function AdminQuizResults(){
 const[data,setData]=useState<Data>(empty),[selected,setSelected]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let alive=true;setLoading(true);fetch(`/api/admin/learning/quiz-results${selected?`?studentId=${selected}`:""}`,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"퀴즈 현황을 불러오지 못했습니다.");if(alive)setData(d)}).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setLoading(false));return()=>{alive=false}},[selected]);
 const chart=useMemo(()=>[...data.daily].sort((a,b)=>a.studyDate.localeCompare(b.studyDate)).slice(-14),[data.daily]);
 const maxTotal=Math.max(1,...chart.map(x=>x.total));
 return <section className="admin-quiz" id="quiz-results">
  <div className="admin-quiz-head"><div><p>PASSAGE QUIZ ANALYTICS</p><h2>본문 퀴즈 학습상황</h2><span>학생이 푼 문제의 정답률과 매일 학습기록이 자동으로 집계됩니다.</span></div><label>학생 선택<select value={selected} onChange={e=>setSelected(Number(e.target.value))}><option value={0}>전체 학생</option>{(selected?data.students: data.students).map(s=><option key={s.id} value={s.id}>{s.name} · {s.school} {s.grade}</option>)}</select></label></div>
  {error?<p className="quiz-admin-empty">{error}</p>:loading?<p className="quiz-admin-empty">퀴즈 학습상황을 불러오는 중입니다…</p>:<>
   <div className="quiz-student-rings">{data.students.length?data.students.map(s=><article key={s.id} onClick={()=>setSelected(s.id)} role="button" tabIndex={0}><i style={{background:`conic-gradient(#245edb ${s.accuracy}%,#e7edf6 0)`}}><b>{s.accuracy}%</b></i><div><strong>{s.name}</strong><span>{s.school} {s.grade}</span><small>{s.correct}/{s.total}문제 정답 · {s.lastStudyDate||"학습 전"}</small></div></article>):<p className="quiz-admin-empty">아직 학생의 본문 퀴즈 기록이 없습니다.</p>}</div>
   <div className="quiz-admin-grid"><article className="quiz-chart-card"><h3>최근 14일 학습기록</h3>{chart.length?<div className="quiz-bars">{chart.map((x,i)=><div key={`${x.studentId}-${x.studyDate}-${i}`}><span title={`${x.name} ${x.studyDate} · ${x.total}문제`} style={{height:`${Math.max(12,x.total/maxTotal*100)}%`}}><em>{x.accuracy}%</em></span><small>{x.studyDate.slice(5)}</small></div>)}</div>:<p className="quiz-admin-empty">표시할 날짜별 기록이 없습니다.</p>}</article>
    <article className="quiz-type-card"><h3>문제 유형별 성취도</h3>{data.types.length?data.types.map(x=><div className="quiz-type-row" key={`${x.studentId}-${x.quizType}`}><div><b>{selected?labels[x.quizType]||x.quizType:`${x.name} · ${labels[x.quizType]||x.quizType}`}</b><small>{x.correct}/{x.total} 정답</small></div><i><em style={{width:`${x.accuracy}%`}}/></i><strong>{x.accuracy}%</strong></div>):<p className="quiz-admin-empty">유형별 기록이 없습니다.</p>}</article>
   </div>
   <div className="quiz-recent-card"><h3>최근 본문 퀴즈 풀이</h3><div className="quiz-recent-table"><div className="head"><span>학생</span><span>교재·과</span><span>유형</span><span>결과</span><span>학습일</span></div>{data.recent.slice(0,20).map(x=><div key={x.id}><b>{x.name}</b><span>{x.publisher} {x.grade} · {x.lesson}</span><span>{labels[x.quizType]||x.quizType}</span><em className={x.correct?"ok":"wrong"}>{x.correct?"정답":"오답"}</em><span>{x.studyDate}</span></div>)}</div>{!data.recent.length&&<p className="quiz-admin-empty">최근 풀이 내역이 없습니다.</p>}</div>
  </>}
 </section>
}
