/** 표준 언어 — CVE, CWE, CVSS, CWSS, MITRE ATT&CK (공격 유형 페이지에서 분리) */
import { Flow } from "../components/Sentences";

const STANDARDS = [
  {
    code: "CVE",
    full: "Common Vulnerabilities and Exposures",
    keeper: "MITRE",
    desc: "공개된 개별 취약점마다 부여되는 고유 식별자입니다. 예를 들어 CVE-2021-44228은 Log4Shell을 가리킵니다.",
    url: "https://www.cve.org",
  },
  {
    code: "CWE",
    full: "Common Weakness Enumeration",
    keeper: "MITRE",
    desc: "취약점을 만들어내는 약점의 유형 분류입니다. 개별 사건이 아니라 결함의 종류를 말할 때 씁니다.",
    url: "https://cwe.mitre.org",
  },
  {
    code: "CVSS",
    full: "Common Vulnerability Scoring System",
    keeper: "FIRST",
    desc: "취약점의 심각도를 0.0에서 10.0 사이 점수로 표준화합니다. 현행 버전은 v4.0이고 v3.1도 널리 쓰입니다.",
    url: "https://www.first.org/cvss/",
  },
  {
    code: "CWSS",
    full: "Common Weakness Scoring System",
    keeper: "MITRE",
    desc: "CWE 약점의 위험도를 점수화하는 체계입니다. 어떤 약점부터 고칠지 우선순위를 정할 때 참고합니다.",
    url: "https://cwe.mitre.org/cwss/",
  },
  {
    code: "ATT&CK",
    full: "MITRE Adversarial Tactics, Techniques and Common Knowledge",
    keeper: "MITRE",
    desc: "공격자의 전술과 기법을 체계화한 지식 베이스입니다. 관제 조직이 대응 절차를 설계할 때 기준으로 삼습니다.",
    url: "https://attack.mitre.org",
  },
];

const MAPPING = [
  { cls: "Brute Force", now: true, cwe: "CWE-307 인증 시도 제한 미비", att: "T1110 Brute Force" },
  { cls: "DoS와 DDoS", now: true, cwe: "CWE-400 자원 소진", att: "T1498 Network Denial of Service" },
  { cls: "Web Attack", now: true, cwe: "CWE-89 SQL Injection과 CWE-79 XSS", att: "T1190 Exploit Public-Facing Application" },
  { cls: "Botnet", now: true, cwe: "행위 기반이라 단일 CWE 없음", att: "T1071 Application Layer Protocol" },
  { cls: "Infiltration", now: true, cwe: "행위 기반이라 단일 CWE 없음", att: "TA0008 Lateral Movement 계열" },
  { cls: "C2 Beaconing", now: false, cwe: "행위 기반이라 단일 CWE 없음", att: "T1071.001 Web Protocols" },
  { cls: "Ransomware Activity", now: false, cwe: "CWE-732 부적절한 권한 설정", att: "T1486 Data Encrypted for Impact" },
  { cls: "Lateral Movement", now: false, cwe: "CWE-284 부적절한 접근 통제", att: "TA0008 Lateral Movement" },
  { cls: "Data Exfiltration", now: false, cwe: "CWE-200 민감 정보 노출", att: "TA0010 Exfiltration" },
  { cls: "Cryptomining", now: false, cwe: "CWE-400 자원 소진", att: "T1496 Resource Hijacking" },
  { cls: "Port Scan", now: false, cwe: "CWE-200 민감 정보 노출", att: "T1046 Network Service Discovery" },
  { cls: "DNS Tunneling", now: false, cwe: "행위 기반이라 단일 CWE 없음", att: "T1071.004 DNS" },
  { cls: "Insider Threat", now: false, cwe: "CWE-269 부적절한 권한 관리", att: "T1078 Valid Accounts" },
];

export default function StandardsPage() {
  return (
    <div className="tp">
      <section className="tp-hero">
        <span className="tp-eyebrow">REFERENCE</span>
        <h1>
          취약점과 위협의
          <br />
          표준 언어
        </h1>
        <p className="tp-lead"><Flow>
          보안 업계는 취약점과 약점을 표준 식별자와 점수로 소통합니다. 제로-클라의 탐지 결과와 위협
          브리핑도 이 표준 위에서 읽히도록 설계했기 때문에 관제 조직의 기존 대응 절차에 그대로
          연결됩니다.
        </Flow></p>
      </section>

      <section className="std-sec">
        <div className="std-list">
          {STANDARDS.map((s) => (
            <a key={s.code} className="std-row" href={s.url} target="_blank" rel="noreferrer">
              <div className="std-code">
                <b>{s.code}</b>
                <span>{s.keeper}</span>
              </div>
              <div className="std-body">
                <span className="std-full">{s.full}</span>
                <p>{s.desc}</p>
              </div>
              <span className="std-go">
                공식 문서
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5.5 10.5 10.5 5.5M6 5.5h4.5V10" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="std-sec">
        <div className="tp-sec-head" style={{ textAlign: "left" }}>
          <span className="tp-eyebrow" style={{ textAlign: "left" }}>
            MAPPING
          </span>
          <h2 style={{ textAlign: "left" }}>탐지 클래스와 표준의 대응</h2>
        </div>
        <p className="std-note">
          제로-클라는 특정 CVE의 시그니처가 아니라 <b>공격 행위</b>를 탐지합니다.
          <br />
          그래서 탐지 클래스는 개별 CVE가 아니라 약점 유형(CWE)과 공격 전술(ATT&CK)에 대응됩니다.
          <br />
          지금 판별하는 유형과 같은 원리로 확장되는 유형을 함께 정리했습니다.
        </p>
        <div className="pt2-table-wrap">
          <table className="pt2-table">
            <thead>
              <tr>
                <th>탐지 클래스</th>
                <th style={{ textAlign: "left", width: "auto" }}>관련 CWE</th>
                <th style={{ textAlign: "left", width: "auto" }}>MITRE ATT&CK</th>
              </tr>
            </thead>
            <tbody>
              {MAPPING.map((m) => (
                <tr key={m.cls} className={m.now ? "us" : ""}>
                  <td>
                    {m.cls}
                    {/* 판별되는 쪽은 배지 없이, 확장 대상만 표시한다 */}
                    {!m.now && <span className="std-tag">확장</span>}
                  </td>
                  <td style={{ textAlign: "left" }}>{m.cwe}</td>
                  <td style={{ textAlign: "left" }}>{m.att}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
