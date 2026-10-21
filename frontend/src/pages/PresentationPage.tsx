import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Flow } from "../components/Sentences";
import { BrandMark } from "../components/Brand";
import imgGoogle from "../assets/news/us_google.png";
import imgMeta from "../assets/news/us_meta.png";
import imgTmobile from "../assets/news/us_tmobile.png";
import imgMarriott from "../assets/news/us_marriott.png";
import logoDku from "../assets/logos/dku.png";
import logoCsrc from "../assets/logos/csrc.png";

/**
 * 발표 자료 (/#/pt)
 * 01 국내 사고 → 02 미국 제재 → 03 시장 규모 → 04 기존 플레이어 → 05 빈칸 → 06 제로-클라 → 07 매출 전망
 * 수치는 원출처로 검증한 값만 사용한다. 매출 가정값은 ASSUME 한 곳에서 관리한다.
 */

/* 공식 서비스 제목 */
/* 신청서에 낸 공식 제목 — 표지에 이 문장 그대로 올린다 */
/* 멘토 피드백: 제목을 줄이고 기술 용어로 격을 올린다 (Inspection, Re-imaging) */
const TITLE_HEAD = "ZERO-CLA";
const TITLE_TAIL = "Header Inspection과 Flow Re-imaging 기반 XAI 탐지 엔진";
const TITLE_FULL = (
  <>
    {TITLE_HEAD}
    <span className="cv-colon">:</span>
    <span className="cv-title-tail">{TITLE_TAIL}</span>
  </>
);

/* 한눈에 보는 판별 절차 */
const PIPELINE = [
  { n: "01", t: "플로우 통계 수집", c: "헤더와 오간 시각만" },
  { n: "02", t: "핵심 특징 선별", c: "44개 중 의미 있는 것만" },
  { n: "03", t: "이미지로 변환", c: "숫자를 관계 그림으로" },
  { n: "04", t: "CNN 판별", c: "공격 유형과 확률" },
  { n: "05", t: "근거 제시", c: "어디를 보고 판단했는지" },
];

/* ── 국내 사고 (검색 결과 캡처 + 확정 수치) ── */
const KR_CASES = [
  {
    org: "C사", kind: "국내 대형 이커머스",
    img: "/news/coupang.png?v=32",
    people: "3,755만 명",
    peopleCap: "유출된 개인정보",
    fine: "6,246억 8,100만 원",
    fineCap: "역대 최대 과징금",
    extra: "과태료 1,680만 원",
    src: "개인정보보호위원회 제11회 전체회의 의결, 2026.06.11",
  },
  {
    org: "S사", kind: "국내 통신 대기업",
    img: "/news/skt.png?v=32",
    people: "2,324만 명",
    peopleCap: "유심 정보 등 25종 유출",
    fine: "1,347억 9,100만 원",
    fineCap: "당시 역대 최대 과징금",
    extra: "매출 3% 기준 산정",
    src: "개인정보보호위원회 제18회 전체회의, 2025.08.28",
  },
  {
    org: "L사", kind: "국내 카드사",
    img: "/news/lottecard.png?v=32",
    people: "297만 명",
    peopleCap: "회원 개인정보 유출",
    fine: "영업정지 1.5개월",
    fineCap: "카드사 최초 업무정지",
    extra: "과징금 50억 원",
    src: "금융위원회 제14차 회의 최종 의결, 2026.07.31",
  },
];

/* ── 미국 제재 (검색 결과 형식으로 재현) ── */
const US_CASES = [
  {
    org: "G사", kind: "세계 최대 검색 플랫폼", img: imgGoogle, amount: "13억 7,500만 달러", amountCap: "단일 주가 받아낸 사상 최대 합의금",
    extra: "위치 정보와 생체 정보를 동의 없이 수집한 혐의입니다",
    src: "텍사스 주 법무장관실 보도자료, 2025.05",
    results: [
      { site: "Attorney General (.gov)", fav: "TX", url: "texasattorneygeneral.gov › news › releases",
        t1: "Attorney General Ken Paxton secured a $1.375 billion ...", mask: "", t2: "",
        date: "2025. 5. 9.", s1: "Attorney General Ken Paxton secured a $1.375 billion settlement in principle with ", mask2: "Google",
        s2: ", delivering a historic win for Texans' data privacy ..." },
      { site: "Attorney General (.gov)", fav: "TX", url: "texasattorneygeneral.gov › news › releases",
        t1: "Attorney General Ken Paxton Finalizes Historic Settlement ...", mask: "", t2: "",
        date: "2025. 10. 31.", s1: "Attorney General Ken Paxton announced that ", mask2: "Google",
        s2: " has signed the historic $1.375 billion settlement agreement with the State of Texas ..." },
      { site: "Reuters", fav: "R", url: "reuters.com › technology › texas-says-it-se...",
        t1: "Texas secures $1.38 billion settlement with ", mask: "Google", t2: " over ...",
        date: "2025. 5. 9.", s1: "", mask2: "Google",
        s2: " has agreed to pay $1.375 billion in a settlement in principle reached with the state of Texas ..." },
    ],
  },
  {
    org: "M사", kind: "글로벌 소셜 플랫폼", img: imgMeta, amount: "14억 달러", amountCap: "단일 주 소송에서 나온 역대 최대 합의금",
    extra: "얼굴 인식용 생체 정보를 동의 없이 수집한 혐의입니다",
    src: "텍사스 주 법무장관실 보도자료, 2024.07",
    results: [
      { site: "Attorney General (.gov)", fav: "TX", url: "texasattorneygeneral.gov › news › releases",
        t1: "Attorney General Ken Paxton Secures $1.4 Billion ...", mask: "", t2: "",
        date: "2024. 7. 30.", s1: "Texas Attorney General Ken Paxton has secured a $1.4 billion settlement with ", mask2: "Meta",
        s2: " to stop the company's unauthorized capture of biometric data ..." },
      { site: "Reuters", fav: "R", url: "reuters.com › technology › cybersecurity",
        t1: "", mask: "Meta", t2: " to pay $1.4 billion to settle Texas facial recognition ...",
        date: "2024. 7. 31.", s1: "", mask2: "Meta",
        s2: " Platforms has agreed to pay $1.4 billion to Texas to resolve the state's lawsuit ..." },
      { site: "AP News", fav: "AP", url: "apnews.com › article › texas-attorney-general-m...",
        t1: "", mask: "Meta", t2: " agrees to $1.4B settlement with Texas over facial ...",
        date: "2024. 7. 30.", s1: "", mask2: "Meta",
        s2: " has agreed to pay $1.4 billion in a privacy lawsuit over claims that the tech giant used biometric data of users ..." },
    ],
  },
  {
    org: "T사", kind: "미국 대형 통신사", img: imgTmobile, amount: "8,000만 달러", amountCap: "연방통신위원회가 부과한 벌금",
    extra: "같은 조사에서 3,150만 달러 합의금이 별도로 더 붙었습니다",
    src: "미국 연방통신위원회 집행 문서, 2024.09",
    results: [
      { site: "Federal Communications Commission (.gov)", fav: "FCC", url: "fcc.gov › document › fcc-fines-t-mobile-80...",
        t1: "FCC Fines ", mask: "T-Mobile", t2: " $80M for Location Data Violations",
        date: "", s1: "FCC fines ", mask2: "T-Mobile",
        s2: " USA, Inc. over $80M for failing to reasonably protect its customers' location information." },
      { site: "Broadband Communities", fav: "BB", url: "bbcmag.com › t-mobile-hit-with-yet-another-fin...",
        t1: "", mask: "T-Mobile", t2: " hit with yet another fine over data breaches",
        date: "2024. 10. 2.", s1: "The company was also fined $80 million by the FCC in April for illegally sharing access to consumers' location data ...", mask2: "",
        s2: "" },
      { site: "The Record from Recorded Future News", fav: "R", url: "therecord.media › tmobile-agrees-to-pay-settlem...",
        t1: "", mask: "T-Mobile", t2: " agrees to pay $31.5 million to resolve FCC data ...",
        date: "2024. 9. 30.", s1: "The settlement resolves charges involving multiple data breaches that impacted millions of customers ... An $80 million fine was levied ...", mask2: "",
        s2: "" },
    ],
  },
  {
    org: "M사", kind: "글로벌 호텔 체인", img: imgMarriott, amount: "5,200만 달러", amountCap: "미국 여러 주가 함께 이끌어낸 합의금",
    extra: "3억 건이 넘는 투숙객 기록이 유출된 사고입니다",
    src: "미국 주 법무장관 연합 합의, 2024.10",
    results: [
      { site: "AP News", fav: "AP", url: "apnews.com › article › marriott-data-breach-settl...",
        t1: "", mask: "Marriott", t2: " agrees to pay $52 million, beef up data security ...",
        date: "2024. 10. 9.", s1: "", mask2: "Marriott",
        s2: " International has agreed to pay $52 million and make changes to bolster its data security to resolve state and federal claims ..." },
      { site: "New York Attorney General (.gov)", fav: "NY", url: "ag.ny.gov › press-release › attorney-general-jam...",
        t1: "", mask: "Marriott", t2: " Data Breach Affected Millions of New York Customers ...",
        date: "2024. 10. 9.", s1: "Attorney General James Announces $52 Million Multistate Settlement with ", mask2: "Marriott",
        s2: " over Data Breach ..." },
      { site: "KJK | Kohrman Jackson Krantz", fav: "KJ", url: "kjk.com › 2025/02/07 › marriott-settles-for-52m...",
        t1: "", mask: "Marriott", t2: " Settles for $52M & Enhances Data Protections ...",
        date: "2025. 2. 7.", s1: "", mask2: "Marriott",
        s2: " will pay $52 million and enhance data protections to settle investigations into 2015-2020 breaches." },
    ],
  },
];

/* 침해가 시작된 시점부터 탐지까지 — 공개 조사 결과 기준 */
const DWELL = [
  { org: "C사", from: "2025.06.24", to: "2025.11.18", days: 147, label: "약 5개월" },
  { org: "S사", from: "2021.08.06", to: "2025.04", days: 1339, label: "약 4년" },
  { org: "L사", from: "2025.08.12", to: "2025.08.26", days: 17, label: "약 17일" },
];

/* ── 시장 규모 ── */
const NDR_CAGR = 10.9;
/* 축은 2023년부터 2031년까지 — 지나온 구간과 앞으로의 구간을 함께 본다.
   두 기관의 조사가 겹치는 구간에서 방향이 같다는 점이 오히려 근거가 된다. */
const YEARS = ["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031"];
/* Valuates Reports — 2023년 24.9억 달러, 연평균 13.7%로 2029년 53.7억 달러 */
const NDR_PAST = [2.49, 2.83, 3.21, 3.65, 4.15, 4.72, 5.37, null, null];
/* MarketsandMarkets — 2026년 43.4억 달러, 연평균 10.9%로 2031년 72.9억 달러 */
const NDR_SERIES = [null, null, null, 4.34, 4.81, 5.34, 5.92, 6.57, 7.29];

const LEADERS = [
  { name: "Darktrace", country: "영국", note: "FY2024 매출 6.9억 달러 공개" },
  { name: "ExtraHop", country: "미국", note: "2021년 사모펀드가 9억 달러에 인수" },
  { name: "Vectra AI", country: "미국", note: "기업가치 12억 달러 평가 (2021)" },
];

/* 국내 참고: 쿼드마이너 (풀패킷 NDR, 코스닥 상장 추진) */
const QM_REV = [
  { y: "2022", v: 94 },
  { y: "2023", v: 104 },
  { y: "2024", v: 123 },
];

/* 유일하게 재무가 공개된 순수 NDR 기업 (Darktrace) */
const DT_REV = [
  { y: "FY2022", v: 415.5 },
  { y: "FY2023", v: 545.4 },
  { y: "FY2024", v: 687.5 },
];

/* 지역별 시장 비중 (2026) */
const REGION = [
  { name: "북미", pct: 42.1, note: "가장 큰 시장" },
  { name: "유럽", pct: 27.0, note: "규제 주도 성장" },
  { name: "아시아태평양", pct: 22.0, note: "성장률 1위", hot: true },
  { name: "기타", pct: 8.9, note: "" },
];

/* ── 1인당 매출 벤치마크 ──
   매출 목표가 과한지 아닌지를 성장 배수가 아니라 업계 실측으로 판정하기 위한 자료다.
   상장사 값은 각 사의 2025년 매출을 공개된 직원 수로 나눈 계산값이다. */
const PER_HEAD = [
  { name: "이글루코퍼레이션", v: 1.02, note: "보안관제 중심", src: "매출 1,183억 별도 기준 1,157명" },
  { name: "파이오링크", v: 1.59, note: "네트워크 장비", src: "매출 656억에 413명" },
  { name: "모니터랩", v: 1.78, note: "WAF 서비스형", src: "매출 192억에 108명" },
  { name: "윈스", v: 1.9, note: "IPS 제품", src: "매출 986억 연결 기준 519명" },
  { name: "안랩", v: 2.11, note: "제품과 서비스", src: "매출 2,677억 연결 기준 1,267명" },
  { name: "지니언스", v: 2.22, note: "NAC 라이선스", src: "매출 484억 연결 기준 218명" },
  { name: "국내 정보보안 부문 평균", v: 2.97, note: "산업 전체", avg: true, src: "7조 1,244억 ÷ 23,987명" },
  { name: "ZERO-CLA 2030년 계획", v: 2.9, note: "엔진 공급", us: true, src: "110억 ÷ 38명" },
  { name: "Darktrace", v: 4.02, note: "글로벌 NDR 선두", src: "FY2024 매출 6.9억 달러에 2,400명 이상" },
];

/* 보수 시나리오 — 고객 확보가 계획의 절반에 그쳤을 때 */
const CONSERVATIVE = { total: 55, perHead: 1.5 };

/* ── 부록 자료 ── */

/* 학습과 검증에 쓴 데이터 */
const DATASET_ROWS = [
  { name: "CSE-CIC-IDS2018", org: "캐나다 사이버보안연구소", st: "done", stKo: "검증 완료",
    what: "관제 콘솔이 판별하는 유형이 여기서 나왔습니다. 공격 트래픽은 실제 도구로 생성된 것입니다" },
  { name: "CIC-IDS2017", org: "캐나다 사이버보안연구소", st: "doing", stKo: "확장 실험 진행 중",
    what: "같은 절차에 다른 연도의 데이터를 넣어 클래스가 늘어도 구조가 유지되는지 봅니다" },
  { name: "UNSW-NB15", org: "호주 사이버보안센터", st: "next", stKo: "적용 예정",
    what: "분류 체계가 전혀 다른 데이터입니다. 여기서도 되면 특정 데이터셋에 종속되지 않는다는 근거가 됩니다" },
  { name: "CIC-DDoS2019", org: "캐나다 사이버보안연구소", st: "next", stKo: "적용 예정",
    what: "한 계열의 공격을 세분화한 데이터로 같은 무리 안에서의 구분 능력을 봅니다" },
  { name: "현장 실트래픽", org: "국내 기관과 기업", st: "next", stKo: "2027년 목표",
    what: "공개 데이터가 아닌 실제 트래픽입니다. 사업 1단계가 이 검증입니다" },
];

/* 가장 가까운 경쟁자와의 거리 — 값은 SEGMENTS 의 ○△✕ 와 같은 척도 */
const RIVALS = [
  { name: "Darktrace", v: [2, 0, 1], gap: "복호화는 안 하지만 어느 값을 보고 판단했는지 내놓지 않습니다" },
  { name: "Exeon", v: [2, 0, 1], gap: "플로우만 보는 점은 같고 설명과 이미지화 축이 없습니다" },
  { name: "ExtraHop RevealX", v: [0, 1, 0], gap: "복호화로 깊이는 얻지만 키 관리와 센서 장비가 따라옵니다" },
  { name: "쿼드마이너", v: [0, 1, 0], gap: "풀패킷을 저장해 되돌려 봅니다. 저장 비용이 구조에 들어 있습니다" },
  { name: "Suricata와 Zeek", v: [1, 1, 2], gap: "무료이고 가볍지만 암호화 앞에서 멈추고 판단은 사람이 합니다" },
  { name: "ZERO-CLA", v: [2, 2, 2], gap: "세 축을 동시에 두는 것이 저희가 잡은 자리입니다", us: true },
];


/* 매출 전망 3단계 */
const PLAN3 = [
  {
    key: "kr",
    label: "국내",
    unit: "억 원",
    desc: "관제 사업자와 보안 벤더에 탐지 엔진을 공급합니다",
    data: [
      { y: "2027", v: 1.6 },
      { y: "2028", v: 6.4 },
      { y: "2029", v: 16.0 },
      { y: "2030", v: 32.0 },
    ],
  },
  {
    key: "apac",
    label: "아시아태평양",
    unit: "만 달러",
    desc: "클라우드 마켓플레이스를 통해 역내 고객으로 넓힙니다",
    data: [
      { y: "2027", v: 0 },
      { y: "2028", v: 30 },
      { y: "2029", v: 120 },
      { y: "2030", v: 320 },
    ],
  },
  {
    key: "global",
    label: "전 세계",
    unit: "만 달러",
    desc: "글로벌 벤더에 엔진을 공급하는 형태로 진입합니다",
    data: [
      { y: "2027", v: 0 },
      { y: "2028", v: 0 },
      { y: "2029", v: 60 },
      { y: "2030", v: 240 },
    ],
  },
];

const SEGMENTS = [
  { tag: "A", title: "무복호화 AI", who: "Darktrace, Cisco, Vectra AI, Exeon",
    how: "메타데이터만으로 복호화 없이 이상 징후를 찾습니다.", limit: "판단 근거를 설명하지 못합니다", mock: "anomaly" },
  { tag: "B", title: "복호화 기반 상용", who: "ExtraHop, 쿼드마이너, 코닉글로리",
    how: "트래픽을 열거나 풀패킷을 저장해 내용을 직접 봅니다.", limit: "키 관리와 저장 비용, 프라이버시 부담", mock: "decrypt" },
  { tag: "C", title: "오픈소스", who: "Suricata, Zeek, Arkime, Malcolm",
    how: "룰과 시그니처로 걸러내고 최종 판단은 사람이 합니다.", limit: "암호화 앞에서 멈춥니다", mock: "rules" },
];

/* 각 계열의 동작 방식 모식도 (공식 문서를 참고해 재구성) */
function SegMock({ kind }: { kind: string }) {
  if (kind === "rules") {
    return (
      <svg className="pt2-mock" viewBox="0 0 260 120" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="252" height="112" rx="8" fill="#14181d" />
        <circle cx="18" cy="17" r="3" fill="#f26060" />
        <circle cx="30" cy="17" r="3" fill="#f5c169" />
        <circle cx="42" cy="17" r="3" fill="#2fbf96" />
        <g className="mock-lines" fill="#9aa3b2">
          <rect x="18" y="34" width="120" height="6" rx="3" />
          <rect x="18" y="48" width="170" height="6" rx="3" opacity="0.7" />
          <rect x="18" y="62" width="96" height="6" rx="3" opacity="0.8" />
          <rect x="18" y="76" width="150" height="6" rx="3" opacity="0.6" />
          <rect x="18" y="90" width="110" height="6" rx="3" opacity="0.75" />
        </g>
        <rect className="mock-hit" x="14" y="58" width="232" height="14" rx="4" fill="#dc2626" fillOpacity="0.3" />
        <text x="196" y="42" className="pt2-mock-t">alert: rule</text>
      </svg>
    );
  }
  if (kind === "decrypt") {
    return (
      <svg className="pt2-mock" viewBox="0 0 260 120" fill="none" aria-hidden="true">
        <g className="mock-key">
          <circle cx="42" cy="46" r="14" stroke="#5b6880" strokeWidth="5" />
          <path d="M52 56 L74 78 M66 70 l8 -8 M60 76 l8 -8" stroke="#5b6880" strokeWidth="5" strokeLinecap="round" />
        </g>
        <rect x="96" y="22" width="76" height="76" rx="10" fill="#fff" stroke="#c6d0e2" strokeWidth="2.5" />
        <g className="mock-open" fill="#8894ab">
          <rect x="108" y="38" width="52" height="7" rx="3.5" />
          <rect x="108" y="52" width="40" height="7" rx="3.5" />
          <rect x="108" y="66" width="48" height="7" rx="3.5" />
          <rect x="108" y="80" width="34" height="7" rx="3.5" />
        </g>
        <path className="tp-flow" d="M182 60 h28" stroke="#5b6880" strokeWidth="3" strokeDasharray="6 7" />
        <g>
          <rect x="216" y="30" width="36" height="60" rx="6" fill="#e7ebf4" stroke="#c6d0e2" strokeWidth="2" />
          <rect x="222" y="38" width="24" height="5" rx="2.5" fill="#aab6cc" />
          <rect x="222" y="48" width="24" height="5" rx="2.5" fill="#aab6cc" />
          <rect x="222" y="58" width="24" height="5" rx="2.5" fill="#aab6cc" />
          <text x="234" y="104" textAnchor="middle" className="pt2-mock-t dark">저장소</text>
        </g>
      </svg>
    );
  }
  return (
    <svg className="pt2-mock" viewBox="0 0 260 120" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="252" height="100" rx="10" fill="#fff" stroke="#c6d0e2" strokeWidth="2.5" />
      <polyline
        className="mock-wave"
        points="16,72 40,66 62,74 84,60 106,70 126,40 146,78 168,64 190,70 212,58 244,66"
        stroke="#5b6880" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle className="mock-ping2" cx="126" cy="40" r="9" stroke="#dc2626" strokeWidth="2.5" />
      <circle cx="126" cy="40" r="4" fill="#dc2626" />
      <text x="126" y="28" textAnchor="middle" className="pt2-mock-t alert">anomaly</text>
      <text x="196" y="98" className="pt2-mock-t dark">이유는 알 수 없음</text>
    </svg>
  );
}

const AXES = ["무복호화", "판정 근거 설명", "경량 엣지 배포"];
const MATRIX = [
  { name: "오픈소스 (Suricata 등)", v: [1, 0, 1] },
  { name: "ExtraHop", v: [0, 1, 0] },
  { name: "Darktrace", v: [2, 1, 0] },
  { name: "Vectra AI", v: [2, 1, 0] },
  { name: "Exeon", v: [2, 1, 0] },
  { name: "Cisco ETA", v: [2, 0, 0] },
  { name: "ZERO-CLA", v: [2, 2, 2], us: true },
];
const MARK = ["✕", "△", "○"];
const MARK_KO = ["없음", "일부", "있음"];

/* ── 매출 전망 가정값 ── */
const ASSUME = {
  domesticInfoSec: 7.12,
  infoSecGrowth: 15.9,
  infoSecFirms: 876,
  targetFirms: 60,
  unitPrice: 0.8,
  plan: [
    { year: "2027", customers: 2, label: "PoC 전환 초기 고객" },
    { year: "2028", customers: 8, label: "관제 사업자로 확대" },
    { year: "2029", customers: 20, label: "마켓플레이스 병행" },
  ],
};

/* 침해가 얼마나 오래 이어졌는지 */
function DwellChart() {
  const max = Math.max(...DWELL.map((d) => d.days));
  return (
    <div className="dw">
      <div className="dw-head">
        <b>침입한 순간이 아니라 머문 기간이 피해를 키웠습니다</b>
        <span>침해가 시작된 시점부터 탐지까지 걸린 시간입니다. 색은 피해액이 아니라 흘러간 시간을 나타내며 오래 머물수록 짙어집니다.</span>
      </div>
      {DWELL.map((d) => (
        <div className="dw-row" key={d.org}>
          <b>{d.org}</b>
          <div className="dw-track">
            <div
              className={`dw-fill ${d.days >= 365 ? "t3" : d.days >= 90 ? "t2" : "t1"}`}
              style={{ width: `${(d.days / max) * 100}%` }}
            >
              <span className="dw-lab">{d.label}</span>
            </div>
          </div>
          <span className="dw-date">{d.from} <i className="dw-tilde">~</i> {d.to}</span>
        </div>
      ))}
      <p className="dw-note">
        <Flow>
          그 기간 내내 네트워크 트래픽은 흐르고 있었습니다. 그 흐름 안에 흔적도 함께 남아 있었습니다.
          이 통신사는 침해 6개월 뒤 내부에서 이상 징후를 한 번 확인했지만 유출이 드러난 것은 3년 뒤였습니다.
          흔적은 암호화된 트래픽 안에 있었고 아무도 그것을 열어 보지 못했습니다.
        </Flow>
      </p>
    </div>
  );
}

/* 지역 비중 — 원 대신 가로 막대 */
function RegionBars() {
  return (
    <div className="rg">
      {REGION.map((r) => (
        <div key={r.name} className={`rg-row ${r.hot ? "hot" : ""}`}>
          <b>{r.name}</b>
          <div className="rg-track">
            <div className="rg-fill" style={{ width: `${r.pct}%` }} />
          </div>
          <span className="rg-pct">{r.pct}%</span>
          {r.note && <span className="rg-note">{r.note}</span>}
        </div>
      ))}
    </div>
  );
}

/* 제로-클라의 여섯 축 */
const CAPS = [
  { en: "Non-decryption", ko: "무복호화", ic: "lock",
    d: "복호화 키가 필요 없습니다. 통신 내용을 볼 수 있는 통로 자체가 설계상 없어 고객사가 키를 넘길 이유도 없습니다." },
  { en: "Flow Re-imaging", ko: "플로우 이미지화", ic: "grid",
    d: "1차원 통계 수치를 수학적 변환으로 2차원 관계 행렬에 담습니다. 피처 사이의 상호작용이 그림의 무늬가 됩니다." },
  { en: "Explainable AI", ko: "설명 가능", ic: "eye",
    d: "입력이 이미지라 어디를 보고 판단했는지 히트맵으로 되돌려 줍니다. 경보를 믿을지 30초 안에 확인합니다." },
  { en: "Scalability", ko: "확장성", ic: "expand",
    d: "공격의 지문을 외우지 않고 행동의 모양을 봅니다. 학습 데이터만 바꾸면 탐지 대상이 넓어집니다." },
  { en: "Response", ko: "대응까지", ic: "shield",
    d: "탐지에서 차단까지 한 화면에서 끝납니다. 찾아낸 위협을 그 자리에서 방화벽 목록에 올립니다." },
  { en: "Validation", ko: "외부 검증", ic: "award",
    d: "학술대회 구두 발표와 연구성과 평가 최우수상으로 방법론의 타당성을 검증받았습니다." },
];

/* 여섯 카드의 아이콘 — 색과 굵기를 한 벌로 맞춘 라인 아이콘 */
function CapIcon({ k }: { k: string }) {
  const paths: Record<string, JSX.Element> = {
    lock: (<><rect x="4" y="10" width="16" height="10" rx="2.5" /><path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" /></>),
    grid: (<><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" /></>),
    eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>),
    expand: (<><path d="M14.5 4h5.5v5.5M20 4l-6.5 6.5M9.5 20H4v-5.5M4 20l6.5-6.5" /></>),
    shield: (<><path d="M12 3l7.5 3v6c0 4.4-3.1 7.7-7.5 9-4.4-1.3-7.5-4.6-7.5-9V6z" /><path d="M8.8 12.2l2.3 2.3 4.1-4.6" /></>),
    award: (<><circle cx="12" cy="9" r="5.5" /><path d="M8.2 13.6 6.5 21l5.5-2.6L17.5 21l-1.7-7.4" /></>),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[k]}
    </svg>
  );
}

/* 지금 서버에서 값을 읽어오고 있는지 배지로 알린다 */
function LiveBadge() {
  const sys = useQuery({ queryKey: ["system"], queryFn: api.system, retry: false, refetchInterval: 3000 });
  const on = !!sys.data;
  return (
    <span className={`lp-live ${on ? "" : "off"}`}>
      <i />
      {on ? "LIVE" : "대기 중"}
    </span>
  );
}

/* 관제 콘솔이 실제로 측정한 값 */
function LivePerf() {
  /* 실시간 값이라는 말이 사실이 되도록 3초마다 다시 읽는다 */
  const sys = useQuery({ queryKey: ["system"], queryFn: api.system, retry: false, refetchInterval: 3000 });
  const ups = useQuery({ queryKey: ["uploads"], queryFn: api.uploads, retry: false });
  const listed = (ups.data ?? []).filter((u) => u.perf)[0]?.perf;
  /* 목록에 perf 가 없으면 가장 최근 세션을 직접 열어 그 값을 읽는다 */
  const newest = (ups.data ?? [])[0]?.upload_id;
  const detail = useQuery({
    queryKey: ["upload-detail", newest],
    queryFn: () => api.upload(newest as string),
    enabled: !listed && !!newest,
    retry: false,
  });
  const last = listed ?? (detail.data as { perf?: typeof listed })?.perf;
  const flows = (ups.data ?? []).reduce((a, u) => a + u.n_rows, 0);
  const dash = (v: unknown) => (v === undefined || v === null ? "—" : String(v));
  return (
    <div className="lp">
      <div className="lp-item">
        <span className="lp-k">Inference</span>
        <strong>{last ? last.per_flow_ms : "—"}<em>ms / flow</em></strong>
        <span className="lp-d">플로우 한 건이 도착해 판정이 나오기까지 걸린 시간</span>
      </div>
      <div className="lp-item">
        <span className="lp-k">Throughput</span>
        <strong>{last?.flows_per_s ? Math.round(last.flows_per_s).toLocaleString() : "—"}<em>flows / s</em></strong>
        <span className="lp-d">1초 동안 실시간으로 판별한 플로우 수</span>
      </div>
      <div className="lp-item">
        <span className="lp-k">CPU</span>
        <strong>{dash(sys.data?.cpu_pct)}<em>%</em></strong>
        <span className="lp-d">실시간 분석이 도는 동안의 프로세서 점유율</span>
      </div>
      <div className="lp-item">
        <span className="lp-k">Memory</span>
        <strong>{dash(sys.data?.mem_pct)}<em>%</em></strong>
        <span className="lp-d">{sys.data?.mem_used_gb ? `${sys.data.mem_used_gb}GB 사용 중` : "메모리 점유율"}</span>
      </div>
      <div className="lp-item accent">
        <span className="lp-k">Device</span>
        <strong>{(last?.device ?? sys.data?.device ?? "—").toUpperCase()}</strong>
        <span className="lp-d">전용 가속기 없이 동작합니다</span>
      </div>
      <p className="lp-note">
        {last ? (
          <Flow>
            실시간 분석이 도는 동안 누적 {flows.toLocaleString()}건의 플로우를 판별하며 측정한 값입니다.
            원본 패킷을 따로 쌓아 두지 않기 때문에 스토리지 요구가 발생하지 않습니다.
          </Flow>
        ) : (
          <Flow>
            추론 속도와 처리량은 분석을 한 번 돌린 뒤에 채워집니다.
            관제 콘솔에서 캡처 하나를 올리면 그 자리에서 측정값이 들어오고 아래 CPU와 메모리는 지금도 실시간으로 읽고 있습니다.
            원본 패킷을 따로 쌓아 두지 않기 때문에 스토리지 요구가 발생하지 않습니다.
          </Flow>
        )}
      </p>
    </div>
  );
}

/* 시연 영상 — 시연 영상 페이지(/#/demo)와 같은 파일을 쓴다.
   파일을 교체하면 DEMO_REV 만 올리면 캐시가 갈린다. */
const DEMO_REV = "87";
const DEMO_SRC = `/media/zerocla_demo_67s.mp4?v=${DEMO_REV}`;
const DEMO_POSTER = `/media/zerocla_demo_poster.jpg?v=${DEMO_REV}`;

function DemoVideo() {
  const [none, setNone] = useState(false);
  if (none) {
    return (
      <div className="dm-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="5" width="14" height="14" rx="3" />
          <path d="M21.5 8.5v7l-5-3.5z" />
        </svg>
        <b>시연 영상이 들어갈 자리입니다</b>
        <span>영상을 frontend/public/media/zerocla_demo_67s.mp4 로 넣으면 이 자리에서 바로 재생됩니다</span>
      </div>
    );
  }
  return (
    <div className="dm">
      <video
        className="dm-v"
        controls
        muted
        playsInline
        preload="auto"
        poster={DEMO_POSTER}
        onError={() => setNone(true)}
      >
        <source src={DEMO_SRC} type="video/mp4" />
      </video>
    </div>
  );
}

/* 미국 사례 화면 — public/news 에 캡처 파일을 넣어 두면 그 이미지를 쓰고
   파일이 없으면 같은 내용의 재현 화면을 그린다 */
function SerpShot({ u }: { u: (typeof US_CASES)[number] }) {
  return (
    <figure className="pt2-shot serp shot-img">
      <img src={u.img} alt="관련 보도 검색 결과" loading="lazy" />
    </figure>
  );
}

/* 세 조건이 겹치는 자리가 비어 있다는 것을 그림으로.
   표지에서 선언한 세 키워드와 같은 영어 표기를 쓴다 */
function GapVenn({ cap = "세 조건이 겹치는 자리에 선 제품이 아직 없습니다" }: { cap?: string }) {
  return (
    <div className="venn">
      <div className="venn-fig">
        <svg viewBox="0 0 340 322" aria-hidden="true">
          <circle className="vc a" cx="170" cy="110" r="78" />
          <circle className="vc b" cx="128" cy="188" r="78" />
          <circle className="vc c" cx="212" cy="188" r="78" />
          <text className="vt" x="170" y="22" textAnchor="middle">Non-decryption</text>
          <text className="vt" x="4" y="300" textAnchor="start">Explainable AI</text>
          <text className="vt" x="336" y="300" textAnchor="end">Lightweight</text>
          <circle className="vcore" cx="170" cy="162" r="40" />
        </svg>
        <span className="venn-logo" aria-hidden="true">
          <BrandMark width={58} />
          <em>ZERO-CLA</em>
        </span>
      </div>
      {cap && <span className="venn-cap">{cap}</span>}
    </div>
  );
}

/* ── 섹션 헤더 ── */
function Head({ n, en, title, sub, mark }: { n: string; en: string; title: string; sub: string; mark?: boolean }) {
  return (
    <header className="pt2-head">
      <span className="pt2-num">{n}</span>
      <div>
        <span className="pt2-en">{en}</span>
        <h2>{mark ? (<span className="hd-mark"><BrandMark width={54} />{title}</span>) : title}</h2>
        <p>{sub}</p>
      </div>
    </header>
  );
}

/* ── 차트 ── */
function MarketChart() {
  const W = 720;
  const H = 268;
  const PAD = { l: 46, r: 20, t: 34, b: 52 };
  const max = 8;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / YEARS.length;
  const bw = Math.min(20, slot * 0.34);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const base = PAD.t + ih;
  /* 한 해에 두 기관 값이 다 있으면 나란히, 하나뿐이면 가운데 */
  const xs = (i: number, which: "past" | "now") => {
    const both = NDR_PAST[i] != null && NDR_SERIES[i] != null;
    const c = PAD.l + slot * i + slot / 2;
    if (!both) return c - bw / 2;
    return which === "past" ? c - bw - 2 : c + 2;
  };
  const I26 = YEARS.indexOf("2026");
  const I31 = YEARS.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pt2-chart" role="img" aria-label="NDR 시장 규모 추이와 전망">
      {[0, 2, 4, 6, 8].map((g) => (
        <g key={g}>
          <line x1={PAD.l} y1={y(g)} x2={W - PAD.r} y2={y(g)} className="pt2-grid" />
          <text x={PAD.l - 10} y={y(g) + 4} textAnchor="end" className="pt2-axis">{g}</text>
        </g>
      ))}

      {NDR_PAST.map((v, i) =>
        v == null ? null : (
          <rect key={`p${i}`} x={xs(i, "past")} y={y(v)} width={bw} height={base - y(v)} rx="3" className="mkb past" />
        )
      )}
      {NDR_SERIES.map((v, i) =>
        v == null ? null : (
          <rect
            key={`m${i}`} x={xs(i, "now")} y={y(v)} width={bw} height={base - y(v)} rx="3"
            className={`mkb now${i === YEARS.length - 1 ? " last" : ""}`}
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        )
      )}

      {YEARS.map((yr, i) => (
        <text key={yr} x={PAD.l + slot * i + slot / 2} y={H - 30} textAnchor="middle" className="pt2-axis">{yr}</text>
      ))}

      {/* 발표에서 입으로 말하는 세 해만 금액을 붙인다 */}
      <text x={xs(0, "past") + bw / 2} y={y(NDR_PAST[0] as number) - 9} textAnchor="middle" className="pt2-pt-label past">2.49</text>
      <text x={xs(I26, "now") + bw / 2} y={y(4.34) - 9} textAnchor="middle" className="pt2-pt-label accent">4.34</text>
      <text x={xs(I31, "now") + bw / 2} y={y(7.29) - 9} textAnchor="middle" className="pt2-pt-label accent">7.29</text>
      <text x={PAD.l} y={PAD.t - 14} className="pt2-axis">USD Billion</text>

      <g transform={`translate(${PAD.l}, ${H - 8})`}>
        <rect x="0" y="-11" width="12" height="10" rx="2" className="mkb past" />
        <text x="18" y="-2" className="pt2-axis">Valuates Reports</text>
        <rect x="150" y="-11" width="12" height="10" rx="2" className="mkb now" />
        <text x="168" y="-2" className="pt2-axis">MarketsandMarkets</text>
      </g>
    </svg>
  );
}

/* 세 시장을 억 원 하나로 합쳐 한눈에 보이게 한다 */
const FX = 1400; // 원 / 달러
const toEok = (p: (typeof PLAN3)[number], v: number) =>
  p.unit === "억 원" ? v : (v * 10000 * FX) / 100000000; // 만 달러 → 억 원

const PLAN_YEARS = PLAN3[0].data.map((d) => d.y);
const PLAN_STACK = PLAN_YEARS.map((yr, i) => {
  const parts = PLAN3.map((p) => ({ key: p.key, label: p.label, v: toEok(p, p.data[i].v) }));
  return { y: yr, parts, total: parts.reduce((s, q) => s + q.v, 0) };
});
const PLAN_LAST = PLAN_STACK[PLAN_STACK.length - 1];
/* 연도별 인원 계획 — 엔진 공급 구조라 소수 정예로 잡는다 */
const PLAN_STAFF: Record<string, number> = { "2027": 6, "2028": 12, "2029": 22, "2030": 38 };
const eok = (v: number) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

function RevenuePlan() {
  const max = Math.max(...PLAN_STACK.map((s) => s.total));
  return (
    <div className="rv">
      <div className="rv-headline">
        <div className="rv-big">
          <span className="rv-k">{PLAN_LAST.y}년 연 매출 목표</span>
          <strong>
            <span className="rv-approx">약</span>
            {eok(PLAN_LAST.total)}
            <em>억 원</em>
            <span className="rv-plus">+α</span>
          </strong>
        </div>
        <ul className="rv-legend">
          {PLAN_LAST.parts.map((q) => (
            <li key={q.key}>
              <i className={q.key} />
              <span>{q.label}</span>
              <b>약 {eok(q.v)}억 <i className="pl">+α</i></b>
            </li>
          ))}
        </ul>
      </div>

      <div className="rvx">
        {PLAN_STACK.map((st) => (
          <div className="rvx-row" key={st.y}>
            <b className="rvx-y">{st.y}</b>
            <div className="rvx-track">
              <div className="rvx-bar" style={{ width: `${(st.total / max) * 100}%` }}>
                {st.parts.map((q) =>
                  q.v ? (
                    <i
                      key={q.key}
                      className={q.key}
                      style={{ flexGrow: q.v }}
                      title={`${q.label} 약 ${eok(q.v)}억 원`}
                    />
                  ) : null,
                )}
              </div>
            </div>
            <strong className="rvx-v">
              약 {eok(st.total)}<em>억 +α</em>
            </strong>
            <span className="rvx-staff">{PLAN_STAFF[st.y]}명</span>
          </div>
        ))}
        <div className="rvx-axis">
          <span>막대 길이는 그해 연 매출이고 색은 시장별 구성입니다</span>
          <span>맨 오른쪽 숫자는 그해 인원 계획입니다</span>
        </div>
      </div>

      <div className="rv-rows">
        {PLAN3.map((p, pi) => (
          <div className="rv-row" key={p.key}>
            <i className={p.key} />
            <b>{p.label}</b>
            <span>{p.desc}</span>
            <strong>
              약 {eok(toEok(p, p.data[p.data.length - 1].v))}억 원 +α
              <em>{PLAN_YEARS[PLAN_YEARS.length - 1]}년</em>
            </strong>
            <span className="rv-start">
              {p.data.findIndex((d) => d.v > 0) < 0 ? "" : `${p.data[p.data.findIndex((d) => d.v > 0)].y}년 시작`}
              {pi === -1 ? "" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 1인당 매출 벤치마크 — 목표가 업계 어디쯤인지 한 줄로 보여 준다 */
function PerHeadChart() {
  const max = Math.max(...PER_HEAD.map((d) => d.v));
  return (
    <div className="ph">
      {PER_HEAD.map((d) => (
        <div className={`ph-row${d.us ? " us" : ""}${d.avg ? " avg" : ""}`} key={d.name}>
          <b className="ph-n">{d.name}</b>
          <div className="ph-track">
            <div className="ph-bar" style={{ width: `${(d.v / max) * 100}%` }} />
          </div>
          <strong className="ph-v">{d.v.toFixed(2)}<em>억</em></strong>
          <span className="ph-note">{d.note}</span>
          <span className="ph-src">{d.src}</span>
        </div>
      ))}
    </div>
  );
}

/* 매출 추이 미니 막대 (범용) */
function RevRows({ rows, unit }: { rows: Array<{ y: string; v: number }>; unit: string }) {
  const max = Math.max(...rows.map((d) => d.v));
  return (
    <div className="pt2-vendor">
      {rows.map((d) => (
        <div className="pt2-vendor-row" key={d.y}>
          <span className="pt2-vendor-y">{d.y}</span>
          <div className="pt2-vendor-track">
            <div className="pt2-vendor-fill" style={{ width: `${(d.v / max) * 100}%` }} />
          </div>
          <b>
            {d.v.toLocaleString()}
            {unit}
          </b>
        </div>
      ))}
    </div>
  );
}

/* 지역 비중 도넛 */
function RegionDonut() {
  const R = 62;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const colors = ["#c9d4e8", "#aab9d6", "var(--focus)", "#e3e9f4"];
  return (
    <div className="pt2-region">
      <svg viewBox="0 0 170 170" className="pt2-donut">
        <g transform="translate(85,85) rotate(-90)">
          {REGION.map((r, i) => {
            const len = (r.pct / 100) * C;
            const el = (
              <circle
                key={r.name}
                r={R}
                fill="none"
                stroke={colors[i]}
                strokeWidth="26"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
                className={r.hot ? "pt2-donut-hot" : ""}
              />
            );
            acc += len;
            return el;
          })}
        </g>
        <text x="85" y="80" textAnchor="middle" className="pt2-donut-t">22%</text>
        <text x="85" y="98" textAnchor="middle" className="pt2-donut-c">아시아태평양</text>
      </svg>
      <ul className="pt2-region-legend">
        {REGION.map((r, i) => (
          <li key={r.name} className={r.hot ? "hot" : ""}>
            <i style={{ background: colors[i] }} />
            <b>{r.name}</b>
            <span>{r.pct}%</span>
            {r.note && <em>{r.note}</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 목차 ── */
/* tag 는 접힌 상태에서 막대 옆에 붙는 짧은 이름 */
const TOC = [
  { id: "cover", en: "COVER", ko: "표지", tag: "표지" },
  { id: "s1", en: "THE PROBLEM", ko: "지금 벌어지는 일", tag: "문제" },
  { id: "s3", en: "THE MARKET", ko: "시장 규모", tag: "시장" },
  { id: "s4", en: "THE PLAYERS", ko: "시장의 선두 주자", tag: "경쟁" },
  { id: "s5", en: "THE GAP", ko: "비어 있는 자리", tag: "공백" },
  { id: "s6", en: "OUR SOLUTION", ko: "제로-클라", tag: "해법" },
  { id: "s7", en: "THE BUSINESS", ko: "매출 전망", tag: "사업" },
  { id: "s65", en: "LIVE DEMO", ko: "시연 영상", tag: "시연" },
  { id: "s9", en: "THANK YOU", ko: "마무리", tag: "끝" },
];
const APPENDIX = { id: "s8", en: "APPENDIX", ko: "부록", tag: "부록" };

/* ── 페이지 ── */
export default function PresentationPage() {
  const [cur, setCur] = useState("cover");
  const [all, setAll] = useState(false);
  const show = (id: string) => all || cur === id;

  /* 목차를 누르면 한 장 보기에서는 그 장으로 갈아 끼우고
     전체 이어보기에서는 그 자리로 스크롤한다 */
  const go = (id: string) => {
    if (all) {
      const el = document.getElementById(`sec-${id}`);
      if (el) {
        setCur(id);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    setAll(false);
    setCur(id);
    window.scrollTo(0, 0);
  };

  /* 전체 이어보기에서 지금 보고 있는 장을 목차에 표시한다 */
  useEffect(() => {
    if (!all) return;
    const ids = [...TOC.map((t) => t.id), APPENDIX.id];
    const onScroll = () => {
      let now = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`sec-${id}`);
        if (el && el.getBoundingClientRect().top <= 140) now = id;
      }
      setCur(now);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [all]);

  return (
    <div className={`pt2-wrap ${all ? "all" : ""}`}>
      <aside className="pt2-toc">
        <div className="pt2-toc-panel">
        <span className="pt2-toc-title">CONTENTS</span>
        <nav>
          {TOC.map((t, i) => (
            <button
              key={t.id}
              className={cur === t.id ? "on" : ""}
              onClick={(e) => {
                go(t.id);
                e.currentTarget.blur();
              }}
            >
              <span className="pt2-toc-bar" aria-hidden="true" />
              <span className="pt2-toc-tag">{t.tag}</span>
              <span className="pt2-toc-label">
                <em>{t.en}</em>
                <b>{t.ko}</b>
              </span>
            </button>
          ))}
        </nav>

        <div className="pt2-toc-extra">
          <button
            className={`pt2-toc-apx ${cur === APPENDIX.id ? "on" : ""}`}
            onClick={(e) => {
              go(APPENDIX.id);
              e.currentTarget.blur();
            }}
          >
            <span className="pt2-toc-bar" aria-hidden="true" />
            <span className="pt2-toc-tag">{APPENDIX.tag}</span>
            <span className="pt2-toc-label">
              <em>{APPENDIX.en}</em>
              <b>{APPENDIX.ko}</b>
            </span>
          </button>
          <label className="pt2-toc-switch">
            <input type="checkbox" checked={all} onChange={() => setAll((v) => !v)} />
            <span className="pt2-switch-track"><i /></span>
            <span className="pt2-switch-label">전체 이어 보기</span>
          </label>
        </div>
        </div>
      </aside>

    <div className="pt2">
      {show("cover") && (
      <section id="sec-cover" className="pt2-cover slide">
        <div className="cv-mid">
          <h1 className="cv-title">{TITLE_FULL}</h1>
          <p className="cv-plain">복호화 없이 암호화 트래픽을 판별합니다</p>
          <p className="cv-lead">
            제로-클라는 <b>페이로드를 복호화하지 않습니다.</b>
            <br />
            네트워크 패킷의 헤더와 오간 시각만 보고 악성 트래픽을 가려냅니다.
            <br />
            어떤 통신 습관이 근거였는지 히트맵으로 짚어 줍니다.
          </p>
        </div>

        <div className="cv-keys">
          <b>Non-decryption</b>
          <b>Explainable AI</b>
          <b>Lightweight</b>
        </div>

        <div className="cv-domain">
          <a href="https://zero-cla.cloud" target="_blank" rel="noreferrer">zero-cla.cloud</a>
        </div>

        <div className="cv-by">
          <span className="cv-who">
            <span className="cv-names">김도현 하상우 안석현</span>
            <span className="cv-mentor">
              <i>멘토</i>
              한현상
              <em>AWS Korea</em>
            </span>
          </span>
          <span className="cv-logos">
            <img src={logoDku} alt="단국대학교" className="cv-logo dku" />
            <img src={logoCsrc} alt="제로트러스트 클라우드 보안 연구센터" className="cv-logo csrc" />
          </span>
        </div>
      </section>
      )}

      {/* 01 국내 */}
      {show("s1") && (
      <section id="sec-s1" className="pt2-sec">
        <Head n="01" en="THE PROBLEM" title="지금 벌어지는 일" sub="최근 개인정보 관리가 부실해 유출과 제재를 겪은 기업이 국내외에 잇따랐습니다" />

        {/* 표지에서 던진 "열지 않는다"가 왜 필요한지를 사고보다 먼저 세운다 */}
        <div className="pr-bridge">
          <b>지금 기업 내부를 오가는 트래픽은 대부분 암호화돼 있습니다</b>
          <p>
            <Flow>
              보안 장비도 그 안을 들여다보지 못합니다.
              공격자가 그 뒤에 숨는 이유입니다.
              열지 못하면 지켜볼 수 없고 지켜보지 못하면 통제할 수 없습니다.
            </Flow>
          </p>
        </div>

        <div className="pt2-cases">
          {KR_CASES.map((c) => (
            <article key={c.kind} className="pt2-case">
              <figure className="pt2-shot">
                <img src={c.img} alt="관련 보도 검색 결과" loading="lazy" />
              </figure>
              <div className="pt2-case-data">
                <b className="pt2-case-org">{c.org}<em>{c.kind}</em></b>
                <div className="pt2-case-nums">
                  <div>
                    <strong>{c.people}</strong>
                    <span>{c.peopleCap}</span>
                  </div>
                  <div>
                    <strong className="alert">{c.fine}</strong>
                    <span>{c.fineCap}</span>
                  </div>
                </div>
                <div className="cs-foot">
                  <span className="cs-chip">{c.extra}</span>
                  <span className="cs-src"><Flow>{c.src}</Flow></span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <DwellChart />

        <div className="pt2-turn">
          <p>
            <Flow>
              이 정도 규모의 유출은 처음이었습니다. 그전까지 보안은 사고가 난 뒤 수습하는 비용에 가까웠습니다.
              지금은 차분 프라이버시처럼 데이터 자체를 지키는 기법까지 논의됩니다.
              남은 과제는 데이터가 밖으로 나가는 길목을 실시간으로 지켜보는 일입니다.
            </Flow>
          </p>
          <b>그러면 제재가 훨씬 무거운 미국은 어떨까요</b>
        </div>

      {/* 02 미국 */}
        <h3 className="pt2-sub-head">미국은 자릿수가 다릅니다</h3>

        <div className="pt2-cases">
          {US_CASES.map((u) => (
            <article key={u.kind} className="pt2-case">
              <SerpShot u={u} />
              <div className="pt2-case-data">
                <b className="pt2-case-org">{u.org}<em>{u.kind}</em></b>
                <div className="pt2-case-nums one">
                  <div>
                    <strong className="alert">{u.amount}</strong>
                    <span>{u.amountCap}</span>
                  </div>
                </div>
                <div className="cs-foot">
                  <span className="cs-chip">{u.extra}</span>
                  <span className="cs-src"><Flow>{u.src}</Flow></span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="pt2-src strong">각 규제기관 공식 보도자료 기준입니다</p>
      </section>
      )}

      {/* 03 시장 */}
      {show("s3") && (
      <section id="sec-s3" className="pt2-sec">
        <Head n="02" en="THE MARKET" title="시장 규모" sub="탐지 수요가 시장을 밀어 올리고 있고 가장 빠르게 크는 곳이 우리가 있는 아시아태평양입니다" />

        <div className="mkd2">
          <span className="mkd2-k">SCOPE</span>
          <h3>
            여기서 말하는 시장은 <b>NG-NDR</b>입니다
            <em>Next-Generation Network Detection and Response</em>
          </h3>
          <p>
            <Flow>
              네트워크를 흐르는 트래픽을 분석해 위협을 찾아내고 대응까지 연결하는 시장이 NDR입니다.
              지금의 NDR은 내용을 열어 보거나 원본을 쌓아 두는 방식 위에 서 있습니다.
              열지 않고 판별하면서 판단 근거까지 내놓는 다음 세대를 저희는 NG-NDR이라 부릅니다.
              아래 시장 규모는 NDR 전체 기준이고 저희는 그 안에서 이 자리를 가져갑니다.
            </Flow>
          </p>
          <div className="mkd2-line">
            <div className="mkd2-cell in">
              <b>트래픽 분석 기반 탐지와 대응</b>
              <span>NDR 시장에 포함됩니다</span>
            </div>
            <div className="mkd2-cell out">
              <b>단말 백신과 경계 방화벽</b>
              <span>포함하지 않습니다</span>
            </div>
            <div className="mkd2-cell us">
              <b>NG-NDR</b>
              <span>열지 않고 판별하고 근거까지 내놓는 자리</span>
            </div>
          </div>
        </div>

        <h3 className="pt2-sub-head">시장은 어디에 몰려 있나</h3>
        <RegionBars />
        <p className="pt2-src strong">
          MarketsandMarkets 2026년 글로벌 NDR 시장의 지역별 비중입니다. 유럽과 기타 지역은 발표된 합계에서 역산한 추정치입니다
        </p>

        <h3 className="pt2-sub-head">얼마나 빠르게 크고 있나</h3>
        <div className="pt2-market-chart wide">
          <MarketChart />
        </div>

        <div className="mk-grow one">
          <strong><i>×</i>2.9</strong>
          <span>2023년 약 25억 달러이던 시장이 2031년 약 73억 달러가 될 것으로 예상됩니다</span>
        </div>

        <div className="mk-stats">
          <div className="pt2-stat">
            <span className="st-k">시장이 커지는 속도</span>
            <strong>해마다 {NDR_CAGR}%</strong>
            <span>2026년부터 2031년까지의 연평균 성장률입니다</span>
          </div>
          <div className="pt2-stat">
            <span className="st-k">가장 빨리 크는 지역</span>
            <strong>아시아태평양</strong>
            <span>세계에서 성장 속도가 가장 빠른 지역이고 우리가 있는 곳입니다</span>
          </div>
          <div className="pt2-stat">
            <span className="st-k">국내 정보보안 시장 전체</span>
            <strong>{ASSUME.domesticInfoSec}조 원</strong>
            <span>
              NDR만이 아니라 백신과 방화벽과 관제 서비스를 모두 더한 국내 매출입니다.
              전년보다 {ASSUME.infoSecGrowth}% 늘었고 사업체는 {ASSUME.infoSecFirms}개입니다
            </span>
          </div>
        </div>
        <p className="pt2-src">과학기술정보통신부와 KISIA, 2025년 국내 정보보호산업 실태조사. 2025년 11월 발표, 2024년 실적 기준</p>

        <div className="mk-src">
          <div><b>Valuates Reports</b><span>세계 조사기관의 시장 보고서를 검증해 발행하는 리서치 회사입니다. 2024년 9월 발표분이며 지나온 구간을 보여 주는 용도로 씁니다</span></div>
          <div><b>MarketsandMarkets</b><span>기술 산업의 시장 규모 전망을 발행하는 B2B 시장조사 기관입니다. 2026년 7월판이 최신이고 앞으로의 전망은 이 값을 씁니다</span></div>
        </div>
      </section>
      )}

      {/* 04 기존 플레이어 */}
      {show("s4") && (
      <section id="sec-s4" className="pt2-sec">
        <Head n="03" en="THE PLAYERS" title="시장의 선두 주자" sub="이미 자리를 잡은 회사들과 공개된 지표로 본 이 시장의 크기입니다" />

        <h3 className="pt2-sub-head">그러면 해외는 누가 하고 있나</h3>
        <div className="pt2-leaders">
          {LEADERS.map((l) => (
            <div key={l.name} className="pt2-leader">
              <b>{l.name}</b>
              <span>{l.country}</span>
              <em>{l.note}</em>
            </div>
          ))}
        </div>
        <p className="pt2-src strong">2026 Gartner Magic Quadrant for Network Detection and Response 리더 사분면에 오른 기업입니다</p>

        <h3 className="pt2-sub-head">얼마나 벌고 있나</h3>
        <div className="pt2-two">
          <div>
            <h4 className="pt2-mini-head">Darktrace 연간 매출</h4>
            <RevRows rows={DT_REV} unit="M 달러" />
            <span className="pt2-src">
              리더 세 곳 가운데 연간 매출을 공개하는 유일한 회사입니다. 2024년 사모펀드 인수 이후 비공개로 전환했습니다.
            </span>
          </div>
          <div>
            <h4 className="pt2-mini-head">비상장 두 곳은 다른 지표로</h4>
            <div className="unl">
              <div className="unl-row">
                <b>ExtraHop</b>
                <strong>9억 달러</strong>
                <span>2021년 사모펀드 인수 금액</span>
              </div>
              <div className="unl-row">
                <b>Vectra AI</b>
                <strong>12억 달러</strong>
                <span>2021년 투자 라운드 기업가치</span>
              </div>
            </div>
            <span className="pt2-src">매출은 공개되지 않지만 시장이 이 회사를 얼마로 평가하는지 보여주는 값입니다.</span>
          </div>
        </div>

        <h3 className="pt2-sub-head">국내는 어떤가</h3>
        <div className="pt2-two">
          <div>
            <h4 className="pt2-mini-head">쿼드마이너 연간 매출</h4>
            <RevRows rows={QM_REV} unit="억 원" />
          </div>
          <div className="qm-note">
            <h4 className="pt2-mini-head">이 회사를 어떻게 보나</h4>
            <p>
              <Flow>
                풀패킷 저장형 NDR로 국내 시장을 연 기업입니다.
                누적 252억 원을 투자받았고 코스닥 상장을 추진하고 있습니다.
                국내에서도 이 시장이 상장 기업을 만들 만큼 커졌다는 신호입니다.
              </Flow>
            </p>
            <p className="qm-us">
              <Flow>
                다만 지나간 패킷을 통째로 저장해 열어 보는 방식이라 우리와는 축이 다릅니다.
                경쟁자이면서 동시에 우리 엔진을 넣을 수 있는 고객이기도 합니다.
              </Flow>
            </p>
          </div>
        </div>

        <h3 className="pt2-sub-head">어떤 방식으로 하고 있나</h3>
        <div className="pt2-segments">
          {SEGMENTS.map((s) => (
            <div key={s.tag} className="pt2-seg">
              <span className="pt2-seg-tag">{s.tag}</span>
              <b>{s.title}</b>
              <span className="pt2-seg-who">{s.who}</span>
              <SegMock kind={s.mock} />
              <p>{s.how}</p>
              <span className="pt2-seg-limit">{s.limit}</span>
            </div>
          ))}
        </div>

      </section>
      )}

      {/* 05 빈칸 */}
      {show("s5") && (
      <section id="sec-s5" className="pt2-sec">
        <Head n="04" en="THE GAP" title="비어 있는 자리" sub="세 가지를 동시에 해내는 제품이 아직 없습니다" />

        <div className="gapx">
          <div className="gapx-txt">
            <span className="gapx-k">결론부터</span>
            <b>국내에는 이 방식으로 하는 회사가 없습니다</b>
            <p>
              <Flow>
                국내에도 NDR 기업은 있습니다. 다만 전부 풀패킷을 저장해 열어 보는 방식입니다.
                복호화 없이 판별하면서 판단 근거까지 내놓는 제품은 국내에서 확인되지 않았습니다.
                앞에서 NG-NDR이라 부른 자리가 바로 여기입니다.
                같은 축에 선 제품이 없으니 국내에서 만든 레퍼런스를 그대로 해외로 가져갈 수 있습니다.
              </Flow>
            </p>
            <div className="gapx-3">
              <div><b>국내 최초</b><span>같은 축에 선 제품이 없습니다</span></div>
              <div><b>시장 개척</b><span>국내에서 레퍼런스를 만듭니다</span></div>
              <div><b>해외 시장 진출</b><span>검증된 엔진을 해외 벤더에 공급합니다</span></div>
            </div>
            <span className="gapx-src">국내외 35개 제품과 서비스를 공식 문서 기준으로 조사한 결과입니다</span>
          </div>
          <GapVenn />
        </div>


        <div className="pt2-table-wrap">
          <table className="pt2-table">
            <thead>
              <tr>
                <th>제품</th>
                {AXES.map((a) => (
                  <th key={a}>{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.name} className={r.us ? "us" : ""}>
                  <td>{r.name}</td>
                  {r.v.map((v, i) => (
                    <td key={i} className={`m m${v}`} title={MARK_KO[v]}>
                      {MARK[v]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pt2-legend-row">
          <span><b className="m2">○</b> 갖추고 있습니다</span>
          <span><b className="m1">△</b> 제한적으로만 됩니다</span>
          <span><b className="m0">✕</b> 해당되지 않습니다</span>
        </div>
        <p className="pt2-src strong">각 벤더의 공식 제품 문서와 기술 백서를 기준으로 정리했습니다</p>

        <div className="gap-why">
          <div className="gap-lead">
            <b>복호화 없이 탐지하는 일은 이미 여러 곳이 합니다</b>
            <span>비어 있는 칸은 두 개입니다. 왜 그렇게 판단했는지 보여주는 능력, 그리고 현장 장비에 그대로 올릴 수 있는 가벼움입니다.</span>
          </div>
          <ol className="gap-why-list">
            <li>
              <span className="gap-n">01</span>
              <b>정확도를 올리면 근거가 사라집니다</b>
              <p><Flow>모델을 키울수록 판단이 수많은 가중치에 흩어져 어디를 봤는지 짚을 수 없게 됩니다. 그래서 성능과 설명 가운데 하나를 포기해 왔습니다.</Flow></p>
            </li>
            <li>
              <span className="gap-n">02</span>
              <b>도입 비용이 장비값에서 시작합니다</b>
              <p><Flow>복호화 방식은 키를 맡기고 별도 장비를 세워야 하고 풀패킷 저장형은 대용량 스토리지를 함께 들여야 합니다. 소프트웨어 값보다 장비 값이 먼저 붙습니다.</Flow></p>
            </li>
            <li>
              <span className="gap-n">03</span>
              <b>기존 벤더에게 가벼움은 필요가 없었습니다</b>
              <p><Flow>전용 어플라이언스를 함께 파는 구조라 모델이 무거워도 손해가 아닙니다. 가볍게 만들 이유 자체가 없었습니다.</Flow></p>
            </li>
          </ol>
          <p className="gap-close">
            <Flow>
              저희는 통계를 이미지로 바꾸는 한 번의 선택으로 이 세 제약을 함께 비껴갔습니다.
              내용을 볼 필요가 없어지고, 이미지라서 어디를 봤는지 그릴 수 있고, 입력이 작아 모델도 작아집니다.
            </Flow>
          </p>
          <div className="xai plain">
            <span className="xai-k">WHY XAI</span>
            <h4 className="xai-head">학계가 요구하는 것은 점수가 아니라 근거와 일반화입니다</h4>
            <p className="xai-lead">
              <Flow>
보안 AI 연구의 최상위 학회들이 지난 4년간 내린 결론은 하나입니다.
                벤치마크 위의 소수점은 실전 능력의 증거가 아니고 다른 네트워크로 옮기면 재현되지 않으며 근거 없는 모델은 현장에서 쓰이지 않는다는 것입니다.
                99%를 경쟁하던 시대는 학계가 먼저 접었습니다.
                저희가 설명 가능성을 앞세운 것도 이 흐름을 읽고 내린 설계 판단입니다.
              </Flow>
            </p>
            <div className="xai-stats">
              <div>
                <strong>17<i>~</i>90<em>%</em></strong>
                <span><Flow>최상위 4개 학회 10년치 논문 30편에서 확인된 방법론 함정의 출현 비율입니다. 높은 점수가 곧 실전 능력은 아니라는 뜻입니다.</Flow></span>
                <em>Arp et al. USENIX Security 2022</em>
              </div>
              <div>
                <strong>99.7<i>→</i>35.7</strong>
                <span><Flow>같은 모델을 다른 데이터셋으로 옮기자 성능이 이만큼 무너졌습니다. 점수는 학습한 환경에서만 유효했습니다.</Flow></span>
                <em>Cantone et al. IEEE Access 2024</em>
              </div>
              <div>
                <strong>25.9<em>%</em></strong>
                <span><Flow>널리 쓰이는 벤치마크에서 수집 도구의 오류로 생긴 무의미한 플로우의 비율입니다. 점수의 일부는 오류를 외운 결과였습니다.</Flow></span>
                <em>Engelen et al. IEEE SPW 2021</em>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 06 제로-클라 */}
      {show("s6") && (
      <section id="sec-s6" className="pt2-sec">
        <Head n="05" en="OUR SOLUTION" title="제로-클라" sub="앞에서 정의한 세 조건을 모두 만족하는 NG-NDR 엔진입니다" mark />

        <div className="why-lead">
          <b>제로-클라는 판단 근거를 함께 냅니다</b>
          <ul>
            <li><b>Verify</b><span>어디를 보고 판단했는지 히트맵으로 보여 주기 때문에 경보를 30초 안에 검증할 수 있습니다.</span></li>
            <li><b>Diagnose</b><span>오탐이 나오면 어느 관찰 항목이 판단을 끌고 갔는지 히트맵에서 바로 보입니다. 그 항목을 기준으로 규칙을 조정하거나 학습 데이터를 보강할 지점을 정할 수 있습니다.</span></li>
            <li><b>Accountability</b><span>차단은 서비스를 끊는 행위입니다. 왜 끊었는지 기록으로 남길 수 있어야 도입이 가능합니다.</span></li>
          </ul>
        </div>

        <div className="pt2-how">
          <svg viewBox="0 0 920 150" fill="none" aria-hidden="true">
            <g>
              <rect x="10" y="38" width="150" height="88" rx="12" fill="#fff" stroke="#c6d0e2" strokeWidth="2.5" />
              <path d="M10 50 L85 94 L160 50" stroke="#c6d0e2" strokeWidth="2.5" fill="none" />
              <g className="tp-lock2">
                <rect x="70" y="72" width="30" height="23" rx="6" fill="#5b6880" />
                <path d="M77 72 v-7 a8 8 0 0 1 16 0 v7" stroke="#5b6880" strokeWidth="4" strokeLinecap="round" />
              </g>
              <text x="85" y="24" textAnchor="middle" className="pt2-how-t">암호화된 트래픽</text>
            </g>
            <path className="tp-flow" d="M172 82 h54" stroke="var(--focus)" strokeWidth="3" strokeDasharray="7 8" />
            <path d="M222 75 l9 7 -9 7" stroke="var(--focus)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <g>
              <rect x="242" y="38" width="160" height="88" rx="12" fill="var(--focus)" fillOpacity="0.09" stroke="var(--focus)" strokeWidth="2.5" />
              <g className="tp-fv-rows" fill="var(--focus)">
                <rect x="258" y="56" width="56" height="10" rx="5" fillOpacity="0.55" />
                <rect x="322" y="56" width="36" height="10" rx="5" fillOpacity="0.4" />
                <rect x="258" y="74" width="42" height="10" rx="5" fillOpacity="0.45" />
                <rect x="308" y="74" width="62" height="10" rx="5" fillOpacity="0.3" />
                <rect x="258" y="92" width="74" height="10" rx="5" fillOpacity="0.5" />
              </g>
              <text x="322" y="24" textAnchor="middle" className="pt2-how-t">헤더만 읽고</text>
              <text x="322" y="144" textAnchor="middle" className="pt2-how-c">보낸 시각, 크기, 방향</text>
            </g>
            <path className="tp-flow d2" d="M414 82 h54" stroke="var(--focus)" strokeWidth="3" strokeDasharray="7 8" />
            <path d="M464 75 l9 7 -9 7" stroke="var(--focus)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <g>
              <rect x="484" y="38" width="150" height="88" rx="12" fill="#1b1130" stroke="#c6d0e2" strokeWidth="2.5" />
              <g className="tp-grid" transform="translate(498, 50)">
                <rect x="0" y="0" width="29" height="15" fill="#440154" /><rect x="31" y="0" width="29" height="15" fill="#2a788e" />
                <rect x="62" y="0" width="29" height="15" fill="#7ad151" /><rect x="93" y="0" width="29" height="15" fill="#414487" />
                <rect x="0" y="17" width="29" height="15" fill="#22a884" /><rect x="31" y="17" width="29" height="15" fill="#fde725" />
                <rect x="62" y="17" width="29" height="15" fill="#440154" /><rect x="93" y="17" width="29" height="15" fill="#2a788e" />
                <rect x="0" y="34" width="29" height="15" fill="#414487" /><rect x="31" y="34" width="29" height="15" fill="#7ad151" />
                <rect x="62" y="34" width="29" height="15" fill="#22a884" /><rect x="93" y="34" width="29" height="15" fill="#fde725" />
                <rect x="0" y="51" width="29" height="15" fill="#2a788e" /><rect x="31" y="51" width="29" height="15" fill="#440154" />
                <rect x="62" y="51" width="29" height="15" fill="#414487" /><rect x="93" y="51" width="29" height="15" fill="#7ad151" />
              </g>
              <text x="559" y="24" textAnchor="middle" className="pt2-how-t">그림으로 바꿔 판별하고</text>
            </g>
            <path className="tp-flow d3" d="M646 82 h54" stroke="var(--focus)" strokeWidth="3" strokeDasharray="7 8" />
            <path d="M696 75 l9 7 -9 7" stroke="var(--focus)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <g>
              <rect x="716" y="38" width="192" height="88" rx="12" fill="#fff" stroke="#c6d0e2" strokeWidth="2.5" />
              <rect className="tp-prob" x="732" y="54" width="118" height="12" rx="6" fill="#dc2626" />
              <rect className="tp-prob p2" x="732" y="74" width="74" height="12" rx="6" fill="var(--focus)" fillOpacity="0.4" />
              <rect className="tp-prob p3" x="732" y="94" width="46" height="12" rx="6" fill="var(--focus)" fillOpacity="0.24" />
              <text x="812" y="24" textAnchor="middle" className="pt2-how-t">근거까지 내놓습니다</text>
              <text x="812" y="144" textAnchor="middle" className="pt2-how-c">공격 유형별 확률과 판단 이유</text>
            </g>
          </svg>
        </div>

        <div className="cap">
          {CAPS.map((c) => (
            <div className="cap-item" key={c.en}>
              <span className="cap-ic"><CapIcon k={c.ic} /></span>
              <b>{c.en}</b>
              <span className="cap-ko">{c.ko}</span>
              <p><Flow>{c.d}</Flow></p>
            </div>
          ))}
        </div>

        <div className="cap2">
          <div className="cap2-item">
            <span className="cap-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l-2.5 7H8.5z" /><path d="M12 10v6" /><path d="M8 21h8" /><path d="M12 16a2.5 2.5 0 0 1 2.5 2.5V21h-5v-2.5A2.5 2.5 0 0 1 12 16Z" />
              </svg>
            </span>
            <div className="cap2-t">
              <b>Lightweight</b>
              <span className="cap-ko">도입 부담이 가볍습니다</span>
            </div>
            <div className="cap2-body">
              <p>
                <Flow>
                  여기서 말하는 가벼움은 모델을 깎아 성능을 포기했다는 뜻이 아닙니다.
                  도입하는 쪽이 새로 들여야 할 장비와 저장 공간이 없다는 뜻입니다.
                </Flow>
              </p>
              <div className="lw-cmp">
                <div className="lw-side old">
                  <span>기존 방식</span>
                  <ul>
                    <li>지나간 패킷을 원본 그대로 저장해 두고 열어 봅니다</li>
                    <li>트래픽이 늘면 저장 공간이 그만큼 같이 늘어납니다</li>
                    <li>복호화 방식은 키를 맡기고 전용 장비를 따로 세워야 합니다</li>
                  </ul>
                </div>
                <div className="lw-side new">
                  <span>제로-클라</span>
                  <ul>
                    <li>플로우 통계만 읽기 때문에 저장해 둘 원본이 없습니다</li>
                    <li>입력이 작아 일반 서버의 CPU에서 그대로 돕니다</li>
                    <li>전용 어플라이언스도 복호화 장비도 필요하지 않습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="cap2-item">
            <span className="cap-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h9M4 12h6M4 17h9" /><circle cx="17.5" cy="9" r="4" /><path d="M15.8 9.2l1.2 1.2 2.3-2.6" />
              </svg>
            </span>
            <div className="cap2-t">
              <b>Verified PoC</b>
              <span className="cap-ko">연동 실증</span>
            </div>
            <p>
              <Flow>
                탐지로 끝나지 않고 차단까지 이어지는지를 실제로 확인했습니다.
                네 개 집행 지점에 대해 판정을 각 플랫폼의 정책 형식으로 바꾸고 산출물까지 검증했습니다.
                가정이 아니라 그 자리에서 재현해 보여 드릴 수 있는 결과입니다.
              </Flow>
            </p>
          </div>
        </div>

        <h3 className="pt2-sub-head lp-head">
          실시간으로 분석하면서 이만큼 씁니다
          <LiveBadge />
        </h3>
        <p className="pt2-note-line">
          <Flow>
            아래 값은 관제 콘솔이 실시간으로 분석하며 스스로 측정한 값입니다.
            zero-cla.cloud 에 접속하시면 지금 이 순간에도 같은 값을 직접 확인하실 수 있습니다.
          </Flow>
        </p>
        <LivePerf />
      </section>
      )}

      {/* 07 매출 전망 */}
      {show("s7") && (
      <section id="sec-s7" className="pt2-sec">
        <Head n="06" en="THE BUSINESS" title="매출 전망" sub="엔진 공급 계약을 기준으로 한 시장별 시나리오입니다" />

        <div className="bz-lead">
          <b>국내에서 먼저 증명하고<br />그 증명을 자격 삼아 해외로 나아갑니다</b>
          <p>
            <Flow>
              지금까지 말씀드린 관제 콘솔과 방화벽 연동이 1단계 제품입니다.
              국내 기관과 기업에 직접 공급해 실환경에서 돌아간 기록을 쌓습니다.
              해외 벤더는 논문이 아니라 실제 현장에서 몇 달을 돌려 본 기록을 보고 판단합니다.
              그 기록이 쌓이면 우리 탐지 엔진을 그들의 제품 안에 넣는 이야기를 시작할 수 있습니다.
            </Flow>
          </p>
        </div>

        <div className="bz-how">
          <div className="bz-step">
            <span className="bz-n">01</span>
            <svg viewBox="0 0 96 64" className="bz-ic" fill="none" aria-hidden="true">
              <rect x="6" y="10" width="84" height="48" rx="6" stroke="currentColor" strokeWidth="2.4" />
              <rect x="6" y="10" width="84" height="12" rx="6" fill="currentColor" fillOpacity="0.14" />
              <rect x="16" y="30" width="30" height="6" rx="3" fill="currentColor" fillOpacity="0.5" />
              <rect x="16" y="42" width="46" height="6" rx="3" fill="currentColor" fillOpacity="0.3" />
              <circle cx="76" cy="42" r="8" fill="currentColor" fillOpacity="0.25" />
            </svg>
            <b>Build</b>
            <span className="bz-when now">지금 하는 일</span>
            <p>관제 콘솔과 방화벽 연동까지 갖춘 완제품을 만듭니다. 지금 보고 계신 화면입니다.</p>
          </div>
          <div className="bz-step">
            <span className="bz-n">02</span>
            <svg viewBox="0 0 96 64" className="bz-ic" fill="none" aria-hidden="true">
              <rect x="10" y="8" width="52" height="48" rx="6" stroke="currentColor" strokeWidth="2.4" />
              <path d="M24 34 l10 10 l20 -22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="76" cy="20" r="10" fill="currentColor" fillOpacity="0.18" />
              <circle cx="76" cy="44" r="10" fill="currentColor" fillOpacity="0.1" />
            </svg>
            <b>Validate</b>
            <span className="bz-when">2027년 목표</span>
            <p>국내 기관과 기업 현장에 넣어 실트래픽으로 검증하고 첫 레퍼런스를 만듭니다.</p>
          </div>
          <div className="bz-step">
            <span className="bz-n">03</span>
            <svg viewBox="0 0 96 64" className="bz-ic" fill="none" aria-hidden="true">
              <rect x="8" y="10" width="46" height="44" rx="6" stroke="currentColor" strokeWidth="2.4" strokeDasharray="5 5" />
              <rect x="58" y="20" width="30" height="24" rx="5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="2.4" />
              <path d="M40 32 h14" stroke="currentColor" strokeWidth="2.6" strokeDasharray="4 4" />
              <path d="M50 27 l6 5 -6 5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <b>Modularize</b>
            <span className="bz-when">2028년 이후 계획</span>
            <p>국내에서 검증을 마친 뒤 탐지 부분만 따로 떼어 다른 제품에 붙일 수 있는 형태로 다듬습니다.</p>
          </div>
          <div className="bz-step">
            <span className="bz-n">04</span>
            <svg viewBox="0 0 96 64" className="bz-ic" fill="none" aria-hidden="true">
              <rect x="6" y="8" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2.2" />
              <rect x="6" y="36" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2.2" />
              <rect x="66" y="22" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2.2" />
              <rect x="40" y="26" width="16" height="12" rx="3" fill="currentColor" fillOpacity="0.3" />
              <path d="M30 18 h10 M30 46 h10 M56 32 h10" stroke="currentColor" strokeWidth="2.2" strokeDasharray="4 4" />
            </svg>
            <b>Supply</b>
            <span className="bz-when">2029년 이후 계획</span>
            <p>관제 사업자와 해외 벤더의 제품 안에 우리 엔진이 들어가는 것이 목표입니다. ipoque와 Qosmos가 같은 길을 먼저 걸었습니다.</p>
          </div>
        </div>

        <RevenuePlan />
        <p className="bz-assume-lite">
          엔진 공급 계약 구조라 인원이 매출에 비례해 늘지 않습니다.
          목표 고객과 단가와 확보 속도는 가정값이고 산출 근거와 보수 시나리오는 부록에 실었습니다.
        </p>

        <h3 className="pt2-sub-head">사회적 책임 활동 (CSR)</h3>
        <div className="gv">
          <div className="gv-main">
            <strong>영업이익의 <b>10%</b></strong>
            <span className="gv-t">인재 양성과 후속 연구에 재투자합니다</span>
            <svg className="gv-art" viewBox="0 0 240 140" fill="none" aria-hidden="true">
              {/* 학사모 */}
              <path d="M120 24 210 56 120 88 30 56Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" />
              <path d="M64 68v26c0 8 25 15 56 15s56-7 56-15V68" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              {/* 술 */}
              <path d="M203 60v30" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
              <path d="M203 90c-6 0-10 5-10 11v8c0 5 4 9 10 9s10-4 10-9v-8c0-6-4-11-10-11Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
              {/* 책 */}
              <path d="M52 116h56M132 116h56" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" opacity="0.45" />
              <path d="M40 132h160" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" opacity="0.25" />
            </svg>
          </div>
          <ul className="gv-list">
            <li>
              <b>Reinvestment</b>
              <span>
                <Flow>
                  국내 500대 기업의 사회공헌 지출은 세전이익의 2.8% 수준입니다.
                  저희가 말하는 10%는 기부금이 아니라 산학 장학과 연구 지원과 교육용 공개를 포함한 재투자입니다.
                  기술 기업이 매출의 5%에서 15%를 연구개발에 쓰는 것과 같은 성격입니다.
                </Flow>
              </span>
            </li>
            <li>
              <b>Research</b>
              <span>
                <Flow>
                  대학 연구실과의 공동 연구 그리고 연구비와 장학 지원이 대상입니다.
                  네트워크를 넘어 로봇과 자율주행 같은 피지컬 AI 환경까지 연구 범위를 넓히는 것이 목표입니다.
                </Flow>
              </span>
            </li>
          </ul>
        </div>
        <p className="pt2-src strong">한국경제인협회 2025 주요 기업의 사회적 가치 보고서, 353개사 2024년 지출 기준</p>
      </section>
      )}

      {/* 시연 영상 — 매출 전망 뒤에서 마지막으로 보여 준다 */}
      {show("s65") && (
      <section id="sec-s65" className="pt2-sec">
        <Head n="07" en="LIVE DEMO" title="시연 영상" sub="앞에서 말씀드린 제품이 실제로 도는 모습을 처음부터 끝까지 담았습니다" />
        <DemoVideo />
      </section>
      )}

      {/* 마무리 — 표지에서 선언한 세 단어와 벤 다이어그램으로 끝인사 */}
      {show("s9") && (
      <section id="sec-s9" className="pt2-sec pt2-thanks">
        <div className="tk-wrap">
          <div className="tk-row">
            <span className="tk-brand">
              <BrandMark width={170} />
              <em>ZERO-CLA</em>
            </span>
            <GapVenn cap="" />
          </div>
          <p className="tk-cap">이 셋을 함께 가진 제품은 오늘 제로-클라가 처음입니다</p>
          <h2 className="tk-thanks">Thank You!</h2>
        </div>
      </section>
      )}

      {show("s8") && (
      <section id="sec-s8" className="pt2-sec">
        <Head n="A" en="APPENDIX" title="부록" sub="질의응답 근거를 사업화 A 와 기술 B 로 나눠 담았습니다" />

        <h3 className="pt2-sub-head">A1. 고객 구조 — 수요와 과금은 다른 층입니다</h3>
        <div className="ap-scn">
          <div className="ap-scn-c">
            <span className="ap-scn-k">수요</span>
            <strong>민감정보를 다루는 기업</strong>
            <span className="ap-scn-s">유출되면 과징금과 영업정지가 걸리는 곳. 이 기능을 먼저 찾는 쪽입니다</span>
          </div>
          <div className="ap-scn-c base">
            <span className="ap-scn-k">과금</span>
            <strong>관제 사업자 · 보안 벤더</strong>
            <span className="ap-scn-s">그 기업들을 이미 지키고 있는 사업자. 저희 엔진을 자기 서비스에 얹어 팝니다</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">우리</span>
            <strong>엔진 공급 계약</strong>
            <span className="ap-scn-s">계약 한 건이 닿는 고객사가 여럿이라 40명 규모로 멀리 갑니다</span>
          </div>
        </div>
        <p className="ap-caveat">
          <Flow>
            트래픽 복사본만 받는 구조라 기존 관제 환경에 얹기 쉽다는 점이 이 구조의 전제입니다.
            최종 기업을 한 곳씩 직접 뚫는 것보다 이미 수십 곳을 지키는 사업자를 통하는 편이 같은 인원으로 멀리 갑니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">A2. 첫 고객 확보 — 세 갈래</h3>
        <div className="ap-scn">
          <div className="ap-scn-c base">
            <span className="ap-scn-k">1</span>
            <strong>무상 PoC</strong>
            <span className="ap-scn-s">멘토와 국내 VC를 통해 중간 규모 기업을 소개받아 진행. 미러 트래픽만 받아 서비스 중단 위험이 없어 허락받기 쉽습니다</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">2</span>
            <strong>클라우드 마켓플레이스</strong>
            <span className="ap-scn-s">영업 인력 없이 접점을 만드는 경로. 무상 PoC와 동시에 진행합니다</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">3</span>
            <strong>연구센터 협력망</strong>
            <span className="ap-scn-s">제로트러스트 클라우드 보안 연구센터의 협력 기관을 통한 공공 레퍼런스</span>
          </div>
        </div>

        <h3 className="pt2-sub-head">A3. 초기 자금 — 정부 지원과 창업경진대회</h3>
        <div className="ap-tbl">
          <div className="ap-tbl-h">
            <span>경로</span><span>규모</span><span>일정</span><span>상태</span>
          </div>
          <div className="ap-tbl-r">
            <b>올해의 K-스타트업 2026</b>
            <span>왕중왕전 총상금 8.9억 원 · 최대 5억 원</span>
            <span>접수 2026.3.27 ~ 8.31</span>
            <i className="ap-st ok">접수 중</i>
          </div>
          <div className="ap-tbl-r">
            <b>예비창업패키지</b>
            <span>평균 0.4억 원 · 1단계 2천만 원</span>
            <span>2026년 접수 3.26 마감</span>
            <i className="ap-st plan">다음 차수 준비</i>
          </div>
        </div>
        <p className="pt2-src strong">중소벤처기업부 K-Startup 공고 기준. 2026년부터 도전 K-스타트업에서 올해의 K-스타트업으로 명칭 변경</p>
        <p className="ap-caveat">
          <Flow>
            전용 하드웨어를 만들지 않아 초기 비용 자체가 크지 않습니다.
            필요한 것은 인건비와 클라우드 비용이고 위 두 경로로 충당하는 계획입니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">A4. 매출 목표가 과한 숫자인지 확인하는 방법</h3>
        <div className="bz-check">
          <div className="bz-check-k">
            <span>판단 기준</span>
            <b>배수가 아니라 1인당 매출로 봅니다</b>
            <p>
              <Flow>
                첫해 매출이 작으면 어떤 회사든 성장 배수는 커집니다.
                그래서 배수 대신 인원으로 나눈 값이 업계 어디쯤인지를 봤습니다.
                2030년 38명 기준 1인당 매출은 약 2.9억 원입니다.
                국내 정보보안 부문의 산업 평균 2.97억 원과 거의 같은 자리입니다.
              </Flow>
            </p>
          </div>
          <div className="bz-check-v">
            <div className="bz-safe">
              <span className="bz-safe-k">계획의 절반만 맞았을 때</span>
              <strong>약 {CONSERVATIVE.total}억 원</strong>
              <span className="bz-safe-s">1인당 약 {CONSERVATIVE.perHead}억 원으로 국내 상장 보안기업 하단과 같아집니다</span>
            </div>
            <div className="bz-assume-grid">
              <div><span>목표 고객</span><b>{ASSUME.targetFirms}곳</b></div>
              <div><span>계약 단가</span><b>{ASSUME.unitPrice}억 원</b></div>
              <div><span>2030년 확보</span><b>40곳</b></div>
              <div><span>2030년 인원</span><b>38명</b></div>
            </div>
          </div>
        </div>
        <p className="ap-lead">
          <Flow>
            국내 보안기업의 공개 실적을 같은 방식으로 계산해 나란히 놓았습니다.
            우리 계획은 산업 평균과 거의 같고 국내 상장사 상단보다 조금 높으며 글로벌 선두보다는 낮습니다.
          </Flow>
        </p>
        <PerHeadChart />
        <p className="pt2-src strong">
          상장사 값은 2025년 매출을 공개된 직원 수로 나눈 계산값입니다.
          산업 평균은 과학기술정보통신부와 KISIA의 2025년 국내 정보보호산업 실태조사에서 정보보안 부문 매출 7조 1,244억 원을 같은 부문 종사자 23,987명으로 나눈 값입니다
        </p>
        <p className="ap-caveat">
          <Flow>
            분모의 정의가 서로 다르다는 점은 밝혀 둡니다.
            실태조사의 종사자는 정보보호 업무 인력이고 상장사 값은 회사 전체 임직원입니다.
            그래서 산업 평균 2.97억 원은 기업 단위 값보다 높게 잡히는 성질이 있습니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">A5. 매출 가정의 분해와 세 가지 시나리오</h3>
        <div className="ap-scn">
          <div className="ap-scn-c">
            <span className="ap-scn-k">보수</span>
            <strong>약 55억 원</strong>
            <span className="ap-scn-s">국내 20곳 확보. 해외는 계획의 절반</span>
            <span className="ap-scn-p">1인당 약 1.5억 원</span>
          </div>
          <div className="ap-scn-c base">
            <span className="ap-scn-k">기준</span>
            <strong>약 110억 원</strong>
            <span className="ap-scn-s">국내 40곳 확보. 발표에 쓰는 값</span>
            <span className="ap-scn-p">1인당 약 2.9억 원</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">전제</span>
            <strong>60곳 × 0.8억</strong>
            <span className="ap-scn-s">관제 사업자와 보안 벤더를 합친 국내 목표 고객군</span>
            <span className="ap-scn-p">국내 정보보안 사업체 876곳 중 추림 · 모수 재산정 중</span>
          </div>
        </div>
        <p className="ap-caveat">
          <Flow>
            2030년 국내 매출 32억 원은 국내 정보보안 시장 7조 1,244억 원의 0.045%입니다.
            시장을 얼마나 가져오느냐로 보면 작은 조각이고 배수로 보면 커 보이는 숫자입니다.
            판단 기준을 어디에 두느냐의 문제라고 봅니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">A6. 인원 계획을 38명으로 잡은 이유</h3>
        <div className="ap-staff">
          {["2027", "2028", "2029", "2030"].map((y, i) => {
            const rev = PLAN_STACK[i].total;
            const n = PLAN_STAFF[y];
            return (
              <div className="ap-staff-c" key={y}>
                <b>{y}</b>
                <strong>{n}명</strong>
                <span>1인당 {(rev / n).toFixed(2)}억</span>
              </div>
            );
          })}
        </div>
        <p className="ap-caveat">
          <Flow>
            1인당 매출이 0.27억에서 2.9억까지 4년에 걸쳐 올라가는 형태입니다.
            초기에는 인원이 매출을 앞서고 후반에 뒤집힙니다.
            엔진을 만들어 파는 구조라 고객이 늘어도 사람이 같은 비율로 늘지 않는다는 가정이 여기에 들어가 있습니다.
            100명에서 300명 규모의 중기업은 이 계획 다음 단계로 봅니다.
            2030년까지 38명으로 검증을 마치고 그다음에 인원을 늘리는 순서입니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">A7. 경쟁 공백을 읽는 두 가지 방법</h3>
        <div className="ap-scope">
          <div className="ap-scope-c can">
            <span className="ap-scope-k">강점으로 읽으면</span>
            <ul>
              <li>세 조건을 동시에 갖춘 제품이 확인 범위에 없습니다</li>
              <li>기존 강자는 풀패킷 저장 위에 매출 구조가 서 있어 방향을 바꾸기 어렵습니다</li>
              <li>저희는 잃을 것이 없어 처음부터 이 구조로 설계했습니다</li>
            </ul>
          </div>
          <div className="ap-scope-c cant">
            <span className="ap-scope-k">약점으로 읽으면</span>
            <ul>
              <li>검증된 경쟁자가 없다는 것은 시장 수요의 증거도 아직 없다는 뜻입니다</li>
              <li>그래서 다음 단계는 판매가 아니라 무상 PoC입니다</li>
              <li>수요를 먼저 확인하고 그다음에 값을 매깁니다</li>
            </ul>
          </div>
        </div>
        <p className="ap-caveat">
          <Flow>
            세계 최초라는 표현은 쓰지 않습니다.
            무복호화 탐지 자체는 2017년 JA3 지문과 Cisco ETA가 이미 시작했습니다.
            저희 주장은 무복호화와 판단 근거 제시와 경량 세 가지의 교집합입니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">A8. 사회 공헌 10%의 성격</h3>
        <p className="ap-lead">
          <Flow>
            국내 500대 기업의 사회공헌 지출은 세전이익의 2.8% 수준입니다.
            저희가 말하는 10%는 영업이익 기준이고 기부금이 아니라 재투자입니다.
            산학 장학과 공동 연구비와 교육용 공개가 대상입니다.
            비교 대상을 기부금 통계가 아니라 기술 기업의 연구개발비 비중으로 잡아야 성격이 맞습니다.
          </Flow>
        </p>
        <p className="pt2-src strong">한국경제인협회 2025 주요 기업의 사회적 가치 보고서, 353개사 2024년 지출 기준</p>

        <h3 className="pt2-sub-head">A9. 가장 가까운 경쟁자와의 거리</h3>
        <div className="ap-tbl five">
          <div className="ap-tbl-h">
            <span>제품</span><span>무복호화</span><span>판단 근거 제시</span><span>장비 부담</span><span>가장 큰 차이</span>
          </div>
          {RIVALS.map((r) => (
            <div className={`ap-tbl-r${r.us ? " us" : ""}`} key={r.name}>
              <b>{r.name}</b>
              <i className={`ap-mk m${r.v[0]}`}>{MARK[r.v[0]]}</i>
              <i className={`ap-mk m${r.v[1]}`}>{MARK[r.v[1]]}</i>
              <i className={`ap-mk m${r.v[2]}`}>{MARK[r.v[2]]}</i>
              <span>{r.gap}</span>
            </div>
          ))}
        </div>
        <p className="pt2-src strong">각 벤더의 공식 제품 문서와 공개된 재무 자료를 기준으로 정리했습니다</p>
        <p className="ap-caveat">
          <Flow>
            NG-NDR은 아직 시장조사 기관이 정의한 카테고리가 아닙니다.
            저희가 세 조건을 묶어 부르는 이름이고 그 점을 먼저 밝힙니다.
            NGFW도 처음에는 없던 이름이었고 조건이 먼저 정의된 뒤에 카테고리가 생겼습니다.
          </Flow>
        </p>
        <p className="ap-caveat">
          <Flow>
            기존 업체도 비슷한 문제를 풀고 있지 않으냐는 질문에는 이렇게 답합니다.
            일부는 비슷한 방향으로 가고 있습니다.
            다만 저희가 확인한 범위에서는 세 조건을 동시에 만족하는 제품을 찾지 못했습니다.
            개별 벤더의 최신 릴리스까지 전부 확인하지는 못했으니 그 부분은 더 확인해 보겠습니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">A10. 인용한 시장 자료의 발행 시점</h3>
        <div className="ap-src">
          <div>
            <b>MarketsandMarkets</b>
            <span>2026년 7월판. 기준연도 2025년 39.1억 달러. 2026년 43.4억 달러에서 2031년 72.9억 달러. 연평균 10.9%. 북미 42.1%</span>
            <i className="ap-fresh now">최신판</i>
          </div>
          <div>
            <b>Valuates Reports</b>
            <span>2024년 9월 발표. 2023년 24.9억 달러에서 2029년 53.7억 달러. 연평균 13.7%</span>
            <i className="ap-fresh old">발표 후 약 2년 경과</i>
          </div>
          <div>
            <b>과학기술정보통신부와 KISIA</b>
            <span>2025년 국내 정보보호산업 실태조사. 2025년 11월 발표. 2024년 실적 기준</span>
            <i className="ap-fresh now">최신판</i>
          </div>
        </div>
        <p className="ap-caveat">
          <Flow>
            두 기관의 조사 시점이 다르고 산정 범위도 다릅니다.
            그래서 하나로 합치지 않고 겹치는 구간에서 방향이 같다는 점만 근거로 씁니다.
            Valuates 값은 지나온 구간을 보여 주는 용도이고 앞으로의 전망은 최신판인 MarketsandMarkets를 씁니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">B1. 대규모 트래픽 구간에서의 확장</h3>
        <div className="ap-scn">
          <div className="ap-scn-c base">
            <span className="ap-scn-k">지금 측정값의 분해</span>
            <strong>8.31초 = 6.67 + 1.64</strong>
            <span className="ap-scn-s">3,000 플로우 기준. 전처리(파일 읽기와 이미지 변환) 6.67초에 모델 추론은 1.64초. 병목은 모델이 아니라 전처리입니다</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">구조적 여유</span>
            <strong>플로우 단위 · 완전 병렬</strong>
            <span className="ap-scn-s">패킷이 아니라 플로우를 처리해 건수가 몇 자릿수 적고 플로우 사이 의존성이 없어 코어를 늘리면 거의 선형으로 늘어납니다</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">확장 로드맵</span>
            <strong>스트리밍 · 분산 · 계층 필터</strong>
            <span className="ap-scn-s">배치를 스트리밍으로. 수집기를 구간별 분산으로. 가벼운 1차 필터로 걸러 의심 건만 모델에 넣는 계층 구조로</span>
          </div>
        </div>
        <p className="ap-caveat">
          <Flow>
            대규모 실환경에서의 실측은 아직 없습니다.
            지금 값은 공개 데이터셋 기준이고 그것이 무상 PoC에서 확인할 첫 번째 항목입니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">B2. 저장 부담의 크기</h3>
        <p className="ap-lead">
          <Flow>
            플로우 기반 데이터는 일반적으로 전체 트래픽 용량의 0.2% 수준으로 알려져 있습니다.
            풀패킷 저장 대비 약 500분의 1 규모입니다.
            저희는 그 플로우에서 뽑은 통계만 쓰므로 저장 부담은 그보다 더 작아집니다.
          </Flow>
        </p>
        <p className="pt2-src strong">Progress Flowmon 기술 문서의 플로우 데이터 일반 수치 기준. 자사 환경 실측값은 PoC 단계에서 제시합니다</p>

        <h3 className="pt2-sub-head">B3. 오탐을 줄인다는 말의 범위</h3>
        <div className="ap-scope">
          <div className="ap-scope-c can">
            <span className="ap-scope-k">할 수 있는 것</span>
            <ul>
              <li>왜 그렇게 판단했는지 히트맵으로 되돌려 줍니다</li>
              <li>판단에 크게 쓰인 관찰 항목을 순서대로 제시합니다</li>
              <li>유형별 확률을 함께 내놓아 1등과 2등의 차이를 보여 줍니다</li>
              <li>담당자가 경보를 확인하는 데 걸리는 시간을 줄입니다</li>
            </ul>
          </div>
          <div className="ap-scope-c cant">
            <span className="ap-scope-k">할 수 없는 것</span>
            <ul>
              <li>이 경보가 오탐인지 아닌지 저희가 판정하지는 못합니다</li>
              <li>오탐률을 몇 퍼센트 낮춘다는 수치는 제시하지 않습니다</li>
              <li>현장 트래픽에서의 성능은 아직 측정하지 못했습니다</li>
            </ul>
          </div>
        </div>
        <p className="ap-caveat">
          <Flow>
            오탐 여부는 그 조직의 정상 트래픽이 무엇인지를 아는 현장이 판정합니다.
            저희가 약속할 수 있는 것은 그 판정을 빠르게 만드는 것까지입니다.
            숫자로 오탐 감소율을 말하지 않는 이유가 여기에 있습니다.
          </Flow>
        </p>

        <h3 className="pt2-sub-head">B4. 경량이라는 말의 범위</h3>
        <p className="ap-lead">
          <Flow>
            모델을 깎았다는 뜻이 아니라 도입하는 쪽의 부담이 없다는 뜻입니다.
            풀패킷 저장형은 지나간 원본을 그대로 쌓지만 저희는 플로우에서 뽑은 통계값만 봅니다.
            그래서 별도 스토리지와 복호화 장비가 필요하지 않습니다.
          </Flow>
        </p>
        <div className="ap-scn">
          <div className="ap-scn-c">
            <span className="ap-scn-k">지금 사실</span>
            <strong>원본 미저장</strong>
            <span className="ap-scn-s">플로우 통계만 입력으로 씁니다. 패킷 본문은 저장하지도 열지도 않습니다</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">지금 사실</span>
            <strong>복호화 0바이트</strong>
            <span className="ap-scn-s">복호화 키를 받을 통로가 설계상 없습니다. 고객이 키를 넘길 이유가 없습니다</span>
          </div>
          <div className="ap-scn-c">
            <span className="ap-scn-k">추후 계획</span>
            <strong>모델 자체 경량화</strong>
            <span className="ap-scn-s">양자화와 프루닝은 아직 적용하지 않았습니다. 현장 장비 기준을 맞추는 단계에서 진행합니다</span>
          </div>
        </div>

        <h3 className="pt2-sub-head">B5. 학습과 검증에 쓴 데이터</h3>
        <div className="ap-tbl">
          <div className="ap-tbl-h">
            <span>데이터셋</span><span>기관</span><span>상태</span><span>여기서 확인하는 것</span>
          </div>
          {DATASET_ROWS.map((d) => (
            <div className="ap-tbl-r" key={d.name}>
              <b>{d.name}</b>
              <span>{d.org}</span>
              <i className={`ap-st ${d.st}`}>{d.stKo}</i>
              <span>{d.what}</span>
            </div>
          ))}
        </div>
        <p className="ap-caveat">
          <Flow>
            공개 데이터셋에서 되는 것과 현장에서 되는 것은 다르다고 보고 있습니다.
            그래서 현장 검증을 연구 과제가 아니라 사업 1단계로 잡았습니다.
            분류 체계가 전혀 다른 데이터셋에서도 같은 절차가 동작하면 특정 데이터에 종속되지 않는다는 근거가 됩니다.
          </Flow>
        </p>


      </section>
      )}    </div>
    </div>
  );
}
