/** 위협 브리핑 — 분석 세션 한 장 요약 보고서 (인쇄 지원) */
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { explainVerdict, fmtConf } from "../format";
import { CLASS_COLORS } from "../types";

export default function ReportPage() {
  const { id = "" } = useParams();
  const summary = useQuery({ queryKey: ["upload", id], queryFn: () => api.upload(id) });
  const flows = useQuery({
    queryKey: ["report-flows", id],
    queryFn: () => api.flows(id, 0, 200, [], "conf_desc"),
  });

  const attacks = useMemo(
    () => (flows.data?.rows ?? []).filter((r) => r.is_attack).slice(0, 6),
    [flows.data],
  );

  const featQueries = useQueries({
    queries: attacks.slice(0, 3).map((r) => ({
      queryKey: ["gradcam-feats", id, r.row_index],
      queryFn: () => api.gradcamFeatures(id, r.row_index, 5),
    })),
  });

  const s = summary.data;
  if (!s) return <div className="empty"><span className="spin" /></div>;

  const topClass =
    Object.entries(s.class_counts)
      .filter(([c, n]) => c !== "Benign" && n > 0)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "없음";

  return (
    <div className="doc report">
      <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Link to={`/uploads/${id}`} className="btn">← 분석 결과</Link>
        <button className="btn primary" onClick={() => window.print()}>인쇄 또는 PDF 저장</button>
      </div>

      <div className="rp-head">
        <div>
          <h1>위협 브리핑</h1>
          <p className="muted">
            {s.filename} 분석 세션 요약. ZERO-CLA가 자동 생성했습니다.
          </p>
        </div>
        <div className="rp-meta">
          <div>분석 시각 {s.created_at.replace("T", " ")}</div>
          <div>생성 시각 {new Date().toLocaleString("ko-KR")}</div>
        </div>
      </div>

      <div className="kpis" style={{ marginTop: 8 }}>
        <div className="kpi"><span className="k">총 플로우</span><span className="v">{s.n_rows.toLocaleString()}</span></div>
        <div className="kpi alert"><span className="k">공격 탐지</span><span className="v">{s.n_attacks.toLocaleString()}</span></div>
        <div className="kpi"><span className="k">공격 비율</span><span className="v">{s.n_rows ? ((s.n_attacks / s.n_rows) * 100).toFixed(1) : "0.0"}%</span></div>
        <div className="kpi">
          <span className="k">클래스 분포</span>
          <div className="dist">
            {Object.entries(s.class_counts).filter(([, n]) => n > 0).map(([c, n]) => (
              <span key={c} title={`${c} ${n}건`}
                    style={{ width: `${(n / s.n_rows) * 100}%`, background: CLASS_COLORS[c] ?? "var(--muted)" }} />
            ))}
          </div>
          <div className="dist-legend">
            {Object.entries(s.class_counts).filter(([, n]) => n > 0).map(([c, n]) => (
              <span key={c}><i style={{ background: CLASS_COLORS[c] ?? "var(--muted)" }} />{c} {n}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>요약 소견</h2>
        <p>
          전체 {s.n_rows.toLocaleString()}개 플로우 중 {s.n_attacks.toLocaleString()}건이 공격으로
          판정되었습니다. 가장 많이 관측된 공격 유형은 {topClass}입니다.
          {s.perf ? ` 추론은 플로우당 ${s.perf.per_flow_ms}ms가 소요되어 게이트웨이 배치 기준을 충족합니다.` : ""}
          {s.warnings?.length ? ` 입력 데이터 참고사항: ${s.warnings.join(" / ")}.` : ""}
        </p>
      </div>

      {attacks.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2>주요 탐지 상위 {attacks.length}건 <span className="h-sub">신뢰도 순</span></h2>
          <div className="rp-list">
            {attacks.map((r, i) => {
              const feats = i < 3 ? featQueries[i]?.data?.pairs : undefined;
              return (
                <div className="rp-item" key={r.row_index}>
                  <img src={api.imageUrl(id, r.row_index)} alt={`flow ${r.row_index}`} />
                  <div>
                    <div className="rp-line">
                      <b style={{ color: CLASS_COLORS[r.pred_class] }}>{r.pred_class}</b>
                      <span>flow #{r.row_index}</span>
                      <span>{fmtConf(r.confidence)}</span>
                      {r.rule_id && <span className="rp-ruled">차단룰 등록됨</span>}
                    </div>
                    {feats?.length ? (
                      <p className="rp-why">{explainVerdict(r.pred_class, feats)}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="rp-foot">
        본 브리핑은 복호화 없이 플로우 메타데이터만으로 생성되었습니다.
        판단 근거 히트맵과 원본 레코드는 각 플로우 상세 화면에서 확인할 수 있습니다.
      </p>
    </div>
  );
}
