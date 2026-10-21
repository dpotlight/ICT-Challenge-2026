/* 클라우드와 네트워크, 보안 검문을 표현한 장식용 배경. 순수 SVG라 가볍다 */
type P = [number, number];

const CLOUD_L: P[] = [[185, 128], [258, 96], [330, 140], [252, 172]];
const CLOUD_R: P[] = [[905, 132], [980, 100], [1052, 146], [972, 178]];
const EDGES: P[] = [[120, 470], [340, 496], [620, 508], [900, 496], [1120, 470]];
const SHIELD: P = [620, 300];

function Cloud({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path
        d="M -96 28 a34 34 0 0 1 4 -66 a46 46 0 0 1 88 -14 a38 38 0 0 1 66 26 a30 30 0 0 1 -8 54 z"
        fill="var(--mesh-cloud)"
        stroke="var(--mesh-line-strong)"
        strokeWidth="1.4"
      />
    </g>
  );
}

function Device({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="var(--mesh-line-strong)" fill="var(--mesh-cloud)" strokeWidth="1.4">
      <rect x={x - 17} y={y - 12} width="34" height="24" rx="4" />
      <line x1={x - 10} y1={y + 18} x2={x + 10} y2={y + 18} strokeLinecap="round" />
    </g>
  );
}

export function Mesh({ className = "mesh" }: { className?: string }) {
  const [sx, sy] = SHIELD;
  return (
    <svg className={className} viewBox="0 0 1240 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* 링크: 클라우드 사이(암호화 터널)와 단말 연결 */}
      <g stroke="var(--mesh-line)" strokeWidth="1.2">
        {CLOUD_L.map((p, i) => CLOUD_L.slice(i + 1).map((q, j) => (
          <line key={`l${i}${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />
        )))}
        {CLOUD_R.map((p, i) => CLOUD_R.slice(i + 1).map((q, j) => (
          <line key={`r${i}${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />
        )))}
        {EDGES.map((e, i) => (
          <line key={`e${i}`} x1={e[0]} y1={e[1] - 14} x2={sx} y2={sy + 62} />
        ))}
        <line x1={CLOUD_L[3][0]} y1={CLOUD_L[3][1]} x2={sx - 24} y2={sy - 40} />
        <line x1={CLOUD_R[3][0]} y1={CLOUD_R[3][1]} x2={sx + 24} y2={sy - 40} />
      </g>
      {/* 암호화 터널: 점선 */}
      <g stroke="var(--mesh-hot)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="7 9">
        <line x1={CLOUD_L[1][0] + 40} y1={CLOUD_L[1][1]} x2={CLOUD_R[0][0] - 40} y2={CLOUD_R[0][1]} />
      </g>
      {/* 흐르는 패킷 */}
      <g stroke="var(--mesh-hot)" strokeWidth="2" strokeLinecap="round">
        <line className="mesh-flow" x1={CLOUD_L[3][0]} y1={CLOUD_L[3][1]} x2={sx - 24} y2={sy - 40} />
        <line className="mesh-flow d2" x1={CLOUD_R[3][0]} y1={CLOUD_R[3][1]} x2={sx + 24} y2={sy - 40} />
        <line className="mesh-flow d3" x1={EDGES[1][0]} y1={EDGES[1][1] - 14} x2={sx} y2={sy + 62} />
      </g>

      {/* 클라우드 두 덩어리 */}
      <Cloud cx={CLOUD_L[1][0]} cy={CLOUD_L[1][1] + 46} />
      <Cloud cx={CLOUD_R[1][0]} cy={CLOUD_R[1][1] + 46} s={0.92} />
      <g fill="var(--mesh-node)">
        {[...CLOUD_L, ...CLOUD_R].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.4" />
        ))}
      </g>

      {/* 단말들 */}
      {EDGES.map(([x, y], i) => (
        <Device key={i} x={x} y={y} />
      ))}

      {/* 중앙 검문 방패와 자물쇠 */}
      <g>
        <path
          d={`M ${sx} ${sy - 56} l 52 18 v 44 c 0 38 -23 58 -52 68 c -29 -10 -52 -30 -52 -68 v -44 z`}
          fill="var(--mesh-cloud)"
          stroke="var(--mesh-line-strong)"
          strokeWidth="1.6"
        />
        <g stroke="var(--mesh-node)" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <rect x={sx - 16} y={sy - 6} width="32" height="26" rx="5" fill="var(--mesh-node)" stroke="none" opacity="0.9" />
          <path d={`M ${sx - 9} ${sy - 6} v -8 a9 9 0 0 1 18 0 v 8`} />
        </g>
      </g>
    </svg>
  );
}
