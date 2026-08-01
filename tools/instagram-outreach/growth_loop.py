#!/usr/bin/env python3
"""Continuously replenish the queue and optionally run one capped send daily."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("OUTREACH_DATA_DIR", HERE / "data")).expanduser()
DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE = DATA_DIR / "growth_loop_state.json"
LOG = DATA_DIR / "growth_loop.log"
TZ = ZoneInfo(os.environ.get("OUTREACH_TIMEZONE", "America/New_York"))
DISCOVERY_INTERVAL = int(os.environ.get("OUTREACH_DISCOVERY_INTERVAL", "21600"))
SEND_HOUR = int(os.environ.get("OUTREACH_SEND_HOUR", "10"))
ENABLE_SEND = os.environ.get("OUTREACH_ENABLE_SEND") == "1"
TAGS = os.environ.get(
    "OUTREACH_HASHTAGS",
    "ugccreator,microinfluencer,contentcreatorlife,momcreator",
).split(",")


def log(message: str) -> None:
    line = f"[{datetime.now(TZ).isoformat(timespec='seconds')}] {message}"
    print(line, flush=True)
    with LOG.open("a") as handle:
        handle.write(line + "\n")


def run(command: list[str]) -> int:
    return subprocess.run(command, cwd=DATA_DIR, check=False).returncode


def load_state() -> dict:
    if not STATE.exists():
        return {}
    return json.loads(STATE.read_text())


def save_state(state: dict) -> None:
    STATE.write_text(json.dumps(state, indent=2) + "\n")


def discover() -> None:
    stamp = datetime.now(TZ).strftime("%Y%m%d_%H%M%S")
    command = [
        sys.executable,
        str(HERE / "discover_public.py"),
        "--min-followers", "200",
        "--max-followers", "10000",
        "--max-lookups", "40",
        "--out", str(DATA_DIR / f"candidates_public_{stamp}.json"),
    ]
    for tag in TAGS:
        if tag.strip():
            command.extend(["--hashtag", tag.strip()])
    log("public discovery started")
    code = run(command)
    if code == 0:
        code = run([sys.executable, str(HERE / "merge_pool.py")])
    log(f"public discovery finished exit={code}")


def main() -> int:
    log(f"growth loop started send_enabled={ENABLE_SEND}")
    while True:
        state = load_state()
        now = datetime.now(TZ)
        last_discovery = float(state.get("last_discovery_epoch", 0))
        if time.time() - last_discovery >= DISCOVERY_INTERVAL:
            discover()
            state["last_discovery_epoch"] = time.time()
            save_state(state)

        today = now.date().isoformat()
        if ENABLE_SEND and now.hour >= SEND_HOUR and state.get("last_send_date") != today:
            log("daily capped send started")
            code = run([sys.executable, str(HERE / "run_outreach_day.py"), "--once-today"])
            # Record the attempt even when blocked so the daemon never retries
            # an authentication/checkpoint failure on the same day.
            state["last_send_date"] = today
            state["last_send_exit"] = code
            save_state(state)
            log(f"daily capped send finished exit={code}")

        time.sleep(60)


if __name__ == "__main__":
    raise SystemExit(main())
