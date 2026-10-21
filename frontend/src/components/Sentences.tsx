import { Children, Fragment, isValidElement, type ReactNode } from "react";

/**
 * 줄바꿈 기준은 온점(.)이다.
 * 한 문장은 통째로 흐르고 다음 문장은 새 줄에서 시작한다.
 * 문장이 한 줄을 넘길 때만 keep-all 로 어절 단위로 접힌다.
 */
const SPLIT = /(?<=\.)\s+/;

export function S({ t }: { t: string }) {
  const lines = t.split(SPLIT).filter(Boolean);
  return (
    <>
      {lines.map((l, i) => (
        <span className="ln" key={i}>
          {l}
        </span>
      ))}
    </>
  );
}

/** 굵은 글씨 등이 섞인 문단도 같은 규칙으로 나눈다 */
export function Flow({ children }: { children: ReactNode }) {
  // <>...</> 로 감싸 온 경우 안쪽을 펼친다
  let nodes = Children.toArray(children);
  if (nodes.length === 1 && isValidElement(nodes[0]) && nodes[0].type === Fragment) {
    nodes = Children.toArray((nodes[0].props as { children?: ReactNode }).children);
  }

  const lines: ReactNode[][] = [[]];
  const push = (n: ReactNode) => lines[lines.length - 1].push(n);

  nodes.forEach((node, ni) => {
    if (typeof node === "string") {
      const parts = node.split(SPLIT);
      parts.forEach((p, i) => {
        if (i > 0) lines.push([]);
        if (p) push(<Fragment key={`${ni}-${i}`}>{p}</Fragment>);
      });
    } else {
      push(<Fragment key={ni}>{node}</Fragment>);
    }
  });

  return (
    <>
      {lines
        .filter((l) => l.length > 0)
        .map((l, i) => (
          <span className="ln" key={i}>
            {l}
          </span>
        ))}
    </>
  );
}

export default S;
