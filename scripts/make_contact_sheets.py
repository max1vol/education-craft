#!/usr/bin/env python3
"""Generate contact sheets for manual visual QA."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from reconstruction_sites import SITES


def site_slice(start: int, end: int):
    start = max(1, start)
    end = min(len(SITES), end)
    for idx in range(start - 1, end):
        yield idx, SITES[idx]


def make_sheet(site_dir: Path, max_images: int = 128, cols: int = 16, cell: int = 140) -> Path | None:
    images = sorted(
        [
            p
            for p in site_dir.iterdir()
            if p.is_file()
            and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif"}
            and p.stem != "qa-contact-sheet"
        ]
    )[:max_images]
    if not images:
        return None

    rows = (len(images) + cols - 1) // cols
    pad = 10
    header = 90
    canvas = Image.new("RGB", (pad * 2 + cols * cell, header + pad * 2 + rows * cell), color=(247, 241, 229))
    draw = ImageDraw.Draw(canvas)
    draw.text((12, 12), f"{site_dir.name} - {len(images)} images", fill=(30, 30, 30))
    draw.text((12, 36), "QA sheet: thumbnails should mostly be historical reconstructions", fill=(30, 30, 30))
    draw.text((12, 60), "Numbers map to filenames in this folder", fill=(30, 30, 30))

    for i, path in enumerate(images, start=1):
        row = (i - 1) // cols
        col = (i - 1) % cols
        x = pad + col * cell
        y = header + pad + row * cell
        with Image.open(path) as img:
            img = img.convert("RGB")
            img.thumbnail((cell - 10, cell - 24))
            ix = x + (cell - img.width) // 2
            iy = y + 18 + (cell - 24 - img.height) // 2
            canvas.paste(img, (ix, iy))
        draw.rectangle((x, y, x + cell - 1, y + cell - 1), outline=(188, 172, 145), width=1)
        draw.text((x + 4, y + 2), f"{i:03d}", fill=(20, 20, 20))

    sheet_path = site_dir / "qa-contact-sheet.jpg"
    canvas.save(sheet_path, "JPEG", quality=88)
    return sheet_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default="doc/sites", help="Root output folder")
    parser.add_argument("--start", type=int, default=1, help="1-based start index")
    parser.add_argument("--end", type=int, default=len(SITES), help="1-based end index")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.root)
    for _, site in site_slice(args.start, args.end):
        site_dir = root / site.slug
        if not site_dir.exists():
            continue
        sheet = make_sheet(site_dir)
        if sheet:
            print(f"{site.slug}: {sheet}")


if __name__ == "__main__":
    main()
