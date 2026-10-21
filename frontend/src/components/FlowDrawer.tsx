import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { CLASS_COLORS } from "../types";
import { featureKo } from "../featureKo";
import Coach, { type CoachStep } from "../components/Coach";


/* 상세 패널을 처음 여는 사람에게 위에서 아래로 여덟 단계를 짚어 준다 */
const DRAWER_TOUR: CoachStep[] = [
  { sel: ".ev-sum", title: "1. 판정 결과",
    body: "선택한 통신 한 건에 대한 판정입니다. 페이로드는 열지 않고 헤더와 오간 시각만으로 내린 판단입니다." },
  { sel: ".ev-pair figure:first-child", title: "2. 트래픽을 그림으로 바꾼 결과",
    body: "플로우 통계 수치를 2차원 관계 행렬로 바꾼 그림입니다. 한 칸이 관찰 항목 두 개의 관계이고 공격마다 무늬가 다릅니다." },
  { sel: ".ev-pair figure:last-child", title: "3. AI가 주목한 위치",
    body: "판단할 때 크게 본 자리를 밝게 칠한 히트맵입니다. 밝은 곳이 그대로 판단의 근거가 됩니다." },
  { sel: ".ev-hint", title: "4. 그림과 표를 이어 봅니다",
    body: "아래 표의 행에 마우스를 올리면 위 두 그림에서 그 관찰 항목이 만나는 자리를 가로선과 세로선으로 짚어 줍니다. 어떤 값을 보고 판단했는지 그림 위에서 바로 확인할 수 있습니다.",
    click: true },
  { sel: ".ev-table", title: "5. 판단에 크게 쓰인 순서",
    body: "판별에 쓰는 관찰 항목 가운데 이번 판정에 크게 기여한 것부터 보여 줍니다. 기여도는 히트맵에서 계산한 값입니다." },
  { sel: ".dw-prob", title: "6. 공격 유형별 확률",
    body: "모델이 각 유형에 얼마나 확신했는지입니다. 1등과 2등의 차이가 작으면 사람이 한 번 더 볼 값이라는 신호입니다." },
  { sel: ".dw-idf", title: "7. 누가 누구와 통신했나",
    body: "차단 규칙을 만들 때 기준이 되는 식별 정보입니다. 익명화된 데이터셋이면 IP 대신 목적지 포트와 프로토콜로 식별합니다." },
  { sel: ".drawer-foot", title: "8. 여기서 바로 차단합니다",
    body: "공격으로 판정된 건이면 이 버튼으로 차단 규칙에 올립니다. 정상으로 판정된 건은 눌리지 않습니다. 등록하면 방화벽 화면으로 이어집니다.",
    click: true },
];

/** 행 클릭 시 우측에서 열리는 상세 조사 패널.
 *  관제 도구 관례대로 목록을 떠나지 않고 근거를 확인하고 바로 조치한다. */
export default function FlowDrawer({
  uploadId,
  row,
  onClose,
  onPrev,
  onNext,
}: {
  uploadId: string;
  row: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const open = row !== null;
  const qc = useQueryClient();
  // 피처쌍 행에 커서를 올리면 히트맵의 해당 픽셀을 짚어준다
  const [hl, setHl] = useState<[number, number] | null>(null);
  // 시연용 안내 — 순서대로 짚어 주는 코치마크
  const [tour, setTour] = useState(false);
  // 원본 레코드를 24개만 보여줄지 전부 펼칠지
  const [rawAll, setRawAll] = useState(false);
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const K = meta.data?.K ?? 44;

  const flow = useQuery({
    queryKey: ["flow", uploadId, row],
    queryFn: () => api.flow(uploadId, row as number),
    enabled: open,
  });
  const feats = useQuery({
    queryKey: ["gradcam-feats", uploadId, row],
    queryFn: () => api.gradcamFeatures(uploadId, row as number, 5),
    enabled: open,
  });
  const register = useMutation({
    mutationFn: () => api.addRule(uploadId, row as number),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow", uploadId, row] });
      qc.invalidateQueries({ queryKey: ["flows", uploadId] });
      qc.invalidateQueries({ queryKey: ["firewall"] });
    },
  });

  useEffect(() => {
    setHl(null);
  }, [row]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); onNext(); }
      if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); onPrev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onNext, onPrev]);

  if (!open) return null;
  const f = flow.data;
  // 기본값은 1순위 기여 피처쌍. 커서를 올리면 그 픽셀로 옮겨간다.
  /* 커서를 올린 행이 있을 때만 그림 위에 표시한다 */
  const shown: [number, number] | null = hl;
  const idf = f?.identifier;

  return (
    <>
      {open && <Coach steps={DRAWER_TOUR} storageKey="zc-tour-drawer-3" open={tour} onClose={() => setTour(false)} />}
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`플로우 ${row} 상세`}>
        <header className="drawer-head">
          <div>
            <span className="mono drawer-id">flow #{row}</span>
            {f && (
              <span
                className="verdict-pill"
                style={{
                  color: CLASS_COLORS[f.pred_class] ?? "var(--text)",
                  borderColor: CLASS_COLORS[f.pred_class] ?? "var(--line)",
                }}
              >
                {f.pred_class}
              </span>
            )}
          </div>
          <div className="drawer-nav">
            <button className="btn guide-btn" onClick={() => setTour(true)} title="이 화면 읽는 법">
              안내 보기
            </button>
            <button className="icon-btn" onClick={onPrev} title="이전 (k)">↑</button>
            <button className="icon-btn" onClick={onNext} title="다음 (j)">↓</button>
            <button className="icon-btn" onClick={onClose} title="닫기 (Esc)">✕</button>
          </div>
        </header>

        {!f ? (
          <div className="empty"><span className="spin" /></div>
        ) : (
          <div className="drawer-body">
            {/* 판정 근거 */}
            <section>
              <h3 className="drawer-h">판단 근거</h3>
              {/* 심사위원과 처음 보는 관제 담당자를 위한 한 줄 요약 */}
              <p className="ev-sum">
                이 플로우는 <b>{f.pred_class}</b>로 판정했습니다.
                <span>페이로드는 복호화하지 않고 헤더와 오간 시각만 보고 내린 판단입니다.</span>
              </p>
              <div className="ev-pair">
                <figure>
                  <div className="img-wrap">
                    <img src={api.imageUrl(uploadId, row)} alt="인코딩" />
                    {shown && (
                      <span
                        className="hl-cell"
                        style={{
                          top: `${(shown[0] / K) * 100}%`,
                          left: `${(shown[1] / K) * 100}%`,
                          width: `${100 / K}%`,
                          height: `${100 / K}%`,
                        }}
                      />
                    )}
                  </div>
                  <figcaption>
                    <b>트래픽을 그림으로 바꾼 결과</b>
                    <span>가로세로 한 칸이 피처 두 개의 관계입니다</span>
                  </figcaption>
                </figure>
                <figure>
                  <div className="img-wrap">
                    <img src={api.gradcamUrl(uploadId, row)} alt="Grad-CAM" />
                    {shown && (
                      <>
                        <span className="hl-row" style={{ top: `${(shown[0] / K) * 100}%`, height: `${100 / K}%` }} />
                        <span className="hl-col" style={{ left: `${(shown[1] / K) * 100}%`, width: `${100 / K}%` }} />
                        <span
                          className="hl-cell"
                          style={{
                            top: `${(shown[0] / K) * 100}%`,
                            left: `${(shown[1] / K) * 100}%`,
                            width: `${100 / K}%`,
                            height: `${100 / K}%`,
                          }}
                        />
                      </>
                    )}
                  </div>
                  <figcaption>
                    <b>AI가 주목한 위치</b>
                    <span>밝을수록 판단에 크게 쓰인 자리입니다</span>
                  </figcaption>
                </figure>
              </div>
              <p className="ev-hint">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2.5 L3 11.5 L5.6 9.2 L7.3 13 L9 12.2 L7.4 8.6 L10.8 8.3 Z" />
                </svg>
                <span>아래 표의 행에 마우스를 올리면 그 자리를 그림에서 짚어 줍니다</span>
              </p>
              <div className="tour-anchor">
              <table className="data tight ev-table">
                <caption className="ev-cap">
                  지금 판별에 쓰는 관찰 항목 <b>{K}개</b> 가운데 이번 판정에 크게 기여한 순서입니다
                </caption>
                <thead>
                  <tr><th>순위</th><th>판단에 쓰인 관찰 항목</th><th>기여도</th></tr>
                </thead>
                <tbody>
                  {feats.data?.pairs.map((p, i) => (
                    <tr
                      key={i}
                      className="hoverable"
                      onMouseEnter={() => setHl([p.pixel[0], p.pixel[1]])}
                      onMouseLeave={() => setHl(null)}
                    >
                      <td className="mono">{i + 1}</td>
                      <td className="ftd">
                        <span className="fen">{p.feature_i}</span>
                        <span className="ftx">×</span>
                        <span className="fen">{p.feature_j}</span>
                      </td>
                      <td className="mono">{p.score.toFixed(3)}</td>
                    </tr>
                  )) ?? (
                    <tr><td colSpan={3} className="muted">계산 중…</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </section>

            {/* 클래스 확률 */}
            <section className="dw-prob">
              <h3 className="drawer-h">공격 유형별 확률</h3>
              {f.classes.map((c, i) => (
                <div className="pr" key={c}>
                  <span className="pr-n">{c}</span>
                  <div className="pr-bar">
                    <div
                      style={{
                        width: `${Math.max(f.probs[i] * 100, 0.6)}%`,
                        background: CLASS_COLORS[c] ?? "var(--focus)",
                        opacity: c === f.pred_class ? 1 : 0.4,
                      }}
                    />
                  </div>
                  <span className="pr-v mono">{(f.probs[i] * 100).toFixed(1)}%</span>
                </div>
              ))}
            </section>

            {/* 세션 식별자 */}
            <section className="dw-idf">
              <h3 className="drawer-h">누가 누구와 통신했나</h3>
              <div className="kv2">
                <div><span><i>Source</i> 출발지</span><b className="mono">{idf?.src_ip ? `${idf.src_ip}:${idf.src_port ?? "-"}` : "—"}</b></div>
                <div><span><i>Destination</i> 목적지</span><b className="mono">{idf?.dst_ip ? `${idf.dst_ip}:${idf.dst_port ?? "-"}` : `포트 ${idf?.dst_port ?? "-"}`}</b></div>
                <div><span><i>Protocol</i> 프로토콜</span><b className="mono">{idf?.protocol ?? "—"}</b></div>
                <div><span><i>Timestamp</i> 시각</span><b className="mono">{idf?.timestamp ?? "—"}</b></div>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {idf?.type === "ip_5tuple"
                  ? "IP 5-tuple 식별 — 차단 규칙을 IP 기준으로 등록합니다."
                  : "익명화된 데이터셋이라 IP가 없습니다. 목적지 포트와 프로토콜로 식별합니다."}
              </p>
            </section>

            {/* 원본 레코드 */}
            <section className="dw-raw">
              <h3 className="drawer-h">Feature <em>이 플로우에서 뽑아낸 값입니다</em></h3>
              <div className="raw-grid">
                {(rawAll ? Object.entries(f.raw_row) : Object.entries(f.raw_row).slice(0, 24)).map(([k, v]) => (
                  <div key={k}>
                    <span>
                      {k}
                      {featureKo(k) && <i className="rk-ko">{featureKo(k)}</i>}
                    </span>
                    <b className="mono">{v === null ? "—" : String(v)}</b>
                  </div>
                ))}
              </div>
              {Object.keys(f.raw_row).length > 24 && (
                <div className="raw-more">
                  <button type="button" className="raw-more-btn" onClick={() => setRawAll((s) => !s)}>
                    {rawAll ? "일부 보기" : "전체 보기"}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        <footer className="drawer-foot">
          {f?.rule_id ? (
            <Link to="/firewall" className="btn" style={{ flex: 1, justifyContent: "center" }}>
              차단 규칙 등록됨 — 방화벽에서 보기
            </Link>
          ) : (
            <button
              className="btn danger"
              style={{ flex: 1 }}
              disabled={!f?.is_attack || register.isPending}
              onClick={() => register.mutate()}
            >
              {register.isError
                ? "시연 모드 — 차단 등록이 잠겨 있습니다"
                : register.isPending
                ? "등록 중…"
                : f?.is_attack
                ? "이 세션 차단 등록"
                : "정상 판정 — 차단 불필요"}
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}
