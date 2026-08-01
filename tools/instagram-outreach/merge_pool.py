#!/usr/bin/env python3
"""Merge discovery runs into one deduped outreach pool.

Every candidates*.json is folded into pool.json, keyed on username, with
anyone in contacted.json removed. Double-messaging a creator is the one
mistake that turns outreach into harassment, so the exclusion is applied
here rather than left to whoever is reading the files.

    python3 merge_pool.py
"""

from __future__ import annotations

import glob
import json
import os
from pathlib import Path

HERE = Path(os.environ.get("OUTREACH_DATA_DIR", Path(__file__).resolve().parent / "data")).expanduser()
HERE.mkdir(parents=True, exist_ok=True)


def load(path: Path, default):
    """Read a JSON file, tolerating absence."""
    return json.loads(path.read_text()) if path.exists() else default


def main() -> int:
    contacted = set(load(HERE / "contacted.json", []))
    pool: list[dict] = []
    seen: set[str] = set()
    per_file: dict[str, int] = {}

    for path in sorted(HERE.glob("candidates*.json")):
        added = 0
        for c in load(path, []):
            username = c.get("username")
            if not username or username in seen or username in contacted:
                continue
            if c.get("is_private") or c.get("is_verified"):
                continue
            seen.add(username)
            c.setdefault("source_file", path.name)
            pool.append(c)
            added += 1
        per_file[path.name] = added

    # Scored candidates first, then the no-incumbent bucket by reach.
    pool.sort(key=lambda c: (c.get("fit_score") is None,
                             -(c.get("fit_score") or 0),
                             -c.get("followers", 0)))
    (HERE / "pool.json").write_text(json.dumps(pool, indent=2))

    incumbent = [c for c in pool if not c.get("no_incumbent")]
    fresh = [c for c in pool if c.get("no_incumbent")]

    for name, n in per_file.items():
        print(f"  {name:<32} +{n}")
    print(f"\npool.json: {len(pool)} uncontacted candidates")
    print(f"  has a link page : {len(incumbent)}  (claim-draft pitch applies)")
    print(f"  no incumbent    : {len(fresh)}  (cheapest ask)")
    print(f"  excluded as already contacted: {len(contacted)}")
    if incumbent:
        print("\n  top by fit:")
        for c in incumbent[:5]:
            print(f"    {c.get('fit_score') or 0:>5}  {c['username']:<24} "
                  f"{c.get('followers', 0):>5}f  {c.get('bio_host', '')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
