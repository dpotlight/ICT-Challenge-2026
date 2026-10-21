"""방화벽 시뮬레이션: firewall.json CRUD (fcntl 락 + 원자적 쓰기).
공용 서버이므로 실제 방화벽(iptables)은 절대 조작하지 않는다 — JSON 관리 데모."""

import fcntl
import json
import os
import shutil
import time
import uuid

import settings

_EMPTY = {"version": 1, "updated_at": None, "rules": []}


def _read() -> dict:
    if not settings.FIREWALL_JSON.exists():
        return dict(_EMPTY, rules=[])
    try:
        with open(settings.FIREWALL_JSON, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        bak = settings.FIREWALL_JSON.with_suffix(".json.bak")
        if bak.exists():
            with open(bak, encoding="utf-8") as f:
                return json.load(f)
        return dict(_EMPTY, rules=[])


def _write(data: dict):
    data["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    tmp = settings.FIREWALL_JSON.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    if settings.FIREWALL_JSON.exists():
        shutil.copy2(settings.FIREWALL_JSON, settings.FIREWALL_JSON.with_suffix(".json.bak"))
    os.replace(tmp, settings.FIREWALL_JSON)


class _Locked:
    """fcntl 파일락 컨텍스트 (외부 패키지 의존 없음)."""

    def __enter__(self):
        self._fh = open(settings.FIREWALL_DIR / ".lock", "w")
        fcntl.flock(self._fh, fcntl.LOCK_EX)
        return self

    def __exit__(self, *exc):
        fcntl.flock(self._fh, fcntl.LOCK_UN)
        self._fh.close()


def list_rules() -> list:
    return _read()["rules"]


def get_rule(rule_id: str):
    return next((r for r in _read()["rules"] if r["rule_id"] == rule_id), None)


def add_rule(upload_id: str, row_index: int, identifier: dict, verdict: dict,
             raw_row: dict, image_png: bytes):
    """등록. 동일 (upload_id,row_index) 중복이면 None 반환 (409 용)."""
    with _Locked():
        data = _read()
        for r in data["rules"]:
            if r["source"]["upload_id"] == upload_id and r["source"]["row_index"] == row_index:
                return None
        rule_id = "fw-" + time.strftime("%Y%m%d") + "-" + uuid.uuid4().hex[:6]
        img_name = f"{rule_id}.png"
        (settings.BLOCKED_IMG_DIR / img_name).write_bytes(image_png)
        rule = {
            "rule_id": rule_id,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "source": {"upload_id": upload_id, "row_index": row_index},
            "identifier": identifier,
            "verdict": verdict,
            "raw_row": raw_row,
            "image": img_name,
        }
        data["rules"].append(rule)
        _write(data)
        return rule


def delete_rule(rule_id: str) -> bool:
    with _Locked():
        data = _read()
        before = len(data["rules"])
        removed = [r for r in data["rules"] if r["rule_id"] == rule_id]
        data["rules"] = [r for r in data["rules"] if r["rule_id"] != rule_id]
        if len(data["rules"]) == before:
            return False
        _write(data)
        for r in removed:
            img = settings.BLOCKED_IMG_DIR / r.get("image", "")
            if img.is_file():
                img.unlink()
        return True


def clear_all() -> int:
    """전체 규칙 삭제 (시연 리셋용). 삭제한 규칙 수 반환."""
    with _Locked():
        data = _read()
        n = len(data["rules"])
        for r in data["rules"]:
            img = settings.BLOCKED_IMG_DIR / r.get("image", "")
            if img.is_file():
                img.unlink()
        data["rules"] = []
        _write(data)
        return n


def registered_map(upload_id: str) -> dict:
    """해당 업로드에서 이미 등록된 row_index → rule_id 매핑."""
    return {r["source"]["row_index"]: r["rule_id"] for r in _read()["rules"]
            if r["source"]["upload_id"] == upload_id}
