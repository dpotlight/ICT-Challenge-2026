# 설계서 — 트래픽 관제 시연 웹 서비스 (SDLC Phase 2: Design)

## 1. 시스템 아키텍처

```
[브라우저 (시연 노트북)]
   │ Tailscale VPN (100.125.171.74:8300) 또는 SSH -L 터널
   ▼
[GPU 서버 · uvicorn 단일 프로세스 :8300]
  FastAPI app (5_webapp/backend/app.py)
  ├─ StaticFiles ─ frontend/dist (React SPA + fallback)
  ├─ /api/uploads    → pipeline: 파싱→스케일→인코딩→추론 → runtime/uploads/{id}/
  ├─ /api/.../image.png, gradcam.png → lazy 렌더 + 디스크 캐시
  └─ /api/firewall   → firewall.json CRUD (락+원자쓰기)
        ▲ import 재사용
  [2_code/transforms.py · models.py]   [6_deploy/multiclass_gasf_K20.pt · scaler.json]
```

## 2. 모델 (7-클래스 다중분류)
- `ImageCNN("gasf", image_size=20, n_out=7)` — CNN2D 백본(Conv 96→192→384+GAP→FC512→256→7), 1.16M 파라미터
- 학습: `2_code/scripts/09_train_multiclass.py` — cleaned.csv attack_category 라벨, seed42 fold round1(60/20/20), 클래스별 캡 20만 언더샘플 + 1/√freq 가중 CE, val macro-F1 조기 종료
- 배포 아티팩트: `6_deploy/` — ckpt(.pt: state_dict+classes+K+transform+ranked_features), scaler.json(min/max), deploy_meta.json(성능 리포트 포함)

## 3. 백엔드 모듈 (backend/)
| 모듈 | 책임 |
|------|------|
| `core/model_service.py` | 모델 싱글턴, scale/predict/encode_image, GPU→CPU fallback(`WEBAPP_CPU=1`) |
| `core/csv_parser.py` | 스키마 검증(누락 컬럼 400), 식별자 컬럼 보존, Inf/NaN→0, 헤더 오염 행 제거 |
| `core/pipeline.py` | 업로드 처리 오케스트레이션, results.json + X_scaled.npy 저장, 공격 이미지 eager 저장(FR-4) |
| `core/image_render.py` | K×K → viridis colormap → nearest 11배 업스케일 PNG, 캐시 |
| `core/gradcam_service.py` | 다중분류 Grad-CAM(예측 클래스 logit backward), jet 오버레이, top-k 픽셀→피처쌍 역매핑 |
| `core/firewall_store.py` | firewall.json CRUD, fcntl 락, 원자 쓰기, blocked_images 복사 |
| `core/session_store.py` | upload_id 관리, raw 행 skiprows 단건 조회 |

### API 요약
`GET /api/meta` · `POST/GET /api/uploads` · `GET /api/uploads/{id}` · `GET /api/uploads/{id}/flows?offset&limit&only` · `GET .../flows/{row}` (+`/image.png`, `/gradcam.png`, `/gradcam/features`) · `GET/POST /api/firewall/rules` (단건/일괄, 중복 409) · `DELETE /api/firewall/rules/{id}` · `GET /api/firewall/rules/{id}/image.png` · `GET /health`

### firewall.json 스키마
`{version, updated_at, rules:[{rule_id, created_at, source:{upload_id,row_index}, identifier:{type: ip_5tuple|dstport_fallback, src_ip…}, verdict:{predicted_class, confidence}, raw_row:{…}, image}]}`

## 4. 프론트엔드 (frontend/, Vite+React+TS)
- 디자인: 관제실 다크 테마 (ink #0B0E14 / alert #FF4D5E / benign #2DD4A8 / focus #7AA2FF), Space Grotesk + IBM Plex Mono(@fontsource 번들 — 오프라인 안전), 시그니처: 트래픽 텍스처 그리드
- 라우트: `/`(업로드) → `/uploads/:id`(대시보드 그리드) → `/uploads/:id/flows/:row`(Grad-CAM 상세) → `/firewall`(관리)
- 상태: TanStack Query(mutation 후 invalidate), 필터는 URL searchParams, 무한스크롤(60행 단위), `<img loading="lazy">`

## 5. 시연 데이터
`5_webapp/tools/make_demo_csv.py` — 0_raw에서 클래스 혼합 추출 + 사전 추론으로 정탐 샘플 선별.
demo_A_with_ip(DDoS, IP 5-tuple 시연) / demo_B_no_ip(Botnet, fallback 시연) / demo_C_large(3,000행) + *_answer.csv 정답 별도.
