"use client";

import { useEffect, useState } from "react";
import { defaultLandingContent, LandingContent } from "./content";

export function useLandingContent() {
  const [content, setContent] = useState<LandingContent>(defaultLandingContent);

  useEffect(() => {
    const load = () => fetch(`/api/site-content?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (value) setContent(value as LandingContent); })
      .catch(() => undefined);
    void load();
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("academy-content") : null;
    if (channel) channel.onmessage = () => void load();
    const onVisibility = () => { if (document.visibilityState === "visible") void load(); };
    const onFocus = () => void load();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(load, 5000);
    return () => {
      channel?.close();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, []);

  return content;
}
