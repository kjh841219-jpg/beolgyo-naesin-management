"use client";

import { FormEvent, useState } from "react";

async function sendEmailNotification(formData: FormData) {
  const consultationAt = String(formData.get("consultationAt") ?? "");
  const [date, time] = consultationAt.split("T");
  const formattedConsultationAt = date && time ? `${date.replaceAll("-", ". ")}. ${time}` : consultationAt;
  const emailForm = new URLSearchParams({
    _subject: "[벌교미래엔영어학원] 새 학생 상담예약",
    _template: "table",
    _captcha: "false",
    "예약구분": "학생 상담예약",
    "학부모전화번호": String(formData.get("phone") ?? ""),
    "학생이름": String(formData.get("studentName") ?? ""),
    "학년": String(formData.get("grade") ?? ""),
    "희망상담일시": formattedConsultationAt,
    "영어학습경험": String(formData.get("learningExperience") ?? ""),
    "바라는학습방향": String(formData.get("desiredDirection") ?? ""),
  });
  const response = await fetch("https://formsubmit.co/ajax/jinsim84@kakao.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
    },
    body: emailForm.toString(),
  });

  const result = (await response.json()) as { success?: boolean | string; message?: string };
  const succeeded = result.success === true || result.success === "true";
  if (!response.ok || !succeeded) {
    throw new Error(result.message ?? "메일 알림 전송에 실패했습니다.");
  }
}

async function saveConsultation(formData: FormData) {
  const response = await fetch("/api/consultations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: formData.get("phone"),
      studentName: formData.get("studentName"),
      grade: formData.get("grade"),
      consultationAt: formData.get("consultationAt"),
      learningExperience: formData.get("learningExperience"),
      desiredDirection: formData.get("desiredDirection"),
      website: formData.get("website"),
    }),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "상담 신청을 저장하지 못했습니다.");
}

export function ConsultationForm() {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState("submitting");
    setMessage("");

    try {
      await saveConsultation(formData);
      try {
        await sendEmailNotification(formData);
      } catch {
        // The application remains safely stored if the optional email notification is delayed.
      }

      form.reset();
      setState("success");
      setMessage("학생 상담예약이 접수되었습니다. 확인 후 입력하신 학부모 전화번호로 연락드리겠습니다.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <form className="reservation-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <span>CONSULTATION RESERVATION</span>
        <h3>학생 상담예약</h3>
        <p>아래 내용을 남겨주시면 확인 후 연락드리겠습니다.</p>
        <div className="email-delivery-badge"><span>✉</span><b>예약 즉시 카카오메일 알림</b><small>jinsim84@kakao.com</small></div>
      </div>

      <div className="form-fields">
        <label>
          <span>학부모 전화번호</span>
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="010-0000-0000" required />
        </label>
        <label>
          <span>학생 이름</span>
          <input name="studentName" type="text" maxLength={40} placeholder="학생 이름을 입력해 주세요" required />
        </label>
        <label>
          <span>학년</span>
          <select name="grade" defaultValue="" required>
            <option value="" disabled>학년을 선택해 주세요</option>
            <option>초등 1학년</option><option>초등 2학년</option><option>초등 3학년</option>
            <option>초등 4학년</option><option>초등 5학년</option><option>초등 6학년</option>
            <option>중등 1학년</option><option>중등 2학년</option><option>중등 3학년</option>
            <option>기타</option>
          </select>
        </label>
        <label>
          <span>희망 상담 일시</span>
          <input
            name="consultationAt"
            type="datetime-local"
            aria-describedby="consultation-time-help"
            required
          />
          <small id="consultation-time-help">상담 가능한 날짜와 시간을 선택해 주세요.</small>
        </label>
        <label className="full-field">
          <span>영어 학습 경험</span>
          <textarea name="learningExperience" maxLength={800} rows={4} placeholder="학원 수강 경험, 사용한 교재, 현재 어려워하는 부분 등을 알려주세요." required />
        </label>
        <label className="full-field">
          <span>바라는 학습 방향</span>
          <textarea name="desiredDirection" maxLength={800} rows={4} placeholder="읽기·쓰기 기초, 영어 자신감, 중등 내신 등 원하는 학습 방향을 알려주세요." required />
        </label>
      </div>

      <label className="honeypot" aria-hidden="true">
        웹사이트
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="consent-field">
        <input name="consent" type="checkbox" required />
        <span>상담예약 접수와 이메일 알림을 위한 개인정보 수집·이용에 동의합니다. 입력 정보는 알림 발송을 위해 FormSubmit을 통해 전송됩니다.</span>
      </label>

      <button className="reservation-submit" type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "예약 접수 중…" : "상담예약 신청하기"}
        <span>→</span>
      </button>

      {message && (
        <p className={`form-message ${state}`} role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
