/** 공격 유형 상세 데이터 */
import type { ReactNode } from "react";

const node = (x: number, y: number, w: number, h: number, label: string, cls = "") => (
  <g className={cls}>
    <rect x={x} y={y} width={w} height={h} rx={9} className="dg-box" />
    <text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle" className="dg-t">{label}</text>
  </g>
);
const arrow = (x1: number, y1: number, x2: number, y2: number, hot = false) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} className={hot ? "dg-arr hot" : "dg-arr"} markerEnd="url(#dga)" />
);
const Defs = (
  <defs>
    <marker id="dga" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" />
    </marker>
  </defs>
);

export interface AttackCase { year: string; title: string; desc: string; url: string; source: string }
export interface AttackInfo {
  id: string; name: string; ko: string; oneliner: string;
  def: string; mech: string; trace: string; view: string;
  cases: AttackCase[]; dataset: string; diagram: ReactNode;
}

export const CLASS_TO_ATTACK: Record<string, string> = {
  Botnet: "botnet", DoS: "dos", DDoS: "ddos",
  "Brute Force": "bruteforce", Web: "web", Infiltration: "infiltration",
};

export const ATTACKS: AttackInfo[] = [
  {
    id: "botnet",
    name: "Botnet",
    ko: "Botnet",
    oneliner: "감염된 기기들이 공격자의 명령 서버와 몰래 교신하는 원격 조종 네트워크",
    def: "악성코드에 감염된 다수의 기기(봇)가 공격자의 C&C(Command & Control) 서버에 연결되어 원격 명령을 받는 네트워크입니다. 봇들은 스팸 발송과 DDoS, 정보 탈취의 발판이 됩니다.",
    mech: "감염 기기는 들키지 않으려 평소엔 조용히 있다가 일정 주기로 C&C 서버에 짧게 접속해 명령을 확인합니다. 이를 Beaconing이라 부릅니다. 이 통신은 대부분 암호화 채널에 숨어 내용 검사로는 보이지 않습니다.",
    trace: "일정한 주기로 반복되는 접속이 남습니다. 패킷 도착 간격(IAT)의 기계적인 규칙성, 비슷한 크기의 작은 패킷, 주기적으로 재생성되는 세션. 사람의 통신에는 없는 리듬입니다.",
    view: "Botnet은 내용이 아니라 리듬으로 잡습니다. Beaconing의 주기성은 IAT 계열 피처에 그대로 새겨지고 관계 행렬 이미지에서는 규칙적인 격자 텍스처로 나타납니다. 제로-클라 검증의 1차 성과(KCC 2026)가 바로 Botnet 탐지였습니다.",
    cases: [
      { year: "2016", title: "Mirai Botnet과 Dyn 공격", desc: "수십만 대의 IoT 기기를 감염시킨 Botnet이 DNS 업체 Dyn을 공격해 미국 동부의 주요 인터넷 서비스가 수 시간 마비됐습니다.", url: "https://www.cloudflare.com/learning/ddos/glossary/mirai-botnet/", source: "Cloudflare Learning" },
      { year: "2021", title: "Emotet 국제 합동 해체", desc: "은행 정보 탈취로 시작해 Botnet 임대업으로 진화한 대형 Botnet이 8개국 합동 작전으로 해체됐습니다.", url: "https://www.europol.europa.eu/media-press/newsroom/news/world%E2%80%99s-most-dangerous-malware-emotet-disrupted-through-global-action", source: "Europol 공식 보도자료" },
    ],
    dataset: "검증 데이터셋 CSE-CIC-IDS2018의 Botnet 트래픽은 Zeus와 Ares 도구로 생성된 실측 트래픽입니다.",
    diagram: (
      <svg viewBox="0 0 380 190" className="dg">
        {Defs}
        {node(16, 16, 84, 34, "감염 PC")}
        {node(16, 62, 84, 34, "감염 IoT")}
        {node(16, 108, 84, 34, "감염 서버")}
        {node(264, 62, 100, 34, "C&C 서버", "bad")}
        {arrow(104, 33, 260, 71, true)}
        {arrow(104, 79, 260, 79, true)}
        {arrow(104, 125, 260, 87, true)}
        <text x="190" y="172" textAnchor="middle" className="dg-cap">암호화 채널 속 주기적 Beaconing</text>
      </svg>
    ),
  },
  {
    id: "ddos",
    name: "DDoS",
    ko: "분산 서비스 거부",
    oneliner: "수많은 출발지가 동시에 트래픽을 퍼부어 서비스를 마비시키는 공격",
    def: "다수의 분산된 출발지가 하나의 대상에 동시에 트래픽을 집중시켜 대역폭이나 서버 자원을 고갈시키는 공격입니다. 주로 Botnet이 동원됩니다.",
    mech: "Botnet을 동원하거나 소량의 요청을 거대한 응답으로 되돌려주는 서버(반사와 증폭)를 악용해 대상이 감당할 수 없는 트래픽을 만듭니다.",
    trace: "짧은 시간에 폭증하는 플로우 수, 극단적으로 짧은 세션 지속 시간, 요청 방향으로 쏠린 패킷 비율, 균일하게 닮은 패킷 크기 분포가 남습니다.",
    view: "DDoS는 개별 플로우보다 무리의 형태로 드러납니다. 짧고 닮은 플로우가 한꺼번에 쏟아지는 순간이 전형적인 신호입니다.",
    cases: [
      { year: "2018", title: "GitHub 1.35 Tbps 방어", desc: "memcached 서버를 증폭기로 악용한 당시 사상 최대 규모의 반사 공격을 약 10분 만에 완화한 사례입니다.", url: "https://github.blog/2018-03-01-ddos-incident-report/", source: "GitHub 공식 블로그" },
      { year: "2020", title: "AWS 2.3 Tbps 완화", desc: "AWS Shield가 공개한 사상 최대급 공격 완화 사례입니다. 클라우드 시대에도 DDoS가 최전선임을 보여줍니다.", url: "https://siliconangle.com/2020/06/17/aws-mitigated-record-breaking-2-3-tbps-ddos-attack-february/", source: "SiliconANGLE" },
    ],
    dataset: "CSE-CIC-IDS2018의 DDoS 트래픽은 LOIC(HTTP/UDP)와 HOIC 도구로 생성됐습니다.",
    diagram: (
      <svg viewBox="0 0 380 190" className="dg">
        {Defs}
        {node(16, 10, 64, 30, "봇")}
        {node(16, 50, 64, 30, "봇")}
        {node(16, 90, 64, 30, "봇")}
        {node(16, 130, 64, 30, "봇")}
        {node(272, 65, 92, 40, "서비스", "bad")}
        {arrow(84, 25, 268, 76, true)}
        {arrow(84, 65, 268, 82, true)}
        {arrow(84, 105, 268, 89, true)}
        {arrow(84, 145, 268, 96, true)}
        <text x="176" y="180" textAnchor="middle" className="dg-cap">동시 다발 대량 트래픽</text>
      </svg>
    ),
  },
  {
    id: "dos",
    name: "DoS",
    ko: "서비스 거부",
    oneliner: "한 출발지가 퍼붓거나 일부러 느리게 끌어 서버 자원을 고갈시키는 공격",
    def: "단일 출발지가 서버의 처리 능력, 연결 슬롯, 메모리 같은 자원을 고갈시켜 정상 사용자가 서비스를 못 쓰게 만드는 공격입니다.",
    mech: "두 갈래입니다. Hulk처럼 요청을 최대 속도로 퍼붓는 유형과 Slowloris처럼 연결을 일부러 느리게 유지해 서버의 연결 슬롯을 잠식하는 유형. 방향은 정반대지만 목적은 같습니다.",
    trace: "퍼붓는 유형은 비정상적인 초당 패킷 수가, 끄는 유형은 비정상적으로 긴 도착 간격과 끝나지 않는 미완결 세션이 남습니다. 둘 다 정상 트래픽의 리듬에서 크게 벗어납니다.",
    view: "정반대 방향의 두 유형이 모두 리듬의 이상이라는 같은 축에서 관측됩니다. 하나의 관계 행렬 표현이 양쪽을 다 커버하는 이유입니다.",
    cases: [
      { year: "2009", title: "Slowloris", desc: "단 한 대의 컴퓨터로 웹서버를 마비시킬 수 있음을 보여준 저대역폭 공격 기법입니다.", url: "https://www.cloudflare.com/learning/ddos/ddos-attack-tools/slowloris/", source: "Cloudflare Learning" },
      { year: "상시", title: "공개 도구의 일상적 악용", desc: "Hulk와 GoldenEye 같은 부하 유발 도구가 공개되어 지금도 무차별적으로 사용됩니다.", url: "https://www.unb.ca/cic/datasets/ids-2018.html", source: "CIC 데이터셋 문서" },
    ],
    dataset: "CSE-CIC-IDS2018의 DoS 트래픽은 Hulk와 Slowloris, GoldenEye, SlowHTTPTest로 생성됐습니다.",
    diagram: (
      <svg viewBox="0 0 380 190" className="dg">
        {Defs}
        {node(16, 70, 96, 40, "공격자 1대")}
        {node(272, 70, 92, 40, "서버", "bad")}
        {arrow(116, 80, 268, 80, true)}
        {arrow(116, 90, 268, 90, true)}
        {arrow(116, 100, 268, 100, true)}
        <text x="192" y="46" textAnchor="middle" className="dg-cap">과속 요청 또는 고의 저속 연결</text>
        <text x="192" y="150" textAnchor="middle" className="dg-cap">연결 슬롯과 자원 고갈</text>
      </svg>
    ),
  },
  {
    id: "bruteforce",
    name: "Brute Force",
    ko: "무차별 대입",
    oneliner: "비밀번호가 맞을 때까지 기계적으로 두드리는 공격",
    def: "SSH와 FTP, 웹 로그인 등의 인증을 뚫기 위해 아이디와 비밀번호 조합을 자동화 도구로 반복 시도하는 공격입니다. 유출된 계정 목록을 재활용하는 크리덴셜 스터핑도 같은 계열입니다.",
    mech: "도구가 사전이나 유출 DB의 조합을 초당 수십 회에서 수백 회 시도합니다. 시도 하나하나는 정상 로그인과 똑같아 보이지만 무리를 이루면 기계의 규칙성이 드러납니다.",
    trace: "같은 목적지 포트로 반복되는 짧고 균일한 세션이 남습니다. 시도 간격과 패킷 수, 크기가 복사한 듯 닮아 있습니다. 사람은 이렇게 일정하게 실패하지 않습니다.",
    view: "개별 시도가 아니라 시도들의 균일함을 봅니다. 세션 길이와 간격의 분산이 비정상적으로 작다는 것 자체가 자동화의 지문입니다.",
    cases: [
      { year: "상시", title: "크리덴셜 스터핑", desc: "유출된 계정 목록을 다른 서비스에 자동 대입하는 공격 유형입니다. 비밀번호 재사용이 공격의 연료가 됩니다.", url: "https://owasp.org/www-community/attacks/Credential_stuffing", source: "OWASP" },
      { year: "상시", title: "SSH와 FTP 스캐닝", desc: "인터넷에 노출된 서버는 수 분 안에 자동화된 로그인 시도를 받기 시작합니다. 관제에서 가장 흔한 배경 소음입니다.", url: "https://www.unb.ca/cic/datasets/ids-2018.html", source: "CIC 데이터셋 문서" },
    ],
    dataset: "CSE-CIC-IDS2018의 Brute Force 트래픽은 Patator 도구의 FTP와 SSH 대입 시도로 생성됐습니다.",
    diagram: (
      <svg viewBox="0 0 380 190" className="dg">
        {Defs}
        {node(16, 70, 104, 40, "자동화 도구")}
        {node(268, 66, 96, 48, "인증 서버", "bad")}
        {arrow(124, 78, 264, 82, true)}
        {arrow(124, 90, 264, 90, true)}
        {arrow(124, 102, 264, 98, true)}
        <text x="192" y="46" textAnchor="middle" className="dg-cap">균일한 간격의 반복 시도</text>
        <text x="192" y="150" textAnchor="middle" className="dg-cap">사전 조합을 순서대로 대입</text>
      </svg>
    ),
  },
  {
    id: "web",
    name: "Web",
    ko: "웹 공격",
    oneliner: "SQL 인젝션과 XSS처럼 웹 애플리케이션의 틈을 파고드는 공격",
    def: "웹 애플리케이션의 입력 처리 취약점을 노리는 공격군입니다. DB 질의를 조작하는 SQL 인젝션과 다른 사용자의 브라우저에서 스크립트를 실행시키는 XSS가 대표적입니다.",
    mech: "정상적인 웹 요청의 탈을 쓰고 악성 구문을 입력 필드에 심습니다. 공격의 본질이 페이로드 내용 안에 있다는 것이 이 유형의 특징입니다.",
    trace: "일반 열람과 다른 요청과 응답의 크기 패턴, 비정상적인 시퀀스가 간접적인 흔적으로 남습니다. 내용 자체가 본질인 유형이라 메타데이터만으로는 간접 포착에 해당합니다.",
    view: "저희가 한계를 숨기지 않는 유형입니다. 공격 유형별 성능을 분해해 적용 범위를 투명하게 공개하는 검증 원칙이 여기서 나왔습니다. 웹 공격의 심층 방어는 WAF와의 병행이 정답이고 제로-클라는 그 앞단의 행위 이상 신호를 맡습니다.",
    cases: [
      { year: "2015", title: "TalkTalk 정보 유출", desc: "영국 통신사가 SQL 인젝션으로 15만 명 이상의 고객 정보를 유출당하고 기록적인 과징금을 받은 사건입니다.", url: "https://ico.org.uk/about-the-ico/media-centre/talktalk-cyber-attack-how-the-ico-investigation-unfolded/", source: "영국 ICO 공식 조사 기록" },
      { year: "상시", title: "OWASP Top 10", desc: "인젝션 계열 취약점은 수년째 웹 보안 위협 상위권을 지키고 있는 상수입니다.", url: "https://owasp.org/www-project-top-ten/", source: "OWASP" },
    ],
    dataset: "CSE-CIC-IDS2018의 Web 트래픽은 취약 웹앱 DVWA를 대상으로 한 SQL 인젝션과 XSS, 웹 로그인 대입으로 생성됐습니다.",
    diagram: (
      <svg viewBox="0 0 380 190" className="dg">
        {Defs}
        {node(16, 70, 88, 40, "브라우저")}
        {node(150, 70, 88, 40, "웹 서버")}
        {node(284, 70, 80, 40, "DB", "bad")}
        {arrow(108, 90, 146, 90, true)}
        {arrow(242, 90, 280, 90, true)}
        <text x="128" y="52" textAnchor="middle" className="dg-cap">악성 구문 주입</text>
        <text x="190" y="150" textAnchor="middle" className="dg-cap">정상 요청의 탈을 쓴 공격</text>
      </svg>
    ),
  },
  {
    id: "infiltration",
    name: "Infiltration",
    ko: "내부 침투",
    oneliner: "일차 감염 뒤 내부망을 조용히 탐색하며 번져가는 단계",
    def: "피싱이나 악성 문서로 내부의 한 기기를 감염시킨 뒤 그 발판에서 내부망을 스캔하고 다른 시스템으로 옮겨가는 공격 단계입니다. APT 침해 사고의 몸통에 해당합니다.",
    mech: "경계 방어를 정면 돌파하는 대신 사람을 속여 안으로 들어옵니다. 그리고 내부는 안전하다는 신뢰를 악용해 포트 스캔과 원격 접속으로 조용히 확산합니다.",
    trace: "평소 없던 내부 방향 연결 시도의 확산이 남습니다. 한 호스트에서 뻗어나가는 다수의 짧은 탐색 세션, 세션 방향성과 연결 패턴의 변화가 신호입니다.",
    view: "제로트러스트가 필요한 이유 그 자체입니다. 내부는 신뢰한다는 가정이 깨진 시대에 접속 허용 이후에도 트래픽을 지속 검증하는 것이 저희가 서 있는 자리입니다.",
    cases: [
      { year: "2013", title: "Target 침해 사고", desc: "공조설비 협력업체 계정으로 내부에 들어와 POS망까지 이동해 약 4천만 건의 카드 정보가 유출된 사건입니다.", url: "https://krebsonsecurity.com/2013/12/sources-target-investigating-data-breach/", source: "KrebsOnSecurity" },
      { year: "상시", title: "횡적 이동(Lateral Movement)", desc: "공격자가 내부망을 옮겨 다니는 표준 전술 분류입니다. 최초 침투보다 내부 확산 기간이 훨씬 깁니다.", url: "https://attack.mitre.org/tactics/TA0008/", source: "MITRE ATT&CK" },
    ],
    dataset: "CSE-CIC-IDS2018의 Infiltration 트래픽은 악성 문서 감염 후 내부망 Nmap 스캔 시나리오로 생성됐습니다.",
    diagram: (
      <svg viewBox="0 0 380 190" className="dg">
        {Defs}
        <rect x="10" y="12" width="360" height="164" rx="12" fill="none" stroke="var(--line)" strokeDasharray="5 4" />
        <text x="30" y="34" className="dg-cap">내부망</text>
        {node(30, 48, 84, 34, "감염 PC", "bad")}
        {node(160, 110, 84, 34, "파일서버")}
        {node(160, 48, 84, 34, "DB")}
        {node(276, 78, 86, 34, "관리자 PC")}
        {arrow(114, 62, 156, 62, true)}
        {arrow(114, 74, 156, 122, true)}
        {arrow(244, 122, 272, 100, true)}
      </svg>
    ),
  },
];

export const attackById = (id: string) => ATTACKS.find((a) => a.id === id);
