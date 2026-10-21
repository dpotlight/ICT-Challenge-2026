#!/usr/bin/env bash
# ZERO-CLA v88 적용 — 웹 부록 개편 (A 사업화 / B 기술)
set -e
[ -d frontend ] || { echo "frontend 폴더가 없습니다. 프로젝트 루트에서 실행하세요."; exit 1; }
TS=$(date +%m%d_%H%M)

echo "1) 백업"
cp frontend/src/pages/PresentationPage.tsx frontend/src/pages/PresentationPage.tsx.bak-$TS
cp frontend/src/styles/global.css          frontend/src/styles/global.css.bak-$TS
cp frontend/index.html                     frontend/index.html.bak-$TS

echo "2) 소스 교체"
cp -f ./frontend/src/pages/PresentationPage.tsx frontend/src/pages/
cp -f ./frontend/src/styles/global.css          frontend/src/styles/
cp -f ./frontend/index.html                     frontend/

echo "3) dist 교체"
rm -f frontend/dist/assets/index-*.js frontend/dist/assets/index-*.css
cp -f ./frontend/dist/assets/index-*.js  frontend/dist/assets/
cp -f ./frontend/dist/assets/index-*.css frontend/dist/assets/
cp -f ./frontend/dist/index.html         frontend/dist/

echo
echo "완료. 백엔드와 영상은 건드리지 않았습니다."
echo "확인 : 강력 새로고침(Ctrl+Shift+R) 후 /#/pt 부록이"
echo "  A1 고객 구조 ~ A10 자료 출처 · B1 대규모 트래픽 ~ B5 데이터 순서인지"
echo "  페이지 소스의 zc-build 값이 v88 인지"
