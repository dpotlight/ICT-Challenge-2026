import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { CLASS_COLORS } from "../types";

/** 캡처 스트립 — 세션 전체를 한 줄로 압축한 판정 미니맵.
 *
 *  수집 순서대로 왼쪽에서 오른쪽으로 흐른다. 스크롤 없이 공격이 어느 구간에
 *  몰려 있는지 보인다.
 *
 *  세션을 1플로우 1픽셀로 그린 그림을 폭에 맞춰 축소한 것과 같게 만든다.
 *  칸 하나가 플로우 여러 개를 묶을 때(3,000행이면 약 11.5건) 두 가지를 피해야 한다.
 *    · 하나라도 공격이면 칸을 통째로 칠하기 → 실제 30%가 76%로 부풀었다.
 *    · 공격 비율만큼 높이를 칠하기 → 100행 세션은 색 띠, 3,000행 세션은 막대그래프로
 *      보여 같은 칸에 두 가지 차트가 섞였다.
 *  그래서 칸은 항상 높이를 다 채우고, **색의 진하기**로 그 구간의 공격 비율을 나타낸다.
 *  칸당 플로우가 1건인 세션에서는 진하기가 0 또는 100%뿐이라 예전의 또렷한 색 띠와
 *  같아진다. 축소해도 표현 방식이 한 가지로 유지된다.
 */
const RISK = ["Benign", "Web", "Infiltration", "Brute Force", "Botnet", "DoS", "DDoS"];
const MIN_MIX = 22; // 1건이라도 있으면 최소 이만큼 섞는다 — 묶는 과정에서 사라지지 않게

export default function CaptureStrip({
  uploadId,
  bins = 260,
  onPick,
}: {
  uploadId: string;
  bins?: number;
  onPick?: (row: number) => void;
}) {
  const strip = useQuery({
    queryKey: ["strip", uploadId],
    queryFn: () => api.strip(uploadId),
  });

  if (strip.isLoading) return <div className="strip" aria-hidden />;
  if (!strip.data) return null;

  const { classes, seq } = strip.data;
  const n = seq.length;
  const width = Math.min(bins, n);
  const per = n / width;

  const cells: { span: number; atk: number; cls: string; row: number }[] = [];
  for (let i = 0; i < width; i++) {
    const a = Math.floor(i * per);
    const b = Math.max(a + 1, Math.min(n, Math.floor((i + 1) * per)));

    let atk = 0;
    let worst = 0;
    let worstRow = a; // 칸을 누르면 그 구간에서 가장 위험한 플로우로 들어간다
    const count = new Map<string, number>();
    for (let k = a; k < b; k++) {
      const name = classes[seq[k]];
      if (name === "Benign") continue;
      atk++;
      count.set(name, (count.get(name) ?? 0) + 1);
      const rank = RISK.indexOf(name);
      if (rank > worst) {
        worst = rank;
        worstRow = k;
      }
    }

    // 구간을 대표하는 색은 그 구간에서 가장 많이 나온 공격 유형
    let cls = "";
    let top = 0;
    count.forEach((v, k) => {
      if (v > top) {
        top = v;
        cls = k;
      }
    });

    cells.push({ span: b - a, atk, cls, row: worstRow });
  }

  const attacks = seq.filter((c) => classes[c] !== "Benign").length;
  const ratio = n ? (attacks / n) * 100 : 0;

  return (
    <div className="strip-wrap">
      <div
        className="strip"
        role="img"
        aria-label={`플로우 ${n}건 중 공격 ${attacks}건의 수집 순서 분포`}
      >
        {cells.map((c, i) => {
          if (c.atk === 0) {
            return (
              <i
                key={i}
                title={`#${c.row} · ${c.span}건 모두 정상`}
                onClick={() => onPick?.(c.row)}
              />
            );
          }
          const frac = c.atk / c.span;
          const mix = Math.round(Math.max(frac * 100, MIN_MIX));
          const col = CLASS_COLORS[c.cls] ?? "var(--muted)";
          return (
            <i
              key={i}
              title={`#${c.row} · ${c.span}건 중 공격 ${c.atk}건 (${Math.round(frac * 100)}%) · ${c.cls}`}
              style={{ background: `color-mix(in oklab, ${col} ${mix}%, var(--panel-2))` }}
              onClick={() => onPick?.(c.row)}
            />
          );
        })}
      </div>
      <span className="strip-legend">
        {n.toLocaleString()} flows · 공격 {attacks.toLocaleString()} ({ratio.toFixed(0)}%)
      </span>
    </div>
  );
}
