"use client";

import { useEffect, useState } from "react";
import { defaultLandingContent, LandingContent } from "./content";

export function useLandingContent() {
  const [content, setContent] = useState<LandingContent>(defaultLandingContent);

  useEffect(() => {
    const load = () => fetch("/api/site-content", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (value) setContent(value as LandingContent); })
      .catch(() => undefined);
    void load();
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("academy-content") : null;
    if (channel) channel.onmessage = () => void load();
    const onVisibility = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(load, 30000);
    return () => {
      channel?.close();
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, []);

  return content;
}
