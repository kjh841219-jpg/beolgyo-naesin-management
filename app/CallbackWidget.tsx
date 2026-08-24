"use client";

import { FormEvent, useEffect, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

const gradeOptions = [
  "초등 1학년", "초등 2학년", "초등 3학년", "초등 4학년", "초등 5학년", "초등 6학년",
  "중등 1학년", "중등 2학년", "중등 3학년", "기타",
];

const callbackTimes = [
  "평일 13:00~15:00", "평일 15:00~17:00", "평일 17:00~19:00", "평일 19:00~21:00",
  "토요일 10:00~12:00", "토요일 12:00~14:00", "기타 시간",
];

export function CallbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function openDialog() { setState("idle"); setMessage(""); setIsOpen(true); }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState("submitting");
    setMessage("");
    const emailForm = new URLSearchParams({
      _subject: "[벌교미래엔영어학원] 새 전화상담 요청",
      _template: "table",
      _captcha: "false",
      "예약구분": "전화상담 요청",
      "학부모전화번호": String(formData.get("callbackPhone") ?? ""),
      "학생학년": String(formData.get("callbackGrade") ?? ""),
      "희망연락시간": String(formData.get("callbackTime") ?? ""),
      "문의내용": String(formData.get("callbackMessage") ?? "없음"),
    });
    try {
      const response = await fetch("https://formsubmit.co/ajax/jinsim84@kakao.com", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", Accept: "application/json" },
        body: emailForm.toString(),
      });
      const result = (await response.json()) as { success?: boolean | string; message?: string };
      const succeeded = result.success === true || result.success === "true";
      if (!response.ok || !succeeded) throw new Error(result.message ?? "콜백 요청 전송에 실패했습니다.");
      form.reset();
      setState("success");
      setMessage("콜백 요청이 접수되었습니다. 선택하신 시간대를 확인한 뒤 전화드리겠습니다.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    }
  }

  return <>
    <button className="callback-fab" type="button" onClick={openDialog} aria-haspopup="dialog">
      <span aria-hidden="true">☎</span><b>전화상담 요청</b><small>원하는 시간에 연락드려요</small>
    </button>
    {isOpen && <div className="callback-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <section className="callback-dialog" role="dialog" aria-modal="true" aria-labelledby="callback-title">
        <button className="callback-close" type="button" onClick={() => setIsOpen(false)} aria-label="콜백 요청 창 닫기">×</button>
        {state === "success" ? <div className="callback-success" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span><p>CALLBACK REQUEST</p><h2 id="callback-title">콜백 요청이<br />접수되었습니다</h2><p>{message}</p>
          <button type="button" onClick={() => setIsOpen(false)}>확인</button>
        </div> : <form className="callback-form" onSubmit={handleSubmit}>
          <div className="callback-heading"><p>CALLBACK SERVICE</p><h2 id="callback-title">전화상담을<br />예약해 주세요</h2><span>간단한 정보를 남겨주시면 원하시는 시간대에 연락드리겠습니다.</span></div>
          <div className="callback-fields">
            <label><span>학부모 전화번호 <b>*</b></span><input name="callbackPhone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="010-0000-0000" required autoFocus /></label>
            <label><span>학생 학년 <b>*</b></span><select name="callbackGrade" defaultValue="" required><option value="" disabled>학년을 선택해 주세요</option>{gradeOptions.map((grade) => <option key={grade}>{grade}</option>)}</select></label>
            <label><span>희망 연락 시간 <b>*</b></span><select name="callbackTime" defaultValue="" required><option value="" disabled>연락받기 편한 시간을 선택해 주세요</option>{callbackTimes.map((time) => <option key={time}>{time}</option>)}</select></label>
            <label><span>문의 내용 <em>선택</em></span><textarea name="callbackMessage" maxLength={500} rows={3} placeholder="궁금한 점이나 학생의 학습 고민을 남겨주세요." /></label>
          </div>
          <label className="callback-consent"><input name="callbackConsent" type="checkbox" required /><span>콜백 접수와 이메일 알림을 위한 개인정보 수집·이용에 동의합니다.</span></label>
          <button className="callback-submit" type="submit" disabled={state === "submitting"}>{state === "submitting" ? "요청을 보내는 중…" : "콜백 요청하기"}<span aria-hidden="true">→</span></button>
          {message && <p className="callback-error" role="alert">{message}</p>}
        </form>}
      </section>
    </div>}
  </>;
}
