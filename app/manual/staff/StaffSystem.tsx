"use client";
import { FormEvent, useEffect, useState } from "react";
type User={id:number;name:string;role:string};type Item={id:number;category:string;title:string;description:string;completed:number;details:string;specialNotes:string;consultation:string};
const today=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
export default function StaffSystem(){
 const[user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[items,setItems]=useState<Item[]>([]),[date,setDate]=useState(today()),[name,setName]=useState(""),[pin,setPin]=useState(""),[error,setError]=useState(""),[saveError,setSaveError]=useState(""),[savingId,setSavingId]=useState(0),[open,setOpen]=useState(0);
 async function load(d=date){const r=await fetch(`/api/staff/checklist?date=${d}`);if(r.ok){const x=await r.json();setUser(x.staff);setItems(x.items||[])}}
 useEffect(()=>{fetch("/api/staff/auth").then(async r=>{if(r.ok){const x=await r.json();setUser(x.staff);await load()}setReady(true)}).catch(()=>setReady(true))},[]);
 async function login(e:FormEvent){e.preventDefault();const r=await fetch("/api/staff/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,pin})}),x=await r.json();if(!r.ok)return setError(x.error);setUser(x.staff);setError("");load()}
 async function save(item:Item,completed=!!item.completed){const previous=!!item.completed;setSaveError("");setSavingId(item.id);setItems(current=>current.map(x=>x.id===item.id?{...x,completed:completed?1:0}:x));try{const r=await fetch("/api/staff/checklist",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({templateId:item.id,date,completed,details:item.details,specialNotes:item.specialNotes,consultation:item.consultation})});if(!r.ok){const x=await r.json().catch(()=>({}));throw new Error(x.error||"저장하지 못했습니다.")}await load(date)}catch(e){setItems(current=>current.map(x=>x.id===item.id?{...x,completed:previous?1:0}:x));setSaveError(e instanceof Error?e.message:"저장하지 못했습니다.")}finally{setSavingId(0)}}
 async function logout(){await fetch("/api/staff/auth",{method:"DELETE"});setUser(null);setItems([])}
 function reportMarkup(){
  const escape=(value:string)=>value.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch)).replace(/\n/g,"<br>");
  const rows=items.map((item,index)=>`<tr><td>${index+1}</td><td>${escape(item.category)}</td><td>${escape(item.title)}</td><td>${item.completed?"완료":"미완료"}</td><td>${escape(item.details||"-")}</td><td>${escape(item.specialNotes||"-")}</td><td>${escape(item.consultation||"-")}</td></tr>`).join("");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>body{font-family:'Malgun Gothic',sans-serif;color:#17283a}h1{margin-bottom:6px;font-size:24px}p{margin:3px 0 18px;color:#52635c}table{width:100%;border-collapse:collapse;font-size:10pt}th,td{padding:8px;border:1px solid #aebbb5;vertical-align:top}th{background:#eaf3ef}td:nth-child(1),td:nth-child(4){text-align:center;white-space:nowrap}</style></head><body><h1>벌교미래엔영어 일일 업무메뉴얼 기록</h1><p>작성자: ${escape(user?.name||"")} · 업무일: ${date} · 완료율: ${items.length?Math.round(items.filter(i=>i.completed).length/items.length*100):0}%</p><table><thead><tr><th>번호</th><th>항목</th><th>업무명</th><th>완료</th><th>세부 업무내용</th><th>특이사항·문제학생</th><th>상담내용</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
 }
 function downloadDocument(){
  const blob=new Blob(["\uFEFF",reportMarkup()],{type:"application/msword;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=`벌교미래엔영어_${user?.name||"강사"}_업무기록_${date}.doc`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
 }
 function printReport(){
  const popup=window.open("","_blank","width=1100,height=760");
  if(!popup)return window.print();
  popup.document.open();popup.document.write(reportMarkup());popup.document.close();popup.focus();
  window.setTimeout(()=>{popup.print();popup.close()},300);
 }
 if(!ready)return <main className="staff-login"><p>업무 메뉴얼을 준비하고 있습니다…</p></main>;
 if(!user)return <main className="staff-login"><div className="login-shell"><a href="/" className="staff-brand"><span>M</span><b>벌교미래엔영어 업무 메뉴얼</b></a><div className="login-choice"><form onSubmit={login}><p>강사 로그인</p><h1>오늘 업무 작성</h1><small>이름과 휴대폰 뒷번호 4자리로 로그인하세요.</small><label>강사 이름<input required value={name} onChange={e=>setName(e.target.value)} placeholder="등록된 이름"/></label><label>휴대폰 뒷번호<input required inputMode="numeric" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="숫자 4자리"/></label>{error&&<div className="staff-error">{error}</div>}<button>로그인</button></form><section className="admin-entry"><p>관리자</p><h2>전체 업무 확인</h2><small>강사 등록과 모든 작성 기록을 한 화면에서 확인합니다.</small><a href="/staff/admin">관리자 로그인</a><a className="manual-home" href="/">업무 메뉴얼 보기</a></section></div></div></main>;
 const done=items.filter(i=>i.completed).length,rate=items.length?Math.round(done/items.length*100):0,categories=[...new Set(items.map(i=>i.category))];
 return <main className="staff-app">
  <aside><a href="/" className="staff-brand"><span>M</span><b>업무 메뉴얼</b></a><nav><a className="active" href="#today">업무 체크</a><a href="#record">세부 기록</a><a href="/staff/admin">관리자</a></nav><div><b>{user.name}</b><small>{user.role}</small><button onClick={logout}>로그아웃</button></div></aside>
  <section className="staff-work">
   <header><div><p>DAILY CHECK</p><h1>{user.name} 강사 업무</h1></div><div className="daily-report-actions"><input aria-label="업무 기록 날짜" type="date" value={date} onChange={e=>{setDate(e.target.value);load(e.target.value)}}/><button type="button" onClick={downloadDocument}>문서로 저장</button><button type="button" className="print-daily" onClick={printReport}>오늘 기록 출력</button></div></header>
   {saveError&&<div className="staff-error" role="alert">{saveError}</div>}
   <div className="staff-overview"><article className="rate-card"><div className="rate-ring" style={{background:`conic-gradient(#52c69f ${rate}%,#ffffff25 0)`}}><span>{rate}%</span></div><div><small>완료율</small><b>{done} / {items.length}</b><p>{rate===100?"모든 업무를 마쳤습니다.":`${items.length-done}개 남았습니다.`}</p></div></article><article><span>✓</span><small>완료</small><b>{done}</b></article><article><span>!</span><small>남은 업무</small><b>{items.length-done}</b></article><article><span>✎</span><small>작성 기록</small><b>{items.filter(i=>i.details||i.specialNotes||i.consultation).length}</b></article></div>
   <div className="check-groups" id="today">{categories.map(c=><section id={c} key={c}><div className="group-title"><span>{String(categories.indexOf(c)+1).padStart(2,"0")}</span><h2>{c}</h2><b>{items.filter(i=>i.category===c&&i.completed).length}/{items.filter(i=>i.category===c).length}</b></div>{items.filter(i=>i.category===c).map(item=><article className={item.completed?"checked":""} key={item.id}><button type="button" role="checkbox" aria-label={`${item.title} 완료 체크`} aria-checked={!!item.completed} disabled={savingId===item.id} className="check-button" onClick={()=>save(item,!item.completed)}>{savingId===item.id?"…":item.completed?"✓":""}</button><div><h3>{item.title}</h3><p>{item.description}</p></div><button type="button" className="detail-toggle" onClick={()=>setOpen(open===item.id?0:item.id)}>{item.details||item.specialNotes||item.consultation?"기록 수정":"내용 기록"}</button>{open===item.id&&<div className="detail-box" id="record"><label>세부 업무내용<textarea value={item.details} onChange={e=>setItems(items.map(x=>x.id===item.id?{...x,details:e.target.value}:x))} placeholder="수업 진행 결과, 확인한 내용과 후속 업무를 적어주세요."/></label><label>특이사항·문제학생<textarea value={item.specialNotes} onChange={e=>setItems(items.map(x=>x.id===item.id?{...x,specialNotes:e.target.value}:x))} placeholder="수업 방해, 반복 미이행, 정서·관계 변화, 안전 관련 특이사항과 조치 내용을 적어주세요."/></label><label>상담내용<textarea value={item.consultation} onChange={e=>setItems(items.map(x=>x.id===item.id?{...x,consultation:e.target.value}:x))} placeholder="학생 또는 학부모 상담 내용, 요청사항과 후속조치를 적어주세요."/></label><button type="button" onClick={()=>{save(item);setOpen(0)}}>업무 기록 저장</button></div>}</article>)}</section>)}</div>
  </section>
 </main>
}




