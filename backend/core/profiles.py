"""업로드 도구 프로파일: 타 트래픽 분석 도구의 CSV 컬럼을
CICFlowMeter(CSE-CIC-IDS2018) 표준 피처명·단위로 매핑한다.

지원 프로파일
------------
- cicflowmeter : 신형(IDS2018 축약명) + 구형(IDS2017 긴 이름) 컬럼명 흡수
- nfstream     : NFStream 컬럼 매핑 + 단위 변환(ms→µs) + 파생 계산(rate 계열)
- auto         : 위 프로파일들을 순서대로 시도해 커버리지가 가장 높은 것 선택

매핑 결과 없는 피처는 0.0 으로 채운다 — 학습 파이프라인(02_clean)의 NaN→0
규칙과 동일한 관례이므로 모델 입력 규약을 깨지 않는다(단, 정확도 저하 경고 표시).
"""

import re

import numpy as np
import pandas as pd


def _norm(s: str) -> str:
    """컬럼명 정규화: 소문자화 + 영숫자만 남김. 'Flow Byts/s'→'flowbytss'."""
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


# ── CICFlowMeter 구형(IDS2017 등) 긴 이름 → 신형 축약명 별칭 ──
CIC_ALIASES = {
    "Flow Duration": ["Flow Duration"],
    "Dst Port": ["Destination Port"],
    "Tot Fwd Pkts": ["Total Fwd Packets", "Total Fwd Packet"],
    "Tot Bwd Pkts": ["Total Backward Packets", "Total Bwd packets"],
    "TotLen Fwd Pkts": ["Total Length of Fwd Packets", "Total Length of Fwd Packet"],
    "TotLen Bwd Pkts": ["Total Length of Bwd Packets", "Total Length of Bwd Packet"],
    "Fwd Pkt Len Max": ["Fwd Packet Length Max"],
    "Fwd Pkt Len Min": ["Fwd Packet Length Min"],
    "Fwd Pkt Len Mean": ["Fwd Packet Length Mean"],
    "Fwd Pkt Len Std": ["Fwd Packet Length Std"],
    "Bwd Pkt Len Max": ["Bwd Packet Length Max"],
    "Bwd Pkt Len Min": ["Bwd Packet Length Min"],
    "Bwd Pkt Len Mean": ["Bwd Packet Length Mean"],
    "Bwd Pkt Len Std": ["Bwd Packet Length Std"],
    "Flow Byts/s": ["Flow Bytes/s"],
    "Flow Pkts/s": ["Flow Packets/s"],
    "Fwd Pkts/s": ["Fwd Packets/s"],
    "Bwd Pkts/s": ["Bwd Packets/s"],
    "Pkt Len Min": ["Min Packet Length", "Packet Length Min"],
    "Pkt Len Max": ["Max Packet Length", "Packet Length Max"],
    "Pkt Len Mean": ["Packet Length Mean"],
    "Pkt Len Std": ["Packet Length Std"],
    "Pkt Len Var": ["Packet Length Variance"],
    "Fwd Header Len": ["Fwd Header Length"],
    "Bwd Header Len": ["Bwd Header Length"],
    "Init Fwd Win Byts": ["Init_Win_bytes_forward", "FWD Init Win Bytes"],
    "Init Bwd Win Byts": ["Init_Win_bytes_backward", "Bwd Init Win Bytes"],
    "Fwd Seg Size Min": ["min_seg_size_forward"],
    "Fwd Act Data Pkts": ["act_data_pkt_fwd", "Fwd Act Data Packets"],
    "Fwd Seg Size Avg": ["Avg Fwd Segment Size"],
    "Bwd Seg Size Avg": ["Avg Bwd Segment Size"],
    "Pkt Size Avg": ["Average Packet Size", "Packet Size Avg"],
    "FIN Flag Cnt": ["FIN Flag Count"], "SYN Flag Cnt": ["SYN Flag Count"],
    "RST Flag Cnt": ["RST Flag Count"], "PSH Flag Cnt": ["PSH Flag Count"],
    "ACK Flag Cnt": ["ACK Flag Count"], "URG Flag Cnt": ["URG Flag Count"],
    "ECE Flag Cnt": ["ECE Flag Count"], "CWE Flag Count": ["CWR Flag Count"],
    "Fwd IAT Tot": ["Fwd IAT Total"], "Bwd IAT Tot": ["Bwd IAT Total"],
    "Subflow Fwd Pkts": ["Subflow Fwd Packets"], "Subflow Fwd Byts": ["Subflow Fwd Bytes"],
    "Subflow Bwd Pkts": ["Subflow Bwd Packets"], "Subflow Bwd Byts": ["Subflow Bwd Bytes"],
    "Src IP": ["Source IP"], "Dst IP": ["Destination IP"],
    "Src Port": ["Source Port"],
}

# ── NFStream 매핑: canonical → (소스컬럼, 배율) 또는 파생 함수 ──
_MS = 1000.0   # NFStream 시간 단위 ms → CICFlowMeter µs

def _rate(num_col, dur_ms_col):
    def f(df):
        dur_s = pd.to_numeric(df[dur_ms_col], errors="coerce") / 1000.0
        num = pd.to_numeric(df[num_col], errors="coerce")
        return (num / dur_s.replace(0, np.nan)).fillna(0.0)
    return f

NFSTREAM_MAP = {
    "Dst Port": ("dst_port", 1),
    "Flow Duration": ("bidirectional_duration_ms", _MS),
    "Tot Fwd Pkts": ("src2dst_packets", 1),
    "Tot Bwd Pkts": ("dst2src_packets", 1),
    "TotLen Fwd Pkts": ("src2dst_bytes", 1),
    "TotLen Bwd Pkts": ("dst2src_bytes", 1),
    "Fwd Pkt Len Max": ("src2dst_max_ps", 1),
    "Fwd Pkt Len Min": ("src2dst_min_ps", 1),
    "Fwd Pkt Len Mean": ("src2dst_mean_ps", 1),
    "Fwd Pkt Len Std": ("src2dst_stddev_ps", 1),
    "Bwd Pkt Len Max": ("dst2src_max_ps", 1),
    "Bwd Pkt Len Min": ("dst2src_min_ps", 1),
    "Bwd Pkt Len Mean": ("dst2src_mean_ps", 1),
    "Bwd Pkt Len Std": ("dst2src_stddev_ps", 1),
    "Pkt Len Max": ("bidirectional_max_ps", 1),
    "Pkt Len Min": ("bidirectional_min_ps", 1),
    "Pkt Len Mean": ("bidirectional_mean_ps", 1),
    "Pkt Len Std": ("bidirectional_stddev_ps", 1),
    "Flow IAT Mean": ("bidirectional_mean_piat_ms", _MS),
    "Flow IAT Max": ("bidirectional_max_piat_ms", _MS),
    "Flow IAT Min": ("bidirectional_min_piat_ms", _MS),
    "Flow IAT Std": ("bidirectional_stddev_piat_ms", _MS),
    "Fwd IAT Mean": ("src2dst_mean_piat_ms", _MS),
    "Fwd IAT Max": ("src2dst_max_piat_ms", _MS),
    "Fwd IAT Min": ("src2dst_min_piat_ms", _MS),
    "Fwd IAT Std": ("src2dst_stddev_piat_ms", _MS),
    "Bwd IAT Mean": ("dst2src_mean_piat_ms", _MS),
    "Bwd IAT Max": ("dst2src_max_piat_ms", _MS),
    "Bwd IAT Min": ("dst2src_min_piat_ms", _MS),
    "Bwd IAT Std": ("dst2src_stddev_piat_ms", _MS),
    "FIN Flag Cnt": ("bidirectional_fin_packets", 1),
    "SYN Flag Cnt": ("bidirectional_syn_packets", 1),
    "RST Flag Cnt": ("bidirectional_rst_packets", 1),
    "PSH Flag Cnt": ("bidirectional_psh_packets", 1),
    "ACK Flag Cnt": ("bidirectional_ack_packets", 1),
    "URG Flag Cnt": ("bidirectional_urg_packets", 1),
    # 파생 계산 (NFStream 은 rate 미제공)
    "Flow Pkts/s": _rate("bidirectional_packets", "bidirectional_duration_ms"),
    "Fwd Pkts/s": _rate("src2dst_packets", "bidirectional_duration_ms"),
    "Bwd Pkts/s": _rate("dst2src_packets", "bidirectional_duration_ms"),
    "Flow Byts/s": _rate("bidirectional_bytes", "bidirectional_duration_ms"),
    # 식별자
    "Src IP": ("src_ip", None), "Dst IP": ("dst_ip", None),
    "Src Port": ("src_port", None), "Protocol": ("protocol", None),
    "Timestamp": ("bidirectional_first_seen_ms", None),
}

PROFILE_NAMES = ["auto", "cicflowmeter", "nfstream"]
IDENT_CANON = ["Flow ID", "Src IP", "Src Port", "Dst IP", "Dst Port", "Protocol", "Timestamp"]


def _build_cic_lookup():
    lookup = {}
    for canon, aliases in CIC_ALIASES.items():
        lookup[_norm(canon)] = canon
        for a in aliases:
            lookup[_norm(a)] = canon
    return lookup

_CIC_LOOKUP = _build_cic_lookup()


def _apply_cic(df: pd.DataFrame, required: list):
    """컬럼명 정규화 매칭으로 canonical 이름 부여 (신·구형 CICFlowMeter, 유사 명명 도구)."""
    rename = {}
    for col in df.columns:
        canon = _CIC_LOOKUP.get(_norm(col))
        if canon and canon not in df.columns:
            rename[col] = canon
    out = df.rename(columns=rename)
    covered = [c for c in required if c in out.columns]
    return out, covered


def _apply_nfstream(df: pd.DataFrame, required: list):
    """NFStream 컬럼 매핑 + 단위 변환 + 파생 계산. 원본 컬럼은 보존."""
    cols_norm = {_norm(c): c for c in df.columns}
    mapped = pd.DataFrame(index=df.index)
    for canon, spec in NFSTREAM_MAP.items():
        if canon in df.columns:
            continue
        if callable(spec):
            try:
                mapped[canon] = spec(df)
            except KeyError:
                continue
        else:
            src, scale = spec
            real = cols_norm.get(_norm(src))
            if real is None:
                continue
            if scale is None:
                mapped[canon] = df[real]
            else:
                mapped[canon] = pd.to_numeric(df[real], errors="coerce") * scale
    out = pd.concat([mapped, df], axis=1)   # canonical 우선 + 원본 보존
    covered = [c for c in required if c in out.columns]
    return out, covered


def resolve(df: pd.DataFrame, required: list, profile: str = "auto"):
    """
    Returns
    -------
    df_mapped : canonical 컬럼명의 DataFrame (식별자 포함, 매핑된 것만)
    used      : 실제 사용된 프로파일명
    missing   : required 중 매핑 실패 피처 목록 (0.0 대체 대상)
    """
    candidates = []
    if profile in ("cicflowmeter", "auto"):
        candidates.append(("cicflowmeter", _apply_cic(df, required)))
    if profile in ("nfstream", "auto"):
        candidates.append(("nfstream", _apply_nfstream(df, required)))
    if not candidates:
        raise ValueError(f"알 수 없는 프로파일: {profile} (가능: {PROFILE_NAMES})")

    used, (df_mapped, covered) = max(candidates, key=lambda kv: len(kv[1][1]))
    missing = [c for c in required if c not in covered]
    return df_mapped, used, missing
