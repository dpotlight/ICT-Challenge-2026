"""정책 어댑터 — 차단 규칙을 각 집행 지점의 정책 형식으로 변환한다.

설계 원칙
---------
· 순수 문자열 생성만 한다. 외부 SDK·네트워크 호출·자격증명을 일절 다루지 않는다(dry-run).
· identifier.type 에 따라 두 모드로 갈라진다.
    ip_5tuple        → 출발지 IP 기준 차단 (권장)
    dstport_fallback → 목적지 포트+프로토콜 기준 차단 (영향 범위가 넓어 경고를 붙인다)
· 같은 대상(IP·포트)을 가리키는 규칙은 하나로 합친다.
· 모든 산출물 머리에 추적 주석(규칙 ID·판정·신뢰도·출처 세션)을 남긴다.
"""

import json
import time
from typing import Any

PROTO_NAME = {"6": "tcp", "17": "udp", "1": "icmp", "58": "icmpv6"}


# ────────────────────────────────────────────────────────────
# 규칙 정규화
# ────────────────────────────────────────────────────────────
def _as_int(v: Any) -> int | None:
    """'8080' · '8080.0' · 8080 → 8080 / 그 외 → None"""
    if v is None:
        return None
    try:
        return int(float(str(v)))
    except (TypeError, ValueError):
        return None


def normalize(rules: list[dict]) -> dict:
    """규칙 목록에서 집행에 필요한 대상만 추려 중복을 제거한다."""
    ips: list[str] = []
    ports: list[tuple[int, str]] = []          # (포트, 프로토콜명)
    trace: list[dict] = []
    skipped: list[str] = []

    for r in rules:
        idf = r.get("identifier", {}) or {}
        v = r.get("verdict", {}) or {}
        src = r.get("source", {}) or {}
        item = {
            "rule_id": r.get("rule_id", "?"),
            "cls": v.get("predicted_class", "?"),
            "conf": v.get("confidence", 0.0),
            "session": f"{src.get('upload_id','?')}#{src.get('row_index','?')}",
            "mode": idf.get("type"),
        }

        if idf.get("type") == "ip_5tuple" and idf.get("src_ip"):
            ip = str(idf["src_ip"]).strip()
            if ip not in ips:
                ips.append(ip)
            item["target"] = ip
            trace.append(item)
            continue

        port = _as_int(idf.get("dst_port"))
        proto = PROTO_NAME.get(str(_as_int(idf.get("protocol"))), "tcp")
        if port is None or port <= 0:
            skipped.append(f"{item['rule_id']} — 식별 가능한 IP도 목적지 포트도 없음")
            continue
        if (port, proto) not in ports:
            ports.append((port, proto))
        item["target"] = f"{proto}/{port}"
        trace.append(item)

    warnings = []
    if ports:
        warnings.append(
            f"포트 단위 차단 {len(ports)}건 — 해당 포트를 쓰는 정상 트래픽까지 함께 막습니다. "
            "운영 적용 전 IP 기준으로 좁히거나 관제 승인 절차를 두세요."
        )
    if skipped:
        warnings.append(f"변환 제외 {len(skipped)}건 — {skipped[0]}")

    return {"ips": ips, "ports": ports, "trace": trace, "skipped": skipped, "warnings": warnings}


def _header(n: dict, comment: str = "#") -> list[str]:
    """추적 주석. 어느 판정에서 나온 규칙인지 산출물만 보고 되짚을 수 있게 한다."""
    c = comment
    out = [
        f"{c} ZERO-CLA 생성 정책 — 규칙 {len(n['trace'])}건 · {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"{c} dry-run 산출물입니다. 이 파일은 어떤 API도 호출하지 않습니다.",
        f"{c} 판정 근거는 관제 콘솔의 Grad-CAM 히트맵과 기여 피처쌍에서 확인할 수 있습니다.",
        c,
    ]
    for t in n["trace"]:
        out.append(
            f"{c}   {t['rule_id']}  {t['cls']} (신뢰도 {t['conf'] * 100:.2f}%)  "
            f"대상 {t['target']}  출처 {t['session']}"
        )
    if n["skipped"]:
        out.append(c)
        for s in n["skipped"]:
            out.append(f"{c}   제외: {s}")
    out.append(c)
    return out


# ────────────────────────────────────────────────────────────
# Cloudflare — WAF custom rule (Rulesets API)
# ────────────────────────────────────────────────────────────
def _cf_expression(n: dict) -> tuple[str, list[str]]:
    notes = []
    parts = []
    if n["ips"]:
        parts.append("(ip.src in {" + " ".join(n["ips"]) + "})")
    if n["ports"]:
        notes.append(
            "Cloudflare WAF 는 HTTP(S) 프록시 계층이라 임의 목적지 포트를 차단하지 않습니다. "
            "포트 기반 차단은 IP 기준으로 대체하거나 Zero Trust Gateway 영역에서 처리하세요."
        )
    return (" or ".join(parts) if parts else "", notes)


def build_cloudflare(n: dict, t: dict, fmt: str) -> tuple[str, list[str]]:
    zone = t.get("zone_id") or "YOUR_ZONE_ID"
    expr, notes = _cf_expression(n)
    desc = f"ZERO-CLA 차단 {len(n['ips'])} IP"

    if not expr:
        return ("\n".join(_header(n) + ["# 변환할 IP 대상이 없어 규칙을 생성하지 않았습니다."]), notes)

    rule = {"action": "block", "expression": expr, "description": desc, "enabled": True}

    if fmt == "json":
        return (
            "\n".join(_header(n, "//"))
            + "\n"
            + json.dumps({"rules": [rule]}, indent=2, ensure_ascii=False),
            notes,
        )

    if fmt == "terraform":
        # f-string 표현식 안에서는 백슬래시를 쓸 수 없으므로(3.12 미만) 미리 이스케이프한다.
        expr_tf = expr.replace('"', '\\"')
        body = f'''resource "cloudflare_ruleset" "zerocla_block" {{
  zone_id     = "{zone}"
  name        = "ZERO-CLA 차단 규칙"
  description = "무복호화 트래픽 판별 엔진이 생성한 차단 목록"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {{
    action      = "block"
    expression  = "{expr_tf}"
    description = "{desc}"
    enabled     = true
  }}
}}'''
        return ("\n".join(_header(n)) + "\n" + body, notes)

    # curl — Rulesets API 엔트리포인트에 커스텀 규칙 배치
    payload = json.dumps({"rules": [rule]}, ensure_ascii=False)
    body = f"""curl -X PUT \\
  "https://api.cloudflare.com/client/v4/zones/{zone}/rulesets/phases/http_request_firewall_custom/entrypoint" \\
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data '{payload}'"""
    return ("\n".join(_header(n)) + "\n" + body, notes)


# ────────────────────────────────────────────────────────────
# GCP — Cloud Armor + VPC 방화벽
# ────────────────────────────────────────────────────────────
def build_gcp(n: dict, t: dict, fmt: str) -> tuple[str, list[str]]:
    project = t.get("project_id") or "YOUR_PROJECT_ID"
    network = t.get("network") or "default"
    policy = t.get("policy_name") or "zerocla-policy"
    notes = []
    lines = _header(n)

    if fmt == "terraform":
        blocks = []
        if n["ips"]:
            ranges = ", ".join(f'"{ip}/32"' for ip in n["ips"])
            blocks.append(f'''resource "google_compute_security_policy" "zerocla" {{
  name    = "{policy}"
  project = "{project}"

  rule {{
    action      = "deny(403)"
    priority    = 1000
    description = "ZERO-CLA 판정 차단"
    match {{
      versioned_expr = "SRC_IPS_V1"
      config {{
        src_ip_ranges = [{ranges}]
      }}
    }}
  }}

  rule {{
    action   = "allow"
    priority = 2147483647
    match {{
      versioned_expr = "SRC_IPS_V1"
      config {{ src_ip_ranges = ["*"] }}
    }}
    description = "기본 허용 (필수 규칙)"
  }}
}}''')
        for i, (port, proto) in enumerate(n["ports"]):
            blocks.append(f'''resource "google_compute_firewall" "zerocla_deny_{proto}_{port}" {{
  name      = "zerocla-deny-{proto}-{port}"
  project   = "{project}"
  network   = "{network}"
  direction = "INGRESS"
  priority  = {1000 + i}

  deny {{
    protocol = "{proto}"
    ports    = ["{port}"]
  }}

  source_ranges = ["0.0.0.0/0"]
  description   = "ZERO-CLA 판정 차단 — 포트 단위(영향 범위 넓음)"
}}''')
        return ("\n".join(lines) + "\n" + "\n\n".join(blocks), notes)

    if fmt == "json":
        doc: dict[str, Any] = {}
        if n["ips"]:
            doc["securityPolicyRule"] = {
                "action": "deny(403)",
                "priority": 1000,
                "description": "ZERO-CLA 판정 차단",
                "match": {
                    "versionedExpr": "SRC_IPS_V1",
                    "config": {"srcIpRanges": [f"{ip}/32" for ip in n["ips"]]},
                },
            }
        if n["ports"]:
            doc["firewalls"] = [
                {
                    "name": f"zerocla-deny-{proto}-{port}",
                    "network": f"projects/{project}/global/networks/{network}",
                    "direction": "INGRESS",
                    "priority": 1000 + i,
                    "denied": [{"IPProtocol": proto, "ports": [str(port)]}],
                    "sourceRanges": ["0.0.0.0/0"],
                }
                for i, (port, proto) in enumerate(n["ports"])
            ]
        return ("\n".join(_header(n, "//")) + "\n" + json.dumps(doc, indent=2, ensure_ascii=False), notes)

    # gcloud CLI
    cmds = []
    if n["ips"]:
        ranges = ",".join(f"{ip}/32" for ip in n["ips"])
        cmds.append(f"""gcloud compute security-policies rules create 1000 \\
  --project={project} \\
  --security-policy={policy} \\
  --src-ip-ranges={ranges} \\
  --action=deny-403 \\
  --description="ZERO-CLA 판정 차단" """)
    for i, (port, proto) in enumerate(n["ports"]):
        cmds.append(f"""gcloud compute firewall-rules create zerocla-deny-{proto}-{port} \\
  --project={project} \\
  --network={network} \\
  --direction=INGRESS \\
  --action=DENY \\
  --rules={proto}:{port} \\
  --source-ranges=0.0.0.0/0 \\
  --priority={1000 + i}""")
    return ("\n".join(lines) + "\n" + "\n\n".join(cmds), notes)


# ────────────────────────────────────────────────────────────
# Suricata — drop 룰 (AWS Network Firewall 이 그대로 받는다)
# ────────────────────────────────────────────────────────────
def suricata_rules(n: dict, sid_start: int = 9000001) -> list[str]:
    out = []
    sid = sid_start
    for t in n["trace"]:
        tgt = t["target"]
        msg = f"ZERO-CLA {t['cls']} conf={t['conf'] * 100:.2f}% {t['rule_id']}"
        if t["mode"] == "ip_5tuple":
            out.append(
                f'drop ip {tgt} any -> any any (msg:"{msg}"; sid:{sid}; rev:1;)'
            )
        else:
            proto, port = tgt.split("/")
            out.append(
                f'drop {proto} any any -> any {port} (msg:"{msg}"; sid:{sid}; rev:1;)'
            )
        sid += 1
    return out


def build_suricata(n: dict, t: dict, fmt: str) -> tuple[str, list[str]]:
    sid = _as_int(t.get("sid_start")) or 9000001
    return ("\n".join(_header(n) + suricata_rules(n, sid)), [])


# ────────────────────────────────────────────────────────────
# AWS — WAFv2 IPSet + Network Firewall(Suricata 문법 재사용)
# ────────────────────────────────────────────────────────────
def build_aws(n: dict, t: dict, fmt: str) -> tuple[str, list[str]]:
    region = t.get("region") or "ap-northeast-2"
    ipset = t.get("ipset_name") or "zerocla-blocklist"
    group = t.get("rule_group_name") or "zerocla-rules"
    notes = [
        "AWS Network Firewall 은 Suricata 규칙 문법을 그대로 수용합니다. "
        "동일한 탐지 결과를 온프렘 Suricata 와 AWS 양쪽에 같은 형식으로 적용할 수 있습니다."
    ]
    sur = suricata_rules(n)

    if fmt == "terraform":
        blocks = []
        if n["ips"]:
            addrs = ", ".join(f'"{ip}/32"' for ip in n["ips"])
            blocks.append(f'''resource "aws_wafv2_ip_set" "zerocla" {{
  name               = "{ipset}"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = [{addrs}]
  description        = "ZERO-CLA 판정 차단 대상"
}}''')
        if sur:
            rules_str = "\\n".join(sur)
            blocks.append(f'''resource "aws_networkfirewall_rule_group" "zerocla" {{
  name     = "{group}"
  type     = "STATEFUL"
  capacity = 100

  rule_group {{
    rules_source {{
      rules_string = "{rules_str}"
    }}
  }}
}}''')
        return ("\n".join(_header(n)) + "\n" + "\n\n".join(blocks), notes)

    if fmt == "json":
        doc = {
            "ipSet": {
                "Name": ipset,
                "Scope": "REGIONAL",
                "IPAddressVersion": "IPV4",
                "Addresses": [f"{ip}/32" for ip in n["ips"]],
            },
            "networkFirewallRuleGroup": {"Name": group, "Type": "STATEFUL", "RulesString": "\n".join(sur)},
        }
        return ("\n".join(_header(n, "//")) + "\n" + json.dumps(doc, indent=2, ensure_ascii=False), notes)

    # aws CLI
    cmds = []
    if n["ips"]:
        addrs = " ".join(f"{ip}/32" for ip in n["ips"])
        cmds.append(f"""# 기존 IPSet 의 LockToken 을 먼저 조회해야 갱신할 수 있습니다.
LOCK=$(aws wafv2 list-ip-sets --scope REGIONAL --region {region} \\
  --query "IPSets[?Name=='{ipset}'].LockToken | [0]" --output text)
ID=$(aws wafv2 list-ip-sets --scope REGIONAL --region {region} \\
  --query "IPSets[?Name=='{ipset}'].Id | [0]" --output text)

aws wafv2 update-ip-set \\
  --name {ipset} --scope REGIONAL --region {region} \\
  --id "$ID" --lock-token "$LOCK" \\
  --addresses {addrs}""")
    if sur:
        joined = "\n".join(sur)
        cmds.append(f"""cat > zerocla.rules <<'RULES'
{joined}
RULES

aws network-firewall update-rule-group \\
  --rule-group-name {group} --type STATEFUL --region {region} \\
  --rules "$(cat zerocla.rules)" \\
  --update-token "$(aws network-firewall describe-rule-group \\
      --rule-group-name {group} --type STATEFUL --region {region} \\
      --query UpdateToken --output text)" """)
    return ("\n".join(_header(n)) + "\n" + "\n\n".join(cmds), notes)


# ────────────────────────────────────────────────────────────
# Kubernetes — Calico GlobalNetworkPolicy (표준 NetworkPolicy 는 deny 표현 불가)
# ────────────────────────────────────────────────────────────
def build_kubernetes(n: dict, t: dict, fmt: str) -> tuple[str, list[str]]:
    name = t.get("policy_name") or "zerocla-deny"
    notes = [
        "표준 Kubernetes NetworkPolicy 는 허용 목록 모델이라 명시적 거부를 표현할 수 없습니다. "
        "Calico GlobalNetworkPolicy(action: Deny)를 사용합니다. Cilium 환경이면 CiliumClusterwideNetworkPolicy 로 대체하세요."
    ]
    yaml_lines = [
        "apiVersion: projectcalico.org/v3",
        "kind: GlobalNetworkPolicy",
        "metadata:",
        f"  name: {name}",
        "spec:",
        "  order: 100",
        "  selector: all()",
        "  types:",
        "    - Ingress",
        "  ingress:",
    ]
    if n["ips"]:
        yaml_lines += ["    - action: Deny", "      source:", "        nets:"]
        yaml_lines += [f"          - {ip}/32" for ip in n["ips"]]
    for port, proto in n["ports"]:
        yaml_lines += [
            "    - action: Deny",
            f"      protocol: {proto.upper()}",
            "      destination:",
            "        ports:",
            f"          - {port}",
        ]
    if not n["ips"] and not n["ports"]:
        yaml_lines.append("    []")
    doc = "\n".join(_header(n) + yaml_lines)

    if fmt == "kubectl":
        return (
            "\n".join(_header(n))
            + "\ncat <<'YAML' | kubectl apply -f -\n"
            + "\n".join(yaml_lines)
            + "\nYAML",
            notes,
        )
    return (doc, notes)


# ────────────────────────────────────────────────────────────
# 온프렘 — iptables / nftables
# ────────────────────────────────────────────────────────────
def build_onprem(n: dict, t: dict, fmt: str) -> tuple[str, list[str]]:
    chain = (t.get("chain") or "INPUT").upper()
    lines = _header(n)

    if fmt == "nftables":
        cmds = ["nft add table inet zerocla",
                f"nft add chain inet zerocla {chain.lower()} '{{ type filter hook input priority 0; }}'"]
        for ip in n["ips"]:
            cmds.append(f"nft add rule inet zerocla {chain.lower()} ip saddr {ip} counter drop")
        for port, proto in n["ports"]:
            cmds.append(f"nft add rule inet zerocla {chain.lower()} {proto} dport {port} counter drop")
        return ("\n".join(lines + cmds), [])

    cmds = []
    for ip in n["ips"]:
        cmds.append(f"iptables -I {chain} -s {ip} -j DROP")
    for port, proto in n["ports"]:
        cmds.append(f"iptables -I {chain} -p {proto} --dport {port} -j DROP")
    cmds.append("")
    cmds.append("# 재부팅 후에도 유지하려면 iptables-save 로 영속화하세요.")
    cmds.append("# iptables-save > /etc/iptables/rules.v4")
    return ("\n".join(lines + cmds), [])


# ────────────────────────────────────────────────────────────
# 레지스트리
# ────────────────────────────────────────────────────────────
PLATFORMS: dict[str, dict] = {
    "cloudflare": {
        "name": "Cloudflare",
        "enforcement_point": "WAF 커스텀 규칙 (Rulesets)",
        "desc": "엣지에서 요청을 차단합니다. IP 기준 차단에 적합합니다.",
        "targets": [{"key": "zone_id", "label": "Zone ID", "placeholder": "023e105f4ecef8ad9ca31a8372d0c353"}],
        "formats": [
            {"key": "curl", "label": "API 호출", "lang": "bash", "ext": "sh"},
            {"key": "terraform", "label": "Terraform", "lang": "hcl", "ext": "tf"},
            {"key": "json", "label": "JSON", "lang": "json", "ext": "json"},
        ],
        "build": build_cloudflare,
    },
    "gcp": {
        "name": "Google Cloud",
        "enforcement_point": "Cloud Armor 정책 + VPC 방화벽",
        "desc": "IP 는 Cloud Armor, 포트는 VPC 방화벽 규칙으로 나눠 적용합니다.",
        "targets": [
            {"key": "project_id", "label": "Project ID", "placeholder": "my-project"},
            {"key": "network", "label": "VPC 네트워크", "placeholder": "default"},
            {"key": "policy_name", "label": "보안정책 이름", "placeholder": "zerocla-policy"},
        ],
        "formats": [
            {"key": "gcloud", "label": "gcloud CLI", "lang": "bash", "ext": "sh"},
            {"key": "terraform", "label": "Terraform", "lang": "hcl", "ext": "tf"},
            {"key": "json", "label": "JSON", "lang": "json", "ext": "json"},
        ],
        "build": build_gcp,
    },
    "aws": {
        "name": "AWS",
        "enforcement_point": "WAFv2 IPSet + Network Firewall",
        "desc": "Network Firewall 은 Suricata 문법을 그대로 받아 같은 규칙을 재사용합니다.",
        "targets": [
            {"key": "region", "label": "리전", "placeholder": "ap-northeast-2"},
            {"key": "ipset_name", "label": "IPSet 이름", "placeholder": "zerocla-blocklist"},
            {"key": "rule_group_name", "label": "룰 그룹 이름", "placeholder": "zerocla-rules"},
        ],
        "formats": [
            {"key": "aws", "label": "aws CLI", "lang": "bash", "ext": "sh"},
            {"key": "terraform", "label": "Terraform", "lang": "hcl", "ext": "tf"},
            {"key": "json", "label": "JSON", "lang": "json", "ext": "json"},
        ],
        "build": build_aws,
    },
    "kubernetes": {
        "name": "Kubernetes",
        "enforcement_point": "Calico GlobalNetworkPolicy",
        "desc": "클러스터 전역 거부 정책으로 컨테이너 환경에 적용합니다.",
        "targets": [{"key": "policy_name", "label": "정책 이름", "placeholder": "zerocla-deny"}],
        "formats": [
            {"key": "yaml", "label": "매니페스트", "lang": "yaml", "ext": "yaml"},
            {"key": "kubectl", "label": "kubectl 적용", "lang": "bash", "ext": "sh"},
        ],
        "build": build_kubernetes,
    },
    "suricata": {
        "name": "Suricata",
        "enforcement_point": "IPS drop 룰",
        "desc": "이미 깔려 있는 오픈소스 IPS 에 룰 파일만 넣으면 됩니다.",
        "targets": [{"key": "sid_start", "label": "시작 SID", "placeholder": "9000001"}],
        "formats": [{"key": "rules", "label": "룰 파일", "lang": "text", "ext": "rules"}],
        "build": build_suricata,
    },
    "onprem": {
        "name": "온프레미스",
        "enforcement_point": "iptables / nftables",
        "desc": "게이트웨이 장비에서 커널 레벨로 즉시 차단합니다.",
        "targets": [{"key": "chain", "label": "체인", "placeholder": "INPUT"}],
        "formats": [
            {"key": "iptables", "label": "iptables", "lang": "bash", "ext": "sh"},
            {"key": "nftables", "label": "nftables", "lang": "bash", "ext": "sh"},
        ],
        "build": build_onprem,
    },
}


def platform_meta() -> list[dict]:
    """프론트가 UI 를 구성하는 데 필요한 메타데이터 (build 함수 제외)."""
    return [
        {k: v for k, v in dict(p, key=key).items() if k != "build"}
        for key, p in PLATFORMS.items()
    ]


def export(rules: list[dict], platform: str, fmt: str, targets: dict | None = None) -> dict:
    if platform not in PLATFORMS:
        raise KeyError(platform)
    p = PLATFORMS[platform]
    if fmt not in [f["key"] for f in p["formats"]]:
        raise ValueError(f"{platform} 은 {fmt} 형식을 지원하지 않습니다")

    n = normalize(rules)
    content, notes = p["build"](n, targets or {}, fmt)
    ext = next(f["ext"] for f in p["formats"] if f["key"] == fmt)
    lang = next(f["lang"] for f in p["formats"] if f["key"] == fmt)

    return {
        "filename": f"zerocla-{platform}-{time.strftime('%Y%m%d-%H%M%S')}.{ext}",
        "language": lang,
        "content": content,
        "stats": {
            "rules": len(n["trace"]),
            "ips": len(n["ips"]),
            "ports": len(n["ports"]),
            "skipped": len(n["skipped"]),
        },
        "warnings": n["warnings"] + notes,
    }
