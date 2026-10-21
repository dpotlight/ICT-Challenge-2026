"""업로드/플로우/이미지/Grad-CAM API."""

import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response

from core import csv_parser, firewall_store, gradcam_service, image_render, pipeline, session_store
from core.readonly import guard as readonly_guard
from core.model_service import get_service
from core.profiles import PROFILE_NAMES

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("")
async def create_upload(file: UploadFile, profile: str = Form("auto")):
    readonly_guard()
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "CSV 파일만 업로드 가능합니다")
    if profile not in PROFILE_NAMES:
        raise HTTPException(400, f"알 수 없는 프로파일: {profile} (가능: {PROFILE_NAMES})")
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)
    try:
        results = pipeline.process_upload(tmp_path, file.filename, profile)
    except csv_parser.CsvSchemaError as e:
        raise HTTPException(400, detail={"error": "missing_features", "missing": e.missing})
    finally:
        tmp_path.unlink(missing_ok=True)
    return {k: v for k, v in results.items() if k != "rows"}


@router.get("")
def get_uploads():
    return session_store.list_uploads()


@router.get("/{upload_id}")
def get_upload(upload_id: str):
    r = _results(upload_id)
    return {k: v for k, v in r.items() if k != "rows"}


@router.delete("/{upload_id}")
def delete_upload(upload_id: str):
    """분석 세션 삭제 (방화벽 등록분 이미지는 blocked_images 복사본이라 영향 없음)."""
    readonly_guard()
    import shutil as sh
    import settings
    d = settings.UPLOAD_DIR / upload_id
    if not (d.exists() and (d / "results.json").exists()):
        raise HTTPException(404, f"upload_id 없음: {upload_id}")
    sh.rmtree(d)
    return {"deleted": upload_id}


def _filter_rows(rows: list, only: str, cls: str | None) -> list:
    """cls(쉼표 구분 예측 클래스명 목록) 필터가 있으면 우선, 없으면 only=attack 필터."""
    if cls:
        wanted = {c.strip() for c in cls.split(",") if c.strip()}
        return [x for x in rows if x["pred_class"] in wanted]
    if only == "attack":
        return [x for x in rows if x["is_attack"]]
    return rows


@router.get("/{upload_id}/strip")
def get_strip(upload_id: str):
    """세션 전체 판정을 압축해 돌려준다 — 캡처 스트립(미니맵) 전용.

    행별 상세는 빼고 클래스 인덱스만 순서대로 담는다.
    """
    r = _results(upload_id)
    svc = get_service()
    idx = {c: i for i, c in enumerate(svc.classes)}
    return {
        "classes": svc.classes,
        "seq": [idx.get(x["pred_class"], 0) for x in r["rows"]],
    }


@router.get("/{upload_id}/flows")
def get_flows(upload_id: str, offset: int = 0, limit: int = Query(100, le=500),
              only: str = "all", cls: str | None = None, sort: str = "row"):
    r = _results(upload_id)
    rows = _filter_rows(r["rows"], only, cls)
    if sort == "conf_asc":       # 검토 우선: 모델이 덜 확신한 판정부터
        rows = sorted(rows, key=lambda x: x["confidence"])
    elif sort == "conf_desc":
        rows = sorted(rows, key=lambda x: -x["confidence"])
    reg = firewall_store.registered_map(upload_id)
    page = [dict(x, rule_id=reg.get(x["row_index"])) for x in rows[offset:offset + limit]]
    return {"total": len(rows), "offset": offset, "limit": limit, "rows": page}


@router.get("/{upload_id}/timeline")
def get_timeline(upload_id: str, bins: int = Query(60, ge=10, le=200)):
    """행 순서 기준 구간별 플로우/공격 수 — 대시보드 타임라인 차트용."""
    r = _results(upload_id)
    n = r["n_rows"]
    bins = min(bins, max(n, 1))
    total = [0] * bins
    attacks = [0] * bins
    for x in r["rows"]:
        b = min(x["row_index"] * bins // max(n, 1), bins - 1)
        total[b] += 1
        if x["is_attack"]:
            attacks[b] += 1
    return {"bins": bins, "n_rows": n,
            "total": total, "attacks": attacks}


@router.get("/{upload_id}/flows/{row_index}")
def get_flow(upload_id: str, row_index: int):
    r = _results(upload_id)
    if not (0 <= row_index < r["n_rows"]):
        raise HTTPException(404, "row_index 범위 밖")
    row = r["rows"][row_index]
    reg = firewall_store.registered_map(upload_id)
    return dict(row,
                classes=get_service().classes,
                raw_row=session_store.load_raw_row(upload_id, row_index),
                rule_id=reg.get(row_index))


@router.get("/{upload_id}/flows/{row_index}/nav")
def get_flow_nav(upload_id: str, row_index: int, only: str = "all", cls: str | None = None):
    """현재 필터(only/cls) 기준 이전/다음 플로우 인덱스."""
    r = _results(upload_id)
    rows = _filter_rows(r["rows"], only, cls)
    indices = [x["row_index"] for x in rows]
    prev_idx = next((i for i in reversed(indices) if i < row_index), None)
    next_idx = next((i for i in indices if i > row_index), None)
    pos = indices.index(row_index) + 1 if row_index in indices else None
    return {"prev": prev_idx, "next": next_idx, "pos": pos, "total": len(indices)}


@router.get("/{upload_id}/flows/{row_index}/similar")
def get_similar(upload_id: str, row_index: int, k: int = Query(6, ge=1, le=24)):
    """스케일된 피처 공간의 코사인 유사도로 행위가 닮은 플로우 검색."""
    import numpy as np

    import settings
    r = _results(upload_id)
    if not (0 <= row_index < r["n_rows"]):
        raise HTTPException(404, "row_index 범위 밖")
    X = np.load(settings.UPLOAD_DIR / upload_id / "X_scaled.npy")
    norms = np.linalg.norm(X, axis=1)
    norms[norms == 0] = 1e-9
    v = X[row_index] / norms[row_index]
    sims = (X / norms[:, None]) @ v
    sims[row_index] = -2.0
    top = np.argsort(-sims)[:k]
    reg = firewall_store.registered_map(upload_id)
    rows = r["rows"]
    return {"rows": [
        dict(rows[int(i)], rule_id=reg.get(int(i)), similarity=round(float(sims[int(i)]), 4))
        for i in top
    ]}


@router.get("/{upload_id}/flows/{row_index}/image.png")
def get_image(upload_id: str, row_index: int):
    try:
        png = image_render.render_encoding(upload_id, row_index)
    except (FileNotFoundError, IndexError) as e:
        raise HTTPException(404, str(e))
    return Response(png, media_type="image/png",
                    headers={"Cache-Control": "max-age=86400"})


@router.get("/{upload_id}/flows/{row_index}/gradcam.png")
def get_gradcam(upload_id: str, row_index: int):
    r = _results(upload_id)
    row = r["rows"][row_index]
    svc = get_service()
    png = gradcam_service.render_gradcam(upload_id, row_index,
                                         svc.classes.index(row["pred_class"]))
    return Response(png, media_type="image/png",
                    headers={"Cache-Control": "max-age=86400"})


@router.get("/{upload_id}/flows/{row_index}/gradcam/features")
def get_gradcam_features(upload_id: str, row_index: int, k: int = Query(5, le=20)):
    r = _results(upload_id)
    row = r["rows"][row_index]
    svc = get_service()
    pairs = gradcam_service.topk_feature_pairs(upload_id, row_index,
                                               svc.classes.index(row["pred_class"]), k)
    return {"row_index": row_index, "pred_class": row["pred_class"], "pairs": pairs}


def _results(upload_id: str) -> dict:
    try:
        return session_store.load_results(upload_id)
    except FileNotFoundError:
        raise HTTPException(404, f"upload_id 없음: {upload_id}")
