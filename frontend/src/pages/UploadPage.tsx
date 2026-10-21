import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import CaptureStrip from "../components/CaptureStrip";
import { Flow } from "../components/Sentences";
import Coach, { type CoachStep } from "../components/Coach";
import { CAPTURE_POINTS, lastPoint, rememberPoint, saveRun } from "../runMeta";

/** 관제 콘솔 — 계측기 화면.
 *  주인공은 업로드 상자가 아니라 이미 분석된 세션들이다.
 *  업로드는 한 줄 슬롯으로 내리고, 세션은 캡처 스트립이 붙은 밀집 목록으로 올렸다.
 */
/* 처음 들어온 사람이 이 화면을 어떤 순서로 봐야 하는지 */
const TOUR: CoachStep[] = [
  { sel: ".ro",
    title: "먼저 여기부터 봅니다",
    body: "지금까지 분석한 세션과 플로우, 공격으로 판정한 건수입니다. 맨 오른쪽 복호화 횟수가 0이라는 점이 이 제품의 핵심입니다." },
  { sel: ".slot",
    title: "여기에 캡처를 올립니다",
    body: "플로우 통계 CSV를 끌어다 놓으면 바로 인코딩과 추론이 돌아갑니다. CICFlowMeter와 NFStream 형식을 자동으로 맞춥니다.",
    click: true },
  { sel: "table.instr thead",
    title: "결과는 아래 표에 쌓입니다",
    body: "가운데 칸은 수집 순서를 따라 그린 판정 분포입니다. 색이 진할수록 그 구간에 공격이 많고 색은 그 구간에서 가장 많이 나온 공격 유형입니다." },
  { sel: "table.instr tbody tr",
    title: "행을 누르면 근거가 열립니다",
    body: "한 세션을 열면 개별 플로우마다 왜 그렇게 판정했는지 그림과 표로 확인할 수 있습니다. 거기서 바로 차단 규칙으로도 넘길 수 있습니다.",
    click: true },
];

export default function UploadPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [drag, setDrag] = useState(false);
  const [profile, setProfile] = useState("auto");
  const [capPoint, setCapPoint] = useState(lastPoint);
  const [guide, setGuide] = useState(false);
  // 분석이 도는 동안 흘러간 시간을 화면에 그대로 보여 준다
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(0);
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const sessions = useQuery({ queryKey: ["uploads"], queryFn: api.uploads });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const t0 = performance.now();
      startedRef.current = t0;
      const startedAt = new Date().toISOString();
      const r = await api.uploadCsv(f, profile);
      // 사람이 실제로 기다린 시간이다. 서버가 재는 추론 시간과는 구간이 다르다.
      saveRun(r.upload_id, { wallMs: performance.now() - t0, point: capPoint, startedAt });
      return r;
    },
    onSuccess: (r) => nav(`/uploads/${r.upload_id}`),
  });

  useEffect(() => {
    if (!upload.isPending) {
      setElapsed(0);
      return;
    }
    const iv = setInterval(() => setElapsed(performance.now() - startedRef.current), 100);
    return () => clearInterval(iv);
  }, [upload.isPending]);
  const delSession = useMutation({
    mutationFn: api.deleteUpload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uploads"] }),
  });

  const onFile = useCallback((f: File | undefined) => f && upload.mutate(f), [upload]);
  // 시연 모드에서는 파일을 고르는 것 자체를 막는다. 화면은 그대로 두고 입력만 잠근다.
  const ro = !!meta.data?.readonly;
  const list = sessions.data ?? [];
  const totalFlows = list.reduce((a, s) => a + s.n_rows, 0);
  const totalAttacks = list.reduce((a, s) => a + s.n_attacks, 0);

  return (
    <>
      <Coach steps={TOUR} storageKey="zc-tour-console-3" open={guide} onClose={() => setGuide(false)} />
      <div className="instr-head">
        <h1>관제 콘솔</h1>
        <span className="sub">복호화 없이 플로우 통계만으로 판별합니다</span>
        <span className="right">
          {/* 변환 이름과 장비 이름은 발표에서 설명할 값이 아니라 뺐다.
              심사위원에게 의미가 있는 것은 몇 종을 가려내는가다. */}
          <span className="head-meta">
            {meta.data ? `판별 클래스 ${meta.data.classes.length}종` : "모델 준비 중"}
          </span>
          <button className="btn guide-btn" onClick={() => setGuide(true)}>
            화면 안내
          </button>
        </span>
      </div>

      {/* 계기 읽기값 */}
      <div className="ro" style={{ marginBottom: 14 }}>
        <div className="ro-cell">
          <span className="ro-k">분석 세션</span>
          <span className="ro-v">{list.length}</span>
          <span className="ro-d">지금까지 분석한 캡처 파일 수</span>
        </div>
        <div className="ro-cell">
          <span className="ro-k">누적 플로우</span>
          <span className="ro-v">{totalFlows.toLocaleString()}</span>
          <span className="ro-d">판별을 거친 통신 건수</span>
        </div>
        <div className="ro-cell alert">
          <span className="ro-k">공격 판정</span>
          <span className="ro-v">{totalAttacks.toLocaleString()}</span>
          <span className="ro-d">그 가운데 공격으로 가려낸 건수</span>
        </div>
        <div className="ro-cell">
          <span className="ro-k">복호화 횟수</span>
          <span className="ro-v">0</span>
          <span className="ro-d">한 번도 열어 보지 않았습니다</span>
        </div>
      </div>

      {/* 업로드 슬롯 — 한 줄 */}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 20 }}>
        <div
          className={`slot ${drag ? "drag" : ""}`}
          style={{ flex: 1, cursor: ro ? "not-allowed" : undefined, opacity: ro ? 0.7 : undefined }}
          title={ro ? "시연 모드 — 발표 중 예기치 않은 입력을 막기 위해 업로드를 잠갔습니다" : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            if (!ro) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!ro) onFile(e.dataTransfer.files[0]);
          }}
          onClick={() => {
            if (!ro) document.getElementById("file-input")?.click();
          }}
        >
          <span className="glyph">{upload.isPending ? "···" : "+"}</span>
          <span className="txt">
            <b>
              {ro
                ? "시연 모드 — 업로드 잠김"
                : upload.isPending
                ? "분석 중. 인코딩과 추론이 돌고 있습니다"
                : "플로우 CSV 올리기"}
            </b>
            <span>
              {ro
                ? "발표 중 예기치 않은 입력을 막기 위해 잠갔습니다. 아래 분석 세션은 그대로 열람할 수 있습니다"
                : upload.isPending
                ? "행 수에 따라 수 초에서 수십 초 걸립니다"
                : "끌어다 놓거나 클릭해서 선택 · CICFlowMeter, NFStream 형식"}
            </span>
          </span>
          {upload.isPending && (
            <span className="slot-timer" aria-live="polite">
              <b>{(elapsed / 1000).toFixed(1)}</b>
              <i>초 경과</i>
            </span>
          )}
          <input
            id="file-input"
            type="file"
            accept=".csv"
            hidden
            disabled={ro}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
        <label
          className="slot"
          style={{ cursor: "default", borderStyle: "solid", flex: "0 0 auto", gap: 8 }}
          title="플로우 피처를 추출한 도구입니다. 컬럼명과 단위를 자동 변환합니다"
        >
          <span className="slot-k">추출 도구</span>
          <select
            className="btn"
            style={{ fontSize: 12.5 }}
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          >
            <option value="auto">자동 감지</option>
            <option value="cicflowmeter">CICFlowMeter</option>
            <option value="nfstream">NFStream</option>
          </select>
        </label>
        <label
          className="slot"
          style={{ cursor: "default", borderStyle: "solid", flex: "0 0 auto", gap: 8 }}
          title="이 데이터를 어느 장비에서 어느 지점을 통해 끌어왔는지입니다. 결과 화면에 그대로 표시됩니다"
        >
          <span className="slot-k">수집 지점</span>
          <select
            className="btn"
            style={{ fontSize: 12.5 }}
            value={capPoint}
            onChange={(e) => { setCapPoint(e.target.value); rememberPoint(e.target.value); }}
          >
            {CAPTURE_POINTS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      {upload.isError && (
        <div className="warn" style={{ marginBottom: 16 }}>
          <span className="wi">!</span>
          <span>{String(upload.error)}</span>
        </div>
      )}

      {/* 세션 목록 — 캡처 스트립이 붙은 밀집 표 */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="instr">
          <thead>
            <tr>
              <th style={{ width: 190 }}>캡처 파일</th>
              <th style={{ width: 132 }}>분석 시각</th>
              <th>판정 분포 — 수집 순서대로</th>
              <th style={{ width: 72, textAlign: "right" }}>플로우</th>
              <th style={{ width: 72, textAlign: "right" }}>공격</th>
              <th style={{ width: 66 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: "22px 12px", textAlign: "center" }}>
                  아직 분석한 캡처가 없습니다. 위에 CSV를 올리면 여기에 쌓입니다.
                </td>
              </tr>
            ) : (
              list.map((s) => (
                <tr key={s.upload_id} className="pick" onClick={() => nav(`/uploads/${s.upload_id}`)}>
                  <td className="name">{s.filename}</td>
                  <td className="num" style={{ textAlign: "left", fontSize: 11.5, color: "var(--muted)" }}>
                    {s.created_at?.replace("T", " ").slice(5)}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <CaptureStrip
                      uploadId={s.upload_id}
                      onPick={(row) => nav(`/uploads/${s.upload_id}`, { state: { openRow: row } })}
                    />
                  </td>
                  <td className="num">{s.n_rows.toLocaleString()}</td>
                  <td className="num" style={{ color: s.n_attacks ? "var(--alert)" : "var(--muted)" }}>
                    {s.n_attacks.toLocaleString()}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn"
                      style={{ padding: "3px 9px", fontSize: 11.5 }}
                      disabled={ro || delSession.isPending}
                      title={ro ? "시연 모드 — 세션 삭제가 잠겨 있습니다" : undefined}
                      onClick={() => {
                        if (confirm(`${s.filename} 세션을 지울까요?`)) delSession.mutate(s.upload_id);
                      }}
                    >
                      지우기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="legend-box">
        <b className="legend-k">판정 분포 그래프 읽는 법</b>
        <p className="strip-legend">
        <Flow>
          스트립의 한 칸은 수집 순서상의 구간입니다.
          색이 진할수록 그 구간에 공격이 많고, 색은 그 구간에서 가장 많이 나온 공격 유형입니다.
          1건이라도 있으면 옅게라도 칠해 묶는 과정에서 사라지지 않습니다.
          칸을 누르면 그 구간에서 가장 위험한 플로우를 세션 화면에서 엽니다.
        </Flow>
        </p>
      </div>
    </>
  );
}
