"""다중분류 Grad-CAM: 예측 클래스 logit 기준 backward.
2_code/scripts/08_gradcam.py 의 hook 구현을 다중분류용으로 개조 이식."""

import io
import threading

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from matplotlib import cm
from PIL import Image

import settings
from core.image_render import load_scaled_row
from core.model_service import get_service

_lock = threading.Lock()   # hook 상태 공유 → 동시 요청 직렬화


class GradCAM:
    """CNN2D 마지막 Conv2d 에 대한 Grad-CAM (클래스 지정 backward)."""

    def __init__(self, model):
        self.model = model
        self.model.eval()
        self.activations = None
        self.gradients = None
        convs = [m for m in model.cnn.features if isinstance(m, nn.Conv2d)]
        convs[-1].register_forward_hook(self._fwd)
        convs[-1].register_full_backward_hook(self._bwd)

    def _fwd(self, module, inp, out):
        self.activations = out.detach()

    def _bwd(self, module, grad_in, grad_out):
        self.gradients = grad_out[0].detach()

    def __call__(self, x_vec: torch.Tensor, class_idx: int) -> np.ndarray:
        """x_vec: (1,K) 스케일 벡터 → (K,K) CAM [0,1]."""
        self.model.zero_grad()
        logits = self.model(x_vec)              # (1,C) 또는 (C,)
        if logits.dim() == 1:
            logits = logits.unsqueeze(0)
        logits[0, class_idx].backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = F.relu((weights * self.activations).sum(dim=1, keepdim=True))
        K = x_vec.shape[1]
        cam = F.interpolate(cam, size=(K, K), mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        if cam.max() > cam.min():
            cam = (cam - cam.min()) / (cam.max() - cam.min())
        return cam


_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = GradCAM(get_service().model)
    return _engine


def compute_cam(upload_id: str, row_index: int, class_idx: int) -> np.ndarray:
    svc = get_service()
    x = load_scaled_row(upload_id, row_index)
    xt = torch.from_numpy(x).unsqueeze(0).to(svc.device)
    with _lock:
        return _get_engine()(xt, class_idx)


def render_gradcam(upload_id: str, row_index: int, class_idx: int) -> bytes:
    """인코딩 이미지(회색) + CAM(jet) 오버레이 PNG. 디스크 캐시."""
    cache = settings.UPLOAD_DIR / upload_id / "gradcam" / f"{row_index}.png"
    if cache.exists():
        return cache.read_bytes()

    svc = get_service()
    base = svc.encode_image(load_scaled_row(upload_id, row_index))
    if svc.transform == "multi":
        gray = np.clip(base, 0, 1).mean(axis=0)          # (3,K,K) → 휘도 평균
    else:
        vmin, vmax = (-1.0, 1.0) if svc.transform == "gasf" else (0.0, 1.0)
        gray = np.clip((base - vmin) / ((vmax - vmin) or 1.0), 0, 1)
    cam = compute_cam(upload_id, row_index, class_idx)

    gray_rgba = (cm.get_cmap("gray")(gray) * 255).astype(np.uint8)
    jet_rgba = (cm.get_cmap("jet")(cam) * 255).astype(np.uint8)
    jet_rgba[..., 3] = int(settings.GRADCAM_ALPHA * 255)

    px = settings.RENDER_SIZE
    img = Image.alpha_composite(
        Image.fromarray(gray_rgba, "RGBA").resize((px, px), Image.NEAREST),
        Image.fromarray(jet_rgba, "RGBA").resize((px, px), Image.NEAREST),
    )
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png = buf.getvalue()
    cache.write_bytes(png)
    return png


def topk_feature_pairs(upload_id: str, row_index: int, class_idx: int, k: int = 5) -> list:
    """CAM 상위 K 픽셀 → (피처 i, 피처 j) 쌍 매핑 (08_gradcam 의 표6 로직)."""
    svc = get_service()
    cam = compute_cam(upload_id, row_index, class_idx)
    flat = cam.flatten()
    top = np.argsort(flat)[::-1][:k]
    names = svc.ranked_features
    out = []
    for fi in top:
        i, j = divmod(int(fi), cam.shape[0])
        out.append({"pixel": [i, j],
                    "feature_i": names[i] if i < len(names) else f"f{i}",
                    "feature_j": names[j] if j < len(names) else f"f{j}",
                    "score": round(float(cam[i, j]), 4)})
    return out
