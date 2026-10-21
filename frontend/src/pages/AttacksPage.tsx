import { S, Flow } from "../components/Sentences";
/** 공격 유형 — 판별 6종과 확장 8종을 한 그리드에서 (두 축 필터) */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ATTACKS } from "../attacksData";

type Axis = "nature" | "stage";

interface Tile {
  key: string;
  name: string;
  ko: string;
  desc: string;
  live: boolean;
  id?: string; // 상세 페이지 (판별 중인 유형만)
  trace?: string; // 플로우 통계에 남는 흔적 (확장 유형)
}

/* 판별 6종 (ATTACKS에서 링크와 설명을 가져온다) */
function liveTile(name: string): Tile {
  const a = ATTACKS.find((x) => x.name === name)!;
  return { key: a.id, name: a.name, ko: a.ko, desc: a.oneliner, live: true, id: a.id };
}

/* 확장 8종 */
const EXT: Tile[] = [
  {
    key: "c2",
    name: "C2 Beaconing",
    ko: "명령 제어 교신",
    desc: "감염 단말이 공격 서버와 주기적으로 주고받는 심박 신호",
    live: false,
    trace: "고정 주기 접속과 균일한 패킷 크기",
  },
  {
    key: "ransom",
    name: "Ransomware Activity",
    ko: "랜섬웨어 활동",
    desc: "암호화 직전의 대량 파일 접근과 내부로 번지는 확산 트래픽",
    live: false,
    trace: "짧은 시간 대량 세션과 급증한 내부 전송량",
  },
  {
    key: "lateral",
    name: "Lateral Movement",
    ko: "측면 이동",
    desc: "내부망 안에서 옆 시스템으로 옮겨 가는 움직임",
    live: false,
    trace: "내부 대 내부 신규 연결 급증",
  },
  {
    key: "exfil",
    name: "Data Exfiltration",
    ko: "데이터 유출",
    desc: "사고를 사건으로 만드는 마지막 단계이자 방향과 볼륨이 뒤집히는 구간",
    live: false,
    trace: "평소와 반대인 상하행 비율과 대용량 업로드",
  },
  {
    key: "mining",
    name: "Cryptomining",
    ko: "암호화폐 채굴",
    desc: "탈취한 자원으로 채굴 풀과 끊임없이 이어지는 통신",
    live: false,
    trace: "채굴 풀과의 장시간 세션과 일정한 소패킷 반복",
  },
  {
    key: "scan",
    name: "Port Scan",
    ko: "포트 스캔",
    desc: "본격적인 공격에 앞서 열린 문을 찾아 두드리는 정찰",
    live: false,
    trace: "짧은 시간 다수 포트에 대한 미완성 세션",
  },
  {
    key: "dns",
    name: "DNS Tunneling",
    ko: "DNS 터널링",
    desc: "DNS 질의에 데이터를 실어 몰래 내보내는 우회 통로",
    live: false,
    trace: "비정상적으로 긴 도메인 질의와 높은 질의 빈도",
  },
  {
    key: "insider",
    name: "Insider Threat",
    ko: "내부자 위협",
    desc: "시그니처가 아니라 평소 행동과의 차이로만 드러나는 위협",
    live: false,
    trace: "정상 계정의 시간대와 접근 범위 이탈",
  },
];
const ext = (k: string) => EXT.find((e) => e.key === k)!;

/* 관측 범위 게이지 — 회전 없이 한 번만 그려지는 링 세 개 */
const RINGS = [
  { n: "6", u: "종", end: 6 / 14, k: "in", t: "지금 판별합니다",
    d: "14종 가운데 6종은 학습을 마쳐 관제 콘솔에서 바로 가려냅니다." },
  { n: "8", u: "종", end: 8 / 14, k: "ext", t: "같은 원리로 넓힙니다",
    d: "나머지 8종도 탐지 구조를 바꾸지 않고 학습 데이터만 더하면 됩니다." },
  { n: "100", u: "%", end: 1, k: "all", t: "모든 판정에 근거를 냅니다",
    d: "판별한 모든 플로우에 대해 어디를 보고 그렇게 판단했는지 히트맵으로 되돌려 줍니다." },
];

/* 성격별 묶음 (판별과 확장을 함께 배치) */
const BY_NATURE = [
  {
    key: "recon",
    title: "정찰과 침투",
    desc: "문을 찾고 두드리는 단계로 반복과 변칙의 패턴이 흔적으로 남습니다",
    tiles: () => [ext("scan"), liveTile("Brute Force"), liveTile("Web")],
  },
  {
    key: "control",
    title: "잠입과 원격 제어",
    desc: "이미 들어온 뒤의 공격으로 주기적 교신과 은밀한 이동이 신호가 됩니다",
    tiles: () => [liveTile("Infiltration"), liveTile("Botnet"), ext("c2"), ext("lateral"), ext("ransom"), ext("insider")],
  },
  {
    key: "avail",
    title: "가용성과 자원",
    desc: "서비스를 멈추거나 자원을 훔치는 공격으로 트래픽의 양과 지속성이 무기가 됩니다",
    tiles: () => [liveTile("DoS"), liveTile("DDoS"), ext("mining")],
  },
  {
    key: "leak",
    title: "정보 유출",
    desc: "훔친 것을 밖으로 내보내는 단계로 방향과 볼륨의 이상으로 드러납니다",
    tiles: () => [ext("exfil"), ext("dns")],
  },
];

/* 공격 단계별 묶음 */
const BY_STAGE = [
  {
    key: "s0",
    title: "0단계 정찰",
    desc: "본격 공격 전에 열린 문을 찾는 단계",
    tiles: () => [ext("scan")],
  },
  {
    key: "s1",
    title: "1단계 접근 시도",
    desc: "인증을 뚫거나 취약한 입력을 노리는 단계",
    tiles: () => [liveTile("Brute Force"), liveTile("Web")],
  },
  {
    key: "s2",
    title: "2단계 내부 확산",
    desc: "들어온 뒤 옆으로 옮겨 다니며 거점을 넓히는 단계",
    tiles: () => [liveTile("Infiltration"), ext("lateral"), ext("ransom"), ext("insider")],
  },
  {
    key: "s3",
    title: "3단계 지속 교신",
    desc: "감염 단말이 공격 서버와 계속 연락을 주고받는 단계",
    tiles: () => [liveTile("Botnet"), ext("c2"), ext("mining")],
  },
  {
    key: "s4",
    title: "4단계 자원 소진과 유출",
    desc: "서비스를 마비시키거나 훔친 것을 내보내는 마지막 단계",
    tiles: () => [liveTile("DoS"), liveTile("DDoS"), ext("exfil"), ext("dns")],
  },
];

/* 데이터셋 확장성 */
const DATASETS = [
  {
    name: "CSE-CIC-IDS2018",
    org: "캐나다 사이버보안연구소",
    status: "done",
    statusKo: "검증 완료",
    base: ["Brute Force", "DoS", "DDoS", "Web Attack", "Infiltration", "Botnet", "Heartbleed"],
    add: [] as string[],
    note: "현재 모델이 학습한 데이터셋입니다. 관제 콘솔에서 판별하는 6종이 여기서 나왔습니다.",
  },
  {
    name: "CIC-IDS2017",
    org: "캐나다 사이버보안연구소",
    status: "doing",
    statusKo: "확장 실험 진행 중",
    base: ["2018과 동일한 6종"],
    add: ["Port Scan"],
    note: "같은 절차에 다른 연도의 데이터를 넣어 새 클래스가 추가돼도 구조가 유지되는지 확인하고 있습니다.",
  },
  {
    name: "UNSW-NB15",
    org: "호주 사이버보안센터",
    status: "next",
    statusKo: "적용 예정",
    base: [],
    add: ["Fuzzers", "Backdoor", "Exploits", "Reconnaissance", "Shellcode", "Worms", "Generic", "Analysis", "DoS"],
    note: "분류 체계가 전혀 다른 데이터셋입니다. 여기서도 동작하면 특정 데이터셋에 종속되지 않는다는 근거가 됩니다.",
  },
  {
    name: "CIC-DDoS2019",
    org: "캐나다 사이버보안연구소",
    status: "next",
    statusKo: "적용 예정",
    base: [],
    add: ["NTP", "DNS", "LDAP", "SNMP", "SSDP 등 반사 증폭형 DDoS 세분류"],
    note: "하나의 공격 계열을 잘게 나눈 데이터셋으로 세분류 성능을 확인합니다.",
  },
];

function TileView({ t }: { t: Tile }) {
  const body = (
    <>
      <div className="atk-tile-top">
        <b>{t.name}</b>
        {/* 판별되는 쪽에는 배지를 달지 않는다 — 확장 대상만 따로 표시 */}
        {!t.live && <span className="atk-state">확장</span>}
      </div>
      <span className="atk-tile-ko">{t.ko}</span>
      <p><S t={t.desc} /></p>
      {t.trace && <span className="atk-tile-trace">{t.trace}</span>}
      {t.live && (
        <span className="atk-tile-go">
          자세히 보기
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
          </svg>
        </span>
      )}
    </>
  );
  if (t.live && t.id) {
    return (
      <Link to={`/attacks/${t.id}`} className="atk-tile live">
        {body}
      </Link>
    );
  }
  return <div className="atk-tile ext">{body}</div>;
}

export default function AttacksPage() {
  const [axis, setAxis] = useState<Axis>("nature");
  const groups = axis === "nature" ? BY_NATURE : BY_STAGE;

  return (
    <div className="tp atk">
      {/* 히어로 */}
      <section className="tp-hero">
        <span className="tp-eyebrow">THREAT COVERAGE</span>
        <h1>
          내용을 감춰도
          <br />
          행동의 흔적은 남습니다
        </h1>
        <p className="tp-lead"><Flow>
          공격은 목적에 따라 성격이 다르고 남기는 흔적의 모양도 다릅니다.
          <br />
          공통점은 하나입니다. <b>내용을 암호화해도 행동의 흔적은 지울 수 없습니다.</b>
          <br />
          지금 판별하는 유형과 같은 원리로 확장되는 유형을 함께 정리했습니다.
        </Flow></p>
        <p className="cvr-lead">
          기존 NDR 제품들이 다루는 공격 유형은 <b>모두 14종</b>입니다. 제로-클라가 지금 어디까지 왔는지 그 기준으로 보여 드립니다.
        </p>
        <div className="cvr">
          {RINGS.map((r, k) => (
            <div className={`cvr-item ${r.k}`} key={r.t}>
              <div className="cvr-dial">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="cvr-bg" cx="60" cy="60" r="48" />
                  <circle
                    className="cvr-fg"
                    cx="60"
                    cy="60"
                    r="48"
                    style={{ "--off": `${(302 * (1 - r.end)).toFixed(1)}`, animationDelay: `${k * 0.16}s` } as never}
                  />
                </svg>
                <span className="cvr-n">
                  {r.n}
                  <em>{r.u}</em>
                </span>
              </div>
              <b>{r.t}</b>
              <p><S t={r.d} /></p>
            </div>
          ))}
          <p className="cvr-base">
            <span>VALIDATED</span>
            <b>CSE-CIC-IDS2018</b>
            공개 데이터셋으로 검증을 마쳤습니다. 다른 데이터셋으로 옮겨도 재현되는지 확인하는 실험을 진행하고 있습니다.
          </p>
        </div>
      </section>

      {/* 전체 유형 */}
      <section className="atk-sec">
        <div className="atk-sec-top">
          <div>
            <span className="tp-eyebrow">COVERAGE MAP</span>
            <h2>관측 범위</h2>
          </div>
          <div className="atk-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={axis === "nature"}
              className={axis === "nature" ? "on" : ""}
              onClick={() => setAxis("nature")}
            >
              성격별
            </button>
            <button
              role="tab"
              aria-selected={axis === "stage"}
              className={axis === "stage" ? "on" : ""}
              onClick={() => setAxis("stage")}
            >
              공격 단계별
            </button>
          </div>
        </div>

        <div className="atk-key">
          <span className="k1"><i />관제 콘솔에서 바로 판별합니다</span>
          <span className="k2"><i />확장 — 같은 원리로 넓혀 갈 유형입니다</span>
        </div>

        {groups.map((g) => (
          <div className="atk-grp2" key={g.key}>
            <div className="atk-grp2-head">
              <b>{g.title}</b>
              <span>{g.desc}</span>
            </div>
            <div className="atk-tiles">
              {/* 바로 판별되는 유형을 앞에 세운다 */}
              {[...g.tiles()]
                .sort((a, b) => Number(b.live) - Number(a.live))
                .map((t) => (
                  <TileView key={t.key} t={t} />
                ))}
            </div>
          </div>
        ))}
      </section>

      {/* 데이터셋 확장성 */}
      <section className="atk-sec">
        <span className="tp-eyebrow">DATASET</span>
        <h2>하나의 데이터셋에 묶이지 않습니다</h2>
        <p className="atk-lead"><Flow>
          탐지할 수 있는 공격의 종류는 학습 데이터가 정합니다.
          <br />
          그래서 다른 데이터를 넣었을 때도 같은 절차가 그대로 도는지가 확장성의 핵심입니다.
          <br />
          우리 구조는 플로우 통계를 관계 행렬로 바꾸는 방식이라{" "}
          <b>피처 이름이나 클래스 개수가 달라져도 그대로 적용됩니다.</b>
        </Flow></p>
        <div className="atk-ds2">
          {DATASETS.map((d) => (
            <div className="atk-ds2-row" key={d.name}>
              <div className="atk-ds2-st">
                <span className={`atk-ds-badge ${d.status}`}>{d.statusKo}</span>
              </div>
              <div className="atk-ds2-name">
                <b>{d.name}</b>
                <span>{d.org}</span>
              </div>
              <div className="atk-ds2-body">
                <div className="atk-ds2-chips">
                  {d.base.map((c) => (
                    <i key={c}>{c}</i>
                  ))}
                  {d.add.map((c) => (
                    <i key={c} className="new">
                      {c}
                    </i>
                  ))}
                </div>
                <p><S t={d.note} /></p>
              </div>
            </div>
          ))}
        </div>
        <span className="atk-src">
          데이터셋 정보는 각 기관의 공식 배포 페이지 기준입니다. 파란 칩은 해당 데이터셋에서 새로
          추가되는 클래스입니다.
        </span>
      </section>
    </div>
  );
}
