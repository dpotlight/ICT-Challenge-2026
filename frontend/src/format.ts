/** 신뢰도 표시: 소수점 둘째 자리 고정.
 *  softmax 반올림으로 100.00%가 되는 것만 99.99%로 클램프 (원값은 툴팁으로 제공). */
export function fmtConf(confidence: number): string {
  const pct = Math.min(confidence * 100, 99.99);
  return `${pct.toFixed(2)}%`;
}

/* Grad-CAM 피처명 → 사람이 읽는 표현 */
const GROUPS: [RegExp, string][] = [
  [/IAT/i, "패킷 도착 간격"],
  [/Pkt Len|Seg Size|Pkt Size|Header Len/i, "패킷 크기"],
  [/Flag/i, "TCP 플래그 사용"],
  [/Duration/i, "세션 지속 시간"],
  [/\/s|Rate|Pkts\/b|Byts\/b/i, "전송 속도"],
  [/TotLen|Tot .*Pkts|Subflow/i, "전송량"],
  [/Win/i, "초기 윈도 크기"],
  [/Active|Idle/i, "활동과 유휴 구간"],
  [/Down\/Up/i, "업/다운 방향 비율"],
  [/Port/i, "포트"],
];

export function featKo(name: string): string {
  const dir = /^Fwd/i.test(name) ? "정방향 " : /^Bwd/i.test(name) ? "역방향 " : "";
  for (const [re, ko] of GROUPS) if (re.test(name)) return dir + ko;
  return name;
}

const CLASS_CLOSER: Record<string, string> = {
  Botnet: "일정한 주기로 짧은 통신을 반복하는 비커닝 패턴에서 전형적으로 나타나는 조합입니다.",
  DoS: "요청을 비정상적인 속도나 리듬으로 보내는 자원 고갈 시도의 흔적입니다.",
  DDoS: "짧은 세션이 대량으로 쏟아질 때 나타나는 특성입니다.",
  "Brute Force": "같은 대상을 기계적으로 반복 접속할 때 남는 규칙성입니다.",
  Web: "일반 열람과 다른 요청과 응답 패턴으로 웹 공격 시도에서 관측되는 형태입니다.",
  Infiltration: "평소와 다른 내부 방향 연결 흐름으로 내부 침투와 확산 단계에서 나타납니다.",
  Benign: "정상 트래픽의 전형적인 분포와 일치해 공격의 흔적이 관측되지 않았습니다.",
};

/** Top 피처쌍 목록 → 자연어 판정 근거 문장 */
export function explainVerdict(
  cls: string,
  pairs: { feature_i: string; feature_j: string }[],
): string {
  const freq = new Map<string, number>();
  for (const p of pairs) {
    for (const f of [featKo(p.feature_i), featKo(p.feature_j)]) {
      freq.set(f, (freq.get(f) ?? 0) + 1);
    }
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const head =
    top.length >= 2
      ? `${top[0]} 및 ${top[1]}의 상호작용`
      : `${top[0] ?? "핵심 피처"} 계열의 상호작용`;
  return `모델은 이 플로우에서 ${head}을 가장 큰 판단 근거로 보았습니다. ${CLASS_CLOSER[cls] ?? ""}`;
}


/* Raw Flow Record 필드명 → 짧은 한글 뜻 */
const FIELD_BASE: [RegExp, string][] = [
  [/^Flow ID$/i, "플로우 식별자"],
  [/^Src IP$/i, "출발지 IP"],
  [/^Dst IP$/i, "목적지 IP"],
  [/^Src Port$/i, "출발지 포트"],
  [/^Dst Port$/i, "목적지 포트"],
  [/^Protocol$/i, "프로토콜 번호"],
  [/^Timestamp$/i, "관측 시각"],
  [/^Flow Duration$/i, "플로우 지속시간"],
  [/^Flow Byts\/s$/i, "초당 전송 바이트"],
  [/^Flow Pkts\/s$/i, "초당 전송 패킷"],
  [/^Down\/Up Ratio$/i, "다운로드 대비 업로드 비율"],
  [/^Pkt Size Avg$/i, "평균 패킷 크기"],
  [/CWE Flag/i, "CWE 플래그 횟수"],
];
const STAT: Record<string, string> = {
  Max: "최대", Min: "최소", Mean: "평균", Std: "표준편차", Tot: "합계", Var: "분산", Avg: "평균",
};

export function fieldKo(k: string): string {
  for (const [re, ko] of FIELD_BASE) if (re.test(k)) return ko;
  const dir = /^Fwd|^Subflow Fwd|Fwd /.test(k) && !/^Bwd/.test(k) ? "정방향 " : /Bwd/.test(k) ? "역방향 " : "";
  const stat = Object.keys(STAT).find((x) => new RegExp(`(^|\\s)${x}$`).test(k));
  const st = stat ? ` ${STAT[stat]}` : "";
  if (/IAT/.test(k)) return `${dir || "전체 "}패킷 도착 간격${st}`;
  if (/TotLen/.test(k)) return `${dir}총 전송 바이트`;
  if (/Header Len/.test(k)) return `${dir}헤더 길이`;
  if (/Pkt Len/.test(k)) return `${dir || "전체 "}패킷 길이${st}`;
  if (/Pkts\/s/.test(k)) return `${dir}초당 패킷`;
  if (/Byts\/b/.test(k)) return `${dir}벌크당 바이트`;
  if (/Pkts\/b/.test(k)) return `${dir}벌크당 패킷`;
  if (/Blk Rate/.test(k)) return `${dir}벌크 전송률`;
  if (/Seg Size Min/.test(k)) return `${dir}최소 세그먼트 크기`;
  if (/Seg Size/.test(k)) return `${dir}평균 세그먼트 크기`;
  if (/Act Data Pkts/.test(k)) return `${dir}데이터 포함 패킷 수`;
  if (/Init .*Win/.test(k)) return `${dir}초기 수신 윈도 크기`;
  if (/Subflow.*Byts/.test(k)) return `${dir}서브플로우 바이트`;
  if (/Subflow.*Pkts/.test(k)) return `${dir}서브플로우 패킷 수`;
  if (/PSH Flags/.test(k)) return `${dir}PSH 플래그 수`;
  if (/URG Flags/.test(k)) return `${dir}URG 플래그 수`;
  if (/Flag Cnt|Flag Count/.test(k)) {
    const m = k.match(/^(\w+) Flag/);
    return `${m ? m[1] + " " : ""}플래그 횟수`;
  }
  if (/^Tot .*Pkts/.test(k)) return `${dir}패킷 수`;
  if (/Active/.test(k)) return `활동 구간${st}`;
  if (/Idle/.test(k)) return `유휴 구간${st}`;
  return "";
}
