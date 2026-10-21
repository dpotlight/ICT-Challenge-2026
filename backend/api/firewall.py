"""방화벽 시뮬레이션 API (JSON 관리)."""

import settings
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from core import firewall_store, image_render, policy_adapters, session_store
from core.readonly import guard as readonly_guard

router = APIRouter(prefix="/api/firewall", tags=["firewall"])


class RuleCreate(BaseModel):
    upload_id: str
    row_index: int | None = None
    all_attacks: bool = False


@router.get("/rules")
def list_rules():
    return {"rules": firewall_store.list_rules()}


@router.post("/rules", status_code=201)
def create_rules(body: RuleCreate):
    readonly_guard()
    try:
        results = session_store.load_results(body.upload_id)
    except FileNotFoundError:
        raise HTTPException(404, f"upload_id 없음: {body.upload_id}")

    if body.all_attacks:
        targets = [r for r in results["rows"] if r["is_attack"]]
    elif body.row_index is not None:
        if not (0 <= body.row_index < results["n_rows"]):
            raise HTTPException(404, "row_index 범위 밖")
        targets = [results["rows"][body.row_index]]
    else:
        raise HTTPException(400, "row_index 또는 all_attacks=true 필요")

    created, duplicated = [], []
    for row in targets:
        rule = firewall_store.add_rule(
            upload_id=body.upload_id,
            row_index=row["row_index"],
            identifier=row["identifier"],
            verdict={"predicted_class": row["pred_class"], "confidence": row["confidence"]},
            raw_row=session_store.load_raw_row(body.upload_id, row["row_index"]),
            image_png=image_render.render_encoding(body.upload_id, row["row_index"]),
        )
        (created if rule else duplicated).append(row["row_index"])

    if not created and duplicated and not body.all_attacks:
        raise HTTPException(409, "이미 방화벽에 등록된 플로우입니다")
    return {"created": created, "duplicated": duplicated}


@router.delete("/rules")
def clear_rules():
    """차단 목록 전체 삭제 (시연 리셋)."""
    readonly_guard()
    return {"deleted_count": firewall_store.clear_all()}


@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: str):
    readonly_guard()
    if not firewall_store.delete_rule(rule_id):
        raise HTTPException(404, f"rule 없음: {rule_id}")
    return {"deleted": rule_id}


@router.get("/rules/{rule_id}/image.png")
def rule_image(rule_id: str):
    rule = firewall_store.get_rule(rule_id)
    if rule is None:
        raise HTTPException(404, f"rule 없음: {rule_id}")
    img = settings.BLOCKED_IMG_DIR / rule["image"]
    if not img.is_file():
        raise HTTPException(404, "이미지 없음")
    return Response(img.read_bytes(), media_type="image/png",
                    headers={"Cache-Control": "max-age=86400"})


# ── 정책 집행 확장 ──────────────────────────────────────────
class ExportReq(BaseModel):
    platform: str
    format: str
    rule_ids: list[str] | None = None      # 생략 시 전체 규칙
    targets: dict[str, str] = {}


@router.get("/platforms")
def list_platforms():
    """집행 지점 메타데이터. 프론트가 이걸로 연동 카드와 입력폼을 구성한다."""
    return {"platforms": policy_adapters.platform_meta()}


@router.post("/export")
def export_policy(body: ExportReq):
    """차단 규칙을 지정한 플랫폼의 정책 형식으로 변환한다.

    변환만 수행하며 어떤 외부 API도 호출하지 않는다(dry-run).
    """
    rules = firewall_store.list_rules()
    if body.rule_ids:
        want = set(body.rule_ids)
        rules = [r for r in rules if r["rule_id"] in want]
    if not rules:
        raise HTTPException(404, "변환할 차단 규칙이 없습니다")

    try:
        return policy_adapters.export(rules, body.platform, body.format, body.targets)
    except KeyError:
        raise HTTPException(400, f"알 수 없는 플랫폼: {body.platform}")
    except ValueError as e:
        raise HTTPException(400, str(e))
