/* ── 단계별 미니 비주얼 ── */
import { Flow } from "../components/Sentences";

/* 01 수집: 패킷 구조 (헤더는 읽고 페이로드는 잠긴 채로) */
function VizHeader() {
  return (
    <svg className="tp-viz" viewBox="0 0 360 220" fill="none" aria-hidden="true">
      {/* 패킷 프레임 */}
      <rect x="14" y="52" width="238" height="70" rx="10" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
      {/* 헤더부 */}
      <rect x="15" y="53" width="120" height="68" rx="9" fill="currentColor" fillOpacity="0.13" />
      <line x1="55" y1="53" x2="55" y2="121" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <line x1="95" y1="53" x2="95" y2="121" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <text x="35" y="83" textAnchor="middle" className="tp-viz-s ink">IP</text>
      <text x="75" y="83" textAnchor="middle" className="tp-viz-s ink">TCP</text>
      <text x="115" y="83" textAnchor="middle" className="tp-viz-s ink">TLS</text>
      <text x="75" y="105" textAnchor="middle" className="tp-viz-xs">HEADER</text>
      {/* 페이로드부 (잠김) */}
      <rect x="137" y="55" width="113" height="64" rx="8" fill="#eef2f8" />
      <g className="tp-blur" fill="#c6d0e2">
        <rect x="149" y="66" width="40" height="7" rx="3.5" />
        <rect x="195" y="66" width="26" height="7" rx="3.5" />
        <rect x="149" y="80" width="22" height="7" rx="3.5" />
        <rect x="177" y="80" width="44" height="7" rx="3.5" />
        <rect x="149" y="94" width="36" height="7" rx="3.5" />
        <rect x="191" y="94" width="30" height="7" rx="3.5" />
      </g>
      <g className="tp-lock">
        <rect x="176" y="76" width="36" height="27" rx="6" fill="#5b6880" />
        <path d="M184 76 v-8 a10 10 0 0 1 20 0 v8" stroke="#5b6880" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="194" cy="89" r="3.5" fill="#fff" />
      </g>
      <text x="193" y="136" textAnchor="middle" className="tp-viz-xs muted">PAYLOAD 복호화 안 함</text>
      {/* 헤더에서만 추출 */}
      <path className="tp-flow" d="M75 128 v34 h96" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 7" />
      <path d="M166 155 l9 7 -9 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="180" y="140" width="166" height="46" rx="10" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
      <text x="196" y="160" className="tp-viz-xs">FLOW STATS</text>
      <g fill="currentColor">
        <rect x="196" y="168" width="42" height="8" rx="4" fillOpacity="0.55" />
        <rect x="244" y="168" width="30" height="8" rx="4" fillOpacity="0.35" />
        <rect x="280" y="168" width="48" height="8" rx="4" fillOpacity="0.45" />
      </g>
      <g className="tp-blink">
        <circle cx="330" cy="155" r="5" fill="#0f9d7a" />
      </g>
    </svg>
  );
}

/* 02 선별: RF 중요도 ∩ MI 상호정보량 = 합의 피처 */
function VizSelect() {
  const rf = [86, 62, 40, 74, 28, 55];
  const mi = [70, 44, 82, 36, 60, 24];
  const keep = [0, 2, 3];
  return (
    <svg className="tp-viz" viewBox="0 0 360 220" fill="none" aria-hidden="true">
      {/* RF 패널 */}
      <rect x="10" y="26" width="108" height="126" rx="11" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
      <text x="64" y="46" textAnchor="middle" className="tp-viz-s ink">Random Forest</text>
      <text x="64" y="60" textAnchor="middle" className="tp-viz-xs ink">중요도</text>
      {rf.map((w, i) => (
        <rect key={i} className={keep.includes(i) ? "tp-bar keep" : "tp-bar"} x="24" y={70 + i * 13} width={w * 0.9} height="8" rx="4"
          fill="currentColor" fillOpacity={keep.includes(i) ? 0.8 : 0.18} />
      ))}
      {/* MI 패널 */}
      <rect x="242" y="26" width="108" height="126" rx="11" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
      <text x="296" y="46" textAnchor="middle" className="tp-viz-s ink">Mutual Info</text>
      <text x="296" y="60" textAnchor="middle" className="tp-viz-xs ink">상호정보량</text>
      {mi.map((w, i) => (
        <rect key={i} className={keep.includes(i) ? "tp-bar keep" : "tp-bar"} x={336 - w * 0.9} y={70 + i * 13} width={w * 0.9} height="8" rx="4"
          fill="currentColor" fillOpacity={keep.includes(i) ? 0.8 : 0.18} />
      ))}
      {/* 교집합 */}
      <circle className="tp-venn" cx="152" cy="92" r="46" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
      <circle className="tp-venn d2" cx="208" cy="92" r="46" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
      <path d="M180 51 a46 46 0 0 0 0 82 a46 46 0 0 0 0 -82 Z" fill="currentColor" fillOpacity="0.34" />
      <text x="180" y="88" textAnchor="middle" className="tp-viz-s">합의</text>
      <text x="180" y="104" textAnchor="middle" className="tp-viz-xs">피처</text>
      <path className="tp-flow" d="M180 146 v26" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 7" />
      <g fill="currentColor">
        <rect x="120" y="180" width="34" height="20" rx="10" fillOpacity="0.75" />
        <rect x="160" y="180" width="34" height="20" rx="10" fillOpacity="0.6" />
        <rect x="200" y="180" width="34" height="20" rx="10" fillOpacity="0.45" />
      </g>
    </svg>
  );
}

/* 03 인코딩: CSV 표 → GAF/MTF 관계 행렬 이미지 (viridis) */
const VIRIDIS = ["#440154", "#414487", "#2a788e", "#22a884", "#7ad151", "#fde725"];
function VizEncode() {
  const cells: { r: number; c: number; v: number }[] = [];
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++) cells.push({ r, c, v: (r * 2 + c * 3 + ((r * c) % 5)) % 6 });
  return (
    <svg className="tp-viz" viewBox="0 0 360 220" fill="none" aria-hidden="true">
      {/* 스프레드시트 */}
      <rect x="10" y="42" width="150" height="132" rx="10" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
      <rect x="11" y="43" width="148" height="22" rx="9" fill="#0f9d7a" fillOpacity="0.15" />
      <text x="26" y="59" className="tp-viz-xs green">A</text>
      <text x="62" y="59" className="tp-viz-xs green">B</text>
      <text x="98" y="59" className="tp-viz-xs green">C</text>
      <text x="134" y="59" className="tp-viz-xs green">D</text>
      <g stroke="#e2e8f3" strokeWidth="1.5">
        <line x1="11" y1="87" x2="159" y2="87" /><line x1="11" y1="109" x2="159" y2="109" />
        <line x1="11" y1="131" x2="159" y2="131" /><line x1="11" y1="153" x2="159" y2="153" />
        <line x1="46" y1="43" x2="46" y2="173" /><line x1="82" y1="43" x2="82" y2="173" />
        <line x1="118" y1="43" x2="118" y2="173" />
      </g>
      <g className="tp-nums" fill="#8894ab">
        <rect x="19" y="73" width="20" height="7" rx="3.5" /><rect x="55" y="73" width="16" height="7" rx="3.5" />
        <rect x="91" y="73" width="20" height="7" rx="3.5" /><rect x="127" y="73" width="14" height="7" rx="3.5" />
        <rect x="19" y="95" width="16" height="7" rx="3.5" /><rect x="55" y="95" width="20" height="7" rx="3.5" />
        <rect x="91" y="95" width="14" height="7" rx="3.5" /><rect x="127" y="95" width="20" height="7" rx="3.5" />
        <rect x="19" y="117" width="20" height="7" rx="3.5" /><rect x="55" y="117" width="14" height="7" rx="3.5" />
        <rect x="91" y="117" width="18" height="7" rx="3.5" /><rect x="127" y="117" width="16" height="7" rx="3.5" />
        <rect x="19" y="139" width="14" height="7" rx="3.5" /><rect x="55" y="139" width="18" height="7" rx="3.5" />
        <rect x="91" y="139" width="20" height="7" rx="3.5" /><rect x="127" y="139" width="14" height="7" rx="3.5" />
        <rect x="19" y="161" width="18" height="7" rx="3.5" /><rect x="55" y="161" width="16" height="7" rx="3.5" />
        <rect x="91" y="161" width="14" height="7" rx="3.5" /><rect x="127" y="161" width="20" height="7" rx="3.5" />
      </g>
      <text x="85" y="192" textAnchor="middle" className="tp-viz-xs muted">플로우 통계 CSV</text>
      {/* 변환 */}
      <path className="tp-flow" d="M170 108 h22" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 7" />
      <rect x="150" y="14" width="66" height="22" rx="11" fill="currentColor" fillOpacity="0.12" />
      <text x="183" y="30" textAnchor="middle" className="tp-viz-xs">수학적 변환</text>
      <path d="M188 101 l9 7 -9 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* 관계 행렬 이미지 */}
      <rect x="200" y="42" width="150" height="132" rx="10" fill="#1b1130" stroke="#c6d0e2" strokeWidth="2" />
      <g className="tp-grid" transform="translate(210, 52)">
        {cells.map((c, i) => (
          <rect key={i} x={c.c * 22} y={c.r * 19} width="21" height="18" fill={VIRIDIS[c.v]} />
        ))}
      </g>
      <text x="275" y="192" textAnchor="middle" className="tp-viz-xs muted">관계 행렬 이미지</text>
    </svg>
  );
}

/* 04 판별: CNN 합성곱 스택 → 클래스 확률 */
function VizCnn() {
  return (
    <svg className="tp-viz" viewBox="0 0 360 220" fill="none" aria-hidden="true">
      {/* 입력 이미지 */}
      <g>
        <rect x="12" y="66" width="72" height="72" rx="6" fill="#1b1130" stroke="#c6d0e2" strokeWidth="2" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}-${c}`} x={14 + c * 17.5} y={68 + r * 17.5} width="17" height="17" fill={VIRIDIS[(r * 2 + c * 3) % 6]} />
          ))
        )}
        <rect className="tp-kernel" x="14" y="68" width="35" height="35" fill="none" stroke="#fff" strokeWidth="2.5" />
        <text x="48" y="154" textAnchor="middle" className="tp-viz-xs muted">입력</text>
      </g>
      {/* 합성곱 스택 */}
      <path className="tp-flow" d="M92 102 h16" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6" />
      {[0, 1, 2].map((k) => (
        <g key={k} transform={`translate(${116 + k * 46}, 0)`}>
          <rect x="10" y={78 - k * 3} width="26" height={48 + k * 6} rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="4" y={72 - k * 3} width="26" height={48 + k * 6} rx="4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
          <rect className="tp-conv" x="-2" y={66 - k * 3} width="26" height={48 + k * 6} rx="4" fill="currentColor" fillOpacity={0.3 + k * 0.12} stroke="currentColor" strokeWidth="1.8" />
        </g>
      ))}
      <text x="180" y="154" textAnchor="middle" className="tp-viz-xs muted">합성곱 · 풀링</text>
      <path className="tp-flow d2" d="M252 102 h16" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6" />
      {/* 클래스 확률 */}
      <g>
        <rect x="272" y="52" width="78" height="100" rx="10" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
        <text x="284" y="70" className="tp-viz-xs">클래스 확률</text>
        <rect className="tp-prob" x="284" y="80" width="54" height="12" rx="6" fill="#dc2626" />
        <text x="343" y="90" textAnchor="end" className="tp-viz-xs alert" />
        <rect className="tp-prob p2" x="284" y="99" width="30" height="12" rx="6" fill="currentColor" fillOpacity="0.4" />
        <rect className="tp-prob p3" x="284" y="118" width="18" height="12" rx="6" fill="currentColor" fillOpacity="0.25" />
        <rect x="284" y="137" width="10" height="12" rx="6" fill="currentColor" fillOpacity="0.15" />
      </g>
      <text x="311" y="172" textAnchor="middle" className="tp-viz-xs alert">공격 유형별 확률</text>
    </svg>
  );
}

/* 05 설명: Grad-CAM (회색 인코딩 + jet 오버레이 + 피처쌍 대응) */
function VizCam() {
  const grid: { r: number; c: number; g: number }[] = [];
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++) grid.push({ r, c, g: 0.12 + (((r * 3 + c * 5) % 6) / 6) * 0.5 });
  const HOT = [
    { r: 2, c: 3, f: "#dc2626" },
    { r: 2, c: 2, f: "#f97316" },
    { r: 3, c: 3, f: "#f97316" },
    { r: 1, c: 3, f: "#facc15" },
    { r: 3, c: 2, f: "#facc15" },
    { r: 2, c: 4, f: "#facc15" },
  ];
  return (
    <svg className="tp-viz" viewBox="0 0 360 220" fill="none" aria-hidden="true">
      {/* 히트맵 */}
      <rect x="12" y="34" width="152" height="152" rx="10" fill="#2a2a2a" stroke="#c6d0e2" strokeWidth="2" />
      <g transform="translate(20, 42)">
        {grid.map((c, i) => (
          <rect key={i} x={c.c * 23} y={c.r * 23} width="22" height="22" fill="#fff" fillOpacity={c.g} />
        ))}
        <g className="tp-cam">
          {HOT.map((h, i) => (
            <rect key={i} x={h.c * 23} y={h.r * 23} width="22" height="22" fill={h.f} fillOpacity="0.75" />
          ))}
        </g>
        {/* 행/열 하이라이트 */}
        <rect className="tp-hl" x="0" y={2 * 23} width="138" height="22" fill="none" stroke="#fff" strokeWidth="2" />
        <rect className="tp-hl" x={3 * 23} y="0" width="22" height="138" fill="none" stroke="#fff" strokeWidth="2" />
      </g>
      <text x="88" y="202" textAnchor="middle" className="tp-viz-xs muted">Grad-CAM 오버레이</text>
      {/* 대응된 피처쌍 */}
      <path className="tp-flow" d="M172 108 h22" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 7" />
      <path d="M190 101 l9 7 -9 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="204" y="44" width="146" height="132" rx="10" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
      <text x="218" y="64" className="tp-viz-xs">Top 5 피처쌍</text>
      {[
        { w: 112, o: 0.85, hot: true },
        { w: 92, o: 0.6 },
        { w: 76, o: 0.45 },
        { w: 60, o: 0.32 },
        { w: 46, o: 0.2 },
      ].map((b, i) => (
        <g key={i}>
          <rect x="218" y={76 + i * 19} width="112" height="12" rx="6" fill="#eef2f8" />
          <rect className={`tp-prob ${i ? "p" + (i + 1) : ""}`} x="218" y={76 + i * 19} width={b.w} height="12" rx="6"
            fill={b.hot ? "#dc2626" : "currentColor"} fillOpacity={b.hot ? 1 : b.o} />
        </g>
      ))}
      <text x="277" y="202" textAnchor="middle" className="tp-viz-xs muted">판단 근거 되돌리기</text>
    </svg>
  );
}

/* ── 파이프라인 5단계 ── */
const PIPELINE = [
  { t: "플로우 통계 CSV", c: "헤더와 타이밍만", lv: 1 },
  { t: "피처 선별", c: "RF와 MI 합의", lv: 1 },
  { t: "이미지 인코딩", c: "관계 행렬로 변환", lv: 2 },
  { t: "CNN 판별", c: "공격 유형 다중 분류", lv: 3 },
  { t: "XAI 근거 제시", c: "Grad-CAM 피처쌍 히트맵", lv: 3 },
];

/* ── 상세 단계 ── */
const STEPS = [
  {
    n: "01",
    tag: "수집",
    title: "패킷에서 헤더만 떼어 플로우 통계로",
    body: (
      <>
        암호화된 트래픽이라도 패킷 도착 간격과 패킷 크기 분포, 세션 지속 시간과 방향성 같은{" "}
        <b>행위의 흔적</b>은 지울 수 없습니다. CICFlowMeter가 이 평문 관측 요소들을 플로우당 통계
        피처로 집계한 것이 입력 CSV입니다. IP와 호스트명 같은 직접 식별자는 배제한 통계량만
        사용합니다.
      </>
    ),
    viz: <VizHeader />,
  },
  {
    n: "02",
    tag: "선별",
    title: "핵심 행위 특징만 선별",
    body: (
      <>
        44개 피처에 랜덤 포레스트 중요도와 상호정보량이라는 서로 다른 원리의 두 기준을 결합한
        랭킹을 적용해 두 기준이 합의한 핵심 행위 특징만 남깁니다.
      </>
    ),
    viz: <VizSelect />,
  },
  {
    n: "03",
    tag: "인코딩",
    title: "숫자 나열을 관계 행렬 이미지로",
    body: (
      <>
        선별된 피처 벡터를 수학적 변환 기법으로 2차원 행렬에 담습니다. 행렬의 (i, j) 성분이 i번째와
        j번째 피처의 <b>관계</b>를 인코딩하므로 결과 이미지는 값의 나열이 아니라{" "}
        <b>피처 간 상호작용 구조</b>를 명시적으로 배치한 관계 행렬입니다. 서로 다른 변환이 포착하는
        상호보완적 관계를 다채널로 합성하며 이미지는 저장하지 않고 추론 시점에 실시간
        변환됩니다.
      </>
    ),
    viz: <VizEncode />,
  },
  {
    n: "04",
    tag: "판별",
    title: "CNN이 텍스처로 공격 유형을 가려냅니다",
    body: (
      <>
        CNN이 합성 이미지에서 공격 고유의 시각적 텍스처를 학습해 정상 트래픽과 여러 공격 유형을
        구분하고 각 유형의 확률을 함께 내놓습니다. 패턴이 단순한 단일 공격 탐지에서는 트리 모델과
        비슷하지만 여러 공격이 뒤섞여 피처 간 상호작용이 풍부해질수록 격차가 벌어집니다. 반복 평가
        전체에서 트리 모델보다 일관되게 앞섰습니다.
      </>
    ),
    viz: <VizCnn />,
  },
  {
    n: "05",
    tag: "XAI",
    title: "설명가능 AI(XAI)가 판단 근거를 제시",
    body: (
      <>
        Grad-CAM 히트맵이 판정에 기여한 영역을 표시하고 히트맵 셀을 피처쌍으로 되돌리는 대응을
        알고리즘으로 명시해 <b>피처쌍 수준의 판단 근거</b>를 제시합니다. 개별 피처의 기여도를 주는
        SHAP과 달리 쌍별 관계를 표현 자체에 배치하므로 SHAP을 대체하는 것이 아니라 보완하는 설명
        양식입니다. 이 근거는 관제 요원의 오탐 검증 시간을 줄이고 차단 결정의 감사 기록이 됩니다.
      </>
    ),
    viz: <VizCam />,
  },
];


export default function TheoryPage() {
  return (
    <div className="tp">
      {/* ── 히어로 ── */}
      <section className="tp-hero">
        <span className="tp-eyebrow">HOW IT WORKS</span>
        <h1>
          복호화 없이
          <br />
          판별하고 설명합니다
        </h1>
        <p className="tp-lead"><Flow>
          제로-클라는 <b>페이로드를 복호화하지 않습니다.</b> 헤더 필드와 관측
          타이밍에서 얻은 플로우 통계만으로 악성 트래픽을 판별하고 왜 그렇게 판단했는지 히트맵으로
          설명합니다. 복호화가 필요 없으므로 암호화 여부와 무관하게 동작하고 통신 내용을 침해할
          능력 자체가 설계상 존재하지 않습니다.
        </Flow></p>
        <div className="tp-flowviz">
          <svg viewBox="0 0 900 150" fill="none" aria-hidden="true">
            {/* 봉투 (암호화된 트래픽) */}
            <g>
              <rect x="14" y="38" width="150" height="92" rx="12" fill="#fff" stroke="#c6d0e2" strokeWidth="2.5" />
              <path d="M14 50 L89 96 L164 50" stroke="#c6d0e2" strokeWidth="2.5" fill="none" />
              <g className="tp-lock2">
                <rect x="74" y="74" width="32" height="24" rx="6" fill="#5b6880" />
                <path d="M81 74 v-7 a9 9 0 0 1 18 0 v7" stroke="#5b6880" strokeWidth="4" strokeLinecap="round" />
              </g>
              <text x="89" y="24" textAnchor="middle" className="tp-fv-t">암호화된 트래픽</text>
            </g>
            <path className="tp-flow" d="M176 84 h58" stroke="currentColor" strokeWidth="3" strokeDasharray="7 8" />
            <path d="M230 77 l9 7 -9 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* 헤더만 읽음 — 패킷 하나가 어떻게 생겼는지 그대로 보여준다 */}
            <g>
              <rect x="250" y="38" width="170" height="92" rx="12" fill="#fff" stroke="#c6d0e2" strokeWidth="2.5" />
              <text x="335" y="24" textAnchor="middle" className="tp-fv-t">헤더만 읽습니다</text>

              <g transform="translate(262, 60)">
                <rect x="0" y="0" width="40" height="30" rx="4" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.6" />
                <rect x="43" y="0" width="40" height="30" rx="4" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.6" />
                <rect x="86" y="0" width="60" height="30" rx="4" fill="#eef1f7" stroke="#c6d0e2" strokeWidth="1.6" />
                <text x="20" y="19" textAnchor="middle" className="tp-fv-s">IP</text>
                <text x="63" y="19" textAnchor="middle" className="tp-fv-s">TCP</text>
                <text x="122" y="19" textAnchor="middle" className="tp-fv-s dim">페이로드</text>
                <g transform="translate(92, 8)">
                  <rect x="0" y="6" width="11" height="8" rx="2" fill="#8d97a3" />
                  <path d="M2.4 6 v-2.4 a3.1 3.1 0 0 1 6.2 0 V6" stroke="#8d97a3" strokeWidth="1.6" fill="none" />
                </g>
              </g>

              <rect
                className="tp-fv-mark"
                x="256" y="54" width="92" height="42" rx="9"
                fill="none" stroke="var(--focus)" strokeWidth="2.4" strokeDasharray="6 5"
              />
              <text x="302" y="120" textAnchor="middle" className="tp-fv-s hi">여기만 봅니다</text>
              <text x="335" y="146" textAnchor="middle" className="tp-fv-c">헤더 필드와 오간 시각</text>
            </g>
            <path className="tp-flow d2" d="M432 84 h58" stroke="currentColor" strokeWidth="3" strokeDasharray="7 8" />
            <path d="M486 77 l9 7 -9 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* 그림으로 바꿔 판별 */}
            <g>
              <rect x="506" y="38" width="150" height="92" rx="12" fill="#1b1130" stroke="#c6d0e2" strokeWidth="2.5" />
              <g className="tp-grid" transform="translate(520, 50)">
                {Array.from({ length: 16 }).map((_, i) => (
                  <rect key={i} x={(i % 4) * 31} y={Math.floor(i / 4) * 17} width="29" height="15" fill={VIRIDIS[(i * 3 + Math.floor(i / 4)) % 6]} />
                ))}
              </g>
              <text x="581" y="24" textAnchor="middle" className="tp-fv-t">그림으로 변환</text>
              <text x="581" y="146" textAnchor="middle" className="tp-fv-c">숫자 사이의 관계</text>
            </g>
            <path className="tp-flow d3" d="M668 84 h58" stroke="currentColor" strokeWidth="3" strokeDasharray="7 8" />
            <path d="M722 77 l9 7 -9 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* 판정과 근거 */}
            <g>
              <rect x="742" y="38" width="146" height="92" rx="12" fill="#fff" stroke="#c6d0e2" strokeWidth="2.5" />
              <rect className="tp-prob" x="758" y="56" width="98" height="13" rx="6.5" fill="#dc2626" />
              <rect className="tp-prob p2" x="758" y="77" width="62" height="13" rx="6.5" fill="currentColor" fillOpacity="0.4" />
              <rect className="tp-prob p3" x="758" y="98" width="38" height="13" rx="6.5" fill="currentColor" fillOpacity="0.24" />
              <text x="815" y="24" textAnchor="middle" className="tp-fv-t">판정과 근거</text>
              <text x="815" y="146" textAnchor="middle" className="tp-fv-c">유형과 확률, 판단 이유</text>
            </g>
          </svg>
        </div>
      </section>

      {/* ── 파이프라인 ── */}
      <section className="tp-pipe-sec">
        <div className="tp-sec-head">
          <span className="tp-eyebrow">PIPELINE</span>
          <h2>다섯 단계로 흐르는 판별 과정</h2>
        </div>
        <p className="tp-pipe-note"><Flow>
          진하게 표시된 뒤쪽 세 단계가 제로-클라의 핵심입니다. 앞의 두 단계는 준비 과정입니다.
        </Flow></p>
        <ol className="tp-pipe">
          {PIPELINE.map((p, i) => (
            <li key={p.t} className={`tp-node lv${p.lv}`}>
              <span className="tp-node-n">{String(i + 1).padStart(2, "0")}</span>
              <b>{p.t}</b>
              <span className="tp-node-c">{p.c}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 상세 단계 ── */}
      <div className="tp-steps">
        {STEPS.map((s, i) => (
          <section key={s.n} className={`tp-step ${i % 2 === 1 ? "rev" : ""}`}>
            <div className="tp-step-inner">
              <div className="tp-step-copy">
                <div className="tp-step-head">
                  <span className="tp-step-n">{s.n}</span>
                  <span className="tp-step-tag">{s.tag}</span>
                </div>
                <h3>{s.title}</h3>
                <p><Flow>{s.body}</Flow></p>
              </div>
              <div className="tp-step-viz">{s.viz}</div>
            </div>
          </section>
        ))}
      </div>

    </div>
  );
}
