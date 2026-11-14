"""Compare an SEO crawl against the baseline. Exit 1 on any difference.

Usage:
  BASE=https://<preview-url> python3 scripts/seo/crawl.py /tmp/after
  python3 scripts/seo/compare.py scripts/seo/baseline-2026-11-13.json.gz /tmp/after.json

Pages are matched by path, so a preview deploy can be compared with production.
`text_hash` and `bytes` are reported but not counted as failures (quiz of the
day, leaderboards etc. change daily).
"""
import gzip, json, sys
from urllib.parse import urlparse

STRICT = ["status", "location", "title", "description", "canonical", "robots",
          "og_locale", "og_title", "html_lang", "hreflang", "h1", "jsonld_types"]

def load(p):
    op = gzip.open if p.endswith(".gz") else open
    with op(p, "rt", encoding="utf-8") as f:
        return {urlparse(r["url"]).path.rstrip("/") or "/": r for r in json.load(f)}

base, after = load(sys.argv[1]), load(sys.argv[2])
fails = 0
for path in sorted(set(base) | set(after)):
    a, b = base.get(path), after.get(path)
    if not a or not b:
        print(("MISSING " if not b else "NEW     ") + path); fails += 1; continue
    for k in STRICT:
        va, vb = a.get(k, ""), b.get(k, "")
        if k == "canonical":
            va, vb = urlparse(va).path, urlparse(vb).path
        if va != vb:
            print(f"DIFF    {path} [{k}]\n  before: {va}\n  after:  {vb}"); fails += 1
print(f"\n{len(base)} pages in baseline, {len(after)} crawled, {fails} differences")
sys.exit(1 if fails else 0)
