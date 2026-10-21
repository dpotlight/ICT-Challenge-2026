"""원본 라벨 → 7-클래스 attack_category 매핑 helper (2_code/config.py 와 동일 규칙)."""

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE / "2_code"))
import config  # noqa: E402


def to_category(raw_label: str) -> str:
    return config.ATTACK_CATEGORY_MAP.get(str(raw_label).strip(), "Benign")
