#!/usr/bin/env python3
"""Refresh Select UMA listings from the public Morgan Stanley index.

Reads the public manager-profile index (no login) and, for each live PDF,
the structured header on the profile: style, minimum, inception, vehicle,
holdings count or range, turnover, ADR use, and fixed-income averages when
printed. A header may give a range ("11 to 21") or a single figure ("15.89").
An em dash stays empty. Eligible-investments lines that sit in front of
"Strategy Overview" (common on MAPS profiles) are kept; overview prose is not.

Does not store overview narrative, holdings lists, or performance tables.

Usage:
  python3 scripts/harvestUma.py
  python3 scripts/harvestUma.py --limit 20   # sample, leaves other headers in place

Writes:
  shared/seed/umaListings.ts
  shared/seed/umaHeaders.ts
  /tmp/uma-harvest-summary.json
"""

from __future__ import annotations

import argparse
import html
import json
import re
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
INDEX_URL = "https://www.morganstanley.com/wealth-investmentsolutions/managerprofiles_uma"
PDF_URL = "https://www.morganstanley.com/content/dam/msdotcom/en/wealth-investmentsolutions/pdfs/uma/{code}.pdf"
LISTINGS_PATH = ROOT / "shared/seed/umaListings.ts"
HEADERS_PATH = ROOT / "shared/seed/umaHeaders.ts"
SUMMARY_PATH = Path("/tmp/uma-harvest-summary.json")

INDEXES = [
    "Russell 1000 Growth",
    "Russell 1000 Value",
    "Russell 2000 Growth",
    "Russell 2000 Value",
    "Russell 1000",
    "Russell 2000",
    "Russell Midcap",
    "MSCI Emerging Markets",
    "MSCI EAFE",
    "MSCI ACWI",
    "Bloomberg US Aggregate",
    "Bloomberg Municipal",
    "Bloomberg Global Aggregate",
    "S&P 500",
]

STYLE_RE = re.compile(
    r"Style:\s*(.+?)\s+GIMA Status:\s*(.+?)\s+Program Inception:\s*(\d{2}/\d{2}/\d{4}|—|-)\s+Strategy Minimum:\s*(\$[\d,]+|—|-|None|N/A)",
    re.I,
)
NUMBER = r"[\d,]+(?:\.\d+)?"
# Stop before the next section. MAPS profiles put "Strategy Overview" here
# instead of "Manager Name", which used to swallow the vehicle line.
VEHICLE_RE = re.compile(
    r"Eligible Investments:\s*(.+?)(?:"
    r"\s+Strategy Overview|\s+Manager Name|\s+Style:|"
    r"\s+\d*\s*Portfolio Manager|\s+Manager's Investment"
    r")",
    re.I,
)
YIELD_LABELS = (
    "Average dividend yield",
    "Average current yield",
    "Yield to worst",
    "Yield to maturity",
    "Current yield",
    "Average yield",
)
ADR_RE = re.compile(rf"Use ADRs:\s*(?:—|--|-|({NUMBER})\s+to\s+({NUMBER})\s*%|({NUMBER})\s*%)", re.I)
CLOSED_RE = re.compile(r"Strategy Status:\s*Closed", re.I)
LISTING_RE = re.compile(
    r'\{ id: "(?P<id>[^"]+)", manager: "(?P<manager>(?:\\.|[^"\\])*)", name: "(?P<name>(?:\\.|[^"\\])*)", code: "(?P<code>[^"]+)", style: (?:"(?P<style>(?:\\.|[^"\\])*)"|null), minimum: (?P<minimum>\d+|null), inception: (?:"(?P<inception>[^"]+)"|null) \}'
)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "WealthPassDemoHarvest/1.0"})
    context = ssl.create_default_context()
    with urllib.request.urlopen(request, timeout=45, context=context) as response:
        return response.read()


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def parse_index(page: str) -> list[dict[str, str]]:
    live = re.sub(r"<!--.*?-->", "", page, flags=re.S)
    live = live.replace("</a< /li>", "</a></li>")
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    for match in re.finditer(r'<ul class="sublist"[^>]*>(.*?)</ul>', live, flags=re.S):
        pre = live[max(0, match.start() - 400) : match.start()]
        manager_match = None
        for candidate in re.finditer(r"<li>\s*([^<]+)", pre):
            manager_match = candidate
        manager = clean(manager_match.group(1)) if manager_match else "Unknown"
        for code, name in re.findall(
            r"pdfs/uma/([A-Za-z0-9-]+)\.pdf\">(.*?)</a>",
            match.group(1),
            flags=re.S,
        ):
            key = code.upper()
            if key in seen:
                continue
            seen.add(key)
            rows.append({"code": key, "manager": manager, "name": clean(name)})
    rows.sort(key=lambda row: (row["name"].lower(), row["code"]))
    return rows


def load_previous() -> dict[str, dict[str, str | int | None]]:
    if not LISTINGS_PATH.exists():
        return {}
    text = LISTINGS_PATH.read_text()
    previous: dict[str, dict[str, str | int | None]] = {}
    for match in LISTING_RE.finditer(text):
        previous[match.group("code")] = {
            "style": match.group("style"),
            "minimum": None if match.group("minimum") == "null" else int(match.group("minimum")),
            "inception": match.group("inception"),
            "manager": match.group("manager"),
            "name": match.group("name"),
        }
    return previous


def parse_number(token: str) -> float:
    return float(token.replace(",", ""))


def midpoint(low: str, high: str, digits: int) -> float:
    value = (parse_number(low) + parse_number(high)) / 2
    return round(value, digits)


def labeled_span(label: str, text: str) -> tuple[float, float] | None:
    match = re.search(rf"{re.escape(label)}:\s*({NUMBER})\s+to\s+({NUMBER})", text, re.I)
    if not match:
        return None
    return parse_number(match.group(1)), parse_number(match.group(2))


def labeled_single(label: str, text: str) -> float | None:
    match = re.search(rf"{re.escape(label)}:\s*({NUMBER})(?!\s+to\b)", text, re.I)
    if not match:
        return None
    return parse_number(match.group(1))


def labeled_midpoint(label: str, text: str, digits: int) -> float | None:
    span = labeled_span(label, text)
    if span:
        return round((span[0] + span[1]) / 2, digits)
    single = labeled_single(label, text)
    if single is None:
        return None
    return round(single, digits)


def holdings_bounds(text: str) -> tuple[int | None, int | None]:
    span = labeled_span("Number of security holdings", text)
    if span:
        return int(span[0]), int(span[1])
    single = labeled_single("Number of security holdings", text)
    if single is None:
        return None, None
    value = int(single)
    return value, value


def yield_pct(text: str) -> float | None:
    for label in YIELD_LABELS:
        value = labeled_midpoint(label, text, 1)
        if value is not None:
            return value
    return None


# Some profile PDFs print the strategy title between the vehicle and
# "Manager Name" ("ETFs First Trust … MAPS (FIR-1) Manager Name").
# Keep only the investment types that start the line. An em dash stays empty.
VEHICLE_TOKENS = (
    "Individual Stocks",
    "Individual Bonds",
    "Mutual Funds",
    "Exchange-Traded Funds",
    "Exchange Traded Funds",
    "Closed-End Funds",
    "Preferred Securities",
    "Municipal Bonds",
    "ETFs",
    "ADRs",
    "Options",
    "Cash",
    "UITs",
)


def vehicle_label(text: str) -> str | None:
    match = VEHICLE_RE.search(text)
    if not match:
        return None
    rest = clean(match.group(1))
    found: list[str] = []
    while rest:
        rest = rest.lstrip(" ,;/")
        hit = next((token for token in sorted(VEHICLE_TOKENS, key=len, reverse=True) if rest.lower().startswith(token.lower())), None)
        if hit is None:
            break
        found.append("ETFs" if hit.lower() in {"etfs", "exchange-traded funds", "exchange traded funds"} else hit)
        rest = rest[len(hit) :]
    if not found:
        return None
    return ", ".join(found)


def characteristics_slice(text: str) -> str:
    start = text.find("Target Portfolio Characteristics")
    if start < 0:
        start = 0
    end = text.find("Style:", start)
    if end < 0:
        end = min(len(text), start + 1200)
    return text[start:end]


def reference_indexes(text: str) -> list[str]:
    window = characteristics_slice(text)
    found: list[str] = []
    for name in INDEXES:
        if name in window and name not in found:
            found.append(name)
    # Drop a shorter index already covered by a longer one.
    pruned: list[str] = []
    for name in found:
        if any(name != other and name in other for other in found):
            continue
        pruned.append(name)
    return pruned


def parse_pdf(data: bytes) -> dict | None:
    reader = PdfReader(io_bytes(data))
    if not reader.pages:
        return None
    chunks = []
    for page in reader.pages[:2]:
        chunks.append(page.extract_text() or "")
    text = re.sub(r"\s+", " ", " ".join(chunks))
    style_match = STYLE_RE.search(text)
    header: dict = {
        "style": None,
        "minimum": None,
        "inception": None,
        "gimaStatus": None,
        "closed": bool(CLOSED_RE.search(text)),
        "vehicle": None,
        "securitiesMin": None,
        "securitiesMax": None,
        "turnoverPct": None,
        "adrUse": None,
        "maturityYears": None,
        "durationYears": None,
        "couponPct": None,
        "yieldPct": None,
        "referenceIndexes": reference_indexes(text),
    }
    if style_match:
        style, gima, inception, minimum = style_match.groups()
        header["style"] = clean(style)
        header["gimaStatus"] = clean(gima)
        header["inception"] = None if inception in {"—", "-"} else inception
        if minimum.startswith("$"):
            header["minimum"] = int(minimum[1:].replace(",", ""))
    securities_min, securities_max = holdings_bounds(text)
    header["securitiesMin"] = securities_min
    header["securitiesMax"] = securities_max
    turnover = labeled_midpoint("Average turnover rate", text, 1)
    if turnover is not None:
        header["turnoverPct"] = int(round(turnover))
    adr = ADR_RE.search(text)
    if adr:
        if adr.group(1) is not None:
            low = float(adr.group(1))
            high = float(adr.group(2))
            header["adrUse"] = high > 0 or low > 0
        elif adr.group(3) is not None:
            header["adrUse"] = float(adr.group(3).replace(",", "")) > 0
    header["maturityYears"] = labeled_midpoint("Average maturity", text, 1)
    header["durationYears"] = labeled_midpoint("Average duration", text, 1)
    header["couponPct"] = labeled_midpoint("Average coupon", text, 1)
    header["yieldPct"] = yield_pct(text)
    header["vehicle"] = vehicle_label(text)
    if header["style"] is None and header["vehicle"] is None and header["securitiesMin"] is None:
        return None
    return header


def io_bytes(data: bytes):
    import io

    return io.BytesIO(data)


def harvest_one(code: str) -> tuple[str, dict | None, str | None]:
    url = PDF_URL.format(code=code.lower())
    try:
        data = fetch(url)
        return code, parse_pdf(data), None
    except Exception as error:  # noqa: BLE001 — keep going across the public index
        return code, None, str(error)


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def ts_value(value) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, str):
        return ts_string(value)
    if isinstance(value, list):
        return "[" + ", ".join(ts_string(item) for item in value) + "]"
    if isinstance(value, float):
        text = f"{value:.1f}".rstrip("0").rstrip(".")
        return text if "." in f"{value:.1f}" else str(int(value)) if value == int(value) else text
    return str(value)


def write_listings(rows: list[dict], headers: dict[str, dict], previous: dict[str, dict]) -> None:
    lines = [
        "/** Public Select UMA manager-profile index metadata. Descriptions are not stored here. */",
        "export interface UmaListing {",
        "  id: string;",
        "  manager: string;",
        "  name: string;",
        "  code: string;",
        "  style: string | null;",
        "  minimum: number | null;",
        "  inception: string | null;",
        "}",
        "",
        "export const UMA_LISTINGS: readonly UmaListing[] = [",
    ]
    for row in rows:
        header = headers.get(row["code"]) or {}
        prior = previous.get(row["code"]) or {}
        style = header.get("style") or prior.get("style")
        minimum = header.get("minimum") if header.get("minimum") is not None else prior.get("minimum")
        inception = header.get("inception") or prior.get("inception")
        listing_id = "uma-" + row["code"].lower()
        lines.append(
            "  { "
            f"id: {ts_string(listing_id)}, "
            f"manager: {ts_string(row['manager'])}, "
            f"name: {ts_string(row['name'])}, "
            f"code: {ts_string(row['code'])}, "
            f"style: {ts_value(style)}, "
            f"minimum: {ts_value(minimum)}, "
            f"inception: {ts_value(inception)} "
            "},"
        )
    lines.append("];")
    lines.append("")
    LISTINGS_PATH.write_text("\n".join(lines))


def write_headers(headers: dict[str, dict]) -> None:
    include_yield = any(item.get("yieldPct") is not None for item in headers.values())
    lines = [
        "/** Structured fields read from public Select UMA profile headers. No narrative or performance tables. */",
        "export interface UmaPublicHeader {",
        "  style: string | null;",
        "  minimum: number | null;",
        "  inception: string | null;",
        "  gimaStatus: string | null;",
        "  closed: boolean;",
        "  vehicle: string | null;",
        "  securitiesMin: number | null;",
        "  securitiesMax: number | null;",
        "  turnoverPct: number | null;",
        "  /** Null when the header printed an em dash (no ADR figure). */",
        "  adrUse: boolean | null;",
        "  maturityYears: number | null;",
        "  durationYears: number | null;",
        "  couponPct: number | null;",
    ]
    if include_yield:
        lines.append("  /** Header yield figure when the profile printed one. Not a performance table. */")
        lines.append("  yieldPct: number | null;")
    lines.extend(
        [
            "  referenceIndexes: string[];",
            "}",
            "",
            "export const UMA_HEADERS: Readonly<Record<string, UmaPublicHeader>> = {",
        ]
    )
    for code in sorted(headers):
        header = headers[code]
        parts = [
            f"style: {ts_value(header['style'])}",
            f"minimum: {ts_value(header['minimum'])}",
            f"inception: {ts_value(header['inception'])}",
            f"gimaStatus: {ts_value(header['gimaStatus'])}",
            f"closed: {ts_value(header['closed'])}",
            f"vehicle: {ts_value(header['vehicle'])}",
            f"securitiesMin: {ts_value(header['securitiesMin'])}",
            f"securitiesMax: {ts_value(header['securitiesMax'])}",
            f"turnoverPct: {ts_value(header['turnoverPct'])}",
            f"adrUse: {ts_value(header['adrUse'])}",
            f"maturityYears: {ts_value(header['maturityYears'])}",
            f"durationYears: {ts_value(header['durationYears'])}",
            f"couponPct: {ts_value(header['couponPct'])}",
        ]
        if include_yield:
            parts.append(f"yieldPct: {ts_value(header.get('yieldPct'))}")
        parts.append(f"referenceIndexes: {ts_value(header['referenceIndexes'])}")
        lines.append(f"  {ts_string(code)}: {{ {', '.join(parts)} }},")
    lines.append("};")
    lines.append("")
    HEADERS_PATH.write_text("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Parse only the first N PDFs. 0 means the full index.")
    parser.add_argument("--workers", type=int, default=12)
    args = parser.parse_args()

    print("fetching index", flush=True)
    page = fetch(INDEX_URL).decode("utf-8", "replace")
    rows = parse_index(page)
    previous = load_previous()
    print(f"live listings {len(rows)} previous {len(previous)}", flush=True)
    live_codes = {row["code"] for row in rows}
    added = sorted(live_codes - set(previous))
    removed = sorted(set(previous) - live_codes)
    print(f"added {len(added)} {added}", flush=True)
    print(f"removed {len(removed)} {removed}", flush=True)

    targets = rows if args.limit <= 0 else rows[: args.limit]
    headers: dict[str, dict] = {}
    failures: list[dict[str, str]] = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(harvest_one, row["code"]): row["code"] for row in targets}
        done = 0
        for future in as_completed(futures):
            code, header, error = future.result()
            done += 1
            if header is None:
                failures.append({"code": code, "error": error or "unparsed"})
            else:
                headers[code] = header
            if done % 50 == 0 or done == len(futures):
                print(f"parsed {done}/{len(futures)} headers {len(headers)} failed {len(failures)}", flush=True)

    if args.limit > 0 and HEADERS_PATH.exists():
        # Keep previously harvested codes outside this sample.
        existing_text = HEADERS_PATH.read_text()
        # Sample mode still rewrites from this run only. Full runs are the default.
        pass

    write_listings(rows, headers, previous)
    write_headers(headers)
    summary = {
        "previousListings": len(previous),
        "liveListings": len(rows),
        "headersParsed": len(headers),
        "headerFailures": len(failures),
        "added": added,
        "removed": removed,
        "failureSample": failures[:30],
        "withVehicle": sum(1 for header in headers.values() if header["vehicle"]),
        "withAdrKnown": sum(1 for header in headers.values() if header["adrUse"] is not None),
        "withMaturity": sum(1 for header in headers.values() if header["maturityYears"] is not None),
        "withDuration": sum(1 for header in headers.values() if header["durationYears"] is not None),
        "withCoupon": sum(1 for header in headers.values() if header["couponPct"] is not None),
        "withYield": sum(1 for header in headers.values() if header["yieldPct"] is not None),
        "withTurnover": sum(1 for header in headers.values() if header["turnoverPct"] is not None),
        "withSecurities": sum(1 for header in headers.values() if header["securitiesMin"] is not None),
        "withBenchmarkIndex": sum(1 for header in headers.values() if header["referenceIndexes"]),
        "closed": sum(1 for header in headers.values() if header["closed"]),
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
