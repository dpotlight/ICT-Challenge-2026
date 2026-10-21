"""업로드 세션(upload_id) 단위 결과 관리."""

import json
import time
import uuid

import pandas as pd

import settings


def new_upload_id() -> str:
    return time.strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:6]


def upload_dir(upload_id: str):
    d = settings.UPLOAD_DIR / upload_id
    if not d.exists():
        raise FileNotFoundError(f"upload_id 없음: {upload_id}")
    return d


def save_results(upload_id: str, results: dict):
    with open(settings.UPLOAD_DIR / upload_id / "results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False)


def load_results(upload_id: str) -> dict:
    with open(upload_dir(upload_id) / "results.json", encoding="utf-8") as f:
        return json.load(f)


def load_raw_row(upload_id: str, row_index: int) -> dict:
    """raw.csv 에서 해당 행 원문을 dict 로 반환 (컬럼명 strip)."""
    df = pd.read_csv(upload_dir(upload_id) / "raw.csv", low_memory=False,
                     skiprows=range(1, row_index + 1), nrows=1)
    df.columns = df.columns.str.strip()
    row = df.iloc[0].to_dict()
    return {k: (None if pd.isna(v) else (v.item() if hasattr(v, "item") else v))
            for k, v in row.items()}


def list_uploads() -> list:
    out = []
    for d in sorted(settings.UPLOAD_DIR.iterdir(), reverse=True):
        rj = d / "results.json"
        if not rj.exists():
            continue
        with open(rj, encoding="utf-8") as f:
            r = json.load(f)
        out.append({"upload_id": d.name, "filename": r.get("filename"),
                    "created_at": r.get("created_at"), "n_rows": r.get("n_rows"),
                    "n_attacks": r.get("n_attacks"), "class_counts": r.get("class_counts"),
                    # 발표 페이지의 실측 지표가 이 값을 읽는다
                    "perf": r.get("perf")})
    return out
