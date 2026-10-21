import type { FirewallRule, FlowDetail, FlowRow, Meta, SysInfo, Timeline, UploadSummary, Platform, ExportResult } from "../types";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json();
      msg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch { /* noop */ }
    throw new Error(msg);
  }
  return res.json();
}

/* ── 시연 모드 ────────────────────────────────────────────────
   발표 중에 관람자가 실수로 상태를 바꾸는 일을 막는다. 화면은 그대로 두고
   서버로 나가는 쓰기 요청만 끊는다. 스위치는 서버의 WEBAPP_READONLY 이고
   그 값을 /api/meta 로 받아 온다. 서버도 같은 값으로 403 을 돌려주므로
   이 층을 우회해도 상태는 바뀌지 않는다. */
export class ReadOnlyError extends Error {
  constructor(action: string) {
    super(`시연 모드입니다. ${action} 요청은 서버로 보내지 않았습니다.`);
    this.name = "ReadOnlyError";
  }
}

let readOnly = false;
export const isReadOnly = () => readOnly;

function blockWrite<T>(action: string): Promise<T> {
  return Promise.reject(new ReadOnlyError(action));
}

/** 에러 객체에서 사람이 읽을 문장만 꺼낸다. */
export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/* 첫 화면이 meta 를 부르기 전에 버튼이 눌리는 경우까지 덮으려고 적재 시점에 한 번 받아 둔다. */
fetch("/api/meta")
  .then((r) => (r.ok ? r.json() : null))
  .then((m) => {
    if (m) readOnly = !!m.readonly;
  })
  .catch(() => {
    /* 못 받아도 서버가 최종 관문이라 상태는 안전하다 */
  });

export const api = {
  meta: () =>
    fetch("/api/meta")
      .then((r) => j<Meta>(r))
      .then((m) => {
        readOnly = !!m.readonly;
        return m;
      }),
  system: () => fetch("/api/system").then((r) => j<SysInfo>(r)),
  timeline: (id: string, bins = 60) =>
    fetch(`/api/uploads/${id}/timeline?bins=${bins}`).then((r) => j<Timeline>(r)),

  uploadCsv: (file: File, profile = "auto") => {
    if (readOnly) return blockWrite<UploadSummary>("CSV 업로드");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("profile", profile);
    return fetch("/api/uploads", { method: "POST", body: fd }).then((r) => j<UploadSummary>(r));
  },

  uploads: () => fetch("/api/uploads").then((r) => j<UploadSummary[]>(r)),
  upload: (id: string) => fetch(`/api/uploads/${id}`).then((r) => j<UploadSummary>(r)),
  deleteUpload: (id: string) =>
    readOnly
      ? blockWrite<{ deleted: string }>("분석 세션 삭제")
      : fetch(`/api/uploads/${id}`, { method: "DELETE" }).then((r) => j<{ deleted: string }>(r)),

  flows: (id: string, offset: number, limit: number, classes: string[], sort = "row") =>
    fetch(`/api/uploads/${id}/flows?offset=${offset}&limit=${limit}&sort=${sort}${classes.length ? `&cls=${encodeURIComponent(classes.join(","))}` : ""}`)
      .then((r) => j<{ total: number; offset: number; rows: FlowRow[] }>(r)),

  similar: (id: string, row: number, k = 6) =>
    fetch(`/api/uploads/${id}/flows/${row}/similar?k=${k}`)
      .then((r) => j<{ rows: (FlowRow & { similarity: number })[] }>(r)),

  flow: (id: string, row: number) =>
    fetch(`/api/uploads/${id}/flows/${row}`).then((r) => j<FlowDetail>(r)),

  flowNav: (id: string, row: number, classes: string[]) =>
    fetch(`/api/uploads/${id}/flows/${row}/nav?only=all${classes.length ? `&cls=${encodeURIComponent(classes.join(","))}` : ""}`)
      .then((r) => j<{ prev: number | null; next: number | null; pos: number | null; total: number }>(r)),

  gradcamFeatures: (id: string, row: number, k = 5) =>
    fetch(`/api/uploads/${id}/flows/${row}/gradcam/features?k=${k}`)
      .then((r) => j<{ pairs: { pixel: [number, number]; feature_i: string; feature_j: string; score: number }[] }>(r)),

  strip: (id: string) =>
    fetch(`/api/uploads/${id}/strip`).then((r) => j<{ classes: string[]; seq: number[] }>(r)),

  imageUrl: (id: string, row: number) => `/api/uploads/${id}/flows/${row}/image.png`,
  gradcamUrl: (id: string, row: number) => `/api/uploads/${id}/flows/${row}/gradcam.png`,

  firewallRules: () => fetch("/api/firewall/rules").then((r) => j<{ rules: FirewallRule[] }>(r)),
  addRule: (upload_id: string, row_index: number) =>
    readOnly
      ? blockWrite<{ created: number[]; duplicated: number[] }>("차단 등록")
      : fetch("/api/firewall/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upload_id, row_index }),
    }).then((r) => j<{ created: number[]; duplicated: number[] }>(r)),
  addAllAttacks: (upload_id: string) =>
    readOnly
      ? blockWrite<{ created: number[]; duplicated: number[] }>("공격 전체 차단 등록")
      : fetch("/api/firewall/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upload_id, all_attacks: true }),
    }).then((r) => j<{ created: number[]; duplicated: number[] }>(r)),
  deleteRule: (rule_id: string) =>
    readOnly
      ? blockWrite<{ deleted: string }>("차단 규칙 삭제")
      : fetch(`/api/firewall/rules/${rule_id}`, { method: "DELETE" }).then((r) => j<{ deleted: string }>(r)),
  clearRules: () =>
    readOnly
      ? blockWrite<{ deleted_count: number }>("차단 규칙 전체 삭제")
      : fetch("/api/firewall/rules", { method: "DELETE" }).then((r) => j<{ deleted_count: number }>(r)),
  ruleImageUrl: (rule_id: string) => `/api/firewall/rules/${rule_id}/image.png`,

  platforms: () => fetch("/api/firewall/platforms").then((r) => j<{ platforms: Platform[] }>(r)),

  exportPolicy: (body: {
    platform: string;
    format: string;
    rule_ids?: string[];
    targets: Record<string, string>;
  }) =>
    fetch("/api/firewall/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => j<ExportResult>(r)),
};
