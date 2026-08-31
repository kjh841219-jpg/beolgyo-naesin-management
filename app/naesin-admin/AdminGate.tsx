"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

export default function AdminGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth", { cache: "no-store" })
      .then((response) => {
        setAuthenticated(response.ok);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);
    if (!response.ok) {
      setError(data.error || "로그인하지 못했습니다.");
      return;
    }
    setAuthenticated(true);
  }

  if (!ready) return <main className="admin-gate"><div className="admin-login-card"><p>관리자 화면을 준비하고 있습니다…</p></div></main>;
  if (!authenticated) return <main className="admin-gate"><form className="admin-login-card" onSubmit={login}>
    <a href="/" className="admin-login-brand"><span>M</span><b>벌교미래엔 영어학원</b></a>
    <p>LEARNING OFFICE</p><h1>관리자 로그인</h1>
    <small>학생별 내신 기록과 학부모 메시지를 관리합니다.</small>
    <label><span>관리자 비밀번호</span><input autoFocus required type="password" inputMode="numeric" maxLength={4} value={password} onChange={(event) => setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="비밀번호 4자리" /></label>
    {error && <div className="admin-login-error">{error}</div>}
    <button disabled={sending || password.length !== 4}>{sending ? "확인 중…" : "관리자 페이지 들어가기"}</button>
    <a className="admin-practice-login" href="/dialog-quiz#admin-login">관리자 연습 로그인 →</a>
    <a className="admin-login-back" href="/naesin">← 내신관리 랜딩페이지 바로보기</a>
  </form></main>;
  return <>{children}</>;
}
