"""K×K 인코딩 행렬 → colormap → nearest 업스케일 PNG. 디스크 캐시."""

import io

import numpy as np
from matplotlib import cm
from PIL import Image

import settings
from core.model_service import get_service


def _to_png_bytes(mat: np.ndarray, vmin: float, vmax: float,
                  cmap_name: str = None, size: int = None) -> bytes:
    cmap = cm.get_cmap(cmap_name or settings.COLORMAP)
    rng = (vmax - vmin) or 1.0
    norm = np.clip((mat - vmin) / rng, 0.0, 1.0)
    rgba = (cmap(norm) * 255).astype(np.uint8)
    img = Image.fromarray(rgba, mode="RGBA")
    px = size or settings.RENDER_SIZE
    img = img.resize((px, px), Image.NEAREST)      # 픽셀 경계 유지
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def load_scaled_row(upload_id: str, row_index: int) -> np.ndarray:
    X = np.load(settings.UPLOAD_DIR / upload_id / "X_scaled.npy", mmap_mode="r")
    if not (0 <= row_index < len(X)):
        raise IndexError(f"row_index 범위 밖: {row_index}")
    return np.asarray(X[row_index], dtype=np.float32)


def _rgb_composite_png(mat3: np.ndarray, size: int = None) -> bytes:
    """(3,K,K) [0,1] → GASF=R, MTF=G, RP=B 합성 RGB PNG."""
    rgb = (np.clip(mat3, 0, 1).transpose(1, 2, 0) * 255).astype(np.uint8)
    img = Image.fromarray(rgb, mode="RGB")
    px = size or settings.RENDER_SIZE
    img = img.resize((px, px), Image.NEAREST)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def render_encoding(upload_id: str, row_index: int) -> bytes:
    """인코딩 이미지 PNG (캐시 우선). multi 는 3채널 RGB 합성."""
    cache = settings.UPLOAD_DIR / upload_id / "images" / f"{row_index}.png"
    if cache.exists():
        return cache.read_bytes()
    svc = get_service()
    mat = svc.encode_image(load_scaled_row(upload_id, row_index))
    if svc.transform == "multi":
        png = _rgb_composite_png(mat)
    else:
        vmin, vmax = (-1.0, 1.0) if svc.transform == "gasf" else (0.0, 1.0)
        png = _to_png_bytes(mat, vmin, vmax)
    cache.write_bytes(png)
    return png
