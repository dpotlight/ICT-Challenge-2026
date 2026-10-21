import { useRef, useState } from 'react'

/* 주소에 판번호를 붙여 브라우저에 남은 옛 응답을 피한다.
   영상을 교체하면 이 숫자만 올리면 된다. */
const REV = "87"
const SRC = `/media/zerocla_demo_67s.mp4?v=${REV}`
const POSTER = `/media/zerocla_demo_poster.jpg?v=${REV}`

type Chapter = { t: number; label: string; note: string }

const CHAPTERS: Chapter[] = [
  { t: 0,     label: "관제 콘솔",  note: "누적 판별 현황과 판정 분포를 봅니다." },
  { t: 3.2,   label: "파일 업로드", note: "분석할 플로우 통계 CSV를 골라 올립니다." },
  { t: 12.85, label: "분석 결과",  note: "3,000 플로우 가운데 1,500건을 공격으로 가려냅니다." },
  { t: 17.65, label: "수집 지점",  note: "DMZ와 내부망 경계에서 복호화 없이 받습니다." },
  { t: 24.65, label: "판단 근거",  note: "트래픽 이미지와 Grad-CAM 히트맵을 함께 보여줍니다." },
  { t: 32.85, label: "기여 항목",  note: "판단에 크게 쓰인 관찰 항목을 순서대로 나열합니다." },
  { t: 48.65, label: "차단 등록",  note: "확인한 플로우를 차단 규칙으로 넘깁니다." },
  { t: 51.55, label: "집행 지점",  note: "여섯 곳의 정책 문법으로 변환해 내려받습니다." },
]

function mmss(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function DemoPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState(false)

  const seek = (i: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = CHAPTERS[i].t
    setActive(i)
    void v.play()
  }

  const onTime = () => {
    const v = videoRef.current
    if (!v) return
    let i = 0
    for (let k = 0; k < CHAPTERS.length; k++) {
      if (v.currentTime >= CHAPTERS[k].t - 0.15) i = k
    }
    setActive(i)
  }

  return (
    <div className="demo-page">
      <header className="demo-head">
        <p className="demo-eyebrow">DEMO</p>
        <h1 className="demo-title">시연 영상</h1>
        <p className="demo-lead">
          암호화된 트래픽을 열지 않고 판별한 뒤 차단 정책까지 내보내는 과정입니다.
          <br />
          실제 화면을 그대로 녹화했고 1분 7초 동안 이어집니다.
        </p>
      </header>

      <div className="demo-stage">
        <video
          ref={videoRef}
          className="demo-video"
          poster={POSTER}
          controls
          muted
          playsInline
          preload="auto"
          onTimeUpdate={onTime}
          onError={() => setFailed(true)}
        >
          <source src={SRC} type="video/mp4" />
        </video>
      </div>

      <ol className="demo-chapters">
        {CHAPTERS.map((c, i) => (
          <li key={c.t}>
            <button
              type="button"
              className={i === active ? 'demo-chip is-active' : 'demo-chip'}
              onClick={() => seek(i)}
            >
              <span className="demo-time">{mmss(c.t)}</span>
              <span className="demo-label">{c.label}</span>
              <span className="demo-note">{c.note}</span>
            </button>
          </li>
        ))}
      </ol>

      {failed && (
        <p className="demo-fallback">
          영상이 재생되지 않으면 <a href={SRC} target="_blank" rel="noreferrer">여기에서 직접 열어</a> 보실 수 있습니다.
        </p>
      )}

      <p className="demo-foot">
        영상 속 수치는 데모 파일 기준입니다.
        <br />
        관제 콘솔에서 직접 CSV를 올려 같은 화면을 확인하실 수 있습니다.
      </p>
    </div>
  )
}
