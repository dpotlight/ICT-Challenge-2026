"""트래픽 관제 시연 웹 서비스 — FastAPI 엔트리.

실행 (서버, tmux 안):
    cd 5_webapp/backend
    ~/miniconda3/envs/itrc/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8300
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import settings
from api import firewall, uploads
from core.model_service import get_service

app = FastAPI(title="암호화 트래픽 이미지 기반 관제 시스템", version="1.0")

app.include_router(uploads.router)
app.include_router(firewall.router)


@app.get("/api/meta")
def meta():
    # readonly 는 화면이 쓰기 UI 를 잠그는 데 쓴다. 실제 차단은 서버가 한다.
    return {**get_service().meta(), "readonly": settings.READONLY}


@app.get("/api/system")
def system_stats():
    """실시간 시스템 부하 — /proc 기반이라 추가 의존성 없음."""
    import os
    try:
        load1 = os.getloadavg()[0]
        cpu_pct = round(min(load1 / (os.cpu_count() or 1) * 100, 100), 1)
    except OSError:
        cpu_pct = None
    mem_total = mem_avail = None
    try:
        with open("/proc/meminfo") as fh:
            for line in fh:
                if line.startswith("MemTotal:"):
                    mem_total = int(line.split()[1]) * 1024
                elif line.startswith("MemAvailable:"):
                    mem_avail = int(line.split()[1]) * 1024
                if mem_total and mem_avail:
                    break
    except OSError:
        pass
    mem_pct = mem_used_gb = mem_total_gb = None
    if mem_total and mem_avail is not None:
        mem_pct = round((mem_total - mem_avail) / mem_total * 100, 1)
        mem_used_gb = round((mem_total - mem_avail) / 1024**3, 1)
        mem_total_gb = round(mem_total / 1024**3, 1)
    return {"cpu_pct": cpu_pct, "mem_pct": mem_pct,
            "mem_used_gb": mem_used_gb, "mem_total_gb": mem_total_gb,
            # torch.device 는 JSON 직렬화가 안 된다. 문자열로 내보내야 500 이 나지 않는다.
            "device": str(get_service().device)}


@app.get("/health")
def health():
    return {"status": "ok"}


# ── 발표 페이지 단축 경로 ──
# HashRouter 라 실제 라우트는 #/pt 다. 사용자가 /pt 로 접속해도 열리도록 리다이렉트.
@app.get("/pt")
def pt_shortcut():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/#/pt")


# ── React 빌드 정적 서빙 + SPA fallback ──
if settings.FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=settings.FRONTEND_DIST / "assets"), name="assets")

    # 영상은 StaticFiles 로 붙인다.
    # catch-all 의 no-store 헤더가 붙으면 Chrome 이 <video> 메타데이터를
    # 끝까지 못 읽고 멈춘다. StaticFiles 는 그 헤더를 붙이지 않는다.
    _media = settings.FRONTEND_DIST / "media"
    if _media.exists():
        app.mount("/media", StaticFiles(directory=_media), name="media")

    # index.html 은 매 배포마다 내용이 바뀌는데 파일 이름은 그대로다.
    # 캐시 헤더가 없으면 브라우저가 예전 index.html 을 그대로 써서
    # 새 번들을 올려도 화면이 안 바뀐다. 그래서 캐시를 막는다.
    # /assets 아래 파일들은 이름에 해시가 붙어 있어 그대로 캐시해도 안전하다.
    NO_STORE = {"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"}

    @app.get("/{spa_path:path}")
    def spa(spa_path: str):
        target = settings.FRONTEND_DIST / spa_path
        if spa_path and target.is_file():
            return FileResponse(target, headers=NO_STORE)
        return FileResponse(settings.FRONTEND_DIST / "index.html", headers=NO_STORE)


@app.on_event("startup")
def warmup():
    svc = get_service()
    print(f"[webapp] model={svc.model_file} transform={svc.transform} "
          f"K={svc.K} device={svc.device} classes={svc.classes}")
