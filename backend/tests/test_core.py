"""모델 없이 실행 가능한 코어 단위 테스트 (csv_parser, firewall_store).

실행:
    cd 5_webapp/backend
    python -m pytest tests/ -q
"""

import sys
import threading
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

FEATURES = ["Dst Port", "Flow Duration", "TotLen Fwd Pkts"]


@pytest.fixture(autouse=True)
def tmp_runtime(tmp_path, monkeypatch):
    """runtime 디렉토리를 임시 경로로 격리."""
    import settings
    monkeypatch.setattr(settings, "FIREWALL_DIR", tmp_path / "fw")
    monkeypatch.setattr(settings, "FIREWALL_JSON", tmp_path / "fw" / "firewall.json")
    monkeypatch.setattr(settings, "BLOCKED_IMG_DIR", tmp_path / "fw" / "img")
    (tmp_path / "fw" / "img").mkdir(parents=True)
    yield tmp_path


def _write_csv(path, rows, header=None):
    header = header or "Dst Port,Flow Duration,TotLen Fwd Pkts,Label"
    path.write_text(header + "\n" + "\n".join(rows))
    return path


# ── csv_parser ──────────────────────────────────────────
def test_parse_basic(tmp_path):
    from core.csv_parser import parse_upload
    p = _write_csv(tmp_path / "a.csv", ["80,100,200,Benign", "443,50,10,Bot"])
    df, X, id_cols, warns = parse_upload(p, FEATURES)
    assert X.shape == (2, 3)
    assert id_cols == ["Dst Port"]
    assert not warns


def test_parse_infinity_and_nan(tmp_path):
    from core.csv_parser import parse_upload
    p = _write_csv(tmp_path / "a.csv", ["80,Infinity,200,Benign", "443,,10,Bot"])
    _, X, _, _ = parse_upload(p, FEATURES)
    assert X[0, 1] == 0.0 and X[1, 1] == 0.0          # Inf/NaN → 0


def test_parse_header_contamination(tmp_path):
    from core.csv_parser import parse_upload
    p = _write_csv(tmp_path / "a.csv", ["80,1,2,Benign", "0,0,0,Label", "443,3,4,Bot"])
    df, X, _, warns = parse_upload(p, FEATURES)
    assert len(df) == 2 and any("헤더" in w for w in warns)


def test_parse_missing_column(tmp_path):
    from core.csv_parser import CsvSchemaError, parse_upload
    # 절반 이하 누락(1/3) → 0 대체 + 경고
    p = _write_csv(tmp_path / "a.csv", ["80,100,x"], header="Dst Port,Flow Duration,Label")
    _, X, _, warns = parse_upload(p, FEATURES)
    assert X[0][2] == 0.0 and any("TotLen Fwd Pkts" in w for w in warns)
    # 절반 초과 누락(2/3) → 스키마 에러
    p2 = _write_csv(tmp_path / "b.csv", ["80,x"], header="Dst Port,Label")
    with pytest.raises(CsvSchemaError) as e:
        parse_upload(p2, FEATURES)
    assert "TotLen Fwd Pkts" in e.value.missing and "Flow Duration" in e.value.missing


def test_identifier_ip_vs_fallback():
    from core.csv_parser import row_identifier
    row = pd.Series({"Src IP": "10.0.0.1", "Dst IP": "10.0.0.2", "Src Port": 1234,
                     "Dst Port": 80, "Protocol": 6})
    ident = row_identifier(row, ["Src IP", "Dst IP", "Src Port", "Dst Port", "Protocol"])
    assert ident["type"] == "ip_5tuple"
    ident2 = row_identifier(pd.Series({"Dst Port": 80, "Protocol": 6}), ["Dst Port", "Protocol"])
    assert ident2["type"] == "dstport_fallback"


# ── firewall_store ──────────────────────────────────────
def _add(i=0, upload="u1"):
    from core import firewall_store
    return firewall_store.add_rule(upload, i, {"type": "dstport_fallback"},
                                   {"predicted_class": "DDoS", "confidence": 0.9},
                                   {"Dst Port": 80}, b"png")


def test_firewall_add_dup_delete():
    from core import firewall_store
    r1 = _add(0)
    assert r1 is not None
    assert _add(0) is None                              # 중복 → None (409)
    assert len(firewall_store.list_rules()) == 1
    assert firewall_store.delete_rule(r1["rule_id"]) is True
    assert firewall_store.list_rules() == []
    assert firewall_store.delete_rule("fw-none") is False


def test_firewall_concurrent_add():
    from core import firewall_store
    errs = []

    def worker(n):
        try:
            for i in range(n * 20, n * 20 + 20):
                _add(i)
        except Exception as e:                          # noqa: BLE001
            errs.append(e)

    ts = [threading.Thread(target=worker, args=(k,)) for k in range(4)]
    [t.start() for t in ts]
    [t.join() for t in ts]
    assert not errs
    assert len(firewall_store.list_rules()) == 80       # 유실/중복 없음


def test_firewall_registered_map():
    from core import firewall_store
    _add(3, "up-A")
    _add(7, "up-A")
    _add(3, "up-B")
    m = firewall_store.registered_map("up-A")
    assert set(m.keys()) == {3, 7}


# ── profiles (도구 프로파일 매핑) ──────────────────────
NFS_HEADER = ("src_ip,dst_ip,src_port,dst_port,protocol,bidirectional_duration_ms,"
              "src2dst_packets,src2dst_bytes,src2dst_max_ps,src2dst_mean_ps,"
              "bidirectional_mean_piat_ms,bidirectional_packets,bidirectional_bytes")

def test_profile_nfstream_mapping(tmp_path):
    from core.csv_parser import parse_upload
    req = ["Dst Port", "Flow Duration", "TotLen Fwd Pkts", "Fwd Pkt Len Max",
           "Flow IAT Mean", "Flow Pkts/s"]
    p = tmp_path / "nfs.csv"
    p.write_text(NFS_HEADER + "\n10.0.0.1,10.0.0.2,1234,80,6,2000,10,5000,1500,500,50,20,9000\n")
    df, X, id_cols, warns = parse_upload(p, req, profile="nfstream")
    assert X[0][0] == 80                       # Dst Port
    assert X[0][1] == 2000 * 1000              # ms → µs
    assert X[0][2] == 5000                     # src2dst_bytes
    assert X[0][4] == 50 * 1000                # IAT ms → µs
    assert abs(X[0][5] - 20 / 2.0) < 1e-6      # 파생 rate: 20pkts / 2s
    assert "Src IP" in id_cols and any("프로파일: nfstream" in w for w in warns)


def test_profile_auto_detects_nfstream(tmp_path):
    from core.csv_parser import parse_upload
    req = ["Dst Port", "Flow Duration", "TotLen Fwd Pkts"]
    p = tmp_path / "nfs.csv"
    p.write_text(NFS_HEADER + "\n10.0.0.1,10.0.0.2,1234,443,6,1000,5,100,60,20,10,8,200\n")
    _, X, _, warns = parse_upload(p, req, profile="auto")
    assert X[0][0] == 443 and X[0][1] == 1000000
    assert any("nfstream" in w for w in warns)


def test_profile_old_cicflowmeter_names(tmp_path):
    from core.csv_parser import parse_upload
    req = ["Dst Port", "TotLen Fwd Pkts", "Init Fwd Win Byts"]
    p = tmp_path / "old.csv"
    p.write_text("Destination Port,Total Length of Fwd Packets,Init_Win_bytes_forward,Label\n80,1234,8192,BENIGN\n")
    _, X, _, _ = parse_upload(p, req, profile="auto")
    assert list(X[0]) == [80, 1234, 8192]


def test_profile_missing_fill_zero(tmp_path):
    from core.csv_parser import parse_upload
    req = ["Dst Port", "Flow Duration", "Init Fwd Win Byts"]   # 마지막은 NFStream 미제공
    p = tmp_path / "nfs.csv"
    p.write_text(NFS_HEADER + "\n1.1.1.1,2.2.2.2,5,80,6,1000,1,1,1,1,1,1,1\n")
    _, X, _, warns = parse_upload(p, req, profile="nfstream")
    assert X[0][2] == 0.0 and any("0 대체" in w for w in warns)
