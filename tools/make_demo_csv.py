"""시연용 데모 CSV 생성 (서버에서 학습 완료 후 1회 실행).

0_raw 원본에서 클래스 혼합 샘플을 추출하고, 학습된 다중분류 모델로 사전 추론해
'정탐되는 샘플 위주'로 선별한다 (시연 실패 확률 최소화).
Label 컬럼은 데모 CSV에서 제거하고 *_answer.csv 에 정답을 별도 보관.

산출 (5_webapp/demo_data/):
    demo_A_with_ip.csv   — IP 포함 (Thuesday-20-02, DDoS) → IP 방화벽 등록 시연
    demo_B_no_ip.csv     — IP 없음 (Friday-02-03 Bot 등)  → fallback 식별자 시연
    demo_C_large.csv     — 3,000행 혼합 → 성능 시연
    demo_*_answer.csv    — 정답 라벨

실행:
    cd ~/"ITRC revised"
    ~/miniconda3/envs/itrc/bin/python 5_webapp/tools/make_demo_csv.py
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parent.parent.parent   # ITRC revised/
RAW = BASE / "1_data" / "0_raw"
OUT = BASE / "5_webapp" / "demo_data"
OUT.mkdir(exist_ok=True)

sys.path.insert(0, str(BASE / "5_webapp" / "backend"))
import settings  # noqa: E402  (ITRC_BASE 기본값 = ~/ITRC revised)
from core.model_service import get_service  # noqa: E402

RNG = np.random.RandomState(42)

# (파일, 그 파일에서 뽑을 {원본라벨: 행수})
# LOIC-HTTP 는 K20 모델 탐지율이 ~0.1% 로 매우 낮음 → 전량 스캔 후 탐지 가능 샘플만 선별
PLAN_A = ("Thuesday-20-02-2018_TrafficForML_CICFlowMeter.csv",
          {"Benign": 70, "DDoS attacks-LOIC-HTTP": 30})
PLAN_A_OVERSAMPLE = 0   # 0 = 해당 라벨 전량 스캔
PLAN_B = ("Friday-02-03-2018_TrafficForML_CICFlowMeter.csv",
          {"Benign": 70, "Bot": 30})
PLAN_C = [
    ("Friday-02-03-2018_TrafficForML_CICFlowMeter.csv", {"Benign": 1500, "Bot": 300}),
    ("Friday-16-02-2018_TrafficForML_CICFlowMeter.csv", {"DoS attacks-Hulk": 300}),
    ("Wednesday-21-02-2018_TrafficForML_CICFlowMeter.csv", {"DDOS attack-HOIC": 300}),
    ("Wednesday-14-02-2018_TrafficForML_CICFlowMeter.csv", {"FTP-BruteForce": 300}),
    ("Thursday-01-03-2018_TrafficForML_CICFlowMeter.csv", {"Infilteration": 300}),
]
OVERSAMPLE = 8   # 정탐 필터링 대비 여유 배수


def load_samples(fname: str, want: dict, oversample: int = OVERSAMPLE) -> pd.DataFrame:
    print(f"  · {fname} 로딩...")
    df = pd.read_csv(RAW / fname, low_memory=False)
    df.columns = df.columns.str.strip()
    df = df[df["Label"].astype(str).str.strip() != "Label"]      # 헤더 오염 행 제거
    parts = []
    for label, n in want.items():
        pool = df[df["Label"] == label]
        if oversample == 0 and label != "Benign":
            take = len(pool)                       # 공격 라벨 전량 스캔 (탐지율 낮은 유형 대비)
        else:
            take = min(len(pool), n * max(oversample, OVERSAMPLE))
        parts.append(pool.sample(n=take, random_state=RNG))
        print(f"      {label}: pool {len(pool):,} → 후보 {take:,}")
    return pd.concat(parts, ignore_index=True)


def keep_correct(df: pd.DataFrame, want: dict, svc) -> pd.DataFrame:
    """모델 추론으로 '정탐' 샘플만 선별.

    Benign 행: pred == Benign 인 것만.
    공격 행 : 1순위 정확한 유형 일치, 2순위 다른 공격 유형으로라도 탐지(pred != Benign).
              미탐(Benign 예측) 샘플로는 절대 채우지 않는다 — 부족하면 경고 후 축소.
    """
    # reindex: 파일에 없는 피처(예: 80열 파일의 Src Port)는 NaN→0 (웹 파서·학습 관례와 동일)
    feat = df.reindex(columns=svc.ranked_features).apply(pd.to_numeric, errors="coerce")
    feat = feat.replace([np.inf, -np.inf], np.nan).fillna(0.0)
    probs = svc.predict(svc.scale(feat.values.astype(np.float64)))
    pred = np.array(svc.classes)[probs.argmax(axis=1)]
    conf = probs.max(axis=1)

    from config_map import to_category   # 아래 helper
    parts = []
    for label, n in want.items():
        cat = to_category(label)
        lbl_mask = (df["Label"] == label).values
        if cat == "Benign":
            ok = lbl_mask & (pred == "Benign")
            sub = df[ok].assign(_conf=conf[ok])
        else:
            exact = lbl_mask & (pred == cat)
            detected = lbl_mask & (pred != "Benign") & (pred != cat)
            sub = pd.concat([
                df[exact].assign(_conf=conf[exact] + 1.0),      # 정확 일치 우선
                df[detected].assign(_conf=conf[detected]),
            ])
        if len(sub) < n:
            print(f"      ⚠ {label}: 탐지 가능 샘플 {len(sub)}/{n} — 있는 만큼만 사용")
        sub = sub.sort_values("_conf", ascending=False).head(n).drop(columns="_conf")
        acc_exact = (pred[sub.index] == cat).mean() if len(sub) else 0.0
        acc_det = (pred[sub.index] != "Benign").mean() if cat != "Benign" and len(sub) else None
        note = f", 공격탐지율 {acc_det:.0%}" if acc_det is not None else ""
        print(f"      {label}: {len(sub)}행 선별 (유형정탐 {acc_exact:.0%}{note})")
        parts.append(sub)
    return pd.concat(parts, ignore_index=False).sample(frac=1, random_state=RNG).reset_index(drop=True)


def write_demo(tag: str, df: pd.DataFrame):
    answer = df[["Label"]].copy()
    demo = df.drop(columns=["Label"])
    demo.to_csv(OUT / f"demo_{tag}.csv", index=False)
    answer.to_csv(OUT / f"demo_{tag}_answer.csv", index=True, index_label="row_index")
    print(f"  ✅ demo_{tag}.csv ({len(demo)}행, {demo.shape[1]}열)")


def main():
    svc = get_service()
    print(f"모델: {svc.model_file} ({svc.transform} K={svc.K}, device={svc.device})")

    print("\n[A] IP 포함 데모 (DDoS)")
    a = load_samples(*PLAN_A, oversample=PLAN_A_OVERSAMPLE)
    write_demo("A_with_ip", keep_correct(a, PLAN_A[1], svc))

    print("\n[B] IP 없는 데모 (Botnet)")
    b = load_samples(*PLAN_B)
    write_demo("B_no_ip", keep_correct(b, PLAN_B[1], svc))

    print("\n[C] 3,000행 혼합 데모")
    parts = []
    for fname, want in PLAN_C:
        df = load_samples(fname, want, oversample=4)
        parts.append(keep_correct(df, want, svc))
    # 컬럼 스키마(80열 표준)로 통일 — IP 있는 파일이 섞이지 않으므로 그대로 concat
    c = pd.concat(parts, ignore_index=True).sample(frac=1, random_state=RNG).reset_index(drop=True)
    write_demo("C_large", c)

    print(f"\n산출 폴더: {OUT}")


if __name__ == "__main__":
    main()
