#!/usr/bin/env python3
"""Build a browsable index for site reconstruction galleries."""

from __future__ import annotations

import html
import json
from pathlib import Path
from typing import Any

from reconstruction_sites import SITES


def load_json(path: Path) -> Any:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def build_index(output_root: Path) -> None:
    cards = []
    site_entries = []

    for site in SITES:
        site_dir = output_root / site.slug
        captions = load_json(site_dir / "captions.json") or []
        count = len(captions)
        thumb = captions[0]["file"] if captions else None
        thumb_html = (
            f"<img loading='lazy' src='{html.escape(site.slug)}/{html.escape(thumb)}' alt='{html.escape(site.name)} thumbnail'>"
            if thumb
            else "<div class='placeholder'>No images yet</div>"
        )
        cards.append(
            "<article class='card'>"
            f"<a href='{html.escape(site.slug)}/index.html'>"
            f"{thumb_html}"
            f"<h2>{html.escape(site.name)}</h2>"
            f"<p>{html.escape(site.region)} | {count} images</p>"
            "</a>"
            "</article>"
        )
        site_entries.append(
            {
                "slug": site.slug,
                "name": site.name,
                "region": site.region,
                "blurb": site.blurb,
                "count": count,
            }
        )

    total_images = sum(item["count"] for item in site_entries)
    html_doc = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Historical Site Reconstructions</title>
  <style>
    :root {{
      --bg: #f4ede2;
      --ink: #241f1a;
      --card: #fff9ef;
      --line: #d8c9b5;
      --link: #1b5d77;
    }}
    body {{ margin: 0; background: var(--bg); color: var(--ink); font-family: "Georgia", serif; }}
    header {{ padding: 1.2rem 1rem 0.8rem; border-bottom: 1px solid var(--line); }}
    main {{ padding: 1rem; }}
    .grid {{ display: grid; gap: 0.9rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }}
    .card {{ border: 1px solid var(--line); background: var(--card); }}
    .card a {{ color: inherit; text-decoration: none; display: block; }}
    img, .placeholder {{ display: block; width: 100%; height: 150px; object-fit: cover; background: #efe4d2; }}
    .placeholder {{ padding: 1rem; font-size: 0.9rem; }}
    h2 {{ margin: 0.7rem 0.7rem 0.2rem; font-size: 1.02rem; line-height: 1.25; }}
    p {{ margin: 0 0.7rem 0.8rem; font-size: 0.84rem; }}
    a {{ color: var(--link); }}
  </style>
</head>
<body>
  <header>
    <h1>Historical Site Reconstructions</h1>
    <p>64 locations including all Seven Wonders of the Ancient World.</p>
    <p>Total images downloaded: {total_images}</p>
  </header>
  <main>
    <div class="grid">
      {"".join(cards)}
    </div>
  </main>
</body>
</html>
"""

    output_root.mkdir(parents=True, exist_ok=True)
    (output_root / "index.html").write_text(html_doc, encoding="utf-8")
    (output_root / "manifest.json").write_text(json.dumps(site_entries, indent=2), encoding="utf-8")


def main() -> None:
    build_index(Path("doc/sites"))


if __name__ == "__main__":
    main()
