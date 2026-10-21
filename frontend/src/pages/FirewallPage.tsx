import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errText } from "../api/client";
import { fmtConf } from "../format";
import { CLASS_COLORS, type FirewallRule } from "../types";
import PolicyExport from "../components/PolicyExport";
import { useQuery as useQ } from "@tanstack/react-query";
import { Flow } from "../components/Sentences";
import Coach, { type CoachStep } from "../components/Coach";

interface Hover {
  rule: FirewallRule;
  x: number;
  y: number;
}

/* 방화벽 화면을 처음 여는 사람에게 보는 순서를 알려 준다 */
const FW_TOUR: CoachStep[] = [
  { sel: ".fw-intro",
    title: "탐지가 끝이 아닙니다",
    body: "관제 콘솔에서 공격으로 판정한 플로우가 이 화면에 차단 규칙으로 넘어옵니다. 탐지에서 차단까지 한 흐름으로 이어진다는 것을 보여 주는 화면입니다." },
  { sel: ".integrations",
    title: "어디에 적용할지 고릅니다",
    body: "같은 판정을 네 개 집행 지점 가운데 어디에 적용할지 고르면 그 플랫폼의 정책 형식으로 변환합니다. 네 곳 모두 변환 산출물까지 확인을 마쳤습니다.",
    click: true },
  { sel: "table.data tbody tr",
    title: "행에 마우스를 올려 보세요",
    body: "그 규칙을 만들어 낸 플로우의 인코딩 이미지가 뜹니다. 오탐이라고 판단되면 그 자리에서 삭제할 수 있고 서버에 바로 반영됩니다." },
];

export default function FirewallPage() {
  const qc = useQueryClient();
  const rules = useQuery({ queryKey: ["firewall"], queryFn: api.firewallRules });
  const [hover, setHover] = useState<Hover | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [guide, setGuide] = useState(false);
  const [exportRules, setExportRules] = useState<string[] | undefined>(undefined);
  const [exportPlat, setExportPlat] = useState<string | undefined>(undefined);
  const platforms = useQ({ queryKey: ["platforms"], queryFn: api.platforms });

  const del = useMutation({
    mutationFn: api.deleteRule,
    onSuccess: () => {
      setConfirming(null);
      qc.invalidateQueries({ queryKey: ["firewall"] });
    },
  });

  const clearAll = useMutation({
    mutationFn: api.clearRules,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["firewall"] }),
  });

  const list = rules.data?.rules ?? [];
  const ipRules = list.filter((r) => r.identifier.type === "ip_5tuple");
  const uniqIps = new Set(ipRules.map((r) => r.identifier.src_ip)).size;
  const uniqPorts = new Set(
    list.filter((r) => r.identifier.type !== "ip_5tuple").map((r) => r.identifier.dst_port),
  ).size;
  const topClass = Object.entries(
    list.reduce<Record<string, number>>((a, r) => {
      a[r.verdict.predicted_class] = (a[r.verdict.predicted_class] ?? 0) + 1;
      return a;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0];

  const openExport = (ids?: string[], plat?: string) => {
    setExportRules(ids);
    setExportPlat(plat);
    setExportOpen(true);
  };

  return (
    <>
      <Coach steps={FW_TOUR} storageKey="zc-tour-fw-3" open={guide} onClose={() => setGuide(false)} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>방화벽 차단 목록</h1>
        <span className="muted" style={{ fontSize: 13 }}>
          {list.length}개 규칙 (firewall.json 동기화)
        </span>
        <button className="btn" style={{ marginLeft: "auto" }} onClick={() => setGuide(true)}>
          화면 안내
        </button>
        {list.length > 0 && (
          <button
            className="btn primary"
            onClick={() => openExport(undefined, undefined)}
          >
            정책 내보내기
          </button>
        )}
        {list.length > 0 && (
          <button
            className="btn danger"
            disabled={clearAll.isPending}
            onClick={() => {
              if (confirm(`차단 규칙 ${list.length}건을 전체 삭제할까요?`)) clearAll.mutate();
            }}
          >
            {clearAll.isPending ? "삭제 중…" : "전체 삭제"}
          </button>
        )}
      </div>
      <p className="fw-intro">
        <Flow>
          공격으로 판정된 플로우의 raw 레코드가 차단 규칙으로 등록됩니다.
          행에 마우스를 올리면 해당 플로우의 인코딩 이미지를 확인할 수 있고, 오탐이라 판단되면 삭제하세요.
          서버 JSON에 즉시 반영됩니다.
        </Flow>
        <span className="fw-sim">시연용 JSON 시뮬레이션이며 실제 방화벽은 조작하지 않습니다</span>
      </p>

      {(del.isError || clearAll.isError) && (
        <div className="warn" style={{ marginBottom: 16 }}>
          <span className="wi">!</span>
          <span>{errText(del.error ?? clearAll.error)}</span>
        </div>
      )}

      {list.length > 0 && (
        <div className="kpis" style={{ marginBottom: 18 }}>
          <div className="kpi">
            <span className="k">차단 규칙</span>
            <span className="v">{list.length}</span>
          </div>
          <div className="kpi">
            <span className="k">IP 기준 / 포트 기준</span>
            <span className="v">
              {ipRules.length}<span style={{ fontSize: 15, color: "var(--muted)" }}> / {list.length - ipRules.length}</span>
            </span>
          </div>
          <div className="kpi">
            <span className="k">차단 대상</span>
            <span className="v">
              {uniqIps}<span style={{ fontSize: 15, color: "var(--muted)" }}> IP · {uniqPorts} 포트</span>
            </span>
          </div>
          <div className="kpi alert">
            <span className="k">최다 판정</span>
            <span className="v" style={{ fontSize: 24 }}>
              {topClass ? `${topClass[0]} ${topClass[1]}건` : "—"}
            </span>
          </div>
        </div>
      )}

      <div className="panel fw-sec" style={{ marginBottom: 18 }}>
        <h2>
          집행 지점 연동
          <span className="h-sub">
            같은 판정을 어디에 적용할지 고르면 그 플랫폼의 정책 형식으로 변환합니다. 네 개 플랫폼에 대해 변환 산출물까지 확인했습니다
          </span>
        </h2>
        <div className="integrations">
          {(platforms.data?.platforms ?? []).map((p) => (
            <button
              key={p.key}
              className="int-card"
              disabled={list.length === 0}
              onClick={() => openExport(undefined, p.key)}
            >
              <div className="int-top">
                <b>{p.name}</b>
                <span className="int-badge ok">정책 변환 검증 완료</span>
              </div>
              <span className="int-ep">{p.enforcement_point}</span>
              <span className="int-fmt mono">
                {p.formats.map((f) => f.label).join(" · ")}
              </span>
            </button>
          ))}
        </div>
        <p className="fw-note">
          <Flow>
            변환만 수행하며 외부로 요청을 보내지 않습니다.
            자격증명은 저장하지도 입력받지도 않습니다.
            대상 식별자만 넣으면 그대로 반영된 산출물이 나오고, 그 파일을 그쪽 파이프라인에 넣으면 적용됩니다.
          </Flow>
        </p>
      </div>

      {rules.isLoading ? (
        <div className="empty"><span className="spin" /></div>
      ) : list.length === 0 ? (
        <div className="empty">
          차단 규칙이 없습니다. <Link to="/console" style={{ color: "var(--focus)" }}>분석 결과</Link>에서 공격
          플로우를 등록하세요
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "auto" }}>
          <table className="data">
            <thead>
              <tr>
                <th>RULE</th><th>식별자</th><th>SRC → DST</th><th>판정</th>
                <th>CONF</th><th>등록 시각</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <FwRow
                  key={r.rule_id}
                  r={r}
                  expanded={expanded === r.rule_id}
                  confirming={confirming === r.rule_id}
                  deleting={del.isPending && del.variables === r.rule_id}
                  onHover={(x, y) => setHover({ rule: r, x, y })}
                  onLeave={() => setHover(null)}
                  onToggle={() => setExpanded(expanded === r.rule_id ? null : r.rule_id)}
                  onAskDelete={() => setConfirming(r.rule_id)}
                  onExport={() => openExport([r.rule_id], undefined)}
                  onCancelDelete={() => setConfirming(null)}
                  onDelete={() => del.mutate(r.rule_id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hover && (
        <div
          className="popover"
          style={{
            left: Math.min(hover.x + 18, window.innerWidth - 220),
            top: Math.min(hover.y + 14, window.innerHeight - 250),
          }}
        >
          <img src={api.ruleImageUrl(hover.rule.rule_id)} alt="flow encoding" />
          <div className="cap">
            {hover.rule.verdict.predicted_class}{" "}
            {fmtConf(hover.rule.verdict.confidence)}
          </div>
        </div>
      )}
      <PolicyExport
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        ruleIds={exportRules}
        initialPlatform={exportPlat}
      />
    </>
  );
}

function FwRow(props: {
  r: FirewallRule;
  expanded: boolean;
  confirming: boolean;
  deleting: boolean;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  onToggle: () => void;
  onAskDelete: () => void;
  onExport: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const { r } = props;
  const idf = r.identifier;
  const src = idf.src_ip ? `${idf.src_ip}:${idf.src_port ?? "?"}` : "—";
  const dst = idf.dst_ip
    ? `${idf.dst_ip}:${idf.dst_port ?? "?"}`
    : `dst-port ${idf.dst_port ?? "?"} (proto ${idf.protocol ?? "?"})`;

  return (
    <>
      <tr
        className="row-main"
        onMouseMove={(e) => props.onHover(e.clientX, e.clientY)}
        onMouseLeave={props.onLeave}
        onClick={props.onToggle}
        style={{ cursor: "pointer" }}
      >
        <td>{r.rule_id}</td>
        <td>
          <span
            className="badge"
            style={{
              background: idf.type === "ip_5tuple" ? "#2563eb1a" : "#5b688022",
              color: idf.type === "ip_5tuple" ? "var(--focus)" : "var(--muted)",
              border: "1px solid var(--line)",
            }}
          >
            {idf.type === "ip_5tuple" ? "IP 5-TUPLE" : "DST-PORT"}
          </span>
        </td>
        <td>{src} → {dst}</td>
        <td style={{ color: CLASS_COLORS[r.verdict.predicted_class] }}>
          {r.verdict.predicted_class}
        </td>
        <td>{fmtConf(r.verdict.confidence)}</td>
        <td className="muted">{r.created_at}</td>
        <td onClick={(e) => e.stopPropagation()}>
          {props.confirming ? (
            <span style={{ display: "flex", gap: 6 }}>
              <button className="btn danger" disabled={props.deleting} onClick={props.onDelete}>
                {props.deleting ? "…" : "확인"}
              </button>
              <button className="btn" onClick={props.onCancelDelete}>취소</button>
            </span>
          ) : (
            <span style={{ display: "flex", gap: 6 }}>
              <button className="btn" onClick={props.onExport}>내보내기</button>
              <button className="btn" onClick={props.onAskDelete}>삭제</button>
            </span>
          )}
        </td>
      </tr>
      {props.expanded && (
        <tr>
          <td colSpan={7} style={{ background: "var(--panel-2)" }}>
            <div className="kv" style={{ padding: "8px 4px" }}>
              {Object.entries(r.raw_row).slice(0, 24).map(([k, v]) => (
                <div key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v === null ? "—" : String(v)}</span>
                </div>
              ))}
            </div>
            <div className="muted mono" style={{ fontSize: 11.5, padding: "4px 4px 8px" }}>
              source: {r.source.upload_id} #{r.source.row_index}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
