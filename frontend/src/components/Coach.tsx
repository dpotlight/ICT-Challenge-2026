import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** 화면에 처음 들어온 사람에게 볼 순서를 짚어 주는 안내.
 *  화면을 가리지 않도록 대상에 테두리만 두르고 말풍선을 옆에 띄운다. */

export interface CoachStep {
  /** 짚어 줄 요소의 CSS 선택자 */
  sel: string;
  title: string;
  body: string;
  /** 손가락 표시를 붙여 눌러 보라고 안내할 때 */
  click?: boolean;
}

interface Box { top: number; left: number; width: number; height: number }

/* ── 화면에 안내는 언제나 하나만 ──
   목록 화면의 안내가 떠 있는 상태에서 상세 패널을 열면 두 안내가 겹쳐 버린다.
   나중에 뜬 쪽이 사용자가 지금 보고 있는 화면이므로 앞선 안내를 닫고 무대를 가져간다. */
interface Stage { end: () => void }
let onStage: Stage | null = null;
function takeStage(h: Stage) {
  if (onStage && onStage !== h) onStage.end();
  onStage = h;
}
function leaveStage(h: Stage) {
  if (onStage === h) onStage = null;
}

export default function Coach({
  steps,
  storageKey,
  open,
  onClose,
}: {
  steps: CoachStep[];
  /** 한 번 본 사람에게는 다시 띄우지 않기 위한 키 */
  storageKey: string;
  /** 버튼으로 다시 열 때 사용 */
  open?: boolean;
  onClose?: () => void;
}) {
  const [i, setI] = useState<number>(-1);
  const [box, setBox] = useState<Box | null>(null);
  const stage = useRef<Stage>({ end: () => {} });

  /* 처음 들어온 사람에게만 자동으로 시작한다 */
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(storageKey) === "1";
    } catch {
      seen = false;
    }
    if (!seen) {
      const t = setTimeout(() => setI(0), 1200);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  const end = () => {
    setI(-1);
    setBox(null);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* 저장이 막혀 있어도 안내 자체는 동작해야 한다 */
    }
    onClose?.();
  };
  stage.current.end = end;

  /* 떠 있는 동안만 무대를 차지하고 사라지면 비워 준다 */
  useEffect(() => {
    if (i >= 0) takeStage(stage.current);
    else leaveStage(stage.current);
  }, [i]);
  useEffect(() => () => leaveStage(stage.current), []);

  const measure = () => {
    const st = steps[i];
    if (!st) return;
    const el = document.querySelector(st.sel) as HTMLElement | null;
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  useLayoutEffect(() => {
    if (i < 0) return;
    const st = steps[i];
    const el = st && (document.querySelector(st.sel) as HTMLElement | null);
    /* 짚어 주는 대상만 가림막 위로 올려 또렷하게 보이게 한다 */
    if (el) {
      el.classList.add("coach-lift");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    /* 서버 응답이 늦어 대상이 아직 없을 수 있으니 잠깐 동안 계속 다시 찾는다 */
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      const el2 = document.querySelector(steps[i]?.sel ?? "") as HTMLElement | null;
      if (el2) el2.classList.add("coach-lift");
      measure();
      if (el2 || n > 18) clearInterval(iv);
    }, 220);
    const t = setTimeout(measure, 420);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
      document.querySelectorAll(".coach-lift").forEach((n2) => n2.classList.remove("coach-lift"));
      if (el) el.classList.remove("coach-lift");
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (i < 0 || i >= steps.length) return null;
  const st = steps[i];

  /* 말풍선은 대상 아래에 두되 화면 밖으로 나가면 위로 올린다 */
  const W = 430;
  const below = box ? box.top + box.height + 14 : 120;
  const flip = box ? below + 210 > window.innerHeight : false;
  const top = box ? (flip ? Math.max(12, box.top - 210) : below) : 120;
  const left = box ? Math.min(Math.max(12, box.left), window.innerWidth - W - 12) : 40;

  return (
    <>
      <div className="coach-veil" onClick={end} />
      {box && (
        <div
          className="coach-ring"
          style={{ top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12 }}
        >
          {st.click && (
            <span className="coach-hand center" aria-hidden="true">
              <svg viewBox="0 0 30 34" fill="none">
                <path
                  d="M10 16V6.5a2.6 2.6 0 0 1 5.2 0V15m0-1.6a2.4 2.4 0 0 1 4.8 0V16m0-1.4a2.4 2.4 0 0 1 4.8 0v7.6c0 5-3.4 9-8.6 9-4 0-6.2-1.6-8.2-4.6l-3.4-5.2a2.5 2.5 0 0 1 3.9-3l1.5 1.7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#fff"
                />
              </svg>
            </span>
          )}
        </div>
      )}
      <div className="coach" style={{ top, left, width: W }}>
        <span className="coach-n">
          {i + 1} / {steps.length}
        </span>
        <b>{st.title}</b>
        <p>{st.body}</p>
        {st.click && <span className="coach-cta">테두리 안을 눌러 보세요</span>}
        <div className="coach-act">
          {i > 0 && (
            <button className="btn" onClick={() => setI(i - 1)}>
              이전
            </button>
          )}
          <button className="btn primary" onClick={() => (i === steps.length - 1 ? end() : setI(i + 1))}>
            {i === steps.length - 1 ? "확인" : "다음"}
          </button>
        </div>
      </div>
    </>
  );
}
