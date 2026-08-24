"use client";

import { useLandingContent } from "./useLandingContent";

const phoneHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

export function AcademyContactCard() {
  const content = useLandingContent();
  return (
    <div className="academy-contact-card">
      <div><span>학원 주소</span><b>{content.academyAddress}</b><small>{content.academyLocationNote}</small></div>
      <div><span>상담 전화</span><a href={phoneHref(content.academyPhone)}>{content.academyPhone}</a></div>
    </div>
  );
}

export function FooterContact() {
  const content = useLandingContent();
  return (
    <div className="footer-contact">
      <span>{content.academyAddress}</span>
      <a href={phoneHref(content.academyPhone)}>{content.academyPhone}</a>
      <small>{content.academyLocationNote} · © 2026 {content.academyName}</small>
    </div>
  );
}
