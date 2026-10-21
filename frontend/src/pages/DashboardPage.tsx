import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errText } from "../api/client";
import { CLASS_COLORS, type FlowRow } from "../types";
import FlowDrawer from "../components/FlowDrawer";
import Coach, { type CoachStep } from "../components/Coach";
import { capturePoint, fmtSec, loadRun } from "../runMeta";

const PAGE = 60;

export interface FlowFilter {
  classes: string[];
}

function fmtConf(c: number) {
  return `${(c * 100).toFixed(1)}%`;
}

/** 관제 콘솔 — 세션 목록 중심의 트리아지 화면 */
/* 분석 결과 화면을 처음 여는 사람에게 보는 순서를 알려 준다 */
const DASH_TOUR: CoachStep[] = [
  { sel: ".kpis",
    title: "이 캡처를 한 줄로 요약하면",
    body: "올린 캡처 안의 총 플로우 수와 그 가운데 공격으로 판정한 건수입니다. 오른쪽 끝 추론 성능은 플로우 한 건을 판별하는 데 걸린 시간이며 실제로 측정한 값입니다." },
  { sel: ".prov",
    title: "이 데이터가 어디서 왔고 얼마나 걸렸나",
    body: "왼쪽은 데이터를 끌어온 장비와 지점이고 오른쪽은 이번 분석에 걸린 시간입니다. 업로드를 보낸 순간부터 결과를 받은 순간까지를 브라우저가 직접 잰 값입니다." },
  { sel: ".search",
    title: "찾고 싶은 것을 여기서 좁힙니다",
    body: "IP와 포트와 프로토콜과 판정으로 목록을 걸러 볼 수 있습니다. 왼쪽 판정 유형을 눌러도 같은 방식으로 좁혀집니다." },
  { sel: ".con-list tbody tr, .con-list .flow-card",
    title: "행을 누르면 판단 근거가 열립니다",
    body: "오른쪽에서 상세 패널이 열리고 왜 그렇게 판정했는지 그림과 표로 보여 줍니다. 거기서 바로 차단 규칙으로 넘길 수도 있습니다.",
    click: true },
];


export default function DashboardPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();

  const entry = location.state as { filter?: FlowFilter; openRow?: number } | null;

  const [filter, setFilter] = useState<FlowFilter>(() => entry?.filter ?? { classes: [] });
  const { classes } = filter;
  const [sort, setSort] = useState("row");
  const [view, setView] = useState<"table" | "grid">("table");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [drawerRow, setDrawerRow] = useState<number | null>(entry?.openRow ?? null);
  const [toast, setToast] = useState<string | null>(null);
  // 다른 화면에서 특정 플로우를 지목해 들어온 경우, 목록을 그 지점부터 연다
  const [anchor, setAnchor] = useState<number | null>(null);
  const [anchorRow, setAnchorRow] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const dropAnchor = () => {
    setAnchor(null);
    setAnchorRow(null);
  };

  const summary = useQuery({ queryKey: ["upload", id], queryFn: () => api.upload(id) });
  // 업로드할 때 브라우저가 남겨 둔 실행 정보 (분석 소요 시간과 고른 수집 지점)
  const run = useMemo(() => loadRun(id), [id]);
  const cap = capturePoint(run?.point);
  const sys = useQuery({ queryKey: ["system"], queryFn: api.system, refetchInterval: 5000 });
  const sessions = useQuery({ queryKey: ["uploads"], queryFn: api.uploads });

  const start = anchor ?? 0;
  const flows = useInfiniteQuery({
    queryKey: ["flows", id, classes, sort, start],
    queryFn: ({ pageParam }) => api.flows(id, pageParam as number, PAGE, classes, sort),
    initialPageParam: start,
    getNextPageParam: (last) => (last.offset + PAGE < last.total ? last.offset + PAGE : undefined),
  });

  const allRows: FlowRow[] = useMemo(
    () => flows.data?.pages.flatMap((p) => p.rows) ?? [],
    [flows.data],
  );

  /* 세션 식별을 IP 5-tuple 로 하는지 목적지 포트로 대신하는지는
     지어낼 수 없는 값이라 실제 판별 결과에서 그대로 읽어 온다. */
  const idType = allRows[0]?.identifier?.type;

  // 검색은 이미 받아온 행에 대한 즉시 필터 (관제 도구의 빠른 좁히기)
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return allRows;
    return allRows.filter((r) => {
      const i = r.identifier;
      return [i.src_ip, i.dst_ip, i.src_port, i.dst_port, i.protocol, r.pred_class, String(r.row_index)]
        .some((v) => v != null && String(v).toLowerCase().includes(t));
    });
  }, [allRows, q]);

  const total = flows.data?.pages[0]?.total ?? 0;

  /* 지목된 플로우 열기 — 콘솔의 캡처 스트립이나 옛 상세 주소로 들어온 경우.
     서버가 정렬·필터를 반영한 위치를 알려주므로 그 페이지부터 목록을 받는다. */
  useEffect(() => {
    const target = (location.state as { openRow?: number } | null)?.openRow;
    if (target === undefined || target === null || Number.isNaN(target)) return;
    setDrawerRow(target);
    setPending(target);
    let live = true;
    api
      .flowNav(id, target, classes)
      .then((n) => {
        if (live && n.pos !== null) {
          setAnchor(Math.floor(n.pos / PAGE) * PAGE);
          setAnchorRow(target);
        }
      })
      .catch(() => {
        /* 위치를 못 구하면 목록은 처음부터, 드로어는 그대로 열린다 */
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, id]);

  // 목록에 그 행이 들어오면 화면 중앙으로 데려온다 (지목해 들어온 경우에만)
  const curRow = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (pending === null) return;
    const el = curRow.current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setPending(null);
  }, [pending, rows.length, view]);

  // 무한 스크롤
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting && flows.hasNextPage && !flows.isFetchingNextPage) flows.fetchNextPage();
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [flows.hasNextPage, flows.isFetchingNextPage, flows.fetchNextPage, rows.length]);

  // 필터·정렬을 바꾸면 목록 위치의 의미가 사라지므로 앵커를 푼다
  const changeFilter = (f: FlowFilter) => {
    dropAnchor();
    setFilter(f);
  };
  const toggleClass = (c: string) =>
    changeFilter({ classes: classes.includes(c) ? classes.filter((x) => x !== c) : [...classes, c] });

  const registerAll = useMutation({
    mutationFn: () => api.addAllAttacks(id),
    onError: (e) => {
      setToast(errText(e));
      setTimeout(() => setToast(null), 4000);
    },
    onSuccess: (r) => {
      setToast(`차단 등록 — 신규 ${r.created.length}건, 중복 ${r.duplicated.length}건`);
      qc.invalidateQueries({ queryKey: ["flows", id] });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const registerSel = useMutation({
    mutationFn: async () => {
      const targets = [...sel];
      // 시연 모드면 첫 건에서 걸러진다. 나머지를 계속 시도할 이유가 없다.
      for (const rowIdx of targets) await api.addRule(id, rowIdx);
      return targets.length;
    },
    onError: (e) => {
      setToast(errText(e));
      setTimeout(() => setToast(null), 4000);
    },
    onSuccess: (n) => {
      setToast(`선택한 ${n}건 차단 등록`);
      setSel(new Set());
      qc.invalidateQueries({ queryKey: ["flows", id] });
      setTimeout(() => setToast(null), 4000);
    },
  });

  /* 드로어 이동 — 받아온 목록 안에서는 그 자리로, 목록 밖이면 서버가 이웃을 알려준다.
     (지목해 들어온 플로우는 목록에 아직 없을 수 있다) */
  const step = async (d: number) => {
    if (drawerRow === null) return;
    const i = rows.findIndex((r) => r.row_index === drawerRow);
    const n = i + d;
    if (i >= 0 && n >= 0 && n < rows.length) {
      setDrawerRow(rows[n].row_index);
      return;
    }
    const nv = await api.flowNav(id, drawerRow, classes).catch(() => null);
    const t = d < 0 ? nv?.prev : nv?.next;
    if (t !== null && t !== undefined) setDrawerRow(t);
  };

  const s = summary.data;
  const attackRows = rows.filter((r) => r.is_attack);
  const allSelected = attackRows.length > 0 && attackRows.every((r) => sel.has(r.row_index));

  return (
    <>
      <Coach steps={DASH_TOUR} storageKey="zc-tour-dash-3" />
      {/* ── 세션 헤더 ── */}
      <div className="con-head">
        <div className="con-title">
          <h1>관제 콘솔</h1>
          {sessions.data && sessions.data.length > 0 && (
            <select
              className="btn mono"
              style={{ fontSize: 12.5, maxWidth: 330 }}
              value={id}
              onChange={(e) => nav(`/uploads/${e.target.value}`)}
              title="분석 세션 전환"
            >
              {sessions.data.map((x) => (
                <option key={x.upload_id} value={x.upload_id}>
                  {x.filename} · {x.created_at?.replace("T", " ")} ({x.n_rows}행)
                </option>
              ))}
            </select>
          )}
          {s && (
            <span className="live-dot" title="분석 완료">
              <i /> 분석 완료
            </span>
          )}
        </div>
        <div className="con-actions">
          <Link to={`/uploads/${id}/report`} className="btn">위협 브리핑</Link>
          <Link to="/firewall" className="btn">방화벽 관리</Link>
          <Link to="/console" className="btn primary">＋ 새 분석</Link>
        </div>
      </div>

      {/* ── KPI ── */}
      {s && (
        <div className="kpis">
          <div className="kpi">
            <span className="k">총 플로우</span>
            <span className="v">{s.n_rows.toLocaleString()}</span>
          </div>
          <div className="kpi alert">
            <span className="k">공격 탐지</span>
            <span className="v">{s.n_attacks.toLocaleString()}</span>
          </div>
          <div className="kpi">
            <span className="k">공격 비율</span>
            <span className="v">{s.n_rows ? ((s.n_attacks / s.n_rows) * 100).toFixed(1) : "0.0"}%</span>
          </div>
          <div className="kpi">
            <span className="k">추론 성능</span>
            <span className="v">
              {s.perf?.per_flow_ms ?? "—"}
              <span style={{ fontSize: 13, fontWeight: 500 }}> ms/flow</span>
            </span>
            {sys.data && (
              <span className="k" style={{ marginTop: 2 }}>
                {(s?.perf?.device ?? sys.data.device).toUpperCase()} · CPU {sys.data.cpu_pct}% · MEM{" "}
                {sys.data.mem_pct}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── 이 데이터가 어디서 왔고 얼마나 걸렸나 ── */}
      {s && (
        <div className="prov">
          <div className="prov-grp">
            <span className="prov-k">
              수집 지점
              {cap.demo && (
                <i
                  className="prov-tag"
                  title="실제 수집기에서 받아 온 값이 아니라 시연을 위해 설정해 둔 값입니다. 실제 배치에서는 수집기가 이 정보를 함께 넘겨 줍니다"
                >
                  시연 구성
                </i>
              )}
            </span>
            <div className="prov-chips">
              <span className="chip2" title="이 트래픽을 실제로 떠낸 장비입니다. 관제망에 놓인 수집 센서의 이름이며 문제가 생겼을 때 어느 장비를 봐야 하는지 알려 줍니다">
                <i>디바이스</i><b>{cap.device}</b>
              </span>
              <span className="chip2" title="그 장비가 트래픽을 끌어오는 지점입니다. 스위치의 미러 포트인지 회선에 직접 물린 TAP인지 라우터가 보내 주는 NetFlow인지에 따라 볼 수 있는 범위가 달라집니다">
                <i>엔드포인트</i><b>{cap.endpoint}</b>
              </span>
              <span className="chip2" title="그 지점이 지켜보는 네트워크 범위입니다. 어디와 어디 사이를 오간 트래픽인지를 뜻합니다">
                <i>구간</i><b>{cap.segment}</b>
              </span>
              <span className="chip2" title="통신 한 건을 무엇으로 구분했는지입니다. 출발지와 목적지의 IP와 포트와 프로토콜이 모두 있으면 IP 5-tuple로 식별하고 익명화된 데이터라 IP가 없으면 목적지 포트와 프로토콜로 대신합니다. 차단 규칙을 만들 때 기준이 되는 값입니다">
                <i>세션 식별</i>
                <b>{idType === "ip_5tuple" ? "IP 5-tuple" : idType ? "목적지 포트와 프로토콜" : "확인 중"}</b>
              </span>
            </div>
          </div>
          <div className="prov-grp">
            <span className="prov-k">처리 시간</span>
            <div className="prov-chips">
              <span className="chip2 hot" title="파일을 올린 순간부터 결과가 뜬 순간까지 실제로 걸린 시간입니다. 인코딩과 추론이 모두 포함됩니다">
                <i>분석 소요</i>
                <b>{run ? fmtSec(run.wallMs) : s.perf?.infer_ms ? fmtSec(s.perf.infer_ms) : "—"}</b>
              </span>
              <span className="chip2" title="통신 한 건을 판별하는 데 걸린 평균 시간입니다"><i>플로우당</i><b>{s.perf?.per_flow_ms ?? "—"} ms</b></span>
              <span className="chip2">
                <i>처리량</i>
                <b>{s.perf?.flows_per_s ? `초당 ${Math.round(s.perf.flows_per_s).toLocaleString()}건` : "—"}</b>
              </span>
              <span className="chip2"><i>실행 장치</i><b>{(s.perf?.device ?? sys.data?.device ?? "—").toUpperCase()}</b></span>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-line">{toast}</div>}

      {/* ── 본문: 좌 패싯 + 우 목록 ── */}
      <div className="con-body">
        {/* 패싯 필터 */}
        <aside className="facets">
          <div className="facet-grp">
            <h4>판정 유형</h4>
            <button
              className={`facet ${classes.length === 0 ? "on" : ""}`}
              onClick={() => changeFilter({ classes: [] })}
            >
              <span className="fdot" style={{ background: "var(--muted)" }} />
              <span className="fname">전체</span>
              <span className="fcnt mono">{s?.n_rows ?? "—"}</span>
            </button>
            {s &&
              Object.entries(s.class_counts)
                .filter(([, n]) => n > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([c, n]) => (
                  <button
                    key={c}
                    className={`facet ${classes.includes(c) ? "on" : ""}`}
                    onClick={() => toggleClass(c)}
                    title="다중 선택 가능"
                  >
                    <span className="fdot" style={{ background: CLASS_COLORS[c] ?? "var(--muted)" }} />
                    <span className="fname">{c}</span>
                    <span className="fcnt mono">{n.toLocaleString()}</span>
                  </button>
                ))}
          </div>

          <div className="facet-grp">
            <h4>정렬</h4>
            <select
              className="btn"
              style={{ width: "100%", fontSize: 12.5 }}
              value={sort}
              onChange={(e) => {
                dropAnchor();
                setSort(e.target.value);
              }}
            >
              <option value="row">수집 순서</option>
              <option value="conf_asc">신뢰도 낮은순 (검토 우선)</option>
              <option value="conf_desc">신뢰도 높은순</option>
            </select>
          </div>

          <div className="facet-grp">
            <h4>일괄 조치</h4>
            <button
              className="btn danger"
              style={{ width: "100%", marginBottom: 6 }}
              disabled={!s?.n_attacks || registerAll.isPending}
              onClick={() => registerAll.mutate()}
            >
              {registerAll.isPending ? "등록 중…" : `공격 전체 차단 (${s?.n_attacks ?? 0})`}
            </button>
            <button
              className="btn"
              style={{ width: "100%" }}
              disabled={sel.size === 0 || registerSel.isPending}
              onClick={() => registerSel.mutate()}
            >
              선택 {sel.size}건 차단
            </button>
          </div>

          <p className="facet-note">
            행을 클릭하면 판단 근거가 오른쪽에서 열립니다.
            <br />
            <span className="mono">j</span> 와 <span className="mono">k</span> 로 위아래 이동,
            <span className="mono">Esc</span> 로 닫기.
          </p>
        </aside>

        {/* 목록 */}
        <section className="con-list">
          <div className="list-tools">
            <input
              className="search"
              placeholder="IP · 포트 · 프로토콜 · 판정으로 좁히기"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="seg">
              <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>목록</button>
              <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>이미지</button>
            </div>
            <span className="mono muted list-count">
              {rows.length.toLocaleString()} / {total.toLocaleString()}
            </span>
          </div>

          {anchor !== null && anchor > 0 && (
            <div className="anchor-note">
              <span>
                지목한 플로우 <b className="mono">#{anchorRow}</b> 위치에서 목록을 엽니다 —{" "}
                {(anchor + 1).toLocaleString()}번째부터
              </span>
              <button className="btn" onClick={dropAnchor}>
                목록 처음으로
              </button>
            </div>
          )}

          {flows.isLoading ? (
            <div className="empty"><span className="spin" /></div>
          ) : rows.length === 0 ? (
            <div className="empty">조건에 맞는 세션이 없습니다</div>
          ) : view === "table" ? (
            <div className="tbl-wrap">
              <table className="flowtbl">
                <thead>
                  <tr>
                    <th className="c-sel">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) =>
                          setSel(e.target.checked ? new Set(attackRows.map((r) => r.row_index)) : new Set())
                        }
                        title="화면의 공격 세션 전체 선택"
                      />
                    </th>
                    <th className="c-id">#</th>
                    <th>출발지</th>
                    <th>목적지</th>
                    <th className="c-proto">프로토콜</th>
                    <th className="c-time">시각</th>
                    <th className="c-verdict">판정</th>
                    <th className="c-conf">신뢰도</th>
                    <th className="c-thumb">인코딩</th>
                    <th className="c-state">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const i = r.identifier;
                    const col = CLASS_COLORS[r.pred_class] ?? "var(--muted)";
                    return (
                      <tr
                        key={r.row_index}
                        ref={drawerRow === r.row_index ? curRow : undefined}
                        className={`${r.is_attack ? "atk" : ""} ${drawerRow === r.row_index ? "cur" : ""}`}
                        onClick={() => setDrawerRow(r.row_index)}
                      >
                        <td className="c-sel" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={!r.is_attack}
                            checked={sel.has(r.row_index)}
                            onChange={(e) => {
                              const n = new Set(sel);
                              e.target.checked ? n.add(r.row_index) : n.delete(r.row_index);
                              setSel(n);
                            }}
                          />
                        </td>
                        <td className="c-id mono">
                          <span className="sev" style={{ background: r.is_attack ? col : "transparent" }} />
                          {r.row_index}
                        </td>
                        <td className="mono">{i.src_ip ? `${i.src_ip}:${i.src_port ?? "-"}` : <span className="muted">익명화</span>}</td>
                        <td className="mono">
                          {i.dst_ip ? `${i.dst_ip}:${i.dst_port ?? "-"}` : <>포트 <b>{i.dst_port ?? "-"}</b></>}
                        </td>
                        <td className="c-proto mono">{i.protocol ?? "—"}</td>
                        <td className="c-time mono">{i.timestamp ? String(i.timestamp).replace(/^\S+\s/, "") : "—"}</td>
                        <td className="c-verdict">
                          <span className="vpill" style={{ color: col, borderColor: col }}>{r.pred_class}</span>
                        </td>
                        <td className="c-conf">
                          <div className="cbar"><div style={{ width: `${r.confidence * 100}%`, background: col }} /></div>
                          <span className="mono cnum">{fmtConf(r.confidence)}</span>
                        </td>
                        <td className="c-thumb">
                          <img loading="lazy" src={api.imageUrl(id, r.row_index)} alt="" />
                        </td>
                        <td className="c-state">
                          {r.rule_id ? <span className="blocked">차단됨</span> : <span className="muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flow-grid">
              {rows.map((r) => (
                <div
                  key={r.row_index}
                  className={`flow-card ${r.is_attack ? "attack" : ""}`}
                  onClick={() => setDrawerRow(r.row_index)}
                >
                  <img loading="lazy" src={api.imageUrl(id, r.row_index)} alt={`flow ${r.row_index}`} />
                  {r.rule_id && <span className="ruled">차단룰 ✓</span>}
                  <div className="meta">
                    <span className="cls" style={{ color: CLASS_COLORS[r.pred_class] ?? "var(--text)" }}>
                      {r.pred_class}
                    </span>
                    <span className="conf">{fmtConf(r.confidence)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={sentinel} style={{ height: 1 }} />
          {flows.isFetchingNextPage && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <span className="spin" />
            </div>
          )}
        </section>
      </div>

      <FlowDrawer
        uploadId={id}
        row={drawerRow}
        onClose={() => setDrawerRow(null)}
        onPrev={() => {
          void step(-1);
        }}
        onNext={() => {
          void step(1);
        }}
      />
    </>
  );
}
