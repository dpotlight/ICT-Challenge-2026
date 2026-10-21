import React from "react";

/* 화면이 하얗게 죽는 대신 에러 내용을 보여주는 안전망 */
export class Boundary extends React.Component<
  { children: React.ReactNode },
  { err: Error | null }
> {
  state = { err: null as Error | null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error("[zerocla] 렌더링 오류:", err, info.componentStack);
  }

  render() {
    if (this.state.err) {
      return (
        <div style={{ maxWidth: 720, margin: "80px auto", padding: 24 }}>
          <h2 style={{ marginBottom: 12 }}>화면을 그리는 중 오류가 발생했습니다</h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: 16,
              fontSize: 13,
            }}
          >
            {String(this.state.err?.stack || this.state.err)}
          </pre>
          <button className="btn" style={{ marginTop: 14 }} onClick={() => location.reload()}>
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
