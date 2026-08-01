#!/usr/bin/env python3
"""Capped Cueful IG outreach run.

- Person gap default **10 minutes** (600s)
- Engage gap default **5 minutes** (300s)
- When the uncontacted queue is empty → public discovery + merge_pool
  (never touches the sending account for discovery)
- Sends at most one capped batch per invocation. Schedule at most once daily;
  this process does not roll into another batch or retry authentication.

  cd tools/instagram-outreach
  PYTHONUNBUFFERED=1 .venv/bin/python -u run_outreach_day.py --once-today
"""
from __future__ import annotations

import argparse
import json
import os
import random
import subprocess
import sys
import time
from datetime import datetime, time as dtime
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("OUTREACH_DATA_DIR", HERE / "data")).expanduser()
IG = Path(os.environ.get("INSTAGRAM_MCP_DIR", HERE.parent / "instagram-mcp")).expanduser()
DATA_DIR.mkdir(parents=True, exist_ok=True)
TZ = ZoneInfo("America/New_York")

CONTACTED = DATA_DIR / "contacted.json"
POOL = DATA_DIR / "pool.json"
BATCH = DATA_DIR / "outreach_day_live.json"
LOG = DATA_DIR / "outreach_day_run.log"
POTENTIAL = DATA_DIR / "potential_clients.json"

PERSON_GAP = 600  # 10 min between people
ENGAGE_GAP = 300  # 5 min between steps
BATCH_CAP = 15

# Wider niches + mid-tier creators. Rotate sets so discovery doesn't
# keep sampling the same exhausted tags.
MIN_FOLLOWERS = 500
MAX_FOLLOWERS = 50_000
MAX_LOOKUPS = 80

HASHTAG_SETS = [
    ["ugccreator", "ugccommunity", "microinfluencer", "contentcreatorlife"],
    ["momcreator", "creatortips", "brandambassador", "ugccreator"],
    ["linkinbio", "contentcreator", "microinfluencer", "ugccommunity"],
    ["ugccommunity", "creatorsearch", "ugccreator", "microinfluencer"],
    # widened
    ["beautycreator", "skincarecreator", "makeupcreator", "ugcbeauty"],
    ["fitnesscreator", "wellnesscreator", "healthcreator", "fitfluencer"],
    ["foodcreator", "recipecreator", "homecooking", "foodblogger"],
    ["travelcreator", "travelblogger", "lifestyleblogger", "lifestylecreator"],
    ["fashioncreator", "fashionblogger", "styleblogger", "outfitinspo"],
    ["naninfluencer", "nanoinfluencer", "microinfluencers", "creatorlife"],
    ["reelscreator", "instagramreels", "contentcreator", "digitalcreator"],
    ["smallbusinessowner", "etsycreator", "shopowner", "makersgonnamake"],
    ["podcastcreator", "newsletter", "substack", "writergram"],
    ["photographer", "videographer", "creativeentrepreneur", "freelancecreator"],
    ["petcreator", "dogmom", "catsofinstagram", "petinfluencer"],
    ["bookstagram", "booktok", "readingcommunity", "bookinfluencer"],
]


def log(msg: str) -> None:
    line = f"[{datetime.now(TZ).strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with LOG.open("a") as f:
        f.write(line + "\n")


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text())


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def link_count(c: dict) -> int:
    page = c.get("page") or {}
    L = page.get("links")
    if isinstance(L, list):
        return len(L)
    if isinstance(L, int):
        return L
    rs = page.get("referral_signals") or {}
    return int(rs.get("total_links") or 0)


def eligible_candidates(limit: int = BATCH_CAP) -> list[dict]:
    contacted = set(load_json(CONTACTED, []))
    pool = load_json(POOL, [])
    ranked = []
    for c in pool:
        u = c.get("username")
        if not u or u in contacted:
            continue
        ext = (c.get("external_url") or "").strip()
        n = link_count(c)
        # Prefer 2+ links, then bio http, then no-incumbent creators
        if n < 2 and not ext.startswith("http") and not c.get("no_incumbent"):
            continue
        score = (
            0 if n >= 2 else 1 if ext.startswith("http") else 2 if c.get("bio_host") else 3,
            -n,
            -(c.get("followers") or 0),
        )
        ranked.append((score, c, n))
    ranked.sort(key=lambda x: x[0])
    return [(c, n) for _, c, n in ranked[:limit]]


def build_batch(limit: int = BATCH_CAP) -> int:
    # No URLs in DMs — copy points to Instagram link in bio only.
    picked = eligible_candidates(limit)
    targets = []
    for c, n in picked:
        targets.append(
            {
                "username": c["username"],
                "followers": c.get("followers"),
                "links": n,
                "status": "pending",
                "error": None,
            }
        )
    batch = {
        "date": datetime.now(TZ).strftime("%Y-%m-%d"),
        "account": "cueful.bio",
        "cap": limit,
        "gap_seconds": PERSON_GAP,
        "engage_gap_seconds": ENGAGE_GAP,
        "targets": targets,
        "dm_cta": "link_in_bio",
    }
    save_json(BATCH, batch)
    # refresh potential clients lightly
    clients = load_json(POTENTIAL, [])
    by_u = {c.get("username"): c for c in clients if isinstance(c, dict)}
    for t in targets:
        by_u[t["username"]] = {
            **(by_u.get(t["username"]) or {}),
            "username": t["username"],
            "role": "potential_client",
            "product": "cueful",
            "status": "queued",
            "followers": t.get("followers"),
            "sending_account": "cueful.bio",
            "updated_at": datetime.now(TZ).isoformat(),
        }
    save_json(POTENTIAL, list(by_u.values()))
    log(f"built batch {BATCH.name} with {len(targets)} targets cta=link_in_bio")
    return len(targets)


def run_discovery() -> None:
    stamp = datetime.now(TZ).strftime("%Y%m%d_%H%M")
    out = HERE / f"candidates_public_day_{stamp}.json"
    tags = random.choice(HASHTAG_SETS)
    cmd = [
        sys.executable,
        str(HERE / "discover_public.py"),
        "--min-followers",
        str(MIN_FOLLOWERS),
        "--max-followers",
        str(MAX_FOLLOWERS),
        "--max-lookups",
        str(MAX_LOOKUPS),
        "--out",
        str(out),
    ]
    for t in tags:
        cmd.extend(["--hashtag", t])
    log(f"discovery start tags={tags} out={out.name}")
    subprocess.run(cmd, cwd=str(HERE), check=False)
    subprocess.run(
        [sys.executable, str(HERE / "merge_pool.py")],
        cwd=str(DATA_DIR),
        check=False,
    )
    pool = load_json(POOL, [])
    log(f"discovery done pool_size={len(pool)}")


def run_send() -> int:
    """Run send_outreach.py; return its exit code."""
    cmd = [
        os.environ.get("INSTAGRAM_MCP_PYTHON", str(IG / ".venv/bin/python")),
        "-u",
        str(HERE / "send_outreach.py"),
        "--batch",
        str(BATCH),
        "--gap-seconds",
        str(PERSON_GAP),
        "--engage-gap-seconds",
        str(ENGAGE_GAP),
        "--cap",
        str(BATCH_CAP),
    ]
    log(
        f"send start gap={PERSON_GAP}s engage={ENGAGE_GAP}s "
        f"cap={BATCH_CAP} batch={BATCH.name}"
    )
    env = {"PYTHONUNBUFFERED": "1", "PATH": str(Path.cwd())}
    import os

    full_env = os.environ.copy()
    full_env["PYTHONUNBUFFERED"] = "1"
    proc = subprocess.run(cmd, cwd=str(IG), env=full_env)
    log(f"send exit={proc.returncode}")
    return proc.returncode


def pending_in_batch() -> int:
    data = load_json(BATCH, {"targets": []})
    return sum(1 for t in data.get("targets") or [] if t.get("status") == "pending")


def until_end_of_day() -> datetime:
    now = datetime.now(TZ)
    return datetime.combine(now.date(), dtime(23, 59, 59), TZ)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Cueful IG outreach day/24-7 runner")
    p.add_argument(
        "--once-today",
        action="store_true",
        help="Stop at end of today (ET) instead of running 24/7",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    continuous = not args.once_today
    end = until_end_of_day()
    mode = "24/7 continuous" if continuous else f"until {end.isoformat()}"
    log(f"day runner start mode={mode} person_gap={PERSON_GAP}s engage_gap={ENGAGE_GAP}s")
    auth_fails = 0

    while True:
        now = datetime.now(TZ)
        if now >= end:
            if not continuous:
                log("day runner finished (reached end of day)")
                return 0
            log("calendar day rolled — continuing 24/7")
            time.sleep(5)
            end = until_end_of_day()
            continue

        # Prefer finishing an existing pending batch
        if not BATCH.exists() or pending_in_batch() == 0:
            n = build_batch()
            if n == 0:
                log("queue empty — running public discovery")
                run_discovery()
                n = build_batch()
                if n == 0:
                    log("still empty after discovery — sleep 5m then retry")
                    time.sleep(5 * 60)
                    continue

        code = run_send()
        if code == 0:
            log(
                f"daily capped run complete; pending={pending_in_batch()} — exiting"
            )
            return 0
        if code == 3:
            log("auth/checkpoint stop — exiting without retry")
            return 3
        if code == 2:
            log("auth failed at start — exiting without retry")
            return 2
        log(f"unexpected send exit {code} — sleep 5m")
        time.sleep(5 * 60)


if __name__ == "__main__":
    raise SystemExit(main())
