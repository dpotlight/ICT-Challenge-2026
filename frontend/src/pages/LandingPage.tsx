import { useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/Brand";
import { Mesh } from "../components/Mesh";

/* 로고 이미지가 없으면 텍스트 마크로 대신 표시 */
function LogoSlot({ src, alt, text, sub, h = 46 }: { src: string; alt: string; text: string; sub?: string; h?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="foot-mark">
        <b>{text}</b>
        {sub && <small>{sub}</small>}
      </span>
    );
  }
  return <img src={src} alt={alt} style={{ height: h }} onError={() => setFailed(true)} />;
}

/* 푸터 로고 한 세트 (마퀴에서 두 번 반복) */
function FootLogoSet() {
  return (
    <div className="foot-set">
      <span className="only-light">
        <LogoSlot src="/logos/dku_v_blue.png?v=13" alt="단국대학교" text="단국대학교" sub="Dankook University" h={40} />
      </span>
      <span className="only-dark">
        <LogoSlot src="/logos/dku_h_white.png?v=13" alt="단국대학교" text="단국대학교" sub="Dankook University" h={38} />
      </span>
      <LogoSlot src="/logos/csos.png?v=13" alt="CSOS Lab" text="CSOS Lab" sub="Dankook University" h={40} />
      <span className="pnu-slot">
        <LogoSlot src="/logos/pnu.png?v=13" alt="부산대학교" text="부산대학교" sub="Pusan National University" h={52} />
      </span>
      <span className="csrc-slot">
        <LogoSlot
          src="/logos/ztcsrc.png?v=13"
          alt="제로트러스트 클라우드 보안 연구센터"
          text="제로트러스트 클라우드 보안 연구센터"
          sub="ZeroTrust Cloud Security Research Center"
          h={42}
        />
      </span>
    </div>
  );
}

/* ── 스토리 섹션용 손그림 요소 ── */
function Squiggle() {
  return (
    <svg className="sq" width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden="true">
      <path
        d="M4 18 C 22 4 30 24 48 14 C 60 7 62 22 82 14 C 100 7 112 16 146 10"
        stroke="currentColor" strokeWidth="6" strokeLinecap="round"
      />
    </svg>
  );
}

function Sparkles() {
  return (
    <svg className="spark" width="34" height="30" viewBox="0 0 34 30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M8 8 L12 12 M12 8 L8 12" />
      <path d="M26 4 L26 10 M23 7 L29 7" />
    </svg>
  );
}

/* 일러스트 1: 열지 않는 탐지 (관제 화면 + 렌즈 스캔) */
function ArtScan() {
  return (
    <svg className="story-svg" viewBox="0 0 560 440" fill="none" aria-hidden="true">
      <rect x="52" y="34" width="456" height="372" rx="44" fill="currentColor" fillOpacity="0.08" />
      <rect x="76" y="58" width="456" height="372" rx="44" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6" strokeDasharray="6 9" />
      {/* 관제 카드 */}
      <g>
        <rect x="112" y="96" width="336" height="248" rx="18" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
        <line x1="112" y1="138" x2="448" y2="138" stroke="#e2e8f3" strokeWidth="2" />
        <circle cx="136" cy="117" r="4.5" fill="#c6d0e2" />
        <circle cx="152" cy="117" r="4.5" fill="#c6d0e2" />
        <rect x="168" y="112" width="90" height="10" rx="5" fill="#e2e8f3" />
        <rect x="398" y="109" width="34" height="16" rx="8" fill="currentColor" fillOpacity="0.16" />
        {/* 플로우 행 */}
        <g className="anim-drift">
          <rect x="132" y="156" width="118" height="13" rx="6.5" fill="#e7ecf5" />
          <rect x="258" y="156" width="56" height="13" rx="6.5" fill="#e7ecf5" />
          <rect x="322" y="156" width="86" height="13" rx="6.5" fill="#e7ecf5" />
        </g>
        <g className="anim-drift d2">
          <rect x="132" y="182" width="74" height="13" rx="6.5" fill="#dde4f0" />
          <rect x="214" y="182" width="120" height="13" rx="6.5" fill="#dde4f0" />
          <rect x="342" y="182" width="52" height="13" rx="6.5" fill="#dde4f0" />
        </g>
        {/* 하이라이트 행 (위협 플로우) */}
        <g>
          <rect x="126" y="206" width="308" height="26" rx="9" fill="currentColor" fillOpacity="0.1" />
          <rect x="136" y="213" width="96" height="12" rx="6" fill="currentColor" fillOpacity="0.55" />
          <rect x="242" y="213" width="58" height="12" rx="6" fill="currentColor" fillOpacity="0.3" />
          <rect className="anim-hot" x="386" y="211" width="38" height="16" rx="8" fill="#dc2626" />
        </g>
        <g className="anim-drift d3">
          <rect x="132" y="246" width="102" height="13" rx="6.5" fill="#e7ecf5" />
          <rect x="242" y="246" width="66" height="13" rx="6.5" fill="#e7ecf5" />
          <rect x="316" y="246" width="92" height="13" rx="6.5" fill="#e7ecf5" />
        </g>
        <g className="anim-drift d2">
          <rect x="132" y="272" width="84" height="13" rx="6.5" fill="#dde4f0" />
          <rect x="224" y="272" width="110" height="13" rx="6.5" fill="#dde4f0" />
        </g>
        <rect x="132" y="302" width="180" height="13" rx="6.5" fill="#e7ecf5" />
        {/* 스캔 라인 */}
        <rect className="anim-scan" x="122" y="148" width="3.5" height="182" rx="1.75" fill="currentColor" opacity="0.5" />
      </g>
      {/* 렌즈 */}
      <g className="anim-bob">
        <circle cx="404" cy="222" r="52" stroke="currentColor" strokeWidth="7" fill="#ffffff" fillOpacity="0.15" />
        <line x1="442" y1="262" x2="478" y2="300" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
        <path d="M394 222 v-9 a10 10 0 0 1 20 0 v9" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <rect x="388" y="222" width="32" height="24" rx="6" fill="currentColor" />
      </g>
      {/* 방패 체크 */}
      <g className="anim-pop">
        <path d="M136 320 l26 -10 26 10 v20 c0 16 -12 26 -26 32 -14 -6 -26 -16 -26 -32 Z" fill="#fff" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M150 340 l8 9 16 -18" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* 일러스트 2: 근거를 보여주는 판정 (히트맵 + 확률 그래프) */
function ArtExplain() {
  const cells: { x: number; y: number; o: number }[] = [];
  const xs = [0, 30, 60, 90, 120];
  xs.forEach((cx, i) =>
    xs.forEach((cy, j) => {
      if (i === 2 && j === 2) return;
      cells.push({ x: cx, y: cy, o: [0.08, 0.2, 0.34, 0.14, 0.26][(i * 3 + j * 2) % 5] });
    })
  );
  return (
    <svg className="story-svg" viewBox="0 0 560 440" fill="none" aria-hidden="true">
      <rect x="52" y="34" width="456" height="372" rx="44" fill="currentColor" fillOpacity="0.08" />
      <rect x="28" y="58" width="456" height="372" rx="44" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6" strokeDasharray="6 9" />
      {/* 히트맵 카드 */}
      <g>
        <rect x="96" y="92" width="222" height="252" rx="18" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
        <rect x="118" y="114" width="92" height="11" rx="5.5" fill="#e2e8f3" />
        <g className="hm" transform="translate(122, 142)">
          {cells.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width="26" height="26" rx="6" fill="currentColor" fillOpacity={c.o} />
          ))}
        </g>
        <rect className="anim-hot" x="182" y="202" width="26" height="26" rx="6" fill="#dc2626" />
        <rect x="122" y="300" width="150" height="10" rx="5" fill="#e7ecf5" />
        <rect x="122" y="318" width="108" height="10" rx="5" fill="#e7ecf5" />
      </g>
      {/* 확률 그래프 카드 */}
      <g className="anim-bob">
        <rect x="336" y="120" width="152" height="196" rx="18" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
        <rect x="356" y="140" width="76" height="11" rx="5.5" fill="#e2e8f3" />
        <rect className="anim-type" x="356" y="168" width="112" height="14" rx="7" fill="currentColor" fillOpacity="0.85" />
        <rect className="anim-type t2" x="356" y="192" width="74" height="14" rx="7" fill="currentColor" fillOpacity="0.45" />
        <rect className="anim-type t3" x="356" y="216" width="52" height="14" rx="7" fill="currentColor" fillOpacity="0.28" />
        <rect className="anim-type t4" x="356" y="240" width="34" height="14" rx="7" fill="currentColor" fillOpacity="0.16" />
        <rect x="356" y="272" width="96" height="9" rx="4.5" fill="#e7ecf5" />
        <rect x="356" y="288" width="70" height="9" rx="4.5" fill="#e7ecf5" />
        <g className="anim-pop">
          <circle cx="472" cy="132" r="19" fill="currentColor" />
          <path d="M463 132 l6 7 13 -14" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {/* 연결선 */}
      <path className="anim-dashline" d="M318 218 C 328 218 326 218 336 218" stroke="currentColor" strokeWidth="3" strokeDasharray="6 7" opacity="0.6" />
    </svg>
  );
}

/* 일러스트 3: 가볍게 어디서나 (경량 모델 + 실시간 처리) */
function ArtLight() {
  return (
    <svg className="story-svg" viewBox="0 0 560 440" fill="none" aria-hidden="true">
      <rect x="52" y="34" width="456" height="372" rx="44" fill="currentColor" fillOpacity="0.08" />
      <rect x="76" y="58" width="456" height="372" rx="44" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6" strokeDasharray="6 9" />
      {/* 모델 압축: 큰 블록 → 작은 블록 */}
      <g>
        <rect x="112" y="112" width="118" height="118" rx="16" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
        <g fill="#dde4f0">
          <rect x="128" y="128" width="24" height="24" rx="6" />
          <rect x="158" y="128" width="24" height="24" rx="6" />
          <rect x="188" y="128" width="24" height="24" rx="6" />
          <rect x="128" y="158" width="24" height="24" rx="6" />
          <rect x="158" y="158" width="24" height="24" rx="6" />
          <rect x="188" y="158" width="24" height="24" rx="6" />
          <rect x="128" y="188" width="24" height="24" rx="6" />
          <rect x="158" y="188" width="24" height="24" rx="6" />
          <rect x="188" y="188" width="24" height="24" rx="6" />
        </g>
        <path className="anim-dashline" d="M244 171 h44" stroke="currentColor" strokeWidth="3.5" strokeDasharray="7 8" />
        <path d="M282 162 l12 9 -12 9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <g className="anim-pop">
          <rect x="306" y="140" width="62" height="62" rx="13" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="2.5" />
          <path d="M342 152 L328 178 h9 L331 200 L351 172 h-10 L349 152 Z" fill="currentColor" />
        </g>
      </g>
      {/* 게이트웨이 장비 + 전파 */}
      <g>
        <circle className="anim-ping" cx="404" cy="192" r="34" stroke="currentColor" strokeWidth="2.5" />
        <circle className="anim-ping p2" cx="404" cy="192" r="34" stroke="currentColor" strokeWidth="2.5" />
        <line x1="404" y1="170" x2="404" y2="196" stroke="#8894ab" strokeWidth="4" strokeLinecap="round" />
        <circle cx="404" cy="166" r="6" fill="#fff" stroke="#8894ab" strokeWidth="3.5" />
      </g>
      <g>
        <rect x="128" y="268" width="308" height="76" rx="16" fill="#fff" stroke="#c6d0e2" strokeWidth="2" />
        <circle className="anim-blink" cx="156" cy="290" r="5.5" fill="currentColor" />
        <circle className="anim-blink d2" cx="176" cy="290" r="5.5" fill="currentColor" fillOpacity="0.5" />
        <circle className="anim-blink d3" cx="196" cy="290" r="5.5" fill="currentColor" fillOpacity="0.3" />
        <rect x="148" y="312" width="130" height="11" rx="5.5" fill="#e7ecf5" />
        {/* 실시간 스파크라인 */}
        <path
          className="anim-spark"
          d="M300 322 l16 -12 14 8 16 -18 14 10 18 -14 14 6 16 -10"
          stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
      {/* 좌우 기기 연결 */}
      <path className="anim-dashline" d="M128 306 C 96 306 88 348 84 366" stroke="#aab6cc" strokeWidth="3" strokeDasharray="6 8" fill="none" />
      <path className="anim-dashline d2" d="M436 306 C 468 306 476 348 480 366" stroke="#aab6cc" strokeWidth="3" strokeDasharray="6 8" fill="none" />
      <rect x="62" y="362" width="44" height="30" rx="7" fill="#fff" stroke="#aab6cc" strokeWidth="3" />
      <path d="M458 384 a13 13 0 0 1 5 -25 a17 17 0 0 1 33 4 a11 11 0 0 1 -1 22 Z" fill="#fff" stroke="#aab6cc" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/* 도입 부담 — 흐르는 트래픽에서 필요한 값만 걸러 기존 장비에 얹고
   원본을 쌓아 두는 스토리지는 새로 들이지 않는다는 대비 구도. */
function ArtNoBox() {
  const cells = Array.from({ length: 44 }, (_, i) => ({
    x: 318 + (i % 11) * 16,
    y: 92 + Math.floor(i / 11) * 16,
    i,
  }));
  return (
    <svg className="story-svg" viewBox="0 0 560 440" fill="none" aria-hidden="true">
      <rect x="52" y="34" width="456" height="372" rx="44" fill="currentColor" fillOpacity="0.08" />
      <rect x="76" y="58" width="456" height="372" rx="44" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6" strokeDasharray="6 9" />

      {/* 흐르는 트래픽 → 걸러내기 → 44칸 */}
      <g>
        <path className="anim-dashline" d="M104 128 H232" stroke="currentColor" strokeWidth="3.5" strokeDasharray="7 9" />
        <path
          d="M242 98 H310 L284 140 V172 L268 180 V140 Z"
          fill="#fff" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"
        />
        <g>
          {cells.map((c) => (
            <rect
              key={c.i}
              className={c.i % 7 === 0 ? "anim-blink" : c.i % 5 === 0 ? "anim-blink d2" : undefined}
              x={c.x} y={c.y} width="12" height="12" rx="3"
              fill="currentColor" fillOpacity={c.i % 3 === 0 ? 0.42 : 0.2}
            />
          ))}
        </g>
        <path className="anim-dashline d2" d="M292 152 H312" stroke="currentColor" strokeWidth="3" strokeDasharray="5 7" />
      </g>

      {/* 왼쪽 — 이미 있는 장비 안에 엔진만 꽂는다 */}
      <g>
        <rect x="102" y="238" width="172" height="128" rx="14" fill="#fff" stroke="#c6d0e2" strokeWidth="2.4" />
        <rect x="116" y="254" width="144" height="26" rx="6" fill="#eef2f8" />
        <rect x="116" y="288" width="144" height="26" rx="6" fill="#eef2f8" />
        <circle className="anim-blink" cx="130" cy="267" r="4.5" fill="#8894ab" />
        <circle className="anim-blink d3" cx="130" cy="301" r="4.5" fill="#8894ab" />
        <rect x="116" y="322" width="144" height="28" rx="6" stroke="currentColor" strokeWidth="2.2" strokeDasharray="6 6" />
        <g className="anim-pop">
          <rect x="150" y="326" width="76" height="20" rx="5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.4" />
          <path d="M186 330 l-9 11 h6 l-4 9 13 -13 h-6 Z" fill="currentColor" />
        </g>
        <path d="M188 214 v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M180 224 l8 10 8 -10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* 오른쪽 — 원본을 쌓아 두는 저장 장치는 늘리지 않는다 */}
      <g opacity="0.55">
        <g stroke="#aab6cc" strokeWidth="2.4" strokeDasharray="7 7" fill="#fff">
          <rect x="330" y="316" width="152" height="46" rx="10" />
          <rect x="330" y="272" width="152" height="46" rx="10" />
          <rect x="330" y="228" width="152" height="46" rx="10" />
        </g>
        <g fill="#c6d0e2">
          <circle cx="352" cy="339" r="5" />
          <circle cx="352" cy="295" r="5" />
          <circle cx="352" cy="251" r="5" />
        </g>
        <g fill="#dde4f0">
          <rect x="370" y="334" width="88" height="10" rx="5" />
          <rect x="370" y="290" width="88" height="10" rx="5" />
          <rect x="370" y="246" width="88" height="10" rx="5" />
        </g>
      </g>
      <g stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity="0.85">
        <path d="M348 244 L466 348" />
        <path d="M466 244 L348 348" />
      </g>
    </svg>
  );
}

const STORIES: Array<{ tone: string; title: string; lead: JSX.Element; points: string[]; to?: string; label?: string; art: JSX.Element }> = [
  {
    tone: "blue",
    title: "복호화 없는 탐지",
    lead: (
      <>
        패킷을 <em>복호화하지 않고</em> 암호화 트래픽 속 위협을 판별합니다.
      </>
    ),
    points: [
      "페이로드를 복호화하지 않으므로 개인정보와 통신 기밀이 그대로 보호됩니다.",
      "헤더와 타이밍에 남은 행동의 흔적만으로 Botnet과 DDoS 같은 위협을 찾아냅니다.",
    ],
    to: "/theory",
    label: "기술 원리 보기",
    art: <ArtScan />,
  },
  {
    tone: "violet",
    title: "근거를 보여주는 판정",
    lead: (
      <>
        탐지로 끝나지 않고 왜 위협인지 <em>근거까지</em> 설명합니다.
      </>
    ),
    points: [
      "Grad-CAM 히트맵이 판정에 기여한 트래픽 특징을 시각적으로 짚어줍니다.",
      "자연어 설명과 클래스 확률을 함께 제시해 관제 담당자가 바로 판단할 수 있습니다.",
    ],
    to: "/console",
    label: "관제 콘솔 열기",
    art: <ArtExplain />,
  },
  {
    tone: "teal",
    title: "장비를 새로 들이지 않아도 됩니다",
    lead: (
      <>
        판별에 기여하는 관찰 항목만 남겨 입력을 줄였고 그만큼 <em>도입 부담</em>도 줄었습니다.
      </>
    ),
    points: [
      "제로-클라 프레임워크가 플로우에서 뽑아내는 피처 가운데 판별에 실제로 기여하는 것만 골라 씁니다.",
      "원본 패킷을 저장하지 않기 때문에 따로 들일 스토리지가 없습니다.",
      "[추후 계획] 양자화와 프루닝을 더해 현장 장비 기준을 맞춥니다.",
    ],
    art: <ArtNoBox />,
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── 풀스크린 히어로 ── */}
      <section className="hero-full">
        <Mesh />
        <div className="hero-inner">
          <BrandMark width={132} />
          <h1 className="hero-brand">ZERO-CLA</h1>
          <div className="hero-cap">Encrypted Traffic Threat Detection</div>
          <p className="hero-slogan">복호화 없이, 잡는다</p>
          <p className="hero-desc">
            <span>내용은 열지 않고 행동의 흔적만으로 위협을 가려냅니다</span>
            <span>왜 그렇게 판단했는지 근거까지 함께 내놓습니다</span>
          </p>
          <div className="cta-row">
            <Link to="/console" className="cta primary">
              관제 콘솔 열기
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
              </svg>
            </Link>
            <Link to="/theory" className="cta ghost">기술 알아보기</Link>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span className="sc-t">스크롤을 내려 어떻게 만들었는지 확인해 보세요</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7.5 10 13.5 16 7.5" />
          </svg>
        </div>
      </section>

      {/* ── 핵심 기능: 글 + 일러스트 교차 스토리 ── */}
      <div className="land-body">
        <div className="land-sec story-head">
          <span className="sec-eyebrow">WHY ZERO CLA</span>
          <h2>무엇이 다른가</h2>
          <p className="sec-lead">복호화 없이 탐지하고 근거까지 설명하는 암호화 트래픽 보안</p>
        </div>
        {STORIES.map((s, i) => (
          <section key={s.title} className={`story tone-${s.tone} ${i % 2 === 1 ? "rev" : ""}`}>
            <div className="story-inner">
              <div className="story-copy">
                <div className="story-title">
                  <Sparkles />
                  <h3>{s.title}</h3>
                  <Squiggle />
                </div>
                <p className="story-lead">{s.lead}</p>
                <ul className="story-points">
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {s.to && s.label && (
                  <Link to={s.to} className="story-btn">
                    {s.label}
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
                    </svg>
                  </Link>
                )}
              </div>
              <div className="story-art">{s.art}</div>
            </div>
          </section>
        ))}

      </div>

      {/* ── 소속 기관 푸터 ── */}
      <footer className="site-foot">
        <div className="foot-marquee" aria-label="참여 기관">
          <div className="foot-track">
            <FootLogoSet />
            <FootLogoSet aria-hidden />
          </div>
        </div>
        <div className="foot-band">
          <div className="fb-brand">
            <BrandMark width={44} />
            <div className="fb-name">
              <b>ZERO-CLA</b>
              <span>Encrypted Traffic Threat Detection</span>
            </div>
          </div>
          <span className="fb-copy">© 2026 Team 제로-클라. All Rights Reserved.</span>
        </div>
      </footer>
    </div>
  );
}
