#!/usr/bin/env python3
"""
Writes a small WebP next to every quiz cover: public/images/quizzes/thumbs/<name>.webp

WHY
The drawn covers are 1408px PNGs of 300 KB to 7 MB. The app lists hundreds of
quizzes; fetching the originals for a card that is a few hundred pixels wide is
what made the quiz page slow. The API hands the app the thumbnail path
(`quizThumbnailUrl` in src/lib/quiz-image.ts) and the app falls back to the
original if a thumbnail is missing, so a cover drawn later still shows - it is
just heavy until this script has run again.

USAGE
  python3 scripts/generate-quiz-thumbnails.py          # only what is missing
  python3 scripts/generate-quiz-thumbnails.py --all    # redo everything
Needs Pillow with WebP support.
"""
import sys
from pathlib import Path

from PIL import Image

WIDTH = 800
QUALITY = 78

root = Path(__file__).resolve().parent.parent / "public" / "images" / "quizzes"
out = root / "thumbs"
out.mkdir(exist_ok=True)

redo = "--all" in sys.argv
written = 0
for source in sorted(root.glob("*.png")):
    target = out / f"{source.stem}.webp"
    if target.exists() and not redo:
        continue
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.width > WIDTH:
            height = round(image.height * WIDTH / image.width)
            image = image.resize((WIDTH, height), Image.LANCZOS)
        image.save(target, "WEBP", quality=QUALITY, method=6)
    written += 1

print(f"{written} thumbnail(s) written to {out}")
