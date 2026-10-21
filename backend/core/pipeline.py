"""업로드 → 파싱 → 스케일 → 추론 → 결과 저장 오케스트레이션."""

import time

import numpy as np

import settings
from core import csv_parser, session_store
from core.model_service import get_service


def process_upload(tmp_path, filename: str, profile: str = "auto") -> dict:
    svc = get_service()
    upload_id = session_store.new_upload_id()
    udir = settings.UPLOAD_DIR / upload_id
    (udir / "images").mkdir(parents=True)
    (udir / "gradcam").mkdir()
    (udir / "attack_images").mkdir()

    df_raw, X_topk, id_cols, warnings = csv_parser.parse_upload(tmp_path, svc.ranked_features, profile)
    # 파싱된 형태(헤더 오염 제거·절단 반영)를 raw.csv 로 저장 → row_index 와 1:1 대응
    df_raw.to_csv(udir / "raw.csv", index=False)

    X_scaled = svc.scale(X_topk)
    np.save(udir / "X_scaled.npy", X_scaled)      # 이미지/Grad-CAM lazy 생성용
    _t0 = time.perf_counter()
    probs = svc.predict(X_scaled)
    _infer_s = time.perf_counter() - _t0

    benign_idx = svc.classes.index("Benign")
    pred_idx = probs.argmax(axis=1)

    rows = []
    for i in range(len(df_raw)):
        pi = int(pred_idx[i])
        ident = csv_parser.row_identifier(df_raw.iloc[i], id_cols)
        rows.append({
            "row_index": i,
            "pred_class": svc.classes[pi],
            "confidence": round(float(probs[i, pi]), 4),
            "probs": [round(float(p), 4) for p in probs[i]],
            "is_attack": pi != benign_idx,
            "identifier": ident,
        })

    class_counts = {c: int((pred_idx == j).sum()) for j, c in enumerate(svc.classes)}
    n_attacks = int((pred_idx != benign_idx).sum())

    results = {
        "upload_id": upload_id,
        "filename": filename,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "n_rows": len(rows),
        "n_attacks": n_attacks,
        "class_counts": class_counts,
        "id_cols": id_cols,
        "warnings": warnings,
        "perf": {
            "infer_ms": round(_infer_s * 1000, 1),
            "per_flow_ms": round(_infer_s * 1000 / max(len(rows), 1), 3),
            "flows_per_s": round(len(rows) / _infer_s, 1) if _infer_s > 0 else None,
            "device": str(svc.device),
        },
        "rows": rows,
    }
    session_store.save_results(upload_id, results)

    # FR-4: 공격 판정 이미지는 업로드 시점에 eager 렌더 → attack_images/ 별도 저장
    from core import image_render
    for r in rows:
        if r["is_attack"]:
            png = image_render.render_encoding(upload_id, r["row_index"])
            (udir / "attack_images" / f"{r['row_index']}.png").write_bytes(png)

    return results
