"""모델 싱글턴 로드 + 배치 추론. 2_code 의 transforms/models 를 그대로 import."""

import json
import sys
import threading

import numpy as np
import torch

import settings

sys.path.insert(0, str(settings.CODE_DIR))
import transforms as T          # noqa: E402
from models import ImageCNN     # noqa: E402

_lock = threading.Lock()
_service = None


class ModelService:
    def __init__(self):
        ckpt_path = sorted(settings.DEPLOY_DIR.glob("multiclass_*.pt"))
        if not ckpt_path:
            raise FileNotFoundError(f"{settings.DEPLOY_DIR} 에 multiclass_*.pt 없음 → 09_train_multiclass.py 먼저 실행")
        ckpt = torch.load(ckpt_path[0], map_location="cpu")

        self.classes = ckpt["classes"]
        self.K = int(ckpt["K"])
        self.transform = ckpt["transform"]
        self.n_bins = int(ckpt.get("n_bins", 8))
        self.ranked_features = ckpt["ranked_features"]
        self.model_file = ckpt_path[0].name

        with open(settings.DEPLOY_DIR / "scaler.json", encoding="utf-8") as f:
            scaler = json.load(f)
        assert scaler["feature_names"] == self.ranked_features, "scaler.json 피처 순서 불일치"
        self.feat_min = np.array(scaler["min"], dtype=np.float64)
        self.feat_max = np.array(scaler["max"], dtype=np.float64)
        assert len(self.feat_min) == self.K, "scaler 차원 != K"

        use_cuda = torch.cuda.is_available() and not settings.FORCE_CPU
        self.device = torch.device("cuda" if use_cuda else "cpu")
        self.model = ImageCNN(method=self.transform, image_size=self.K, n_out=len(self.classes))
        self.model.load_state_dict(ckpt["state_dict"])
        self.model.to(self.device).eval()

    # ── 전처리: raw 피처행렬(랭킹순 K열) → [-1,1] ──
    def scale(self, X_topk: np.ndarray) -> np.ndarray:
        return T.scale_to_unit(X_topk, self.feat_min, self.feat_max).astype(np.float32)

    # ── 배치 추론: 스케일된 (N,K) → softmax (N,C) ──
    @torch.no_grad()
    def predict(self, X_scaled: np.ndarray) -> np.ndarray:
        probs = []
        for i in range(0, len(X_scaled), settings.BATCH_SIZE):
            xb = torch.from_numpy(X_scaled[i:i + settings.BATCH_SIZE]).to(self.device)
            logits = self.model(xb)
            if logits.dim() == 1:                     # 배치 1 인 경우 (C,) → (1,C)
                logits = logits.unsqueeze(0)
            probs.append(torch.softmax(logits.float(), dim=1).cpu().numpy())
        return np.concatenate(probs) if probs else np.zeros((0, len(self.classes)), dtype=np.float32)

    # ── 단건 이미지 — 렌더링/Grad-CAM 공용. 단일변환 (K,K) / multi (3,K,K) ──
    def encode_image(self, x_scaled_row: np.ndarray) -> np.ndarray:
        if self.transform == "multi":
            return T.to_image_multi(x_scaled_row, n_bins=self.n_bins)
        return T.to_image(x_scaled_row, self.transform, n_bins=self.n_bins)

    def meta(self) -> dict:
        return {
            "model_file": self.model_file,
            "classes": self.classes,
            "K": self.K,
            "transform": self.transform,
            "feature_names": self.ranked_features,
            "device": str(self.device),
        }


def get_service() -> ModelService:
    global _service
    with _lock:
        if _service is None:
            _service = ModelService()
    return _service
