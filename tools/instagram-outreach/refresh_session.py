#!/usr/bin/env python3
"""Interactively refresh Instagram authentication without logging secrets."""

from __future__ import annotations

import getpass
import io
import logging
import os
import sys
from contextlib import redirect_stderr
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
IG = Path(os.environ.get("INSTAGRAM_MCP_DIR", HERE.parent / "instagram-mcp")).expanduser()
sys.path.insert(0, str(IG / "src"))

from instagrapi import Client
from instagram_mcp.client import InstagramClient
from instagram_mcp.config import get_settings


LOG = Path(os.environ.get("INSTAGRAM_SESSION_LOG", "session_refresh.log")).expanduser()


def log(message: str) -> None:
    line = f"[{datetime.now().astimezone().isoformat(timespec='seconds')}] {message}"
    print(line)
    with LOG.open("a") as handle:
        handle.write(line + "\n")


def prompt_choice() -> tuple[str, str | None]:
    while True:
        choice = input(
            "Authenticate with [1] password, [2] session ID, "
            "or paste the session ID: "
        ).strip()
        if choice in {"1", "2"}:
            return choice, None
        # Instagram session IDs begin with a numeric user id and normally
        # contain URL-encoded colons. Accepting it here avoids the confusing
        # extra prompt, but never print or log the value.
        if choice.split("%3A", 1)[0].isdigit() and "%3A" in choice:
            return "2", choice
        print("Enter 1, 2, or a complete Instagram session ID.")


def main() -> int:
    settings = get_settings()
    session_path = settings.instagram_session_file
    log("session refresh started")
    choice, pasted_session_id = prompt_choice()
    client = InstagramClient(session_file=session_path)

    try:
        if choice == "1":
            username = input(
                f"Instagram username [{settings.instagram_username}]: "
            ).strip() or settings.instagram_username
            password = getpass.getpass("Instagram password: ")
            client.login(
                username=username,
                password=password,
                verification_code_handler=lambda: input("2FA code: ").strip(),
            )
            method = "password"
        else:
            session_id = pasted_session_id or getpass.getpass(
                "Instagram session ID: "
            ).strip()
            if not session_id:
                raise ValueError("session ID cannot be empty")
            raw = Client()
            # instagrapi logs full internal tracebacks for an expected rejected
            # session. Keep terminal output concise; our redacted audit log
            # records only the outcome and exception type.
            logging.getLogger("instagrapi").setLevel(logging.CRITICAL)
            with redirect_stderr(io.StringIO()):
                raw.login_by_sessionid(session_id)
            client.client = raw
            client.save_session()
            method = "session_id"

        # login/login_by_sessionid validates the session with Instagram. Avoid
        # extra profile or feed requests immediately after authentication.
        log(f"session refresh successful method={method} file={session_path}")
        return 0
    except Exception as exc:
        log(f"session refresh failed type={type(exc).__name__}")
        print(f"Authentication failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
