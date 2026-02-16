#!/usr/bin/env python3
"""Download reconstruction-style images from Wikimedia Commons."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import subprocess
import time
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, urlparse

from reconstruction_sites import SITES

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)

STOPWORDS = {
    "ancient",
    "city",
    "temple",
    "site",
    "rome",
    "kingdom",
    "capital",
    "sanctuary",
    "palace",
    "churches",
    "mounds",
    "mausoleum",
}

POSITIVE_KEYWORDS = [
    "reconstruction",
    "reconstructed",
    "artist impression",
    "artist's impression",
    "restoration",
    "historical reconstruction",
    "rendering",
    "digital reconstruction",
    "cg",
    "3d model",
    "illustration",
    "drawing",
    "engraving",
    "painting",
    "depiction",
    "hypothetical",
    "imagined",
    "diorama",
    "cutaway",
]

STRONG_RECON_TERMS = [
    "reconstruction",
    "reconstructed",
    "artist impression",
    "artist's impression",
    "historical reconstruction",
    "digital reconstruction",
    "hypothetical",
]

VISUAL_RECON_TERMS = [
    "illustration",
    "drawing",
    "engraving",
    "painting",
    "rendering",
    "depiction",
    "diorama",
    "cutaway",
    "model",
]

NEGATIVE_KEYWORDS = [
    "ruin photo",
    "ruins photo",
    "ruins",
    "tourist",
    "selfie",
    "today",
    "then and now",
    " now ",
    "modern",
    "street view",
    "drone",
    "aerial photograph",
    "panorama",
    "night shot",
    "stock photo",
    "shutterstock",
    "alamy",
    "getty",
    "tripadvisor",
    "booking.com",
    "ticket",
    "guided tour",
    "scaffold",
    "fiat",
    "automobile",
    "car ",
    "vehicle",
    "motor",
]

ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@dataclass
class Candidate:
    uid: str
    title: str
    image_url: str
    source_url: str
    mime: str
    score: int
    query: str
    object_name: str
    description: str
    artist: str
    license_name: str
    credit: str
    text_blob: str


def strip_html(raw: str) -> str:
    cleaned = re.sub(r"<[^>]+>", " ", raw or "")
    cleaned = re.sub(r"\s+", " ", html.unescape(cleaned)).strip()
    return cleaned


def curl_fetch(url: str, retries: int, is_binary: bool) -> bytes:
    cmd = [
        "curl",
        "-L",
        "--fail",
        "--silent",
        "--show-error",
        "--connect-timeout",
        "10",
        "--max-time",
        "20",
        "--retry",
        str(retries),
        "--retry-all-errors",
        "--retry-delay",
        "2",
        "-A",
        USER_AGENT,
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, check=False)
    if result.returncode != 0:
        error_text = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"curl failed for {url}: {error_text}")
    if not is_binary:
        return result.stdout
    return result.stdout


def request_json(url: str, retries: int = 2) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return json.loads(curl_fetch(url, retries=2, is_binary=False).decode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < retries:
                time.sleep(1.8 * attempt)
    raise RuntimeError(f"Failed to fetch JSON: {url}") from last_error


def download_binary(url: str, retries: int = 2) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return curl_fetch(url, retries=1, is_binary=True)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < retries:
                time.sleep(2.0 * attempt)
    raise RuntimeError(f"Failed to download: {url}") from last_error


def commons_search(query: str, max_results: int) -> list[dict[str, Any]]:
    pages: dict[int, dict[str, Any]] = {}
    continuation: dict[str, str] = {}

    while len(pages) < max_results:
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": query,
            "gsrlimit": "50",
            "prop": "imageinfo",
            "iiprop": "url|mime|extmetadata",
            "iiurlwidth": "1280",
        }
        params.update(continuation)
        url = f"{COMMONS_API}?{urlencode(params)}"
        payload = request_json(url)
        for page in payload.get("query", {}).get("pages", {}).values():
            pageid = int(page["pageid"])
            pages[pageid] = page

        cont = payload.get("continue")
        if not cont:
            break
        continuation = {k: v for k, v in cont.items() if k in {"continue", "gsroffset", "gsrcontinue"}}
        if not continuation:
            break
        time.sleep(0.1)

    return list(pages.values())


def site_tokens(site_name: str) -> list[str]:
    name = re.sub(r"\([^)]*\)", "", site_name.lower())
    tokens = []
    for token in re.findall(r"[a-z0-9]+", name):
        if len(token) >= 4 and token not in STOPWORDS:
            tokens.append(token)
    return list(dict.fromkeys(tokens))


def score_candidate(text_blob: str, site_words: list[str]) -> int:
    score = 0
    for keyword in POSITIVE_KEYWORDS:
        if keyword in text_blob:
            score += 3
    for keyword in NEGATIVE_KEYWORDS:
        if keyword in text_blob:
            score -= 2

    matches = sum(1 for token in site_words if token in text_blob)
    score += matches * 2

    if "reconstruction" in text_blob:
        score += 4
    if "artist impression" in text_blob or "artist's impression" in text_blob:
        score += 3
    return score


def is_reconstruction_like(text_blob: str, site_words: list[str]) -> bool:
    strong = any(term in text_blob for term in STRONG_RECON_TERMS)
    visual_hits = sum(1 for term in VISUAL_RECON_TERMS if term in text_blob)
    site_hits = sum(1 for token in site_words if token in text_blob)

    if site_hits == 0:
        return False

    if strong:
        return True

    if visual_hits >= 2:
        return True

    if "ancient" in text_blob and visual_hits >= 1:
        return True

    return False


def ext_for_candidate(candidate: Candidate) -> str:
    suffix = Path(urlparse(candidate.image_url).path).suffix.lower()
    if suffix in ALLOWED_SUFFIXES:
        return suffix
    if "jpeg" in candidate.mime or "jpg" in candidate.mime:
        return ".jpg"
    if "png" in candidate.mime:
        return ".png"
    if "webp" in candidate.mime:
        return ".webp"
    if "gif" in candidate.mime:
        return ".gif"
    return ".jpg"


def to_candidate(page: dict[str, Any], query: str, site_words: list[str], relaxed: bool = False) -> Candidate | None:
    info = (page.get("imageinfo") or [{}])[0]
    url = info.get("thumburl") or info.get("url")
    source_url = info.get("descriptionurl") or ""
    mime = info.get("mime") or ""
    if not url or not source_url or not mime.startswith("image/"):
        return None

    title = page.get("title", "").replace("File:", "").strip()
    extmeta = info.get("extmetadata") or {}
    object_name = strip_html((extmeta.get("ObjectName") or {}).get("value", ""))
    description = strip_html((extmeta.get("ImageDescription") or {}).get("value", ""))
    artist = strip_html((extmeta.get("Artist") or {}).get("value", ""))
    license_name = strip_html((extmeta.get("LicenseShortName") or {}).get("value", ""))
    credit = strip_html((extmeta.get("Credit") or {}).get("value", ""))

    text_blob = " ".join([title, object_name, description, artist, credit]).lower()
    match_blob = text_blob if not relaxed else f"{text_blob} {query.lower()}"
    score = score_candidate(match_blob, site_words)

    candidate = Candidate(
        uid=f"commons-{int(page['pageid'])}",
        title=title,
        image_url=url,
        source_url=source_url,
        mime=mime,
        score=score,
        query=query,
        object_name=object_name,
        description=description,
        artist=artist,
        license_name=license_name,
        credit=credit,
        text_blob=text_blob,
    )

    # Enforce reconstruction-heavy matches and avoid obvious modern photos.
    min_score = 8 if not relaxed else 5
    if candidate.score < min_score:
        return None
    if not is_reconstruction_like(match_blob, site_words):
        return None
    if "modern" in text_blob and "reconstruction" not in text_blob:
        return None
    if "tourist" in text_blob:
        return None
    if (not relaxed) and "photograph" in text_blob and "model" not in text_blob and "reconstruction" not in text_blob:
        return None
    return candidate


def ddgs_search(query: str, max_results: int) -> list[dict[str, Any]]:
    try:
        from ddgs import DDGS
    except Exception:  # noqa: BLE001
        return []

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            with DDGS(timeout=15) as ddgs:
                return list(ddgs.images(query, max_results=max_results))
    except Exception:  # noqa: BLE001
        return []


def ddgs_to_candidate(
    item: dict[str, Any],
    query: str,
    site_words: list[str],
    relaxed: bool = False,
) -> Candidate | None:
    title = str(item.get("title") or "").strip()
    image_url = str(item.get("thumbnail") or item.get("image") or "").strip()
    source_url = str(item.get("url") or image_url).strip()
    if not image_url:
        return None

    base_blob = " ".join([title, source_url]).lower()
    match_blob = base_blob if not relaxed else f"{base_blob} {query.lower()}"
    score = score_candidate(match_blob, site_words)
    min_score = 5 if not relaxed else 3
    if score < min_score:
        return None
    site_hits = sum(1 for token in site_words if token in base_blob)
    if site_hits == 0:
        return None
    if not is_reconstruction_like(match_blob, site_words):
        return None
    if any(bad in base_blob for bad in NEGATIVE_KEYWORDS):
        return None

    uid = "ddgs-" + hashlib.sha1(image_url.encode("utf-8")).hexdigest()[:16]
    return Candidate(
        uid=uid,
        title=title or "Web reconstruction image",
        image_url=image_url,
        source_url=source_url,
        mime="",
        score=score,
        query=query,
        object_name=title,
        description="",
        artist="",
        license_name="Unspecified (web source)",
        credit="",
        text_blob=base_blob,
    )


def short_text(text: str, max_len: int = 180) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"


def caption_for(site_name: str, candidate: Candidate) -> str:
    primary = candidate.object_name or candidate.description or candidate.title
    if not primary:
        primary = f"Reconstruction view of {site_name}"
    source_bits = []
    if candidate.artist:
        source_bits.append(f"Artist: {candidate.artist}")
    if candidate.license_name:
        source_bits.append(f"License: {candidate.license_name}")
    source_text = " | ".join(source_bits)
    if source_text:
        return f"{short_text(primary)} ({source_text})"
    return short_text(primary)


def build_queries(site_name: str) -> list[str]:
    base = re.sub(r"\([^)]*\)", "", site_name).strip()
    return [
        f"{base} reconstruction",
        f"{base} artist impression",
        f"{base} historical reconstruction",
        f"{base} digital reconstruction",
        f"{base} illustration",
        f"{base} reconstruction drawing",
        f"{base} ancient view",
    ]


def write_site_html(site_name: str, site_blurb: str, records: list[dict[str, Any]], output_dir: Path) -> None:
    cards = []
    for item in records:
        img = html.escape(item["file"])
        caption = html.escape(item["caption"])
        src = html.escape(item["source_url"])
        cards.append(
            "<figure class='card'>"
            f"<img loading='lazy' src='{img}' alt='{caption}'>"
            f"<figcaption>{caption}<br><a href='{src}' target='_blank' rel='noreferrer'>Source</a></figcaption>"
            "</figure>"
        )

    content = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(site_name)} reconstruction gallery</title>
  <style>
    :root {{
      --bg: #f6f1e8;
      --ink: #1f1f1f;
      --card: #fffdfa;
      --line: #d8ccb9;
      --link: #165c7d;
    }}
    body {{ margin: 0; font-family: "Georgia", serif; color: var(--ink); background: var(--bg); }}
    header {{ padding: 1.2rem 1rem 0.5rem; border-bottom: 1px solid var(--line); }}
    main {{ padding: 1rem; }}
    p {{ margin-top: 0.3rem; }}
    .grid {{ display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }}
    .card {{ margin: 0; border: 1px solid var(--line); background: var(--card); }}
    img {{ width: 100%; height: 170px; object-fit: cover; display: block; }}
    figcaption {{ padding: 0.6rem; font-size: 0.84rem; line-height: 1.35; }}
    a {{ color: var(--link); }}
  </style>
</head>
<body>
  <header>
    <h1>{html.escape(site_name)}</h1>
    <p>{html.escape(site_blurb)} | Reconstruction images collected for classroom browsing.</p>
    <p><a href="../index.html">Back to all sites</a></p>
  </header>
  <main>
    <div class="grid">
      {"".join(cards)}
    </div>
  </main>
</body>
</html>
"""
    (output_dir / "index.html").write_text(content, encoding="utf-8")


def process_site(
    site_index: int,
    output_root: Path,
    target: int,
    max_per_query: int,
    delay_ms: int,
    force: bool,
    relaxed: bool,
    skip_commons: bool,
) -> dict[str, Any]:
    site = SITES[site_index]
    site_dir = output_root / site.slug
    site_dir.mkdir(parents=True, exist_ok=True)
    site_deadline = time.time() + min(max(220, target * 3), 320)

    manifest_path = site_dir / "captions.json"
    if manifest_path.exists() and not force:
        with manifest_path.open("r", encoding="utf-8") as handle:
            existing = json.load(handle)
        if len(existing) >= target:
            return {"site": site.slug, "name": site.name, "downloaded": len(existing), "skipped": True}

    words = site_tokens(site.name)
    candidates: dict[str, Candidate] = {}
    used_queries = []

    if not skip_commons:
        for query in build_queries(site.name):
            if time.time() > site_deadline:
                break
            used_queries.append(query)
            for page in commons_search(query, max_results=max_per_query):
                if time.time() > site_deadline:
                    break
                candidate = to_candidate(page, query=query, site_words=words, relaxed=relaxed)
                if not candidate:
                    continue
                suffix = ext_for_candidate(candidate)
                if suffix not in ALLOWED_SUFFIXES:
                    continue
                previous = candidates.get(candidate.uid)
                if previous is None or candidate.score > previous.score:
                    candidates[candidate.uid] = candidate
            if len(candidates) >= target * 2:
                break
            if delay_ms > 0:
                time.sleep(delay_ms / 1000)

    if len(candidates) < target:
        for query in build_queries(site.name):
            if time.time() > site_deadline:
                break
            for item in ddgs_search(query, max_results=max_per_query):
                if time.time() > site_deadline:
                    break
                candidate = ddgs_to_candidate(item, query=query, site_words=words, relaxed=relaxed)
                if not candidate:
                    continue
                suffix = ext_for_candidate(candidate)
                if suffix not in ALLOWED_SUFFIXES:
                    continue
                previous = candidates.get(candidate.uid)
                if previous is None or candidate.score > previous.score:
                    candidates[candidate.uid] = candidate
            if len(candidates) >= target * 3:
                break
            if delay_ms > 0:
                time.sleep(delay_ms / 1000)

    ordered = sorted(candidates.values(), key=lambda item: (-item.score, item.title.lower()))
    records: list[dict[str, Any]] = []
    count = 0
    attempted = 0
    max_attempts = max(target * 12, target + 80)

    for candidate in ordered:
        if count >= target:
            break
        if time.time() > site_deadline:
            break
        attempted += 1
        if attempted > max_attempts:
            break
        suffix = ext_for_candidate(candidate)
        filename = f"{count + 1:03d}{suffix}"
        path = site_dir / filename
        if path.exists() and not force:
            binary = path.read_bytes()
        else:
            try:
                binary = download_binary(candidate.image_url)
            except Exception as exc:  # noqa: BLE001
                print(f"  ! failed download for {candidate.image_url}: {exc}")
                continue
            path.write_bytes(binary)
        if len(binary) < 3_000:
            path.unlink(missing_ok=True)
            continue

        record = {
            "index": count + 1,
            "file": filename,
            "caption": caption_for(site.name, candidate),
            "title": candidate.title,
            "source_url": candidate.source_url,
            "query": candidate.query,
            "score": candidate.score,
            "license": candidate.license_name,
        }
        records.append(record)
        count += 1
        if delay_ms > 0:
            time.sleep(delay_ms / 1000)

    with manifest_path.open("w", encoding="utf-8") as handle:
        json.dump(records, handle, indent=2, ensure_ascii=False)

    report = {
        "site": site.slug,
        "name": site.name,
        "region": site.region,
        "blurb": site.blurb,
        "downloaded": len(records),
        "target": target,
        "queries": used_queries,
        "timestamp": int(time.time()),
    }
    with (site_dir / "report.json").open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, ensure_ascii=False)

    write_site_html(site.name, site.blurb, records, site_dir)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="doc/sites", help="Output root directory")
    parser.add_argument("--target", type=int, default=128, help="Target image count per site")
    parser.add_argument("--start", type=int, default=1, help="1-based start index in site list")
    parser.add_argument("--end", type=int, default=len(SITES), help="1-based end index in site list")
    parser.add_argument("--max-per-query", type=int, default=120, help="Maximum results to inspect per query")
    parser.add_argument("--delay-ms", type=int, default=150, help="Delay between query groups per site")
    parser.add_argument("--force", action="store_true", help="Redownload and overwrite existing files")
    parser.add_argument("--relaxed", action="store_true", help="Use looser matching to increase yield")
    parser.add_argument("--skip-commons", action="store_true", help="Use only DDGS image search")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_root = Path(args.output)
    output_root.mkdir(parents=True, exist_ok=True)

    start = max(1, args.start)
    end = min(len(SITES), args.end)
    if end < start:
        raise SystemExit(f"Invalid range: {start}..{end}")

    reports = []
    for idx in range(start - 1, end):
        site = SITES[idx]
        print(f"[{idx + 1:02d}/{len(SITES)}] Processing {site.name} ({site.slug})")
        report = process_site(
            site_index=idx,
            output_root=output_root,
            target=args.target,
            max_per_query=args.max_per_query,
            delay_ms=args.delay_ms,
            force=args.force,
            relaxed=args.relaxed,
            skip_commons=args.skip_commons,
        )
        reports.append(report)
        print(f"  -> downloaded {report['downloaded']} images")

    batch_report = {
        "start": start,
        "end": end,
        "target": args.target,
        "sites": reports,
        "timestamp": int(time.time()),
    }
    batch_file = output_root / f"batch-{start:02d}-{end:02d}.json"
    batch_file.write_text(json.dumps(batch_report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote batch report: {batch_file}")


if __name__ == "__main__":
    main()
