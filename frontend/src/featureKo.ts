/** 플로우 피처 이름을 우리말로 옮긴 대응표.
 *  CICFlowMeter 계열 컬럼명을 기준으로 하고, 표기 차이는 normalize 로 흡수한다.
 *  표에 없는 이름은 영문 그대로 두어 없는 뜻을 지어내지 않는다.
 *
 *  대응 범위
 *  1) CSE-CIC-IDS2018 배포 CSV 헤더 80개 (Dst Port ~ Label)
 *  2) CIC-IDS2017 계열의 긴 표기 (Total Fwd Packets 등)
 *  3) UNB 데이터셋 소개 페이지의 축약 표기 (fl_dur, tot_fw_pk 등)
 *  slash 를 공백으로 바꾸지 않으면 Flow Byts/s 같은 이름이 대응표를 빗나간다. */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[_\-./\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const TABLE: Record<string, string> = {
  /* 식별 */
  "dst port": "목적지 포트",
  "src port": "출발지 포트",
  "protocol": "프로토콜",

  /* 지속 시간 */
  "flow duration": "플로우 지속 시간",

  /* 패킷 수 */
  "tot fwd pkts": "정방향 패킷 수",
  "total fwd packets": "정방향 패킷 수",
  "tot bwd pkts": "역방향 패킷 수",
  "total backward packets": "역방향 패킷 수",

  /* 전송량 */
  "totlen fwd pkts": "정방향 총 전송량",
  "total length of fwd packets": "정방향 총 전송량",
  "totlen bwd pkts": "역방향 총 전송량",
  "total length of bwd packets": "역방향 총 전송량",

  /* 패킷 크기 */
  "fwd pkt len max": "정방향 패킷 최대 크기",
  "fwd pkt len min": "정방향 패킷 최소 크기",
  "fwd pkt len mean": "정방향 패킷 평균 크기",
  "fwd pkt len std": "정방향 패킷 크기 편차",
  "bwd pkt len max": "역방향 패킷 최대 크기",
  "bwd pkt len min": "역방향 패킷 최소 크기",
  "bwd pkt len mean": "역방향 패킷 평균 크기",
  "bwd pkt len std": "역방향 패킷 크기 편차",
  "pkt len max": "패킷 최대 크기",
  "pkt len min": "패킷 최소 크기",
  "pkt len mean": "패킷 평균 크기",
  "pkt len std": "패킷 크기 편차",
  "pkt len var": "패킷 크기 분산",
  "pkt size avg": "평균 패킷 크기",
  "fwd seg size avg": "정방향 평균 세그먼트 크기",
  "bwd seg size avg": "역방향 평균 세그먼트 크기",
  "fwd seg size min": "정방향 최소 세그먼트 크기",
  "fwd header len": "정방향 헤더 길이",
  "bwd header len": "역방향 헤더 길이",

  /* 속도 */
  "flow byts s": "초당 전송 바이트",
  "flow pkts s": "초당 패킷 수",
  "fwd pkts s": "정방향 초당 패킷 수",
  "bwd pkts s": "역방향 초당 패킷 수",
  "down up ratio": "수신 대비 송신 비율",

  /* 패킷 간격 */
  "flow iat mean": "패킷 간격 평균",
  "flow iat std": "패킷 간격 편차",
  "flow iat max": "패킷 간격 최댓값",
  "flow iat min": "패킷 간격 최솟값",
  "fwd iat tot": "정방향 패킷 간격 합",
  "fwd iat mean": "정방향 패킷 간격 평균",
  "fwd iat std": "정방향 패킷 간격 편차",
  "fwd iat max": "정방향 패킷 간격 최댓값",
  "fwd iat min": "정방향 패킷 간격 최솟값",
  "bwd iat tot": "역방향 패킷 간격 합",
  "bwd iat mean": "역방향 패킷 간격 평균",
  "bwd iat std": "역방향 패킷 간격 편차",
  "bwd iat max": "역방향 패킷 간격 최댓값",
  "bwd iat min": "역방향 패킷 간격 최솟값",

  /* TCP 플래그 */
  "fin flag cnt": "FIN 플래그 횟수",
  "syn flag cnt": "SYN 플래그 횟수",
  "rst flag cnt": "RST 플래그 횟수",
  "psh flag cnt": "PSH 플래그 횟수",
  "ack flag cnt": "ACK 플래그 횟수",
  "urg flag cnt": "URG 플래그 횟수",
  "cwe flag count": "CWR 플래그 횟수",
  "ece flag cnt": "ECE 플래그 횟수",
  "fwd psh flags": "정방향 PSH 플래그",
  "bwd psh flags": "역방향 PSH 플래그",
  "fwd urg flags": "정방향 URG 플래그",
  "bwd urg flags": "역방향 URG 플래그",

  /* 윈도우와 벌크 */
  "init fwd win byts": "정방향 초기 윈도우 크기",
  "init bwd win byts": "역방향 초기 윈도우 크기",
  "fwd act data pkts": "정방향 데이터 포함 패킷 수",
  "fwd byts b avg": "정방향 벌크 평균 바이트",
  "fwd pkts b avg": "정방향 벌크 평균 패킷",
  "fwd blk rate avg": "정방향 벌크 전송률",
  "bwd byts b avg": "역방향 벌크 평균 바이트",
  "bwd pkts b avg": "역방향 벌크 평균 패킷",
  "bwd blk rate avg": "역방향 벌크 전송률",

  /* 서브플로우 */
  "subflow fwd pkts": "서브플로우 정방향 패킷 수",
  "subflow fwd byts": "서브플로우 정방향 바이트",
  "subflow bwd pkts": "서브플로우 역방향 패킷 수",
  "subflow bwd byts": "서브플로우 역방향 바이트",

  /* 활동과 유휴 */
  "active mean": "활동 구간 평균",
  "active std": "활동 구간 편차",
  "active max": "활동 구간 최댓값",
  "active min": "활동 구간 최솟값",
  "idle mean": "유휴 구간 평균",
  "idle std": "유휴 구간 편차",
  "idle max": "유휴 구간 최댓값",
  "idle min": "유휴 구간 최솟값",

  /* CICIDS 계열에서 함께 쓰이는 다른 표기들 */
  "flow id": "플로우 식별자",
  "src ip": "출발지 IP",
  "dst ip": "목적지 IP",
  "timestamp": "수집 시각",
  "label": "라벨",
  "fwd header length": "정방향 헤더 길이",
  "bwd header length": "역방향 헤더 길이",
  "fwd header length 1": "정방향 헤더 길이",
  "min packet length": "패킷 최소 크기",
  "max packet length": "패킷 최대 크기",
  "packet length mean": "패킷 평균 크기",
  "packet length std": "패킷 크기 편차",
  "packet length variance": "패킷 크기 분산",
  "average packet size": "평균 패킷 크기",
  "avg fwd segment size": "정방향 평균 세그먼트 크기",
  "avg bwd segment size": "역방향 평균 세그먼트 크기",
  "min seg size forward": "정방향 최소 세그먼트 크기",
  "act data pkt fwd": "정방향 데이터 포함 패킷 수",
  "init win bytes forward": "정방향 초기 윈도우 크기",
  "init win bytes backward": "역방향 초기 윈도우 크기",
  "flow bytes s": "초당 전송 바이트",
  "flow packets s": "초당 패킷 수",
  "fwd packets s": "정방향 초당 패킷 수",
  "bwd packets s": "역방향 초당 패킷 수",
  "fwd iat total": "정방향 패킷 간격 합",
  "bwd iat total": "역방향 패킷 간격 합",
  "fwd packet length max": "정방향 패킷 최대 크기",
  "fwd packet length min": "정방향 패킷 최소 크기",
  "fwd packet length mean": "정방향 패킷 평균 크기",
  "fwd packet length std": "정방향 패킷 크기 편차",
  "bwd packet length max": "역방향 패킷 최대 크기",
  "bwd packet length min": "역방향 패킷 최소 크기",
  "bwd packet length mean": "역방향 패킷 평균 크기",
  "bwd packet length std": "역방향 패킷 크기 편차",
  "cwe flag cnt": "CWR 플래그 횟수",
  "cwr flag count": "CWR 플래그 횟수",
  "ece flag count": "ECE 플래그 횟수",
  "fin flag count": "FIN 플래그 횟수",
  "syn flag count": "SYN 플래그 횟수",
  "rst flag count": "RST 플래그 횟수",
  "psh flag count": "PSH 플래그 횟수",
  "ack flag count": "ACK 플래그 횟수",
  "urg flag count": "URG 플래그 횟수",
  "subflow fwd packets": "서브플로우 정방향 패킷 수",
  "subflow fwd bytes": "서브플로우 정방향 바이트",
  "subflow bwd packets": "서브플로우 역방향 패킷 수",
  "subflow bwd bytes": "서브플로우 역방향 바이트",
  "fwd avg bytes bulk": "정방향 벌크 평균 바이트",
  "fwd avg packets bulk": "정방향 벌크 평균 패킷",
  "fwd avg bulk rate": "정방향 벌크 전송률",
  "bwd avg bytes bulk": "역방향 벌크 평균 바이트",
  "bwd avg packets bulk": "역방향 벌크 평균 패킷",
  "bwd avg bulk rate": "역방향 벌크 전송률",

  /* 배포 CSV 에서만 보이는 나머지 표기 */
  "unnamed 0": "행 번호",
  "attempted category": "시도 분류",

  /* ── UNB 데이터셋 소개 페이지의 축약 표기 ── */
  /* 지속 시간과 총량 */
  "fl dur": "플로우 지속 시간",
  "tot fw pk": "정방향 패킷 수",
  "tot bw pk": "역방향 패킷 수",
  "tot l fw pkt": "정방향 총 전송량",
  "tot l bw pkt": "역방향 총 전송량",
  "fl byt s": "초당 전송 바이트",
  "fl pkt s": "초당 패킷 수",

  /* 패킷 크기 */
  "fw pkt l max": "정방향 패킷 최대 크기",
  "fw pkt l min": "정방향 패킷 최소 크기",
  "fw pkt l avg": "정방향 패킷 평균 크기",
  "fw pkt l std": "정방향 패킷 크기 편차",
  "bw pkt l max": "역방향 패킷 최대 크기",
  "bw pkt l min": "역방향 패킷 최소 크기",
  "bw pkt l avg": "역방향 패킷 평균 크기",
  "bw pkt l std": "역방향 패킷 크기 편차",
  "pkt len avg": "패킷 평균 크기",
  "pkt len va": "패킷 크기 분산",

  /* 패킷 간격 */
  "fl iat avg": "패킷 간격 평균",
  "fl iat std": "패킷 간격 편차",
  "fl iat max": "패킷 간격 최댓값",
  "fl iat min": "패킷 간격 최솟값",
  "fw iat tot": "정방향 패킷 간격 합",
  "fw iat avg": "정방향 패킷 간격 평균",
  "fw iat std": "정방향 패킷 간격 편차",
  "fw iat max": "정방향 패킷 간격 최댓값",
  "fw iat min": "정방향 패킷 간격 최솟값",
  "bw iat tot": "역방향 패킷 간격 합",
  "bw iat avg": "역방향 패킷 간격 평균",
  "bw iat std": "역방향 패킷 간격 편차",
  "bw iat max": "역방향 패킷 간격 최댓값",
  "bw iat min": "역방향 패킷 간격 최솟값",

  /* TCP 플래그 */
  "fw psh flag": "정방향 PSH 플래그",
  "bw psh flag": "역방향 PSH 플래그",
  "fw urg flag": "정방향 URG 플래그",
  "bw urg flag": "역방향 URG 플래그",
  "fin cnt": "FIN 플래그 횟수",
  "syn cnt": "SYN 플래그 횟수",
  "rst cnt": "RST 플래그 횟수",
  "pst cnt": "PSH 플래그 횟수",
  "ack cnt": "ACK 플래그 횟수",
  "urg cnt": "URG 플래그 횟수",
  "cwe cnt": "CWR 플래그 횟수",
  "ece cnt": "ECE 플래그 횟수",

  /* 헤더와 방향 */
  "fw hdr len": "정방향 헤더 길이",
  "bw hdr len": "역방향 헤더 길이",
  "fw pkt s": "정방향 초당 패킷 수",
  "bw pkt s": "역방향 초당 패킷 수",
  "fw seg avg": "정방향 평균 세그먼트 크기",
  "bw seg avg": "역방향 평균 세그먼트 크기",

  /* 벌크 */
  "fw byt blk avg": "정방향 벌크 평균 바이트",
  "fw pkt blk avg": "정방향 벌크 평균 패킷",
  "fw blk rate avg": "정방향 벌크 전송률",
  "bw byt blk avg": "역방향 벌크 평균 바이트",
  "bw pkt blk avg": "역방향 벌크 평균 패킷",
  "bw blk rate avg": "역방향 벌크 전송률",

  /* 서브플로우 */
  "subfl fw pk": "서브플로우 정방향 패킷 수",
  "subfl fw byt": "서브플로우 정방향 바이트",
  "subfl bw pkt": "서브플로우 역방향 패킷 수",
  "subfl bw byt": "서브플로우 역방향 바이트",

  /* 윈도우와 활동 */
  "fw win byt": "정방향 초기 윈도우 크기",
  "bw win byt": "역방향 초기 윈도우 크기",
  "fw act pkt": "정방향 데이터 포함 패킷 수",
  "fw seg min": "정방향 최소 세그먼트 크기",
  "atv avg": "활동 구간 평균",
  "atv std": "활동 구간 편차",
  "atv max": "활동 구간 최댓값",
  "atv min": "활동 구간 최솟값",
  "idl avg": "유휴 구간 평균",
  "idl std": "유휴 구간 편차",
  "idl max": "유휴 구간 최댓값",
  "idl min": "유휴 구간 최솟값",
};

/** 대응표에 실린 이름의 개수. 발표에서 인용할 수 있게 밖으로 뺀다. */
export const FEATURE_KO_COUNT = Object.keys(TABLE).length;

/** 우리말 이름을 돌려준다. 대응표에 없으면 null. */
export function featureKo(name: string): string | null {
  return TABLE[norm(name)] ?? null;
}
