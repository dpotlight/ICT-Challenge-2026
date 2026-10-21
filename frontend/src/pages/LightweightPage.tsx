/** 경량화 */
export default function LightweightPage() {
  return (
    <div className="doc">
      <h1>경량화</h1>
      <p className="lead">
        저희가 말하는 <b>경량</b>은 막연한 수식어가 아닙니다. 게이트웨이와 엣지 장비의 자원
        예산 안에서 동작 가능한 <b>추론 지연과 CPU 및 메모리 점유율</b>이라는 측정 가능한
        정의입니다. 아무리 정확한 모델도 게이트웨이에 올라가지 못하면 관제실의 그림일
        뿐이니까요.
      </p>

      <div className="stat-band">
        <div className="stat">
          <span className="v">-60%</span>
          <span className="k">복호화 검사를 켠 차세대 방화벽의 평균 처리량 감소 (NSS Labs 실측)</span>
        </div>
        <div className="stat">
          <span className="v">+672%</span>
          <span className="k">같은 조건에서의 응답 지연 증가 (NSS Labs 실측)</span>
        </div>
        <div className="stat accent">
          <span className="v">0회</span>
          <span className="k">제로-클라의 복호화 횟수. 이 비용 자체가 없습니다</span>
        </div>
      </div>

      <div className="panel">
        <h2>기존 접근과의 비교</h2>
        <table className="data cmp">
          <thead>
            <tr><th>구분</th><th>복호화 게이트웨이</th><th>대형 딥러닝 모델</th><th>제로-클라</th></tr>
          </thead>
          <tbody>
            <tr><td>페이로드 접근</td><td>전부 열람</td><td>모델에 따라 다름</td><td className="good">열지 않음</td></tr>
            <tr><td>처리 비용</td><td>처리량 60% 감소</td><td>GPU 서버 필요</td><td className="good">게이트웨이 자원 예산 내</td></tr>
            <tr><td>판단 근거</td><td>시그니처 매칭</td><td>블랙박스</td><td className="good">히트맵과 피처쌍 제시</td></tr>
            <tr><td>미관리 단말 적용</td><td>인증서 주입 불가로 원리적 불가</td><td>가능</td><td className="good">가능</td></tr>
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>모델을 장비 예산에 맞추는 3단계</h2>
        <div className="stat-band" style={{ marginBottom: 0, marginTop: 8 }}>
          <div className="stat">
            <span className="v" style={{ fontSize: 20 }}>INT8 양자화</span>
            <span className="k">가중치 정밀도를 8비트로 줄여 연산량과 메모리를 낮춥니다</span>
          </div>
          <div className="stat">
            <span className="v" style={{ fontSize: 20 }}>프루닝</span>
            <span className="k">판정 기여가 낮은 연결을 잘라내 모델을 홀쭉하게 만듭니다</span>
          </div>
          <div className="stat">
            <span className="v" style={{ fontSize: 20 }}>ONNX 변환</span>
            <span className="k">경량 런타임으로 이식해 다양한 장비에서 같은 모델을 돌립니다</span>
          </div>
        </div>
        <p style={{ marginTop: 14 }}>
          압축 후에도 F1이 유지되는지를 추론 지연과 처리량, 자원 점유율 실측과 함께
          검증합니다. 비교 기준선은 복호화 기반 검사 장비와 FT-Transformer 같은 대형 딥러닝
          모델입니다. 실측 수치는 분석 대시보드의 성능 게이지에서 그대로 확인할 수 있습니다.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>복호화가 아예 불가능한 곳들<span className="h-sub">인증서를 심을 수 없는 단말</span></h2>
        <div className="lw-chips">
          <div className="lw-chip"><b>BYOD</b><small>미관리 개인 단말</small></div>
          <div className="lw-chip"><b>IoT 센서</b><small>펌웨어 수정 불가</small></div>
          <div className="lw-chip"><b>OT 설비</b><small>가동 중단 불가</small></div>
          <div className="lw-chip"><b>커넥티드카</b><small>폐쇄 플랫폼</small></div>
        </div>
        <p style={{ marginTop: 12 }}>
          복호화 기반 제품은 이 영역에서 경쟁자가 아니라 <b>진입 자체가 불가능</b>합니다.
          자원 제약까지 심해 무복호화와 경량성이 동시에 필요한, 제로-클라의 두 강점이
          함께 성립하는 시장입니다.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>샘플 효율성<span className="h-sub">학습 데이터 5%만으로</span></h2>
        <table className="data cmp">
          <thead>
            <tr><th>학습 데이터</th><th>제로-클라 (CNN)</th><th>MLP 비교군</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>100%</td>
              <td className="mono good">F1 99.9%대 유지</td>
              <td className="mono">F1 99%대</td>
            </tr>
            <tr>
              <td><b>5%</b></td>
              <td className="mono good"><b>F1 99.87%</b></td>
              <td className="mono bad">F1 87.96%로 하락</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12 }}>
          현장 도입에서 가장 비싼 과정이 고객사 트래픽의 라벨링과 학습입니다. 적은 데이터로
          배우는 성질은 구축 기간과 비용을 그대로 줄입니다.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>대가와 상쇄</h2>
        <div className="stat-band" style={{ marginBottom: 0, marginTop: 8 }}>
          <div className="stat">
            <span className="v">×16.9</span>
            <span className="k">이미지 표현의 대가 — 원본 대비 저장 용량 증가</span>
          </div>
          <div className="stat accent">
            <span className="v">저장 0</span>
            <span className="k">이미지를 저장하지 않고 추론 시점에 실시간 변환해 상쇄. 이 사이트의 인코딩 이미지도 요청 순간 생성됩니다</span>
          </div>
        </div>
      </div>
    </div>
  );
}
