"use client";

import Script from "next/script";

type KakaoSdkLoaderProps = { javaScriptKey?: string };

export default function KakaoSdkLoader({ javaScriptKey }: KakaoSdkLoaderProps) {
  function initialize() {
    if (!javaScriptKey || !window.Kakao || window.Kakao.isInitialized()) return;
    window.Kakao.init(javaScriptKey);
  }

  return (
    <Script
      id="kakao-javascript-sdk"
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js"
      integrity="sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={initialize}
      onReady={initialize}
    />
  );
}
