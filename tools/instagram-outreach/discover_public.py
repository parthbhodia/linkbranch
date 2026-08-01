#!/usr/bin/env python3
"""Discover Cueful outreach candidates without touching the sending account.

Hashtag sampling and profile lookups run through a logged-out Playwright
browser (see ig_public.py). Link-in-bio pages are scored with prefill.py.
Nothing here loads instagrapi, .instagram_session, or just_bod.

    .venv/bin/python discover_public.py \
        --hashtag ugccreator --hashtag microinfluencer \
        --min-followers 200 --max-followers 10000 \
        --out candidates_public.json

Then fold into the outreach pool (excludes contacted.json automatically):

    .venv/bin/python merge_pool.py
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
from pathlib import Path
from typing import Any

import ig_public
import prefill

BIO_HOSTS = (
    "linktr.ee", "beacons.ai", "bio.link", "campsite.bio", "milkshake.app",
    "stan.store", "taplink.cc", "carrd.co", "lnk.bio", "solo.to",
    "allmylinks.com", "linkin.bio", "komi.io", "flowcode.com", "shor.by",
)

DEAL_HANDLE_MARKERS = (
    "deal", "deals", "coupon", "promo", "discount", "clearance", "bargain",
    "savings", "freebie", "freebies", "offers", "steals", "dailydeals",
)
DEAL_BIO_PHRASES = (
    "couponer", "deal hunter", "clearance hunter", "daily deals", "deals daily",
    "affiliate links", "all links are affiliate", "commission on", "i earn a",
    "deal sharer", "sharing deals",
)

# Paths / reserved names that show up as /username/ links on explore pages.
IG_RESERVED = {
    "explore", "reels", "accounts", "p", "reel", "stories", "direct", "about",
    "legal", "developer", "directory", "web", "blog", "popular", "tags",
    "nametag", "graphql", "api", "static", "challenge", "session", "privacy",
    "terms", "emails", "push", "lite", "tv", "igtv", "locations", "guide",
}


def deal_account_reason(username: str, bio: str = "") -> str | None:
    """Identify automated deal accounts from cheap signals, or None."""
    name = (username or "").lower()
    for marker in DEAL_HANDLE_MARKERS:
        if re.search(rf"(?:^|[^a-z]){marker}(?:[^a-z]|$)", name):
            return f"handle marker {marker!r}"
    low = (bio or "").lower()
    phrase = next((p for p in DEAL_BIO_PHRASES if p in low), None)
    return f"bio phrase {phrase!r}" if phrase else None


def nap(low: float, high: float) -> None:
    time.sleep(random.uniform(low, high))


def bio_host(url: str | None) -> str | None:
    if not url:
        return None
    low = url.lower()
    return next((h for h in BIO_HOSTS if h in low), None)


def collect_from_hashtag(tag: str, settle_ms: int = 6_000) -> list[str]:
    """Scrape distinct poster handles from a public hashtag explore page."""
    page = ig_public.BROWSER.page()
    seen: list[str] = []
    try:
        page.goto(
            f"https://www.instagram.com/explore/tags/{tag}/",
            wait_until="domcontentloaded",
            timeout=40_000,
        )
        page.wait_for_timeout(settle_ms)
        # Scroll once so more tiles load before the login wall.
        page.mouse.wheel(0, 2400)
        page.wait_for_timeout(2_000)

        hrefs = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
        for href in hrefs:
            m = re.search(r"instagram\.com/([A-Za-z0-9._]+)/?(?:\?|$)", href)
            if not m:
                continue
            name = m.group(1)
            if name.lower() in IG_RESERVED or name.startswith("tags"):
                continue
            if name not in seen:
                seen.append(name)
    except Exception as e:
        print(f"  ! #{tag}: {type(e).__name__}: {str(e)[:90]}", file=sys.stderr)
    finally:
        page.close()
    return seen


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("--hashtag", action="append", default=[], help="repeatable")
    ap.add_argument(
        "--seeds",
        type=Path,
        help="file of usernames (one per line); skips hashtag sampling if alone",
    )
    ap.add_argument("--min-followers", type=int, default=200)
    ap.add_argument("--max-followers", type=int, default=10_000)
    ap.add_argument("--max-lookups", type=int, default=40, help="hard cap on profile fetches")
    ap.add_argument("--out", type=Path, default=Path("candidates_public.json"))
    ap.add_argument("--fast", action="store_true", help="shorter delays between profile pages")
    args = ap.parse_args()
    if not args.hashtag and not args.seeds:
        ap.error("give --seeds and/or at least one --hashtag")

    lo, hi = (2.0, 4.0) if args.fast else (3.5, 6.5)
    log = lambda m: print(m, file=sys.stderr, flush=True)  # noqa: E731

    log(
        "public discovery — no IG session, no instagrapi, "
        f"{args.min_followers}-{args.max_followers} followers, "
        f"max {args.max_lookups} lookups"
    )

    candidates: list[str] = []
    if args.seeds:
        for line in args.seeds.read_text().splitlines():
            name = line.strip().lstrip("@").rsplit("/", 1)[-1]
            if name and not name.startswith("#") and name not in candidates:
                candidates.append(name)
        log(f"{len(candidates)} seeds loaded from {args.seeds}")

    for tag in args.hashtag:
        names = collect_from_hashtag(tag.lstrip("#"))
        log(f"  #{tag.lstrip('#')}: {len(names)} distinct handles")
        for name in names:
            if name not in candidates:
                candidates.append(name)
        nap(2.0, 4.0)

    pre_blocked = [(n, r) for n in candidates if (r := deal_account_reason(n))]
    if pre_blocked:
        blocked = {n for n, _ in pre_blocked}
        candidates = [n for n in candidates if n not in blocked]
        for name, reason in pre_blocked[:8]:
            log(f"  - {name:<24} pre-filtered: {reason}")

    log(f"\n{len(candidates)} accounts after pre-filter; inspecting up to {args.max_lookups}\n")

    # Phase 1: IG profiles via one Playwright (ig_public). Must finish and close
    # before prefill starts another sync Playwright — two at once crashes.
    kept: list[dict[str, Any]] = []
    skipped = {
        "private": 0, "too_big": 0, "too_small": 0, "error": 0,
        "deal_bio": 0, "aggregator": 0, "deal_handle": len(pre_blocked),
    }

    for name in candidates[: args.max_lookups]:
        nap(lo, hi)
        p = ig_public.anon_profile(name)
        if not p:
            skipped["error"] += 1
            continue
        if p.get("is_private"):
            skipped["private"] += 1
            continue
        if p.get("followers", 0) > args.max_followers or p.get("is_verified"):
            skipped["too_big"] += 1
            continue
        if p.get("followers", 0) < args.min_followers:
            skipped["too_small"] += 1
            continue

        bio_reason = deal_account_reason(p["username"], p.get("biography") or "")
        if bio_reason and bio_reason.startswith("bio phrase"):
            skipped["deal_bio"] += 1
            log(f"  - {p['username']:<22} filtered: {bio_reason}")
            continue

        host = bio_host(p.get("external_url"))
        p["bio_host"] = host
        p["is_business"] = False  # not visible logged-out
        p["category"] = ""
        kept.append(p)
        if host:
            log(f"  ~ {p['username']:<22} {p['followers']:>6} followers  {host}")
        else:
            log(
                f"  ~ {p['username']:<22} {p['followers']:>6} followers  "
                f"(no link page)"
            )

    ig_public.BROWSER.close()

    # Phase 2: score link-in-bio pages (separate Playwright via prefill).
    log(f"\nscoring {sum(1 for c in kept if c.get('bio_host'))} link pages\n")
    scored: list[dict[str, Any]] = []
    for p in kept:
        host = p.get("bio_host")
        if not host:
            p["fit_score"] = None
            p["no_incumbent"] = True
            scored.append(p)
            log(
                f"  + {p['username']:<22} {p['followers']:>6} followers  "
                f"{'(no link page)':<14} no incumbent"
            )
            continue

        try:
            page = prefill.extract(p["external_url"], render=True)
            p["page"] = {
                "links": len(page["links"]),
                "empty": page["flags"].get("empty"),
                "referral_signals": page["referral_signals"],
            }
            p["fit_score"] = page["referral_signals"]["score"]
            if page["referral_signals"]["disqualified"]:
                skipped["aggregator"] += 1
                log(
                    f"  - {p['username']:<22} disqualified: "
                    f"{page['referral_signals']['total_links']} links (aggregator)"
                )
                continue
        except prefill.ExtractError as e:
            p["page"] = {"error": str(e)}
            p["fit_score"] = None
            p["needs_review"] = True

        scored.append(p)
        sig = (p.get("page") or {}).get("referral_signals", {})
        fit = "  n/a" if p["fit_score"] is None else f"{p['fit_score']:>5}"
        log(
            f"  + {p['username']:<22} {p['followers']:>6} followers  {host:<14}"
            f" fit {fit}  ({sig.get('referral_links', 0)} referral links)"
            f"{'  [unparsed]' if p.get('needs_review') else ''}"
        )
        nap(1.0, 2.5)

    kept = scored
    prefill.RENDERER.close()

    kept.sort(
        key=lambda c: (c["fit_score"] is None, -(c["fit_score"] or 0), -c["followers"])
    )
    args.out.write_text(json.dumps(kept, indent=2))

    two_plus = [
        c for c in kept
        if not c.get("no_incumbent")
        and ((c.get("page") or {}).get("links") or 0) >= 2
    ]
    log(f"\n{len(kept)} candidates -> {args.out}")
    log(f"  2+ links on bio page: {len(two_plus)}")
    log(f"skipped: {', '.join(f'{k}={v}' for k, v in skipped.items() if v)}")
    if kept:
        log("\ntop by fit:")
        for c in kept[:10]:
            fit = " n/a" if c["fit_score"] is None else f"{c['fit_score']:>5}"
            log(
                f"  {fit}  {c['username']:<22} {c['followers']:>6}f  "
                f"{(c.get('biography') or '')[:52]}"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
