#!/usr/bin/env python3
"""Remove non-reconstruction images by index and renumber the site gallery."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from fetch_reconstruction_images import write_site_html
from reconstruction_sites import SITES


def parse_indices(raw: str) -> set[int]:
    indices: set[int] = set()
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            start = int(a)
            end = int(b)
            for i in range(min(start, end), max(start, end) + 1):
                indices.add(i)
        else:
            indices.add(int(part))
    return indices


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default="doc/sites", help="Root sites directory")
    parser.add_argument("--site", required=True, help="Site slug")
    parser.add_argument(
        "--remove",
        required=True,
        help="Indices to remove, e.g. 3,8,14-17",
    )
    args = parser.parse_args()

    site_dir = Path(args.root) / args.site
    captions_path = site_dir / "captions.json"
    if not captions_path.exists():
        raise SystemExit(f"Missing captions file: {captions_path}")

    captions = json.loads(captions_path.read_text(encoding="utf-8"))
    remove = parse_indices(args.remove)
    keep = [row for row in captions if int(row.get("index", 0)) not in remove]

    staged_rows = []
    for row in captions:
        old_idx = int(row.get("index", 0))
        old_name = row.get("file", "")
        old_path = site_dir / old_name
        if old_idx in remove:
            if old_path.exists():
                old_path.unlink()
            continue
        if not old_path.exists():
            continue
        tmp_name = f"tmp-{old_name}"
        tmp_path = site_dir / tmp_name
        old_path.rename(tmp_path)
        row["file"] = tmp_name
        staged_rows.append(row)

    rebuilt = []
    for new_idx, row in enumerate(staged_rows, start=1):
        tmp_name = row["file"]
        old_ext = Path(tmp_name).suffix.lower() or ".jpg"
        tmp_path = site_dir / tmp_name
        if not tmp_path.exists():
            continue
        new_name = f"{new_idx:03d}{old_ext}"
        tmp_path.rename(site_dir / new_name)
        row["index"] = new_idx
        row["file"] = new_name
        rebuilt.append(row)

    captions_path.write_text(json.dumps(rebuilt, indent=2, ensure_ascii=False), encoding="utf-8")
    site = next((item for item in SITES if item.slug == args.site), None)
    if site:
        write_site_html(site.name, site.blurb, rebuilt, site_dir)
    print(f"{args.site}: kept {len(rebuilt)} images after removing {len(remove)} requested indices")


if __name__ == "__main__":
    main()
