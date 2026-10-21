import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { Boundary } from "./components/Boundary";

/* 한글 본문 서체 — 모든 페이지가 같은 글자로 보이게 자체 호스팅한다 */
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-sans-condensed/500.css";
import "@fontsource/ibm-plex-sans-condensed/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./styles/global.css";

/* 어떤 오류든 하얀 화면 대신 내용을 보여주는 최후 안전망 */
function showFatal(msg: string) {
  let el = document.getElementById("fatal-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "fatal-overlay";
    el.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#7f1d1d;color:#fff;" +
      "padding:12px 16px;border-radius:10px;font:13px/1.6 monospace;white-space:pre-wrap;max-height:40vh;overflow:auto";
    document.body.appendChild(el);
  }
  el.textContent = "오류 발생:\n" + msg;
}
window.addEventListener("error", (e) => showFatal(String(e.error?.stack || e.message)));
window.addEventListener("unhandledrejection", (e) => showFatal("Promise: " + String((e.reason && e.reason.stack) || e.reason)));

/* 어떤 빌드가 떠 있는지 콘솔에서 바로 확인할 수 있게 찍어 둔다 */
console.info("[zerocla] build v81");

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <HashRouter>
        <Boundary>
          <App />
        </Boundary>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
