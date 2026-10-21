/** 공격 유형 상세 — 정의·도식·작동 방식·흔적·사례 */
import { Link, useParams } from "react-router-dom";
import { attackById, ATTACKS } from "../attacksData";
import { CLASS_COLORS } from "../types";

export default function AttackDetailPage() {
  const { aid = "" } = useParams();
  const a = attackById(aid);
  if (!a) return <div className="empty">알 수 없는 공격 유형입니다</div>;

  const idx = ATTACKS.findIndex((x) => x.id === a.id);
  const prev = ATTACKS[(idx - 1 + ATTACKS.length) % ATTACKS.length];
  const next = ATTACKS[(idx + 1) % ATTACKS.length];

  return (
    <div className="doc">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <Link to="/attacks" className="btn">← 공격 유형</Link>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link to={`/attacks/${prev.id}`} className="btn">‹ {prev.name}</Link>
          <Link to={`/attacks/${next.id}`} className="btn">{next.name} ›</Link>
        </span>
      </div>

      <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="dot-lg" style={{ background: CLASS_COLORS[a.name] ?? "var(--muted)" }} />
        {a.name} <span className="h-ko">{a.ko}</span>
      </h1>
      <p className="lead">{a.oneliner}</p>

      <div className="panel dg-panel">{a.diagram}</div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>정의</h2>
        <p>{a.def}</p>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>어떻게 동작하나</h2>
        <p>{a.mech}</p>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>플로우 메타데이터에 남는 흔적</h2>
        <p>{a.trace}</p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>실제 사례</h2>
        <div className="case-list">
          {a.cases.map((c) => (
            <div className="case" key={c.title}>
              <span className="yr">{c.year}</span>
              <div>
                <b>{c.title}</b>
                <p>{c.desc}</p>
                <a className="src" href={c.url} target="_blank" rel="noreferrer">
                  {c.source} 원문 보기 ↗
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="dataset-note">{a.dataset}</p>
      </div>

      <div className="panel verdict" style={{ marginTop: 16 }}>
        <h2>제로-클라의 시선</h2>
        <p>{a.view}</p>
      </div>
    </div>
  );
}
