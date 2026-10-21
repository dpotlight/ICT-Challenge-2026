# 테스트 계획 및 시연 체크리스트 (SDLC Phase 4: Testing)

## 1. 단위 테스트 (자동, pytest)
`backend/tests/test_core.py` — 8 케이스
- csv_parser: 기본 파싱 / Infinity·NaN→0 / 헤더 오염 행 제거 / 누락 컬럼 CsvSchemaError / 식별자 ip_5tuple vs dstport_fallback
- firewall_store: 등록·중복(None)·삭제 / 4-스레드 80건 동시 등록 무유실 / registered_map 업로드별 격리

실행: `cd 5_webapp/backend && python -m pytest tests/ -q`

## 2. 모델 검증 (학습 산출물)
- `6_deploy/deploy_meta.json`의 test per-class F1 / confusion matrix 확인
- 소수 클래스(Web, Infiltration) recall 명시 — 낮으면 시연 멘트에서 한계로 언급

## 3. E2E 시연 시나리오 체크리스트 (수동)

| # | 단계 | 확인 |
|---|------|------|
| 1 | demo_A_with_ip.csv 드래그 업로드 | 진행 스피너 → 대시보드 이동 |
| 2 | 대시보드 요약 칩 | 클래스 분포 카운트 = answer와 부합 |
| 3 | 이미지 그리드 | 100개 텍스처 렌더, 스크롤 lazy 로드 |
| 4 | 공격 카드 | 빨간 테두리 + 클래스명 + confidence, 서버 `attack_images/`에 PNG 존재 |
| 5 | 공격 카드 클릭 → 상세 | Grad-CAM 오버레이 + 판정 근거 피처쌍 표 + 확률 막대 |
| 6 | "이 플로우 방화벽 등록" / "공격 전체 등록" | 201, 중복 시 409 토스트 |
| 7 | 방화벽 페이지 | IP 5-TUPLE 뱃지, src→dst 표시, 행 hover 시 이미지 팝업 |
| 8 | 규칙 삭제(확인 다이얼로그) | 목록 제거 + 서버 firewall.json에서 소멸 확인 |
| 9 | demo_B_no_ip.csv 반복 | DST-PORT 뱃지로 fallback 식별자 시연 |
| 10 | demo_C_large.csv (3,000행) | 업로드 응답 수 초 내, 그리드 스크롤 원활 |

## 4. 원격 접속 리허설
- 시연 노트북 Tailscale 로그인 → `http://100.125.171.74:8300` 전 시나리오 1회
- fallback: `ssh -p 50022 -N -L 8300:localhost:8300 itrc2026stu@100.125.171.74` → `http://localhost:8300`
- 비상: 전체 시나리오 화면 녹화 영상 준비
