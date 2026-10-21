# 요구사항 정의서 — 트래픽 관제 시연 웹 서비스 (SDLC Phase 1: Requirements)

ICT 챌린지 2026 "암호화 트래픽 이미지 기반 탐지" 시연 시스템.
페이로드를 열지 않는 플로우 메타데이터 → GASF 이미지 인코딩 → CNN 7-클래스 분류 + Grad-CAM XAI.

## 기능 요구사항 (FR)

| ID | 요구사항 | 시연 단계 |
|----|----------|-----------|
| FR-1 | CICFlowMeter 형식 raw CSV 업로드 (드래그&드롭) | 1 |
| FR-2 | 서버 파이프라인: 파싱 → RF+MI 랭킹 top-K 피처 → [-1,1] 스케일 → GASF 인코딩 → 7-클래스 CNN 추론 | 2 |
| FR-3 | 플로우별 인코딩 이미지 그리드 표시 | 3 |
| FR-4 | 공격 판정 플로우: 빨간 테두리 구분 + 서버 `attack_images/` 별도 저장 | 4 |
| FR-5 | 공격 플로우 상세 페이지: Grad-CAM 히트맵 + 판정 근거 피처쌍(top-5 픽셀 역매핑) + 클래스 확률 | 5 |
| FR-6 | 공격 플로우 ↔ raw CSV 행 맵핑 → 방화벽 등록 (firewall.json 시뮬레이션, 실 방화벽 미조작) | 6 |
| FR-7 | 방화벽 관리 페이지: raw 레코드 테이블 + hover 시 인코딩 이미지 팝업 | 7 |
| FR-8 | 방화벽 규칙 삭제 → 서버 JSON 즉시 동기화 | 8 |

## 비기능 요구사항 (NFR)

| ID | 요구사항 | 구현 방식 |
|----|----------|-----------|
| NFR-1 | 공용 GPU 서버 계정 권한 내 구동 (sudo 불요, 단일 포트) | uvicorn :8300, tmux, React dist 정적 서빙 |
| NFR-2 | 수천 행 업로드에도 무응답 없음 | 배치 추론(512), 이미지 lazy 렌더+디스크 캐시, 페이지네이션(60/페이지) |
| NFR-3 | 업로드 세션 격리 | upload_id(`YYYYmmdd_HHMMSS_uuid6`)별 runtime 디렉토리 |
| NFR-4 | firewall.json 무결성 | fcntl 파일락 + tmp 쓰기 후 `os.replace` 원자 교체 + `.bak` 복구 |
| NFR-5 | 기존 연구 코드(`2_code/`) 보호 | 웹앱은 import-only. 유일한 수정: `models.py` `n_out` 파라미터(기본 1 → 이진 실험 완전 호환) |
| NFR-6 | 학습-서빙 스케일 일치 | `6_deploy/scaler.json` 단일 소스, 기동 시 피처 순서/차원 assert |

## 입력 데이터 제약
- CSE-CIC-IDS2018 raw CSV는 날짜별 스키마 상이: 표준 80열(IP 없음), Thuesday-20-02만 `Flow ID/Src IP/Src Port/Dst IP` 포함 84열.
- → 방화벽 식별자 이원화: IP 존재 시 `ip_5tuple`, 없으면 `dstport_fallback` (Dst Port+Protocol, 고유성은 upload_id+row_index로 보장). UI에 식별자 타입 뱃지 표시.
- "Infinity" 문자열, NaN, 헤더 오염 행(Label 값이 "Label") → 02_clean.py와 동일 규칙으로 흡수.
- 행 상한 20,000 (초과분 절단 + 경고 표시).
