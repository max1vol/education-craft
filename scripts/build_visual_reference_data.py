#!/usr/bin/env python3
"""Build official and created visual reference data for all historical sites."""

from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import re
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, urlparse

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WIKI_API = "https://en.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)
ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
MAX_DIM = 1800
JPEG_QUALITY = 90


@dataclass
class FileMeta:
    file_title: str
    title: str
    image_url: str
    source_url: str
    mime: str
    author: str
    license_name: str
    description: str


STOPWORDS = {
    "ancient",
    "site",
    "temple",
    "city",
    "rome",
    "kingdom",
    "capital",
    "churches",
    "mounds",
    "mausoleum",
    "the",
    "of",
    "at",
    "and",
    "in",
}

ILLUS_POSITIVE = [
    "reconstruction",
    "reconstructed",
    "artist",
    "impression",
    "plan",
    "diagram",
    "drawing",
    "engraving",
    "painting",
    "illustration",
    "render",
    "model",
    "restoration",
    "depiction",
    "hypothetical",
    "cutaway",
]

ILLUS_NEGATIVE = [
    "logo",
    "icon",
    "flag",
    "locator",
    "map of",
    "coat of arms",
    "symbol",
    "blank",
    "disambig",
]

PHOTO_NEGATIVE = [
    "logo",
    "icon",
    "flag",
    "plan",
    "diagram",
    "drawing",
    "engraving",
    "illustration",
    "cutaway",
    "map",
    "model",
]

TERM_SEARCH_NEGATIVE = [
    "logo",
    "icon",
    "flag",
    "symbol",
    "map",
    "diagram",
    "route",
]

MATERIAL_ID_BY_TERM = {
    "adobe": "adobe",
    "bronze": "bronze",
    "clay": "clay",
    "earth": "earth",
    "fired brick": "fired-brick",
    "granite": "granite",
    "lime mortar": "lime-mortar",
    "limestone": "limestone",
    "pentelic marble": "pentelic-marble",
    "roman travertine": "travertine",
    "sandstone": "sandstone",
    "stone": "stone",
    "timber": "timber",
    "bluestone": "bluestone",
    "concrete": "concrete",
    "ebony": "ebony",
    "gold": "gold",
    "ivory": "ivory",
    "sarsen": "sarsen",
    "tuff": "tuff",
    "wood": "wood",
}

MATERIAL_LABELS = {
    "adobe": "Adobe",
    "bronze": "Bronze",
    "clay": "Clay",
    "earth": "Earth",
    "fired-brick": "Fired Brick",
    "granite": "Granite",
    "lime-mortar": "Lime Mortar",
    "limestone": "Limestone",
    "pentelic-marble": "Pentelic Marble",
    "travertine": "Roman Travertine",
    "sandstone": "Sandstone",
    "stone": "Stone",
    "timber": "Timber",
    "bluestone": "Bluestone",
    "concrete": "Concrete",
    "ebony": "Ebony",
    "gold": "Gold",
    "ivory": "Ivory",
    "sarsen": "Sarsen",
    "tuff": "Tuff",
    "wood": "Wood",
}

MATERIAL_WIKI_TITLES = {
    "adobe": "Adobe",
    "bronze": "Bronze",
    "clay": "Clay",
    "earth": "Earth",
    "fired-brick": "Brick",
    "granite": "Granite",
    "lime-mortar": "Lime mortar",
    "limestone": "Limestone",
    "pentelic-marble": "Pentelic marble",
    "travertine": "Travertine",
    "sandstone": "Sandstone",
    "stone": "Stone",
    "timber": "Timber framing",
    "bluestone": "Bluestone",
    "concrete": "Roman concrete",
    "ebony": "Ebony",
    "gold": "Gold",
    "ivory": "Ivory",
    "sarsen": "Sarsen",
    "tuff": "Tuff",
    "wood": "Wood",
}

TOOL_ID_BY_TERM = {
    "antler/wood picks": "antler-wood-picks",
    "axes/adzes": "axes-adzes",
    "boring tools/augers": "boring-tools-augers",
    "brick moulds": "brick-moulds",
    "carrying baskets": "carrying-baskets",
    "clay moulds": "clay-moulds",
    "hammerstones/mallets": "hammerstones-mallets",
    "kilns": "kilns",
    "levering poles": "levering-poles",
    "manual stone/earth shaping tools": "manual-stone-earth-shaping-tools",
    "metal chisels": "metal-chisels",
    "mixing tools": "mixing-tools",
    "modeling/carving tools": "modeling-carving-tools",
    "mudbrick moulds": "mudbrick-moulds",
    "picks": "picks",
    "plastering tools": "plastering-tools",
    "rope and lever systems": "rope-and-lever-systems",
    "rope systems": "rope-systems",
    "saws": "saws",
    "trowels": "trowels",
    "wooden centering/formwork": "wooden-centering-formwork",
    "wooden shovels": "wooden-shovels",
    "wooden sledges/rollers": "wooden-sledges-rollers",
}

TOOL_LABELS = {
    "antler-wood-picks": "Antler and Wood Picks",
    "axes-adzes": "Axes and Adzes",
    "boring-tools-augers": "Boring Tools and Augers",
    "brick-moulds": "Brick Moulds",
    "carrying-baskets": "Carrying Baskets",
    "clay-moulds": "Clay Moulds",
    "hammerstones-mallets": "Hammerstones and Mallets",
    "kilns": "Kilns",
    "levering-poles": "Levering Poles",
    "manual-stone-earth-shaping-tools": "Stone and Earth Shaping Tools",
    "metal-chisels": "Metal Chisels",
    "mixing-tools": "Mixing Tools",
    "modeling-carving-tools": "Modeling and Carving Tools",
    "mudbrick-moulds": "Mudbrick Moulds",
    "picks": "Picks",
    "plastering-tools": "Plastering Tools",
    "rope-and-lever-systems": "Rope and Lever Systems",
    "rope-systems": "Rope Systems",
    "saws": "Saws",
    "trowels": "Trowels",
    "wooden-centering-formwork": "Wooden Centering and Formwork",
    "wooden-shovels": "Wooden Shovels",
    "wooden-sledges-rollers": "Wooden Sledges and Rollers",
}

TOOL_WIKI_TITLES = {
    "antler-wood-picks": "Pickaxe",
    "axes-adzes": "Adze",
    "boring-tools-augers": "Auger (drill)",
    "brick-moulds": "Brick",
    "carrying-baskets": "Basket",
    "clay-moulds": "Molding (process)",
    "hammerstones-mallets": "Mallet",
    "kilns": "Kiln",
    "levering-poles": "Lever",
    "manual-stone-earth-shaping-tools": "Masonry tools",
    "metal-chisels": "Chisel",
    "mixing-tools": "Mortar and pestle",
    "modeling-carving-tools": "Sculpting tool",
    "mudbrick-moulds": "Adobe",
    "picks": "Pickaxe",
    "plastering-tools": "Plaster",
    "rope-and-lever-systems": "Block and tackle",
    "rope-systems": "Rope",
    "saws": "Saw",
    "trowels": "Trowel",
    "wooden-centering-formwork": "Formwork",
    "wooden-shovels": "Shovel",
    "wooden-sledges-rollers": "Sled",
}


def curl_fetch(url: str, retries: int = 2, binary: bool = False) -> bytes:
    cmd = [
        "curl",
        "-L",
        "--fail",
        "--silent",
        "--show-error",
        "--connect-timeout",
        "12",
        "--max-time",
        "40",
        "--retry",
        str(retries),
        "--retry-all-errors",
        "--retry-delay",
        "2",
        "-A",
        UA,
        url,
    ]
    last_error: str | None = None
    for attempt in range(1, retries + 1):
        result = subprocess.run(cmd, capture_output=True, check=False)
        if result.returncode == 0:
            if binary:
                return result.stdout
            return result.stdout

        error = result.stderr.decode("utf-8", errors="replace").strip()
        last_error = error
        if "429" in error and attempt < retries:
            time.sleep(2.5 * attempt)
            continue
        if attempt < retries:
            time.sleep(1.2 * attempt)

    raise RuntimeError(f"curl failed for {url}: {last_error or 'unknown error'}")


def request_json(base_url: str, params: dict[str, Any], retries: int = 3) -> dict[str, Any]:
    last_error: Exception | None = None
    url = f"{base_url}?{urlencode(params)}"
    for attempt in range(1, retries + 1):
        try:
            payload = curl_fetch(url, retries=2, binary=False)
            return json.loads(payload.decode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < retries:
                time.sleep(1.2 * attempt)
    raise RuntimeError(f"failed to request json: {url}") from last_error


def strip_html(raw: str) -> str:
    text = re.sub(r"<[^>]+>", " ", raw or "")
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def site_tokens(name: str) -> list[str]:
    lowered = re.sub(r"\([^)]*\)", "", name).lower()
    tokens: list[str] = []
    for token in re.findall(r"[a-z0-9]+", lowered):
        if len(token) < 4 or token in STOPWORDS:
            continue
        tokens.append(token)
    return list(dict.fromkeys(tokens))


def is_image_title(title: str) -> bool:
    lowered = title.lower()
    if not lowered.startswith("file:"):
        return False
    if not lowered.endswith((".jpg", ".jpeg", ".png", ".webp", ".svg")):
        return False
    return True


def choose_illustration_title(image_titles: list[str], tokens: list[str]) -> str | None:
    best: tuple[int, str] | None = None
    for title in image_titles:
        lowered = title.lower()
        if any(bad in lowered for bad in ILLUS_NEGATIVE):
            continue

        score = 0
        for token in tokens:
            if token in lowered:
                score += 3
        for word in ILLUS_POSITIVE:
            if word in lowered:
                score += 2
        if lowered.endswith(".svg"):
            score += 1
        if "reconstruction" in lowered:
            score += 3

        if score < 4:
            continue
        if best is None or score > best[0]:
            best = (score, title)

    return best[1] if best else None


def choose_photo_title(image_titles: list[str], tokens: list[str]) -> str | None:
    best: tuple[int, str] | None = None
    for title in image_titles:
        lowered = title.lower()
        if any(bad in lowered for bad in PHOTO_NEGATIVE):
            continue

        score = 1
        for token in tokens:
            if token in lowered:
                score += 2
        if "photo" in lowered or "view" in lowered:
            score += 2
        if "ruin" in lowered or "temple" in lowered:
            score += 1

        if best is None or score > best[0]:
            best = (score, title)

    return best[1] if best else None


def fetch_page_data(title: str) -> dict[str, Any] | None:
    params = {
        "action": "query",
        "format": "json",
        "redirects": "1",
        "titles": title,
        "prop": "pageimages|images|info",
        "piprop": "name|original",
        "imlimit": "500",
        "inprop": "url",
    }
    payload = request_json(WIKI_API, params)
    pages = payload.get("query", {}).get("pages", {})
    if not pages:
        return None
    page = next(iter(pages.values()))
    if "missing" in page:
        return None
    return page


def fetch_file_meta(file_title: str) -> FileMeta | None:
    params = {
        "action": "query",
        "format": "json",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata",
        "iiurlwidth": "1600",
    }
    payload = request_json(WIKI_API, params)
    pages = payload.get("query", {}).get("pages", {})
    if not pages:
        return None
    page = next(iter(pages.values()))
    info = (page.get("imageinfo") or [{}])[0]
    image_url = info.get("thumburl") or info.get("url")
    source_url = info.get("descriptionurl") or ""
    mime = info.get("mime") or ""
    if not image_url:
        return None

    extmeta = info.get("extmetadata") or {}
    title = file_title.replace("File:", "").strip()
    author = strip_html((extmeta.get("Artist") or {}).get("value", ""))
    license_name = strip_html((extmeta.get("LicenseShortName") or {}).get("value", ""))
    description = strip_html((extmeta.get("ImageDescription") or {}).get("value", ""))

    return FileMeta(
        file_title=file_title,
        title=title,
        image_url=image_url,
        source_url=source_url,
        mime=mime,
        author=author,
        license_name=license_name,
        description=description,
    )


def commons_search_image(query: str, tokens: list[str]) -> FileMeta | None:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrnamespace": "6",
        "gsrsearch": query,
        "gsrlimit": "20",
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata",
        "iiurlwidth": "1600",
    }
    payload = request_json(COMMONS_API, params)
    pages = payload.get("query", {}).get("pages", {})
    candidates: list[tuple[int, FileMeta]] = []

    for page in pages.values():
        title = page.get("title", "")
        if not is_image_title(title):
            continue
        info = (page.get("imageinfo") or [{}])[0]
        image_url = info.get("thumburl") or info.get("url")
        source_url = info.get("descriptionurl") or ""
        if not image_url:
            continue
        extmeta = info.get("extmetadata") or {}
        object_name = strip_html((extmeta.get("ObjectName") or {}).get("value", ""))
        description = strip_html((extmeta.get("ImageDescription") or {}).get("value", ""))
        author = strip_html((extmeta.get("Artist") or {}).get("value", ""))
        license_name = strip_html((extmeta.get("LicenseShortName") or {}).get("value", ""))

        blob = f"{title} {object_name} {description}".lower()
        if any(bad in blob for bad in TERM_SEARCH_NEGATIVE):
            continue

        score = 0
        for token in tokens:
            if token in blob:
                score += 3
        if "reconstruction" in blob:
            score += 2
        if "illustration" in blob or "drawing" in blob:
            score += 1
        if score < 1:
            continue

        candidates.append(
            (
                score,
                FileMeta(
                    file_title=title,
                    title=title.replace("File:", ""),
                    image_url=image_url,
                    source_url=source_url,
                    mime=info.get("mime") or "",
                    author=author,
                    license_name=license_name,
                    description=description,
                ),
            )
        )

    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]


def safe_ext(url: str, mime: str) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in ALLOWED_SUFFIXES:
        return suffix
    if "png" in mime:
        return ".png"
    return ".jpg"


def optimize_binary(binary: bytes, suffix: str) -> bytes:
    try:
        with Image.open(io.BytesIO(binary)) as img:
            img.load()
            width, height = img.size
            max_side = max(width, height)
            if max_side > MAX_DIM:
                scale = MAX_DIM / max_side
                img = img.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)

            output = io.BytesIO()
            out_suffix = suffix.lower()
            if out_suffix in {".jpg", ".jpeg", ".webp"}:
                if img.mode not in {"RGB", "L"}:
                    img = img.convert("RGB")
                img.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            elif out_suffix == ".png":
                img.save(output, format="PNG", optimize=True, compress_level=6)
            else:
                if img.mode not in {"RGB", "L"}:
                    img = img.convert("RGB")
                img.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            return output.getvalue()
    except Exception:
        return binary


def download_to_static(meta: FileMeta, relative_target: Path) -> str:
    out_path = ROOT / "static" / relative_target
    out_path.parent.mkdir(parents=True, exist_ok=True)

    suffix = safe_ext(meta.image_url, meta.mime)
    final_path = out_path.with_suffix(suffix)
    if final_path.exists() and final_path.stat().st_size > 1_500:
        return "/" + str(final_path.relative_to(ROOT / "static")).replace("\\", "/")

    # Reuse any existing variant extension to reduce repeated source downloads.
    for candidate in out_path.parent.glob(f"{out_path.name}.*"):
        if candidate.suffix.lower() in ALLOWED_SUFFIXES and candidate.stat().st_size > 1_500:
            return "/" + str(candidate.relative_to(ROOT / "static")).replace("\\", "/")

    binary = curl_fetch(meta.image_url, retries=4, binary=True)
    binary = optimize_binary(binary, suffix)
    final_path.write_bytes(binary)
    return "/" + str(final_path.relative_to(ROOT / "static")).replace("\\", "/")


def download_to_static_or_remote(meta: FileMeta, relative_target: Path) -> str:
    try:
        return download_to_static(meta, relative_target)
    except Exception as exc:  # noqa: BLE001
        print(f"[media] download fallback for {meta.file_title}: {exc}")
        return meta.image_url


def format_year(year: int) -> str:
    if year < 0:
        return f"{abs(year)} BCE"
    return f"{year} CE"


def svg_escape(text: str) -> str:
    return html.escape(text, quote=True)


def write_site_timeline_svg(slug: str, site_name: str, facts: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    start = int(facts.get("startYear", 0))
    peak = int(facts.get("peakYear", start))
    end = int(facts.get("endYear", peak))
    rediscovery = int(facts.get("rediscoveryYear", end))

    years = [start, peak, end, rediscovery]
    min_year = min(years)
    max_year = max(years)
    span = max(1, max_year - min_year)

    def x_pos(year: int) -> int:
        return int(110 + ((year - min_year) / span) * 980)

    marks = [
        ("Origins", start, "#6a8dff"),
        ("Peak", peak, "#19a57a"),
        ("Transition", end, "#e1912d"),
        ("Rediscovery", rediscovery, "#d65b5b"),
    ]

    bubbles = []
    labels = []
    for idx, (label, year, color) in enumerate(marks):
        x = x_pos(year)
        y = 300 + ((idx % 2) * 70)
        bubbles.append(f"<circle cx='{x}' cy='{y}' r='16' fill='{color}' stroke='#1d1f29' stroke-width='2'/>")
        labels.append(
            "".join(
                [
                    f"<text x='{x}' y='{y - 28}' text-anchor='middle' font-size='18' fill='#1d1f29' font-weight='700'>{svg_escape(label)}</text>",
                    f"<text x='{x}' y='{y + 40}' text-anchor='middle' font-size='16' fill='#3b3f4e'>{svg_escape(format_year(year))}</text>",
                ]
            )
        )

    title = svg_escape(site_name)
    subtitle = f"{svg_escape(format_year(start))} to {svg_escape(format_year(end))}"

    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='680' viewBox='0 0 1200 680'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#f8f4ec'/>
      <stop offset='100%' stop-color='#e8dbc6'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='680' rx='28' fill='url(#bg)'/>
  <rect x='36' y='36' width='1128' height='608' rx='20' fill='white' opacity='0.72' stroke='#d8c8ad'/>
  <text x='76' y='105' font-size='48' fill='#1d1f29' font-family='Georgia, serif' font-weight='700'>{title}</text>
  <text x='76' y='145' font-size='22' fill='#4d5162' font-family='Georgia, serif'>Created Illustration: Historical Timeline ({subtitle})</text>
  <line x1='110' y1='335' x2='1090' y2='335' stroke='#4b5062' stroke-width='6' stroke-linecap='round'/>
  {''.join(bubbles)}
  {''.join(labels)}
  <text x='76' y='610' font-size='17' fill='#666c7c' font-family='Georgia, serif'>Created by Codex for classroom visualization. Not an official archaeological plate.</text>
</svg>
"""
    out_path.write_text(svg, encoding="utf-8")


def write_site_construction_svg(
    slug: str,
    site_name: str,
    construction: dict[str, Any],
    out_path: Path,
) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    materials = construction.get("materials", [])[:8]
    tools = construction.get("constructionTools", [])[:8]
    methods = construction.get("constructionMethods", [])[:6]

    def render_rows(items: list[str], start_x: int, start_y: int, color: str) -> str:
        rows = []
        y = start_y
        for item in items:
            rows.append(
                f"<rect x='{start_x}' y='{y}' width='470' height='44' rx='10' fill='{color}' opacity='0.14' stroke='{color}'/>"
                f"<text x='{start_x + 14}' y='{y + 28}' font-size='18' fill='#1f2330' font-family='Georgia, serif'>{svg_escape(item)}</text>"
            )
            y += 54
        return "".join(rows)

    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='760' viewBox='0 0 1200 760'>
  <defs>
    <linearGradient id='bg2' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#f6efe2'/>
      <stop offset='100%' stop-color='#e3d3b3'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='760' rx='28' fill='url(#bg2)'/>
  <rect x='34' y='34' width='1132' height='692' rx='18' fill='white' opacity='0.78' stroke='#d8c4a0'/>
  <text x='74' y='96' font-size='44' fill='#1f2531' font-family='Georgia, serif' font-weight='700'>{svg_escape(site_name)}</text>
  <text x='74' y='132' font-size='22' fill='#565f75' font-family='Georgia, serif'>Created Illustration: Construction Summary</text>
  <text x='74' y='182' font-size='24' fill='#244f8a' font-family='Georgia, serif' font-weight='700'>Building Materials</text>
  {render_rows(materials, 74, 198, '#2f68ac')}
  <text x='654' y='182' font-size='24' fill='#8a5d1e' font-family='Georgia, serif' font-weight='700'>Likely Tools</text>
  {render_rows(tools, 654, 198, '#a56f27')}
  <text x='74' y='560' font-size='24' fill='#206e59' font-family='Georgia, serif' font-weight='700'>Construction Methods</text>
  {render_rows(methods, 74, 576, '#2a8f77')}
  <text x='74' y='710' font-size='17' fill='#687287' font-family='Georgia, serif'>Created by Codex for visual teaching support. Use source links for official records.</text>
</svg>
"""
    out_path.write_text(svg, encoding="utf-8")


def write_term_svg(label: str, kind: str, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha1(label.encode("utf-8")).hexdigest()
    hue = int(digest[:2], 16)
    hue2 = int(digest[2:4], 16)
    c1 = f"#{hue:02x}{(70 + hue2 // 2):02x}{(120 + hue // 3):02x}"
    c2 = f"#{(200 - hue // 2):02x}{(110 + hue2 // 3):02x}{(90 + hue // 4):02x}"
    kind_title = "Material" if kind == "material" else "Tool"

    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='960' height='640' viewBox='0 0 960 640'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#f5efe3'/>
      <stop offset='100%' stop-color='#e1d0b3'/>
    </linearGradient>
    <linearGradient id='shape' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='{c1}'/>
      <stop offset='100%' stop-color='{c2}'/>
    </linearGradient>
  </defs>
  <rect width='960' height='640' rx='28' fill='url(#bg)'/>
  <rect x='42' y='42' width='876' height='556' rx='20' fill='white' opacity='0.72' stroke='#d7c6a9'/>
  <circle cx='245' cy='312' r='120' fill='url(#shape)' opacity='0.92'/>
  <rect x='195' y='262' width='285' height='140' rx='24' fill='url(#shape)' opacity='0.65' transform='rotate(-16 330 332)'/>
  <text x='520' y='228' font-size='44' fill='#1e2430' font-family='Georgia, serif' font-weight='700'>{svg_escape(label)}</text>
  <text x='520' y='274' font-size='26' fill='#4f5668' font-family='Georgia, serif'>Created {kind_title} Illustration</text>
  <text x='520' y='326' font-size='21' fill='#5d6679' font-family='Georgia, serif'>Designed by Codex for classroom visual comparison.</text>
  <text x='520' y='360' font-size='21' fill='#5d6679' font-family='Georgia, serif'>Pair this with the official reference image and source citation.</text>
</svg>
"""
    out_path.write_text(svg, encoding="utf-8")


def normalize_material(term: str) -> str:
    return MATERIAL_ID_BY_TERM.get(term.strip().lower(), "stone")


def normalize_tool(term: str) -> str:
    return TOOL_ID_BY_TERM.get(term.strip().lower(), "rope-systems")


def build_media_entry(meta: FileMeta | None, fallback_title: str = "") -> dict[str, Any] | None:
    if meta is None:
        return None
    title = meta.description or meta.title or fallback_title
    return {
        "title": title,
        "sourceUrl": meta.source_url,
        "sourceName": "Wikipedia / Wikimedia Commons",
        "author": meta.author or "Unknown",
        "license": meta.license_name or "License listed on source page",
    }


def find_term_media(term_label: str, wiki_title: str, extra_query: str) -> FileMeta | None:
    page = fetch_page_data(wiki_title)
    if page:
        page_image = page.get("pageimage")
        if page_image:
            file_title = page_image if page_image.startswith("File:") else f"File:{page_image}"
            meta = fetch_file_meta(file_title)
            if meta:
                return meta

    query_tokens = [token for token in re.findall(r"[a-z0-9]+", term_label.lower()) if len(token) >= 3]
    return commons_search_image(f"{term_label} {extra_query}", query_tokens)


def build_site_visual(
    site: dict[str, Any],
    facts_by_slug: dict[str, dict[str, Any]],
    construction_by_slug: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    slug = site["slug"]
    site_name = site["name"]
    construction = construction_by_slug.get(slug, {})
    wiki_title = construction.get("wikipediaTitle") or site_name
    tokens = site_tokens(site_name)

    try:
        page = fetch_page_data(wiki_title)
    except Exception as exc:  # noqa: BLE001
        print(f"[site] page fetch fallback for {slug}: {exc}")
        page = None
    page_url = page.get("fullurl") if page else f"https://en.wikipedia.org/wiki/{wiki_title.replace(' ', '_')}"

    page_image_title = None
    image_titles: list[str] = []
    if page:
        page_image_title = page.get("pageimage")
        image_titles = [entry.get("title", "") for entry in page.get("images", []) if is_image_title(entry.get("title", ""))]

    if page_image_title and not page_image_title.startswith("File:"):
        page_image_title = f"File:{page_image_title}"

    photo_meta = None
    if page_image_title:
        try:
            photo_meta = fetch_file_meta(page_image_title)
        except Exception as exc:  # noqa: BLE001
            print(f"[site] photo meta fallback for {slug}: {exc}")

    if photo_meta and any(bad in photo_meta.file_title.lower() for bad in PHOTO_NEGATIVE):
        fallback_photo_title = choose_photo_title(image_titles, tokens)
        if fallback_photo_title:
            try:
                photo_meta = fetch_file_meta(fallback_photo_title)
            except Exception as exc:  # noqa: BLE001
                print(f"[site] photo fallback meta error for {slug}: {exc}")

    illustration_title = choose_illustration_title(image_titles, tokens)
    illustration_meta = None
    if illustration_title:
        try:
            illustration_meta = fetch_file_meta(illustration_title)
        except Exception as exc:  # noqa: BLE001
            print(f"[site] illustration meta fallback for {slug}: {exc}")

    if illustration_meta is None:
        reconstruction_query = f"{site_name} reconstruction illustration"
        try:
            illustration_meta = commons_search_image(reconstruction_query, tokens)
        except Exception as exc:  # noqa: BLE001
            print(f"[site] commons fallback failed for {slug}: {exc}")

    if illustration_meta is None and photo_meta is not None:
        illustration_meta = photo_meta

    official_photo = build_media_entry(photo_meta, fallback_title=f"{site_name} official photograph")
    official_illustration = build_media_entry(
        illustration_meta,
        fallback_title=f"{site_name} official illustration",
    )

    site_media_root = Path("official-media") / "sites" / slug
    if photo_meta:
        official_photo["imageUrl"] = download_to_static_or_remote(photo_meta, site_media_root / "official-photo")
    if official_illustration:
        official_illustration["imageUrl"] = download_to_static_or_remote(
            illustration_meta,
            site_media_root / "official-illustration",
        )

    facts = facts_by_slug.get(slug, {})
    timeline_rel = Path("created-illustrations") / "sites" / f"{slug}-timeline.svg"
    construction_rel = Path("created-illustrations") / "sites" / f"{slug}-construction.svg"

    write_site_timeline_svg(slug, site_name, facts, ROOT / "static" / timeline_rel)
    write_site_construction_svg(slug, site_name, construction, ROOT / "static" / construction_rel)

    created = [
        {
            "title": f"{site_name} Timeline Diagram",
            "description": "Created illustration showing origin, peak, transition, and rediscovery milestones.",
            "imageUrl": "/" + str(timeline_rel).replace("\\", "/"),
            "sourceName": "Created by Codex",
            "sourceUrl": None,
            "license": "Created for Education Craft project",
        },
        {
            "title": f"{site_name} Construction Summary Diagram",
            "description": "Created illustration showing materials, methods, and tool groups for classroom study.",
            "imageUrl": "/" + str(construction_rel).replace("\\", "/"),
            "sourceName": "Created by Codex",
            "sourceUrl": None,
            "license": "Created for Education Craft project",
        },
    ]

    return {
        "slug": slug,
        "siteName": site_name,
        "pageUrl": page_url,
        "officialPhotos": [official_photo] if official_photo else [],
        "officialIllustrations": [official_illustration] if official_illustration else [],
        "createdIllustrations": created,
        "updated": time.strftime("%Y-%m-%d"),
    }


def build_term_library(
    terms: dict[str, str],
    labels: dict[str, str],
    wiki_titles: dict[str, str],
    kind: str,
    extra_query: str,
) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []

    for term_id in sorted(terms.values()):
        label = labels[term_id]
        wiki_title = wiki_titles[term_id]
        meta = find_term_media(label, wiki_title, extra_query)

        official = None
        if meta:
            target = Path("official-media") / ("materials" if kind == "material" else "tools") / term_id
            local_url = download_to_static_or_remote(meta, target)
            official = {
                "title": meta.description or meta.title or label,
                "imageUrl": local_url,
                "sourceUrl": meta.source_url,
                "sourceName": "Wikipedia / Wikimedia Commons",
                "author": meta.author or "Unknown",
                "license": meta.license_name or "License listed on source page",
            }

        created_rel = Path("created-illustrations") / ("materials" if kind == "material" else "tools") / f"{term_id}.svg"
        write_term_svg(label, kind, ROOT / "static" / created_rel)

        entries.append(
            {
                "id": term_id,
                "label": label,
                "official": official,
                "created": {
                    "title": f"{label} Created Illustration",
                    "imageUrl": "/" + str(created_rel).replace("\\", "/"),
                    "sourceName": "Created by Codex",
                    "sourceUrl": None,
                    "license": "Created for Education Craft project",
                },
            }
        )

    return entries


def main() -> None:
    parser = argparse.ArgumentParser(description="Build site visual reference datasets and generated illustrations")
    parser.add_argument("--threads", type=int, default=6)
    args = parser.parse_args()

    manifest = json.loads((ROOT / "src/lib/data/sites-manifest.json").read_text(encoding="utf-8"))
    facts = json.loads((ROOT / "src/lib/data/site-facts.json").read_text(encoding="utf-8"))
    construction = json.loads((ROOT / "src/lib/data/site-construction.json").read_text(encoding="utf-8"))

    facts_by_slug = {entry["slug"]: entry for entry in facts}
    construction_by_slug = {entry["slug"]: entry for entry in construction}

    site_visuals: list[dict[str, Any]] = []

    with ThreadPoolExecutor(max_workers=max(1, args.threads)) as executor:
        futures = {
            executor.submit(build_site_visual, site, facts_by_slug, construction_by_slug): site["slug"]
            for site in manifest
        }
        for future in as_completed(futures):
            slug = futures[future]
            try:
                site_visuals.append(future.result())
                print(f"[site] built visuals for {slug}")
            except Exception as exc:  # noqa: BLE001
                print(f"[site] failed for {slug}: {exc}")

    site_visuals.sort(key=lambda item: item["slug"])

    material_entries = build_term_library(
        MATERIAL_ID_BY_TERM,
        MATERIAL_LABELS,
        MATERIAL_WIKI_TITLES,
        kind="material",
        extra_query="building material",
    )
    tool_entries = build_term_library(
        TOOL_ID_BY_TERM,
        TOOL_LABELS,
        TOOL_WIKI_TITLES,
        kind="tool",
        extra_query="ancient construction tool",
    )

    aliases = {
        "materials": {raw: normalize_material(raw) for raw in sorted(MATERIAL_ID_BY_TERM.keys())},
        "tools": {raw: normalize_tool(raw) for raw in sorted(TOOL_ID_BY_TERM.keys())},
    }

    site_visuals_path = ROOT / "src/lib/data/site-visuals.json"
    term_visuals_path = ROOT / "src/lib/data/material-tool-visuals.json"

    site_visuals_path.write_text(json.dumps(site_visuals, indent=2, ensure_ascii=False), encoding="utf-8")
    term_visuals_path.write_text(
        json.dumps(
            {
                "materials": material_entries,
                "tools": tool_entries,
                "aliases": aliases,
                "updated": time.strftime("%Y-%m-%d"),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print(f"wrote {site_visuals_path}")
    print(f"wrote {term_visuals_path}")


if __name__ == "__main__":
    main()
