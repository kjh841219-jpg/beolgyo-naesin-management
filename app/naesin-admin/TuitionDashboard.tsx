"use client";
import{useEffect,useMemo,useState}from"react";

type Item={studentId:number;name:string;grade:string;parentPhone:string;dueDate:string;amount:number;paid:number;paidAt:string;memo:string};
const kstToday=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
const days=(date:string)=>date?Math.floor((new Date(`${kstToday()}T00:00:00+09:00`).getTime()-new Date(`${date}T00:00:00+09:00`).getTime())/86400000):-9999;
function stage(n:number){if(n<0)return n>=-3?"결제일 임박":"예정";if(n===0)return"결제일 당일";if(n<3)return"당일 경과";if(n<5)return"3일 경과";if(n<7)return"5일 경과";if(n<14)return"1주 경과";if(n<21)return"2주 경과";if(n<30)return"3주 경과";return"1개월 경과"}
function message(x:Item){const n=days(x.dueDate),late=n>0?`결제일로부터 ${n}일이 지났습니다.`:n===0?"오늘은 원비 결제일입니다.":`원비 결제일이 ${Math.abs(n)}일 남았습니다.`;return `안녕하세요. 벌교미래엔영어입니다.\n\n${x.name} 학생의 원비 안내드립니다.\n결제일: ${x.dueDate}\n${x.amount?`납부금액: ${x.amount.toLocaleString()}원\n`:""}${late}\n\n이미 납부하신 경우에는 본 안내를 확인하지 않으셔도 됩니다. 감사합니다.`}
export default function TuitionDashboard(){
 const[items,setItems]=useState<Item[]>([]),[notice,setNotice]=useState(""),[editing,setEditing]=useState<number|null>(null);
 const load=()=>fetch("/api/admin/learning/tuition",{cache:"no-store"}).then(r=>r.json()).then(d=>setItems(d.items||[]));
 useEffect(()=>{void load();const t=window.setInterval(load,60000);const focus=()=>void load();window.addEventListener("focus",focus);return()=>{clearInterval(t);window.removeEventListener("focus",focus)}},[]);
 const alerts=useMemo(()=>items.filter(x=>!x.paid&&x.dueDate&&days(x.dueDate)>=-3).sort((a,b)=>days(b.dueDate)-days(a.dueDate)),[items]);
 async function save(x:Item){const r=await fetch("/api/admin/learning/tuition",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(x)}),d=await r.json();setNotice(r.ok?d.message:d.error);if(r.ok){setEditing(null);await load()}}
 function update(id:number,key:keyof Item,value:string|number){setItems(v=>v.map(x=>x.studentId===id?{...x,[key]:value}:x))}
 function kakao(x:Item){if(!window.Kakao?.isInitialized()){setNotice("카카오 JavaScript 키 또는 현재 도메인 등록을 확인해 주세요.");return}window.Kakao.Share.sendDefault({objectType:"text",text:message(x),link:{mobileWebUrl:location.origin+"/naesin",webUrl:location.origin+"/naesin"},buttonTitle:"벌교미래엔영어 확인"})}
 return <section className="tuition-dashboard" id="tuition"><div className="tuition-head"><div><p>TUITION REMINDER</p><h2>원비 결제일 알림</h2><span>대시보드를 열면 결제일 임박·연체 단계가 자동으로 갱신됩니다.</span></div><b>{alerts.length}건 확인</b></div>
 {notice&&<div className="tuition-notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
 <div className="tuition-alerts">{alerts.length?alerts.map(x=>{const n=days(x.dueDate);return <article key={x.studentId} className={n>=7?"late":""}><div><em>{stage(n)}</em><h3>{x.name} <small>{x.grade}</small></h3><p>{x.dueDate} · {x.amount?`${x.amount.toLocaleString()}원`:"금액 미등록"}</p></div><button onClick={()=>kakao(x)}>카톡 보내기</button><button className="paid" onClick={()=>save({...x,paid:1})}>납부 완료</button></article>}):<p className="tuition-empty">현재 확인할 원비 알림이 없습니다.</p>}</div>
 <details className="tuition-settings"><summary>학생별 결제일·금액 관리</summary><div className="tuition-table">{items.map(x=><div key={x.studentId} className={x.paid?"is-paid":""}><b>{x.name}<small>{x.grade}</small></b><input aria-label={`${x.name} 결제일`} type="date" value={x.dueDate} onChange={e=>{update(x.studentId,"dueDate",e.target.value);setEditing(x.studentId)}}/><input aria-label={`${x.name} 원비`} inputMode="numeric" placeholder="원비 금액" value={x.amount||""} onChange={e=>{update(x.studentId,"amount",Number(e.target.value.replace(/\D/g,"")));setEditing(x.studentId)}}/><button onClick={()=>save({...x,paid:x.paid?0:1})}>{x.paid?"미납으로 변경":"납부 완료"}</button><button className="save" disabled={editing!==x.studentId||!x.dueDate} onClick={()=>save(x)}>저장</button></div>)}</div></details>
 </section>
}
