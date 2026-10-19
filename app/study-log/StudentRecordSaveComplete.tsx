"use client";

import {useEffect,useState} from "react";

export default function StudentRecordSaveComplete(){
 const[message,setMessage]=useState("");
 const[saving,setSaving]=useState(false);
 useEffect(()=>{const result=(event:Event)=>{const detail=(event as CustomEvent<{path:string;ok:boolean;message:string}>).detail;if(detail?.path!=="/api/student/records")return;setSaving(false);setMessage(detail.ok?"학습기록이 서버에 저장 완료되었습니다. 관리자 화면에도 바로 반영됩니다.":detail.message)};window.addEventListener("student-record-save-result",result);return()=>window.removeEventListener("student-record-save-result",result)},[]);
 function saveAll(){
  const form=document.querySelector<HTMLFormElement>(".study-record-form");
  if(!form){setMessage("학생 로그인 후 학습기록을 작성해 주세요.");return}
  if(!form.checkValidity()){form.reportValidity();form.scrollIntoView({behavior:"smooth",block:"center"});setMessage("학습기록의 필수 작성란을 확인해 주세요.");return}
  setSaving(true);setMessage("서버에 학습기록을 저장하고 있습니다…");form.requestSubmit();
 }
 return <section className="student-final-save"><div><span>FINAL SAVE</span><h2>오늘 작성한 학습기록 저장 완료</h2><p>위의 학습기록을 작성한 뒤 마지막으로 눌러 주세요. 시험분석은 해당 영역의 저장 버튼으로 별도 저장됩니다.</p></div><button type="button" onClick={saveAll} disabled={saving}>{saving?"서버 저장 중…":"학습기록 저장 완료"} <b>✓</b></button>{message&&<p role="status" aria-live="polite">{message}</p>}</section>
}
