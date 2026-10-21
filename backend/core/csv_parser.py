"""업로드 CSV 파싱: 스키마 검증 + 식별자 보존 + 02_clean 과 동일한 정제 규칙."""

import numpy as np
import pandas as pd

import settings
from core import profiles


class CsvSchemaError(ValueError):
    def __init__(self, missing):
        self.missing = missing
        super().__init__(f"필수 피처 컬럼 누락: {missing}")


def parse_upload(csv_path, required_features: list, profile: str = "auto") -> tuple:
    """
    Returns
    -------
    df_raw   : canonical 명명으로 매핑된 DataFrame — raw 행 조회용
    X_topk   : (N, K) float64 — required_features 순서의 피처 행렬 (NaN/Inf→0)
    id_cols  : 존재하는 식별자 컬럼 목록
    warnings : list[str]  (사용 프로파일·누락 피처 0 대체 등)
    """
    df = pd.read_csv(csv_path, low_memory=False)
    df.columns = df.columns.str.strip()
    warnings = []

    # 라벨 값이 들어간 헤더 오염 행 제거 (CSE-CIC-IDS2018 알려진 문제)
    label_col = next((c for c in ("Label", "label") if c in df.columns), None)
    if label_col is not None:
        mask = df[label_col].astype(str).str.strip().str.lower() == "label"
        if mask.any():
            df = df[~mask].reset_index(drop=True)
            warnings.append(f"헤더 오염 행 {int(mask.sum())}개 제거")

    if len(df) > settings.MAX_UPLOAD_ROWS:
        warnings.append(f"행 수 {len(df):,} → 상한 {settings.MAX_UPLOAD_ROWS:,}개로 절단")
        df = df.iloc[:settings.MAX_UPLOAD_ROWS].reset_index(drop=True)

    # 도구 프로파일 매핑 (컬럼명 표준화 + 단위 변환)
    df, used_profile, missing = profiles.resolve(df, required_features, profile)
    if used_profile != "cicflowmeter" or profile != "auto":
        warnings.append(f"프로파일: {used_profile}")

    # 매핑 실패 피처: 절반 이하면 0.0 대체(학습 시 NaN→0 관례와 동일) + 경고
    if missing:
        if len(missing) > len(required_features) // 2:
            raise CsvSchemaError(missing)
        warnings.append(f"누락 피처 {len(missing)}개 → 0 대체 (정확도 저하 가능): {', '.join(missing)}")
        for c in missing:
            df[c] = 0.0

    feat = df[required_features].copy()
    for col in required_features:
        if feat[col].dtype == object:
            feat[col] = pd.to_numeric(feat[col], errors="coerce")   # "Infinity" 등 흡수
    feat = feat.replace([np.inf, -np.inf], np.nan).fillna(0.0)
    X_topk = feat.values.astype(np.float64)

    id_cols = [c for c in settings.IDENTIFIER_COLS if c in df.columns]
    return df, X_topk, id_cols, warnings


def row_identifier(row: pd.Series, id_cols: list) -> dict:
    """방화벽 등록용 식별자. IP 있으면 ip_5tuple, 없으면 dstport_fallback."""
    def val(c):
        return None if c not in id_cols else (None if pd.isna(row[c]) else str(row[c]))

    has_ip = val("Src IP") is not None and val("Dst IP") is not None
    ident = {
        "type": "ip_5tuple" if has_ip else "dstport_fallback",
        "src_ip": val("Src IP"),
        "src_port": val("Src Port"),
        "dst_ip": val("Dst IP"),
        "dst_port": val("Dst Port"),
        "protocol": val("Protocol"),
        "timestamp": val("Timestamp"),
        "flow_id": val("Flow ID"),
    }
    return ident
