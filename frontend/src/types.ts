export interface Identifier {
  type: "ip_5tuple" | "dstport_fallback";
  src_ip: string | null;
  src_port: string | null;
  dst_ip: string | null;
  dst_port: string | null;
  protocol: string | null;
  timestamp: string | null;
  flow_id: string | null;
}

export interface FlowRow {
  row_index: number;
  pred_class: string;
  confidence: number;
  probs: number[];
  is_attack: boolean;
  identifier: Identifier;
  rule_id?: string | null;
}

export interface FlowDetail extends FlowRow {
  classes: string[];
  raw_row: Record<string, string | number | null>;
}

export interface UploadSummary {
  upload_id: string;
  filename: string;
  created_at: string;
  n_rows: number;
  n_attacks: number;
  class_counts: Record<string, number>;
  warnings?: string[];
  perf?: { infer_ms: number; per_flow_ms: number; flows_per_s: number | null; device: string };
}

export interface SysInfo {
  cpu_pct: number | null;
  mem_pct: number | null;
  mem_used_gb: number | null;
  mem_total_gb: number | null;
  device: string;
}

export interface Timeline {
  bins: number;
  n_rows: number;
  total: number[];
  attacks: number[];
}

export interface FirewallRule {
  rule_id: string;
  created_at: string;
  source: { upload_id: string; row_index: number };
  identifier: Identifier;
  verdict: { predicted_class: string; confidence: number };
  raw_row: Record<string, string | number | null>;
  image: string;
}

export interface Meta {
  model_file: string;
  classes: string[];
  K: number;
  transform: string;
  feature_names: string[];
  device: string;
  /** 시연 모드 — 서버가 쓰기 요청을 막고 있는 상태 */
  readonly?: boolean;
}

export const CLASS_COLORS: Record<string, string> = {
  Benign: "var(--benign)",
  Botnet: "var(--c-botnet)",
  DoS: "var(--c-dos)",
  DDoS: "var(--c-ddos)",
  "Brute Force": "var(--c-brute)",
  Web: "var(--c-web)",
  Infiltration: "var(--c-infil)",
};

export interface PlatformTarget { key: string; label: string; placeholder: string }
export interface PlatformFormat { key: string; label: string; lang: string; ext: string }
export interface Platform {
  key: string;
  name: string;
  enforcement_point: string;
  desc: string;
  targets: PlatformTarget[];
  formats: PlatformFormat[];
}
export interface ExportResult {
  filename: string;
  language: string;
  content: string;
  stats: { rules: number; ips: number; ports: number; skipped: number };
  warnings: string[];
}
