/** 한 번의 분석 실행에 붙는 곁들이 정보.
 *
 *  플로우 통계 CSV 안에는 이 데이터가 어느 장비에서 어느 지점을 통해 떠진 것인지가
 *  들어 있지 않다. 실제 배치에서는 수집기가 그 값을 함께 넘겨 주지만
 *  파일 업로드로 시작하는 지금 구조에서는 화면에서 골라 붙이는 수밖에 없다.
 *  값을 지어내지 않도록 시연용 구성에는 demo 표시를 달아 화면에서 그대로 밝힌다.
 *
 *  분석 소요 시간은 브라우저가 직접 잰다. 업로드를 보낸 순간부터 결과를 받은 순간까지라
 *  사람이 실제로 기다린 시간과 같다. 서버가 내려주는 추론 시간과는 재는 구간이 다르다. */

export interface CapturePoint {
  key: string;
  label: string;
  /** 데이터가 뜬 장비 */
  device: string;
  /** 그 장비가 트래픽을 끌어오는 지점 */
  endpoint: string;
  /** 어느 구간을 보고 있는지 */
  segment: string;
  /** 실제 수집이 아니라 시연을 위해 설정한 값인지 */
  demo: boolean;
}

export const CAPTURE_POINTS: CapturePoint[] = [
  {
    key: "span",
    label: "미러 포트 수집",
    device: "sensor-dmz-01",
    endpoint: "SPAN 미러 포트",
    segment: "DMZ 와 내부망 경계",
    demo: true,
  },
  {
    key: "tap",
    label: "네트워크 TAP 수집",
    device: "sensor-core-02",
    endpoint: "네트워크 TAP",
    segment: "코어 스위치 구간",
    demo: true,
  },
  {
    key: "netflow",
    label: "NetFlow 수집",
    device: "collector-01",
    endpoint: "NetFlow 익스포터",
    segment: "경계 라우터",
    demo: true,
  },
  {
    key: "upload",
    label: "직접 업로드",
    device: "직접 업로드",
    endpoint: "파일 업로드",
    segment: "지정 없음",
    demo: false,
  },
];

export function capturePoint(key: string | undefined): CapturePoint {
  return CAPTURE_POINTS.find((p) => p.key === key) ?? CAPTURE_POINTS[0];
}

export interface RunMeta {
  /** 업로드를 보낸 순간부터 결과를 받은 순간까지 (밀리초) */
  wallMs: number;
  /** 고른 수집 지점 키 */
  point: string;
  /** 분석을 시작한 시각 */
  startedAt: string;
}

/* sessionStorage 는 새로고침이나 새 탭에서 사라진다.
   시연 도중 화면을 다시 불러오면 수집 지점 표시가 통째로 날아가므로 localStorage 를 쓴다. */
const KEY = (uploadId: string) => `zc-run-${uploadId}`;
const LAST = "zc-capture-point";

/** 마지막으로 고른 수집 지점. 매번 직접 업로드로 되돌아가지 않게 기억해 둔다. */
export function lastPoint(): string {
  try {
    return localStorage.getItem(LAST) ?? CAPTURE_POINTS[0].key;
  } catch {
    return CAPTURE_POINTS[0].key;
  }
}
export function rememberPoint(key: string) {
  try {
    localStorage.setItem(LAST, key);
  } catch {
    /* noop */
  }
}

export function saveRun(uploadId: string, m: RunMeta) {
  try {
    localStorage.setItem(KEY(uploadId), JSON.stringify(m));
  } catch {
    /* 저장이 막혀 있어도 분석 자체는 끝난 뒤라 무시한다 */
  }
}

export function loadRun(uploadId: string): RunMeta | null {
  try {
    const raw = localStorage.getItem(KEY(uploadId));
    return raw ? (JSON.parse(raw) as RunMeta) : null;
  } catch {
    return null;
  }
}

/** 3400 → "3.4초", 820 → "0.82초" */
export function fmtSec(ms: number): string {
  const s = ms / 1000;
  return `${s >= 10 ? s.toFixed(1) : s.toFixed(2)}초`;
}
