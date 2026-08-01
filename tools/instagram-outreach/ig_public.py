#!/usr/bin/env python3
"""Read public Instagram profile data without an authenticated session.

Instagram serves logged-out HTTP clients an empty JS shell -- no bio, no
follower count, not even og:description -- so plain scraping returns nothing.
A headless browser renders the profile before the login wall closes over it,
and og:description plus the rendered body carry everything the outreach
pipeline needs.

This matters because the alternative was routing every lookup through the
sending account, which is what got it checkpointed. Discovery should cost the
account nothing; only sending should touch it.

    python3 ig_public.py amberkrugar someoneelse
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# "1,801 Followers, 685 Following, 168 Posts - See Instagram photos and videos
#  from Ambs (@amberkrugar)"
STATS_RE = re.compile(
    r"([\d,.KMkm]+)\s+Followers?,\s*([\d,.KMkm]+)\s+Following,\s*([\d,.KMkm]+)\s+Posts?",
    re.I,
)
NAME_RE = re.compile(r"from\s+(.+?)\s*\(@([A-Za-z0-9._]+)\)")

# Logged-out profiles inject Meta/Threads chrome before the creator's real
# bio link. Skip those so we keep linktr.ee / beacons / etc.
NOISE_HOSTS = (
    "instagram.com", "threads.com", "threads.net", "facebook.com", "fb.com",
    "meta.com", "meta.ai", "about.meta.com", "l.instagram.com",
    "help.instagram.com", "privacycenter.instagram.com",
    "accountscenter.facebook.com", "developers.facebook.com",
)
BIO_HOSTS = (
    "linktr.ee", "beacons.ai", "bio.link", "campsite.bio", "milkshake.app",
    "stan.store", "taplink.cc", "carrd.co", "lnk.bio", "solo.to",
    "allmylinks.com", "linkin.bio", "komi.io", "flowcode.com", "shor.by",
)
BIO_HOST_RE = re.compile(
    r"(?:https?://)?(?:www\.)?("
    + "|".join(re.escape(h) for h in BIO_HOSTS)
    + r")/[^\s<>\"']+",
    re.I,
)


def _pick_external(hrefs: list[str], body: str = "") -> str | None:
    """Choose the creator bio link, ignoring Meta/Threads chrome.

    Logged-out profiles often omit a real <a href> for the bio link and only
    show the host/path in body text (e.g. linktr.ee/handle). Prefer that.
    """
    for m in BIO_HOST_RE.finditer(body or ""):
        raw = m.group(0).rstrip(").,;")
        return raw if raw.startswith("http") else f"https://{raw}"

    candidates: list[str] = []
    for href in hrefs:
        if not href.startswith("http"):
            continue
        low = href.lower()
        if any(h in low for h in NOISE_HOSTS):
            continue
        candidates.append(href)
    for href in candidates:
        low = href.lower()
        if any(h in low for h in BIO_HOSTS):
            return href
    return candidates[0] if candidates else None


class _Browser:
    """One headless browser reused across a batch; launching costs ~1s."""

    def __init__(self) -> None:
        self._pw = None
        self._browser = None

    def page(self):
        from playwright.sync_api import sync_playwright

        if self._browser is None:
            self._pw = sync_playwright().start()
            self._browser = self._pw.chromium.launch()
        return self._browser.new_page(user_agent=UA)

    def close(self) -> None:
        if self._browser:
            self._browser.close()
            self._browser = None
        if self._pw:
            self._pw.stop()
            self._pw = None


BROWSER = _Browser()


def _count(raw: str) -> int:
    """Parse Instagram's abbreviated counts: '1,801', '12.4K', '3M'."""
    raw = raw.strip().replace(",", "")
    multiplier = 1
    if raw and raw[-1] in "KkMm":
        multiplier = 1_000 if raw[-1] in "Kk" else 1_000_000
        raw = raw[:-1]
    try:
        return int(float(raw) * multiplier)
    except ValueError:
        return 0


def anon_profile(username: str, settle_ms: int = 5_000) -> dict[str, Any] | None:
    """Fetch one public profile. Returns None if it is private or missing."""
    page = BROWSER.page()
    try:
        page.goto(f"https://www.instagram.com/{username}/",
                  wait_until="domcontentloaded", timeout=40_000)
        page.wait_for_timeout(settle_ms)

        og = page.get_attribute('meta[property="og:description"]', "content") or ""
        body = page.inner_text("body")

        stats = STATS_RE.search(og)
        name = NAME_RE.search(og)

        # External links render as anchors pointing off-instagram; the visible
        # text is truncated ("a.co/d/... and 2 more") so read the href.
        hrefs = page.eval_on_selector_all(
            "a[href]", "els => els.map(e => e.href)"
        )
        external = _pick_external(hrefs, body)

        if not stats and "Sorry, this page" in body:
            return None

        return {
            "username": username,
            "full_name": name.group(1).strip() if name else "",
            "followers": _count(stats.group(1)) if stats else 0,
            "following": _count(stats.group(2)) if stats else 0,
            "posts": _count(stats.group(3)) if stats else 0,
            "biography": _bio_from(body, username),
            "external_url": external,
            "is_private": "This account is private" in body,
            "is_verified": False,  # not reliably visible logged-out
            "source": "anonymous",
        }
    except Exception as e:
        print(f"  ! {username}: {type(e).__name__}", file=sys.stderr)
        return None
    finally:
        page.close()


def _bio_from(body: str, username: str) -> str:
    """Pull the bio out of the rendered body text.

    The layout runs: Log In | Sign Up | <username> | N followers | N following
    | <display name> | <username> | <bio...> | more | <links>
    so take what follows the second occurrence of the handle.
    """
    lines = [ln.strip() for ln in body.split("\n") if ln.strip()]
    hits = [i for i, ln in enumerate(lines) if ln.lower() == username.lower()]
    if len(hits) < 2:
        return ""
    tail = lines[hits[1] + 1:]
    bio: list[str] = []
    for line in tail:
        if line.lower() in {"more", "less"} or line.startswith("http"):
            break
        bio.append(line)
        if len(" ".join(bio)) > 200:
            break
    return " ".join(bio)[:200]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("usernames", nargs="+")
    ap.add_argument("--out", help="write results as JSON")
    args = ap.parse_args()

    out = []
    for name in args.usernames:
        p = anon_profile(name)
        if not p:
            print(f"  fail  {name}", file=sys.stderr)
            continue
        out.append(p)
        print(f"  ok    {p['username']:<24} {p['followers']:>6}f  "
              f"link={'yes' if p['external_url'] else 'no ':<3}  {p['biography'][:44]}",
              file=sys.stderr)
    BROWSER.close()

    if args.out:
        with open(args.out, "w") as fh:
            json.dump(out, fh, indent=2)
    else:
        print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
