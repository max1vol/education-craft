#!/usr/bin/env python3
"""Parallel-friendly image optimizer for site media assets."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def optimize_file(path: Path, max_dim: int, quality: int) -> tuple[bool, int, int]:
    suffix = path.suffix.lower()
    before = path.stat().st_size

    with Image.open(path) as src:
        img = src.copy()

    width, height = img.size
    resized = max(width, height) > max_dim
    if resized:
        scale = max_dim / float(max(width, height))
        new_size = (max(1, int(round(width * scale))), max(1, int(round(height * scale))))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    tmp = path.with_suffix(path.suffix + ".tmp")
    if suffix in {".jpg", ".jpeg"}:
        if img.mode in {"RGBA", "LA", "P"}:
            bg = Image.new("RGB", img.size, (255, 255, 255))
            alpha = img.split()[-1] if "A" in img.getbands() else None
            bg.paste(img, mask=alpha)
            img = bg
        else:
            img = img.convert("RGB")
        img.save(tmp, format="JPEG", quality=quality, optimize=True, progressive=True)
    elif suffix == ".png":
        if img.mode == "P":
            img = img.convert("RGBA")
        img.save(tmp, format="PNG", optimize=True, compress_level=6)
    elif suffix == ".webp":
        img.save(tmp, format="WEBP", quality=quality, method=6)
    else:
        return False, before, before

    after = tmp.stat().st_size
    if after >= before and not resized:
        tmp.unlink(missing_ok=True)
        return False, before, before

    tmp.replace(path)
    return True, before, path.stat().st_size


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default="static/site-media", help="Root media directory")
    parser.add_argument("--manifest", default="src/lib/data/sites-manifest.json", help="Site manifest JSON")
    parser.add_argument("--start", type=int, default=1, help="1-based start site index from manifest")
    parser.add_argument("--end", type=int, default=9999, help="1-based end site index from manifest")
    parser.add_argument("--max-dim", type=int, default=2000, help="Maximum width/height")
    parser.add_argument("--quality", type=int, default=90, help="JPEG/WebP quality")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.root)
    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))

    start = max(1, args.start)
    end = min(len(manifest), args.end)
    if end < start:
        raise SystemExit(f"Invalid range: {start}..{end}")

    scanned = 0
    changed = 0
    bytes_before = 0
    bytes_after = 0
    exts = {".jpg", ".jpeg", ".png", ".webp"}

    for index in range(start - 1, end):
        site = manifest[index]
        slug = site["slug"]
        site_dir = root / slug
        if not site_dir.exists():
            print(f"[{index + 1:02d}] {slug}: skipped (missing dir)")
            continue

        site_scanned = 0
        site_changed = 0
        for path in sorted(site_dir.iterdir()):
            if not path.is_file() or path.suffix.lower() not in exts:
                continue
            site_scanned += 1
            scanned += 1
            try:
                did_change, before, after = optimize_file(path, max_dim=args.max_dim, quality=args.quality)
            except Exception as exc:  # noqa: BLE001
                print(f"  ! {slug}/{path.name}: {exc}")
                before = path.stat().st_size
                after = before
                did_change = False
            bytes_before += before
            bytes_after += after
            if did_change:
                changed += 1
                site_changed += 1
        print(f"[{index + 1:02d}] {slug}: scanned={site_scanned} changed={site_changed}")

    reduction = 0.0
    if bytes_before:
        reduction = (bytes_before - bytes_after) * 100 / bytes_before
    print(f"TOTAL scanned={scanned} changed={changed}")
    print(f"TOTAL before={bytes_before} after={bytes_after} reduction_pct={reduction:.2f}")


if __name__ == "__main__":
    main()
