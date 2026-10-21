import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Platform } from "../types";
import Coach, { type CoachStep } from "./Coach";

/* 이 화면에서 정말 중요한 세 가지만 짚는다 */
const EXPORT_TOUR: CoachStep[] = [
  { sel: ".export-side", title: "1. 어디에 적용할지 고릅니다",
    body: "차단을 실제로 집행하는 지점입니다. 방화벽과 클라우드와 스위치는 정책 문법이 서로 달라 고른 곳에 맞춰 변환합니다." },
  { sel: ".code-block", title: "2. 그대로 붙여 넣을 결과물입니다",
    body: "관제 콘솔이 공격으로 판정한 대상이 고른 장비의 정책 문법으로 바뀌어 나옵니다. 복사하거나 파일로 내려받아 그대로 씁니다." },
  { sel: ".export-guide", title: "3. 전송은 하지 않습니다",
    body: "변환만 수행하고 외부로 요청을 보내지 않습니다. 자격증명도 받지 않습니다. 적용 여부는 사람이 판단합니다." },
];

/** 정책 내보내기 — 차단 판정을 각 집행 지점의 정책 형식으로 변환한다.
 *  전송은 하지 않는다(dry-run). 대상 식별자만 입력받아 산출물에 반영한다. */
export default function PolicyExport({
  open,
  onClose,
  ruleIds,
  initialPlatform,
}: {
  open: boolean;
  onClose: () => void;
  ruleIds?: string[];
  initialPlatform?: string;
}) {
  const plats = useQuery({ queryKey: ["platforms"], queryFn: api.platforms, enabled: open });
  const [pk, setPk] = useState(initialPlatform ?? "cloudflare");
  const [fmt, setFmt] = useState<string>("");
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [guide, setGuide] = useState(false);

  const list: Platform[] = plats.data?.platforms ?? [];
  const cur = useMemo(() => list.find((p) => p.key === pk), [list, pk]);

  // 플랫폼이 바뀌면 첫 포맷 선택 + 대상 입력 초기화(placeholder 를 기본값으로)
  useEffect(() => {
    if (!cur) return;
    setFmt(cur.formats[0].key);
    setTargets(Object.fromEntries(cur.targets.map((t) => [t.key, t.placeholder])));
  }, [cur]);

  useEffect(() => {
    if (open && initialPlatform) setPk(initialPlatform);
  }, [open, initialPlatform]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const out = useQuery({
    queryKey: ["export", pk, fmt, targets, ruleIds],
    queryFn: () => api.exportPolicy({ platform: pk, format: fmt, rule_ids: ruleIds, targets }),
    enabled: open && !!fmt && !!cur,
  });

  if (!open) return null;

  const download = () => {
    if (!out.data) return;
    const blob = new Blob([out.data.content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = out.data.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copy = async () => {
    if (!out.data) return;
    await navigator.clipboard.writeText(out.data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <Coach steps={EXPORT_TOUR} storageKey="zc-tour-export-1" open={guide} onClose={() => setGuide(false)} />
      <div className="export-modal" role="dialog" aria-label="정책 내보내기">
        <header className="export-head">
          <div>
            <b>정책 내보내기</b>
            <span className="muted" style={{ fontSize: 12.5, marginLeft: 10 }}>
              {ruleIds?.length ? `선택한 ${ruleIds.length}건` : "차단 목록 전체"} · 변환만 하고
              전송하지 않습니다
            </span>
          </div>
          <button className="btn" onClick={() => setGuide(true)} style={{ marginLeft: "auto" }}>
            화면 안내
          </button>
          <button className="icon-btn" onClick={onClose} title="닫기 (Esc)">
            ✕
          </button>
        </header>
        <p className="export-guide">
          <b>여기서 하는 일</b>
          <span>관제 콘솔이 공격으로 판정한 대상을 각 방화벽이 알아듣는 정책 문법으로 바꿔 줍니다</span>
          <span>적용할 플랫폼을 고르고 대상 식별자를 넣으면 그대로 붙여 넣을 산출물이 나옵니다</span>
          <span>외부로 요청을 보내지 않고 자격증명도 받지 않으며 변환만 수행합니다</span>
        </p>

        <div className="export-body">
          {/* 집행 지점 선택 */}
          <nav className="export-side">
            <h4>집행 지점</h4>
            {list.map((p) => (
              <button
                key={p.key}
                className={`ep ${pk === p.key ? "on" : ""}`}
                onClick={() => setPk(p.key)}
              >
                <b>{p.name}</b>
                <span>{p.enforcement_point}</span>
              </button>
            ))}
          </nav>

          {/* 산출물 */}
          <div className="export-main">
            {cur && (
              <>
                <p className="ep-desc">{cur.desc}</p>

                <div className="tgt-form">
                  {cur.targets.map((t) => (
                    <label key={t.key}>
                      <span>{t.label}</span>
                      <input
                        className="search"
                        value={targets[t.key] ?? ""}
                        placeholder={t.placeholder}
                        onChange={(e) => setTargets({ ...targets, [t.key]: e.target.value })}
                      />
                    </label>
                  ))}
                </div>

                <div className="fmt-tabs">
                  {cur.formats.map((f) => (
                    <button
                      key={f.key}
                      className={fmt === f.key ? "on" : ""}
                      onClick={() => setFmt(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                  <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button className="btn" onClick={copy} disabled={!out.data}>
                      {copied ? "복사됨" : "복사"}
                    </button>
                    <button className="btn primary" onClick={download} disabled={!out.data}>
                      내려받기
                    </button>
                  </span>
                </div>

                {out.isLoading ? (
                  <div className="empty">
                    <span className="spin" />
                  </div>
                ) : out.isError ? (
                  <div className="warn">
                    <span className="wi">!</span>
                    <span>{String(out.error)}</span>
                  </div>
                ) : out.data ? (
                  <>
                    <div className="code-meta mono">
                      {out.data.filename} · 규칙 {out.data.stats.rules}건 · IP{" "}
                      {out.data.stats.ips} · 포트 {out.data.stats.ports}
                      {out.data.stats.skipped > 0 && ` · 제외 ${out.data.stats.skipped}`}
                    </div>
                    <pre className="code-block">{out.data.content}</pre>
                    {out.data.warnings.map((w, i) => (
                      <div className="warn" key={i}>
                        <span className="wi">!</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
