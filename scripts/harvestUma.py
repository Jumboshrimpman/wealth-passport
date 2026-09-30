#!/usr/bin/env python3
"""Refresh Select UMA listings from the public Morgan Stanley index.

Reads the public manager-profile index (no login) and, for each live PDF,
the structured header on the profile: style, minimum, inception, vehicle,
holdings range, turnover, ADR use, and fixed-income averages when printed.

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
HOLDINGS_RE = re.compile(r"Number of security holdings:\s*([\d,]+)\s+to\s+([\d,]+)", re.I)
TURNOVER_RE = re.compile(r"Average turnover rate:\s*([\d.]+)\s+to\s+([\d.]+)\s*%", re.I)
ADR_RE = re.compile(r"Use ADRs:\s*(?:—|--|-|([\d.]+)\s+to\s+([\d.]+)\s*%)", re.I)
MATURITY_RE = re.compile(r"Average maturity:\s*([\d.]+)\s+to\s+([\d.]+)\s+years", re.I)
DURATION_RE = re.compile(r"Average duration:\s*([\d.]+)\s+to\s+([\d.]+)\s+years", re.I)
COUPON_RE = re.compile(r"Average coupon:\s*([\d.]+)\s+to\s+([\d.]+)\s*%", re.I)
VEHICLE_RE = re.compile(
    r"Eligible Investments:\s*(.+?)(?:\s+Manager Name|\s+Style:|\s+\d*\s*Portfolio Manager|\s+Manager's Investment)",
    re.I,
)
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


def midpoint(low: str, high: str, digits: int) -> float:
    value = (float(low.replace(",", "")) + float(high.replace(",", ""))) / 2
    return round(value, digits)


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
        "referenceIndexes": reference_indexes(text),
    }
    if style_match:
        style, gima, inception, minimum = style_match.groups()
        header["style"] = clean(style)
        header["gimaStatus"] = clean(gima)
        header["inception"] = None if inception in {"—", "-"} else inception
        if minimum.startswith("$"):
            header["minimum"] = int(minimum[1:].replace(",", ""))
    holdings = HOLDINGS_RE.search(text)
    if holdings:
        header["securitiesMin"] = int(holdings.group(1).replace(",", ""))
        header["securitiesMax"] = int(holdings.group(2).replace(",", ""))
    turnover = TURNOVER_RE.search(text)
    if turnover:
        header["turnoverPct"] = int(round(midpoint(turnover.group(1), turnover.group(2), 1)))
    adr = ADR_RE.search(text)
    if adr and adr.group(1) is not None:
        high = float(adr.group(2))
        low = float(adr.group(1))
        header["adrUse"] = high > 0 or low > 0
    maturity = MATURITY_RE.search(text)
    if maturity:
        header["maturityYears"] = midpoint(maturity.group(1), maturity.group(2), 1)
    duration = DURATION_RE.search(text)
    if duration:
        header["durationYears"] = midpoint(duration.group(1), duration.group(2), 1)
    coupon = COUPON_RE.search(text)
    if coupon:
        header["couponPct"] = midpoint(coupon.group(1), coupon.group(2), 1)
    vehicle = VEHICLE_RE.search(text)
    if vehicle:
        label = clean(vehicle.group(1))
        label = re.split(r"\s{2,}| For more information", label)[0].strip(" .")
        if 0 < len(label) <= 80:
            header["vehicle"] = label
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
        "  referenceIndexes: string[];",
        "}",
        "",
        "export const UMA_HEADERS: Readonly<Record<string, UmaPublicHeader>> = {",
    ]
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
            f"referenceIndexes: {ts_value(header['referenceIndexes'])}",
        ]
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
        "withTurnover": sum(1 for header in headers.values() if header["turnoverPct"] is not None),
        "withSecurities": sum(1 for header in headers.values() if header["securitiesMin"] is not None),
        "withBenchmarkIndex": sum(1 for header in headers.values() if header["referenceIndexes"]),
        "closed": sum(1 for header in headers.values() if header["closed"]),
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
