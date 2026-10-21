import { S, Flow } from "../components/Sentences";
type Status = "done" | "current" | "planned";

/* 날짜와 문구는 여기서 자유롭게 수정하세요 */
const MILESTONES: Array<{ date: string; status: Status; title: string; desc: string; img?: string }> = [
  {
    date: "2026.03",
    status: "done",
    title: "연구 착수",
    desc: "플로우 통계를 이미지로 바꿔 판별하는 구조를 설계했습니다.",
  },
  {
    date: "2026.06",
    status: "done",
    title: "ITRC 학생창의자율과제 최우수상",
    desc: "암호화 트래픽 탐지 연구로 최우수상을 받았습니다.",
    img: "/awards/itrc.jpg?v=13",
  },
  {
    date: "2026.06",
    status: "done",
    title: "KCC 2026 Oral Session 발표",
    desc: "구두 발표로 연구 결과를 학계에 공개했습니다.",
    img: "/awards/kcc.jpg?v=13",
  },
  {
    date: "2026.07",
    status: "done",
    title: "ICT 챌린지 2026 예선 통과",
    desc: "예선 심사를 통과해 결선에 진출했습니다.",
    img: "/awards/ict.jpg?v=13",
  },
  {
    date: "2026.08.20",
    status: "current",
    title: "결선 발표",
    desc: "대한상공회의소에서 라이브 데모와 함께 발표합니다.",
  },
  {
    date: "2026 하반기",
    status: "planned",
    title: "탐지 범위 확장",
    desc: "다른 데이터셋을 더해 판별할 수 있는 공격 유형을 넓힙니다. 판별에 기여하지 않는 관찰 항목을 걷어내는 작업도 함께 진행하며 그 결과로 도입하는 쪽의 장비 부담이 줄어듭니다.",
  },
  {
    date: "2027 상반기",
    status: "planned",
    title: "국내 실환경 검증",
    desc: "협력 기관을 확보해 실제 트래픽으로 성능을 확인합니다. 첫 레퍼런스가 여기서 나옵니다.",
  },
  {
    date: "2027",
    status: "planned",
    title: "완제품 공급 시작",
    desc: "관제 콘솔과 방화벽 연동을 갖춘 완제품으로 국내에 공급합니다.",
  },
  {
    date: "2029",
    status: "planned",
    title: "엔진 공급 전환",
    desc: "검증된 탐지 엔진을 모듈로 떼어 글로벌 벤더의 제품 안에 공급합니다.",
  },
];

const LEFT_X = 540;
const RIGHT_X = 820;
const TOP_Y = 80;
const STEP_Y = 224;
const VW = 1480;
const CARD_W = 452;
const GAP = 62;

function pt(i: number): [number, number] {
  return [i % 2 === 0 ? LEFT_X : RIGHT_X, TOP_Y + i * STEP_Y];
}

function roadPath(totalHeight: number): string {
  const n = MILESTONES.length;
  const [x0, y0] = pt(0);
  let d = `M ${x0} -40 L ${x0} ${y0}`;
  for (let i = 1; i < n; i++) {
    const [x, y] = pt(i);
    const [, py] = pt(i - 1);
    d += ` C ${pt(i - 1)[0]} ${py + STEP_Y * 0.55}, ${x} ${y - STEP_Y * 0.55}, ${x} ${y}`;
  }
  const [xl, yl] = pt(n - 1);
  d += ` L ${xl} ${totalHeight + 40}`;
  return d;
}

function Pin({ x, y, status }: { x: number; y: number; status: Status }) {
  if (status === "done") {
    return (
      <g>
        <circle cx={x} cy={y} r="30" fill="var(--focus)" />
        <path
          d={`M ${x - 11} ${y + 1} l 7.5 7.5 l 15 -15`}
          fill="none"
          stroke="#fff"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (status === "current") {
    return (
      <g>
        <circle cx={x} cy={y} r="39" fill="none" stroke="var(--alert)" strokeWidth="2.5" opacity="0.5" />
        <circle cx={x} cy={y} r="30" fill="var(--alert)" />
        <circle cx={x} cy={y} r="9.5" fill="#fff" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={x} cy={y} r="30" fill="var(--panel)" stroke="var(--line)" strokeWidth="2.5" />
      <circle cx={x} cy={y} r="8" fill="var(--line)" />
    </g>
  );
}

const STATUS_KO: Record<Status, string> = { done: "완료", current: "진행 중", planned: "예정" };

export default function RoadmapPage() {
  const height = TOP_Y + (MILESTONES.length - 1) * STEP_Y + 90;

  return (
    <div className="roadmap">
      <section className="hero compact">
        <h1>로드맵</h1>
        <p className="sub wide"><Flow>
          제로-클라가 걸어온 길과 나아갈 길입니다. 연구에서 출발해 수상과 학술 발표로 검증받았고 이제 실환경 배치와 사업화를 향해 갑니다.
        </Flow></p>
        <div className="rm-legend">
          <span><i className="dotc done" /> 완료</span>
          <span><i className="dotc current" /> 진행 중</span>
          <span><i className="dotc planned" /> 예정</span>
        </div>
      </section>

      {/* 데스크톱: 구불구불한 길 */}
      <div className="rm-road">
        <svg viewBox={`0 0 ${VW} ${height}`} width="100%" role="img" aria-label="로드맵 타임라인">
          <path d={roadPath(height)} fill="none" stroke="var(--road)" strokeWidth="78" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={roadPath(height)}
            fill="none"
            stroke="var(--road-line)"
            strokeWidth="4"
            strokeDasharray="22 18"
            strokeLinecap="round"
          />
          {MILESTONES.map((m, i) => {
            const [x, y] = pt(i);
            const left = x === LEFT_X;
            const cardX = left ? x - GAP - CARD_W : x + GAP;
            return (
              <g key={i}>
                <line
                  x1={left ? x - 32 : x + 32}
                  y1={y}
                  x2={left ? x - GAP + 4 : x + GAP - 4}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth="2"
                />
                <Pin x={x} y={y} status={m.status} />
                <foreignObject x={cardX} y={y - 70} width={CARD_W} height={m.img ? 424 : 172}>
                  <div className={`rm-card ${left ? "r" : ""} ${m.status}`}>
                    <span className="rm-date">{m.date}</span>
                    <b>{m.title}</b>
                    <p><S t={m.desc} /></p>
                    {m.img && <img className="rm-card-img" src={m.img} alt={m.title} loading="lazy" />}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 모바일: 세로 타임라인 */}
      <div className="rm-list">
        {MILESTONES.map((m, i) => (
          <div key={i} className={`rm-item ${m.status}`}>
            <div className="rm-rail">
              <i className={`dotc ${m.status}`} />
              {i < MILESTONES.length - 1 && <span className="rm-bar" />}
            </div>
            <div className="rm-card">
              <span className="rm-date">
                {m.date} <em>{STATUS_KO[m.status]}</em>
              </span>
              <b>{m.title}</b>
              <p><S t={m.desc} /></p>
              {m.img && <img className="rm-card-img" src={m.img} alt={m.title} loading="lazy" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
