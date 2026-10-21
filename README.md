# FLOW/SIGHT — 암호화 트래픽 이미지 관제 시연 시스템

ICT 챌린지 2026. 플로우 메타데이터 → GASF 이미지 → CNN 7-클래스 분류 + Grad-CAM.
SDLC 산출물: `docs/01_requirements.md`(요구분석) · `docs/02_design.md`(설계) · `docs/03_testplan.md`(테스트) · 본 문서(배포/운영).

## 서버 구동 (SDLC Phase 5: Deployment)

```bash
ssh -p 50022 itrc2026stu@100.125.171.74
tmux new -s webapp        # 이미 있으면: tmux attach -t webapp
cd ~/"ITRC revised"/5_webapp/backend
~/miniconda3/envs/itrc/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8300
```

- 포트 충돌 확인: `ss -tlnp | grep 8300`
- GPU 대신 CPU 추론(타 사용자 GPU 학습 배려): `WEBAPP_CPU=1` 접두
- 로그아웃해도 tmux 세션 유지. 재접속: `tmux attach -t webapp`

## 시연 접속
1. 시연 노트북에 Tailscale 로그인 → **먼저 `tailscale ping 100.125.171.74` 로 경로 워밍업** (유휴 시 NAT 매핑이 만료되어 첫 접속이 실패할 수 있음 — 핑 한 번이면 직결 경로 재수립) → `http://100.125.171.74:8300`
2. fallback: `ssh -p 6404 -N -L 8300:localhost:8300 itrc2026stu@220.149.241.201` (공인 IP 경로) → `http://localhost:8300`

데모 CSV: 서버 `5_webapp/demo_data/` (`demo_A_with_ip.csv`=DDoS·IP 식별자, `demo_B_no_ip.csv`=Botnet·fallback, `demo_C_large.csv`=3,000행). 시연 노트북에 미리 복사해 둘 것.

## 재학습 / 데이터 재생성
```bash
cd ~/"ITRC revised"
python 2_code/scripts/01_combine.py && python 2_code/scripts/02_clean.py   # cleaned.csv
python 2_code/scripts/09_train_multiclass.py --transform gasf --K 20       # 6_deploy/ 갱신
python 5_webapp/tools/make_demo_csv.py                                     # 데모 CSV 갱신
```

## 개발 (로컬 Mac)
- 코드 원본: `~/project_renew/0_tasks/ICT_challenge/webapp/` → rsync로 서버 `5_webapp/` 배포
- 프론트 개발: `cd frontend && npm run dev` (proxy /api→:8300, `ssh -L 8300:...` 터널과 병용)
- 배포: `npm run build` 후 dist 포함 rsync (서버에 node 불필요)

## runtime 정리
`runtime/uploads/` 세션 누적 시: `rm -rf runtime/uploads/*` (방화벽 등록분 이미지는 `runtime/firewall/blocked_images/`에 복사돼 있어 무관)
