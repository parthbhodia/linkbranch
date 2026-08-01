#!/usr/bin/env python3
"""Extract a creator's existing link-in-bio page into a normalized schema.

Reads a public Linktree (or generic link-in-bio) URL and emits JSON describing
the profile, theme and links, ready to be fed into cueful page creation.

Usage:
    python3 prefill.py linktr.ee/someone
    python3 prefill.py someone --out someone.json
    python3 prefill.py --batch handles.txt --out-dir pages/
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit
from html import unescape
from pathlib import Path
from typing import Any

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
TIMEOUT = 20
NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S
)
META_RE = re.compile(
    r'<meta[^>]+(?:property|name)=["\'](og:[\w:]+|description)["\'][^>]*content=["\'](.*?)["\']',
    re.I,
)
ANCHOR_RE = re.compile(r'<a[^>]+href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', re.I | re.S)
TAG_RE = re.compile(r"<[^>]+>")


# Networks whose presence in a URL means the creator is already monetizing
# via referral/affiliate links — the signal cueful's referrals table serves.
AFFILIATE_HOSTS = (
    "amzn.to", "amazon.com/dp", "shopstyle", "rstyle.me", "liketk.it",
    "ltk.app.link", "shrsl.com", "sjv.io", "pxf.io", "refersion", "awin1.com",
    "skimlinks", "magiclinks", "howl.link", "impact.com", "cj.com", "rakuten",
    "sovrn", "genius.link", "bit.ly/aff", "prf.hn", "tidd.ly",
)
AFFILIATE_PARAMS = (
    "tag=", "ref=", "aff=", "aff_id=", "affiliate", "partner=", "irclickid=",
    "clickid=", "sub_id=", "utm_campaign=affiliate", "referral",
)
CODE_PHRASES = (
    "code", "% off", "discount", "use my", "save ", "referral", "affiliate",
    "shop my", "get $", "off with", "promo", "coupon", "link to save",
)

# Affiliate density alone ranks deal-aggregator farms above real creators --
# a page that is nothing but affiliate links scores perfectly while being the
# worst possible target. Link count separates the two: genuine micro-creators
# curate a handful, aggregators dump hundreds.
CREATOR_LINK_RANGE = (5, 20)
AGGREGATOR_LINK_CAP = 40   # decay starts here rather than a cliff
AGGREGATOR_HARD_CAP = 46   # nothing above this is a person

# Recycled destinations are the real farm tell: hundreds of links behind two
# redirect roots. But the ratio is scale-free, so it cannot be applied blind --
# an Amazon affiliate creator with 10 links all on amzn.to scores 0.10 and is a
# perfectly good target. Only judge diversity once the count is large enough for
# concentration to imply automation.
DIVERSITY_MIN_LINKS = 20
DIVERSITY_FLOOR = 0.20


class ExtractError(Exception):
    """Raised when a page cannot be turned into a profile."""


class BlockedError(ExtractError):
    """Raised when the provider refuses the request rather than serving a page."""


class ClientRenderedError(ExtractError):
    """Raised when a page's links exist only after JS runs, so static HTML is empty."""


def normalize_url(raw: str) -> str:
    """Turn a handle or partial URL into a fetchable https URL.

    A bare word is assumed to be a Linktree handle, since that is the
    dominant provider and the common case for this pipeline.
    """
    raw = raw.strip().rstrip("/")
    if not raw:
        raise ExtractError("empty input")
    if raw.startswith(("http://", "https://")):
        return raw.replace("http://", "https://", 1)
    if "/" in raw or "." in raw:
        return f"https://{raw}"
    return f"https://linktr.ee/{raw}"


def fetch(url: str, retries: int = 2) -> str:
    """Fetch a URL, retrying transient failures with a short backoff."""
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise ExtractError(f"page not found ({url})") from e
            last = e
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
        if attempt < retries:
            time.sleep(1.5 * (attempt + 1))
    raise ExtractError(f"fetch failed: {last}")


class _Renderer:
    """Lazily-started headless browser, reused across pages in a batch.

    Launching Chromium costs ~1s, so a run over 60 candidates keeps one
    instance alive rather than paying that per page.
    """

    def __init__(self) -> None:
        self._pw = None
        self._browser = None

    def html(self, url: str, timeout_ms: int = 20_000) -> str:
        from playwright.sync_api import sync_playwright

        if self._browser is None:
            self._pw = sync_playwright().start()
            self._browser = self._pw.chromium.launch()

        page = self._browser.new_page(user_agent=UA)
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            try:
                # Links are the thing we came for; wait for one rather than
                # for networkidle, which these pages often never reach.
                page.wait_for_selector("a[href^='http']", timeout=8_000)
            except Exception:
                pass  # fall through and parse whatever did render
            return page.content()
        finally:
            page.close()

    def close(self) -> None:
        if self._browser is not None:
            self._browser.close()
            self._browser = None
        if self._pw is not None:
            self._pw.stop()
            self._pw = None


RENDERER = _Renderer()


def _clean(text: str) -> str:
    """Strip tags and collapse whitespace in a fragment of HTML."""
    return re.sub(r"\s+", " ", unescape(TAG_RE.sub(" ", text))).strip()


def _theme(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize a Linktree theme into a common shape.

    Linktree serves two schemas in the wild: an older one keyed on
    background/buttonStyle, and a newer one keyed on colors/fonts/mode.
    Both appear on live pages, so handle each.
    """
    if not raw:
        return {}
    if "colors" in raw:  # newer schema
        colors = raw.get("colors") or {}
        return {
            "key": raw.get("key"),
            "mode": raw.get("mode"),
            "background_color": colors.get("body"),
            "button_color": colors.get("linkBackground"),
            "button_text_color": colors.get("linkText"),
            "font": (raw.get("fonts") or {}).get("primary"),
        }
    bg = raw.get("background") or {}
    button = raw.get("buttonStyle") or {}
    return {
        "key": raw.get("key"),
        "mode": (raw.get("luminance") or "").lower() or None,
        "background_color": bg.get("color"),
        "background_type": bg.get("type"),
        "button_color": (button.get("backgroundStyle") or {}).get("color"),
        "button_corner": (button.get("cornerStyle") or {}).get("type"),
    }


def referral_signals(links: list[dict[str, Any]]) -> dict[str, Any]:
    """Score how heavily a page leans on referral / affiliate monetization.

    This is the targeting signal: cueful's referrals table (provider, offer,
    code, copy-tracking) only matters to creators already doing this by hand
    with plain links. A high score means the pitch has something to bite on.
    """
    hits: list[dict[str, str]] = []
    hosts: set[str] = set()
    coded = 0

    for link in links:
        url = (link.get("url") or "").lower()
        title = (link.get("title") or "").lower()
        reasons = []

        for host in AFFILIATE_HOSTS:
            if host in url:
                hosts.add(host)
                reasons.append(f"affiliate host: {host}")
                break
        if any(p in url for p in AFFILIATE_PARAMS):
            reasons.append("affiliate url param")
        matched_phrase = next((p for p in CODE_PHRASES if p in title), None)
        if matched_phrase:
            reasons.append(f"title phrase: {matched_phrase!r}")
            coded += 1

        if reasons:
            hits.append({"title": link.get("title", ""), "why": "; ".join(reasons)})

    total = len(links)
    density = len(hits) / (total or 1)
    # Weight density over raw count: 3-of-5 referral links is a stronger
    # signal than 3-of-40, where they're incidental rather than the point.
    base = min(100, (density * 70) + min(len(hits), 6) * 5)

    domains = {urlsplit(link["url"]).netloc.lower().removeprefix("www.") for link in links}
    diversity = len(domains) / (total or 1)

    low, high = CREATOR_LINK_RANGE
    disqualified = None
    if total >= AGGREGATOR_HARD_CAP:
        shape, disqualified = 0.0, "aggregator"
    elif total > AGGREGATOR_LINK_CAP:
        # Steep exponential decay rather than a cliff, so a high-curator sitting
        # a link or two past the cap degrades instead of vanishing.
        shape = 0.5 * math.exp(-0.644 * (total - AGGREGATOR_LINK_CAP))
    elif total > high:
        # Gentle taper between the creator range and the cap.
        shape = 1.0 - 0.5 * (total - high) / (AGGREGATOR_LINK_CAP - high)
    elif total < low:
        shape = 0.85  # thin, but plausibly a real person
    else:
        shape = 1.0

    if total > DIVERSITY_MIN_LINKS and diversity < DIVERSITY_FLOOR:
        # Catches farms the count cap misses -- e.g. a scrape that only picked
        # up 39 of a farm's links would otherwise land in the outreach queue.
        shape, disqualified = 0.0, "low_domain_diversity"

    return {
        "score": round(base * shape, 1),
        "unshaped_score": round(base, 1),
        "disqualified": disqualified,
        "unique_domains": len(domains),
        "domain_diversity": round(diversity, 2),
        # Dropped only for being over the count cap while scoring well on the
        # underlying signal -- worth auditing rather than discarding silently.
        "needs_boundary_review": bool(
            disqualified == "aggregator" and base >= 50 and total <= 48
        ),
        "referral_links": len(hits),
        "total_links": total,
        "density": round(density, 2),
        "affiliate_hosts": sorted(hosts),
        "titles_implying_codes": coded,
        "matches": hits[:8],
    }


def parse_linktree(html: str, url: str) -> dict[str, Any]:
    """Extract a profile from Linktree's embedded __NEXT_DATA__ payload."""
    m = NEXT_DATA_RE.search(html)
    if not m:
        raise ExtractError("no __NEXT_DATA__ payload — Linktree may have changed layout")
    try:
        data = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        raise ExtractError(f"malformed payload: {e}") from e

    page = data.get("page") or ""
    if page.startswith("/status"):
        raise BlockedError(f"Linktree returned {page} — back off and retry later")

    props = data.get("props", {}).get("pageProps", {})
    # Two payload shapes are live: fields nested under `account`, and the same
    # fields flattened onto pageProps. Prefer whichever actually carries links.
    nested = props.get("account") or {}
    account = nested if (nested.get("links") or nested.get("pinnedLinks")) else (props or nested)
    if not account:
        raise ExtractError("no profile in payload")

    links = []
    for item in (account.get("pinnedLinks") or []) + (account.get("links") or []):
        target = item.get("url")
        if not target:
            continue  # headers and non-navigating blocks carry no url
        links.append(
            {
                "title": (item.get("title") or "").strip(),
                "url": target,
                "position": item.get("position"),
                "type": item.get("type"),
                "thumbnail": (item.get("modifiers") or {}).get("thumbnailUrl"),
            }
        )
    links.sort(key=lambda link: (link["position"] is None, link["position"]))

    socials = [
        {"platform": s.get("type"), "url": s.get("url")}
        for s in (account.get("socialLinks") or [])
        if s.get("url")
    ]

    title = (account.get("pageTitle") or "").strip()
    return {
        "source": url,
        "provider": "linktree",
        "username": account.get("username"),
        "display_name": title.lstrip("@") or account.get("username"),
        # userGeneratedBio is Linktree's SEO filler ("X has been a member since..."),
        # not the creator's own words — keep it separate so it never renders as a bio.
        "bio": (account.get("description") or "").strip() or None,
        "generated_bio": (account.get("userGeneratedBio") or "").strip() or None,
        "avatar_url": account.get("profilePictureUrl"),
        "theme": _theme(account.get("theme") or {}),
        "links": links,
        "socials": socials,
        "referral_signals": referral_signals(links),
        "flags": {
            "unclaimed": bool(account.get("isUnclaimedAccount")),
            "inactive": not account.get("isActive", True),
            "tier": account.get("tier"),
            "sensitive": bool(account.get("isSensitive")),
            # A parked or empty page is not worth prefilling — never DM one.
            "empty": not links,
        },
    }


def parse_generic(html: str, url: str) -> dict[str, Any]:
    """Fallback for non-Linktree providers: read OG tags and outbound links.

    Deliberately conservative — it keeps only off-host links, since nav and
    footer anchors on the same host are chrome rather than the creator's links.
    """
    meta = {k.lower(): unescape(v).strip() for k, v in META_RE.findall(html)}
    host = re.sub(r"^https?://([^/]+).*$", r"\1", url).lower()

    seen: set[str] = set()
    links = []
    for href, label in ANCHOR_RE.findall(html):
        target_host = re.sub(r"^https?://([^/]+).*$", r"\1", href).lower()
        text = _clean(label)
        if not text or target_host.endswith(host) or href in seen:
            continue
        seen.add(href)
        links.append({"title": text[:120], "url": href, "position": len(links), "type": "CLASSIC"})

    if not links:
        # Most modern link-in-bio hosts (campsite.bio, beacons.ai, ...) ship a
        # JS shell with no anchors in the HTML. Returning an empty page here
        # would score 0 and silently rank a good candidate last, so refuse.
        raise ClientRenderedError(
            f"no links in static HTML for {host} — client-rendered, needs a headless fetch"
        )

    return {
        "source": url,
        "provider": host,
        "username": url.rstrip("/").rsplit("/", 1)[-1],
        "display_name": meta.get("og:title") or None,
        "bio": meta.get("og:description") or meta.get("description") or None,
        "avatar_url": meta.get("og:image"),
        "theme": {},
        "links": links,
        "socials": [],
        "referral_signals": referral_signals(links),
        "flags": {"best_effort": True, "empty": not links},
    }


def extract(raw: str, render: bool = False) -> dict[str, Any]:
    """Fetch and parse one link-in-bio page into the normalized schema.

    Args:
        raw: A handle or URL.
        render: If the static HTML turns out to be a JS shell, re-fetch it
            through a headless browser instead of giving up.
    """
    url = normalize_url(raw)
    html = fetch(url)
    if "linktr.ee" in url:
        return parse_linktree(html, url)  # server-rendered, no browser needed
    try:
        return parse_generic(html, url)
    except ClientRenderedError:
        if not render:
            raise
    profile = parse_generic(RENDERER.html(url), url)
    profile["flags"]["rendered"] = True
    return profile


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("target", nargs="?", help="Linktree handle or link-in-bio URL")
    ap.add_argument("--batch", type=Path, help="file with one handle/URL per line")
    ap.add_argument("--out", type=Path, help="write single result to this JSON file")
    ap.add_argument("--out-dir", type=Path, help="write one JSON file per target here")
    ap.add_argument("--delay", type=float, default=2.0, help="seconds between batch fetches")
    args = ap.parse_args()

    if not args.target and not args.batch:
        ap.error("give a target or --batch")

    targets: list[str] = []
    if args.target:
        targets.append(args.target)
    if args.batch:
        targets += [
            ln.strip()
            for ln in args.batch.read_text().splitlines()
            if ln.strip() and not ln.startswith("#")
        ]

    results, failures = [], []
    for i, target in enumerate(targets):
        if i:
            time.sleep(args.delay)  # stay well under anything rate-limited
        try:
            profile = extract(target)
        except ExtractError as e:
            failures.append((target, str(e)))
            print(f"  FAIL  {target}: {e}", file=sys.stderr)
            continue
        results.append(profile)
        sig = profile["referral_signals"]
        print(
            f"  ok    {profile['username']:<24} {len(profile['links']):>3} links"
            f"  referral-score {sig['score']:>5}  ({sig['referral_links']} matched)"
            f"{'  [unclaimed]' if profile['flags'].get('unclaimed') else ''}",
            file=sys.stderr,
        )
        if args.out_dir:
            args.out_dir.mkdir(parents=True, exist_ok=True)
            slug = re.sub(r"[^a-zA-Z0-9_-]", "_", profile["username"] or f"page{i}")
            (args.out_dir / f"{slug}.json").write_text(json.dumps(profile, indent=2))

    payload = results[0] if len(results) == 1 and not args.batch else results
    if args.out:
        args.out.write_text(json.dumps(payload, indent=2))
    elif not args.out_dir:
        print(json.dumps(payload, indent=2))

    if failures:
        print(f"\n{len(failures)} failed, {len(results)} ok", file=sys.stderr)
    return 1 if failures and not results else 0


if __name__ == "__main__":
    sys.exit(main())
