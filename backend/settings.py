"""웹 시연 서비스 설정. ITRC_BASE 환경변수로 프로젝트 루트 재정의 가능."""

import os
from pathlib import Path

# ITRC revised 프로젝트 루트 (서버 기본값 / 로컬 개발 시 ITRC_BASE 로 지정)
BASE_DIR = Path(os.environ.get("ITRC_BASE", str(Path.home() / "ITRC revised"))).resolve()

CODE_DIR = BASE_DIR / "2_code"
DEPLOY_DIR = BASE_DIR / "6_deploy"

WEBAPP_DIR = Path(__file__).resolve().parent.parent   # 5_webapp/
RUNTIME_DIR = WEBAPP_DIR / "runtime"
UPLOAD_DIR = RUNTIME_DIR / "uploads"
FIREWALL_DIR = RUNTIME_DIR / "firewall"
FIREWALL_JSON = FIREWALL_DIR / "firewall.json"
BLOCKED_IMG_DIR = FIREWALL_DIR / "blocked_images"
LOG_DIR = RUNTIME_DIR / "logs"

FRONTEND_DIST = WEBAPP_DIR / "frontend" / "dist"

HOST = os.environ.get("WEBAPP_HOST", "0.0.0.0")
PORT = int(os.environ.get("WEBAPP_PORT", "8300"))

# 추론
BATCH_SIZE = 512
FORCE_CPU = os.environ.get("WEBAPP_CPU", "0") == "1"   # 공용 GPU 점유 회피용

# 시연 모드 — 발표 중 관람자가 상태를 바꾸지 못하게 쓰기 경로를 잠근다.
# 화면(UI)은 그대로 두고 등록·삭제·업로드만 막는다. 끄려면 값을 0 으로 두고 재기동한다.
READONLY = os.environ.get("WEBAPP_READONLY", "0") == "1"
MAX_UPLOAD_ROWS = 20_000

# 이미지 렌더링
RENDER_SIZE = 220          # K×K → nearest 업스케일 픽셀
COLORMAP = "viridis"
GRADCAM_ALPHA = 0.45

# CICFlowMeter 식별자 컬럼 (있는 것만 보존)
IDENTIFIER_COLS = ["Flow ID", "Src IP", "Src Port", "Dst IP", "Dst Port", "Protocol", "Timestamp"]

for d in (UPLOAD_DIR, FIREWALL_DIR, BLOCKED_IMG_DIR, LOG_DIR):
    d.mkdir(parents=True, exist_ok=True)
