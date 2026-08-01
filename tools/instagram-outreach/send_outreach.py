#!/usr/bin/env python3
"""Cueful Instagram outreach sender (durable).

Defaults / safety
-----------------
- Between people: **120 seconds (2 minutes)** via ``--gap-seconds``.
- Between engagement steps (follow / story / comment / DM): **120 seconds
  (2 minutes)** via ``--engage-gap-seconds``, with ±30s jitter so timing
  is not a metronome.
- Copy: large pools of unique DM, story-reply, and post-comment templates.
  Comments never include URLs (spam signal). Claim links only in DM (and
  optionally soft story replies).
- Stops on checkpoint / login_required / feedback_required.
- Do NOT run while just_bod is suspended/challenged. Never print passwords.

Usage
-----
  python send_outreach.py --batch outreach_20260729.json
  python send_outreach.py --batch outreach_YYYYMMDD.json --gap-seconds 120 \\
      --engage-gap-seconds 120 --cap 15
"""
from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("OUTREACH_DATA_DIR", HERE / "data")).expanduser()
IG = Path(os.environ.get("INSTAGRAM_MCP_DIR", HERE.parent / "instagram-mcp")).expanduser()
DATA_DIR.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(IG / "src"))

from instagrapi.exceptions import (  # noqa: E402
    ChallengeRequired,
    FeedbackRequired,
    LoginRequired,
)
from instagram_mcp.client import InstagramClient  # noqa: E402
from instagram_mcp.config import get_settings  # noqa: E402

CONTACTED = DATA_DIR / "contacted.json"
DEFAULT_GAP_SEC = 600  # 10 minutes between people
DEFAULT_ENGAGE_GAP_SEC = 300  # 5 minutes between actions
DEFAULT_CAP = 15

# ---------------------------------------------------------------------------
# Message pools — keep distinct wording. Do NOT put URLs in DMs (IG spam
# filter blocks cueful.bio / short links). Point people to link in bio only.
# ---------------------------------------------------------------------------

DM_TEMPLATES: list[tuple[str, str]] = [
    (
        "A",
        "hey! noticed youve got a few things in your bio but ig only shows the first "
        "link. i made cueful so creators can put everything on one free page. "
        "link in bio if you wanna check it",
    ),
    (
        "B",
        "hi! your other bio links basically get buried. cueful keeps them all in one "
        "spot and its free. link in bio",
    ),
    (
        "C",
        "quick thing, ig only surfaces one bio link so the rest kinda disappear. "
        "i built cueful for that. link in bio if you wanna peek",
    ),
    (
        "D",
        "hey! saw how many links youre juggling. cueful is a free page i made for "
        "creators so nothing gets lost. link in bio",
    ),
    (
        "E",
        "ig hides every bio link after the first which is annoying when youve got a "
        "real stack. cueful puts them on one free page. link in bio",
    ),
    (
        "F",
        "hey i made a free multi link page for creators called cueful. curious if it "
        "beats the usual bio setup for you. link in bio if useful",
    ),
    (
        "G",
        "small thing, people only see your first bio link. cueful keeps the full "
        "list on one page and its free. link in bio",
    ),
    (
        "H",
        "hi! if half your links never get clicked because ig buries them, cueful "
        "fixes that. free to try, link in bio",
    ),
    (
        "I",
        "hey, creator here. i made cueful so multiple bio links dont get lost. "
        "free if you want it, link in bio",
    ),
    (
        "J",
        "noticed your bio has more going on than ig will show. cueful is one free "
        "page for all of it. link in bio",
    ),
    (
        "K",
        "quick share, cueful keeps every link in one place instead of burying them "
        "after igs first slot. link in bio",
    ),
    (
        "L",
        "hey! built a free link page for creators (cueful). no pressure, just "
        "sharing in case it helps. link in bio",
    ),
]

# Story replies: soft human notes only (no URLs).
STORY_TEMPLATES: list[tuple[str, str]] = [
    ("S1", "this is such a vibe love it"),
    ("S2", "okay this looks amazing"),
    ("S3", "saving this energy for later"),
    ("S4", "you always post the good stuff"),
    ("S5", "this made me stop scrolling"),
    ("S6", "love the vibe here"),
    ("S7", "so clean great shot"),
    ("S8", "this is fire"),
    ("S9", "loved this"),
    ("S10", "this was great"),
    ("S11", "cute story keep going"),
    ("S12", "really nice thanks for sharing"),
]

# Post comments: NEVER include URLs. Pure unique reactions.
COMMENT_TEMPLATES: list[tuple[str, str]] = [
    ("C1", "this looks so good"),
    ("C2", "love the lighting here"),
    ("C3", "okay i needed this inspo"),
    ("C4", "the vibe is immaculate"),
    ("C5", "saving this one"),
    ("C6", "so clean and aesthetic"),
    ("C7", "you crushed this"),
    ("C8", "this is such a mood"),
    ("C9", "obsessed with this look"),
    ("C10", "really well done"),
    ("C11", "the composition is chef kiss"),
    ("C12", "this made my day a little better"),
    ("C13", "love how this turned out"),
    ("C14", "such a strong post"),
    ("C15", "instant favorite"),
    ("C16", "the details here are everything"),
    ("C17", "wow this is beautiful"),
    ("C18", "need more content like this"),
]


class TemplatePicker:
    """Random pick from a pool, avoiding immediate repeat of the same id."""

    def __init__(self, templates: list[tuple[str, str]]) -> None:
        if not templates:
            raise ValueError("template pool is empty")
        self.templates = list(templates)
        self._last_id: str | None = None

    def pick(self, _unused: str = "") -> tuple[str, str]:
        choices = [t for t in self.templates if t[0] != self._last_id]
        if not choices:
            choices = self.templates
        vid, tmpl = random.choice(choices)
        self._last_id = vid
        text = tmpl
        # strip leftover placeholders / blocked domains if any legacy templates slip in
        text = text.replace("{link}", "link in bio").replace("{claim}", "link in bio")
        text = text.replace("—", ",").replace("–", ",")
        for blocked in (
            "https://shorthtml.win",
            "http://shorthtml.win",
            "https://cueful.bio",
            "http://cueful.bio",
            "shorthtml.win",
            "cueful.bio",
        ):
            text = text.replace(blocked, "link in bio")
        return vid, text


def reply_to_story(cl, user_id: str, story_pk: str, text: str) -> dict:
    """Reply to a user's story via direct reel_share (story reply)."""
    token = cl.generate_mutation_token()
    media_id = cl.media_id(story_pk)
    data = {
        "recipient_users": json.dumps([[int(user_id)]]),
        "action": "send_item",
        "client_context": token,
        "media_id": media_id,
        "text": text,
        "reel_id": str(user_id),
        "mutation_token": token,
        "offline_threading_id": token,
        "_uuid": cl.uuid,
        "device_id": cl.android_device_id,
    }
    return cl.private_request(
        "direct_v2/threads/broadcast/reel_share/",
        data=cl.with_default_data(data),
        with_signature=False,
    )


def engage_sleep(base_sec: int, label: str) -> None:
    """Sleep ~base_sec with jitter so gaps aren't perfectly even."""
    if base_sec <= 0:
        return
    jitter = random.randint(-30, 45) if base_sec >= 60 else 0
    wait = max(30, base_sec + jitter)
    print(f"sleep {wait}s ({label})")
    time.sleep(wait)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Send Cueful IG outreach batch")
    p.add_argument(
        "--batch",
        type=Path,
        default=HERE / "outreach_20260728.json",
        help="Batch JSON path (default: outreach_20260728.json)",
    )
    p.add_argument(
        "--gap-seconds",
        type=int,
        default=DEFAULT_GAP_SEC,
        help=f"Seconds between people (default: {DEFAULT_GAP_SEC} = 10 min)",
    )
    p.add_argument(
        "--engage-gap-seconds",
        type=int,
        default=DEFAULT_ENGAGE_GAP_SEC,
        help=(
            f"Seconds between follow/story/comment/DM steps "
            f"(default: {DEFAULT_ENGAGE_GAP_SEC} = 5 min)"
        ),
    )
    p.add_argument(
        "--cap",
        type=int,
        default=DEFAULT_CAP,
        help=f"Max people to process this run (default: {DEFAULT_CAP})",
    )
    p.add_argument(
        "--results",
        type=Path,
        default=None,
        help="JSONL results log (default: <batch_stem>_log.jsonl)",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    batch_path: Path = args.batch
    if not batch_path.is_absolute():
        batch_path = HERE / batch_path
    results_path: Path = args.results or batch_path.with_name(
        f"{batch_path.stem}_log.jsonl"
    )
    gap_sec: int = max(0, int(args.gap_seconds))
    engage_sec: int = max(0, int(args.engage_gap_seconds))
    cap: int = max(1, int(args.cap))

    data = json.loads(batch_path.read_text())
    contacted = set(json.loads(CONTACTED.read_text())) if CONTACTED.exists() else set()
    settings = get_settings()
    client = InstagramClient(session_file=IG / ".instagram_session")
    try:
        client.login_or_load_session(
            settings.instagram_username,
            settings.instagram_password.get_secret_value(),
        )
    except Exception as e:
        print(f"STOP: auth failed: {type(e).__name__}: {e}")
        return 2

    cl = client.client
    dm_picker = TemplatePicker(DM_TEMPLATES)
    story_picker = TemplatePicker(STORY_TEMPLATES)
    comment_picker = TemplatePicker(COMMENT_TEMPLATES)
    attempted = 0
    sent = 0

    print(
        f"outreach start batch={batch_path.name} person_gap={gap_sec}s "
        f"engage_gap={engage_sec}s cap={cap} "
        f"dm={len(DM_TEMPLATES)} story={len(STORY_TEMPLATES)} "
        f"comment={len(COMMENT_TEMPLATES)}"
    )

    for t in data["targets"]:
        u = t["username"]
        if u in contacted:
            print(f"skip already contacted @{u}")
            continue
        if t.get("status") == "sent":
            continue
        if attempted >= cap:
            break

        # Cap all accounts touched, rather than only successful DMs.
        attempted += 1

        outreach_url = ""  # no links in DMs — copy says link in bio
        follow_ok = False
        story_ok = False
        story_skipped = False
        like_ok = False
        comment_ok = False
        dm_ok = False
        story_pk = None
        media_pk = None
        dm_variant = None
        story_variant = None
        comment_variant = None

        try:
            user_id = str(cl.user_id_from_username(u))

            # 1) Follow
            try:
                follow_ok = bool(cl.user_follow(user_id))
            except (ChallengeRequired, LoginRequired, FeedbackRequired):
                raise
            except Exception as e:
                t["follow_error"] = f"{type(e).__name__}: {e}"
                print(f"follow failed @{u}: {e}")
            else:
                t["followed"] = follow_ok
                print(f"followed @{u}: {follow_ok}")

            engage_sleep(engage_sec, f"after follow @{u}")

            # 2) Engage: prefer like over story reply.
            # Story replies have repeatedly triggered login_required on this
            # account; keep interaction via like + comment instead.
            stories = []
            story_skipped = True
            t["story_reply"] = False
            t["story_skipped"] = True
            print(f"story reply skipped @{u} (like+comment path)")
            try:
                medias = cl.user_medias(user_id, amount=1) or []
            except (ChallengeRequired, LoginRequired, FeedbackRequired):
                raise
            except Exception as e:
                medias = []
                t["media_error"] = f"fetch {type(e).__name__}: {e}"
                print(f"media fetch failed @{u}: {e}")
            if medias:
                media_pk = str(medias[0].pk)
                try:
                    like_ok = bool(cl.media_like(media_pk))
                    t["liked"] = like_ok
                    t["liked_media_pk"] = media_pk
                    print(f"liked post @{u}: {like_ok} pk={media_pk}")
                except (ChallengeRequired, LoginRequired, FeedbackRequired):
                    raise
                except Exception as e:
                    t["like_error"] = f"{type(e).__name__}: {e}"
                    print(f"like failed @{u}: {e}")

            engage_sleep(engage_sec, f"before comment @{u}")

            # 3) Unique comment on latest post (no URLs)
            try:
                medias = cl.user_medias(user_id, amount=1) or []
            except (ChallengeRequired, LoginRequired, FeedbackRequired):
                raise
            except Exception as e:
                medias = []
                t["media_error"] = f"fetch {type(e).__name__}: {e}"
                print(f"media fetch failed @{u}: {e}")
            if medias:
                media_pk = str(medias[0].pk)
                comment_variant, comment_text = comment_picker.pick()
                try:
                    cl.media_comment(media_pk, comment_text)
                    comment_ok = True
                    t["commented"] = True
                    t["comment_media_pk"] = media_pk
                    t["comment_variant"] = comment_variant
                    t["comment_message"] = comment_text
                    print(
                        f"comment @{u}: ok pk={media_pk} "
                        f"variant={comment_variant}"
                    )
                except (ChallengeRequired, LoginRequired, FeedbackRequired):
                    raise
                except Exception as e:
                    t["comment_error"] = f"{type(e).__name__}: {e}"
                    print(f"comment failed @{u}: {e}")
            else:
                t["comment_skipped"] = True
                print(f"no posts to comment @{u}")

            engage_sleep(engage_sec, f"before DM @{u}")

            # 4) DM — soft product invite, link in bio only (no URLs)
            dm_variant, dm_text = dm_picker.pick()
            t["variant"] = dm_variant
            t["message"] = dm_text
            msg = client.send_message(text=dm_text, user_ids=[user_id])
            if not msg:
                raise RuntimeError("send_message returned None")
            dm_ok = True
            t["status"] = "sent"
            t["error"] = None
            t["dm"] = True
            contacted.add(u)
            CONTACTED.write_text(json.dumps(sorted(contacted), indent=2) + "\n")
            batch_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n"
            )
            with results_path.open("a") as f:
                f.write(
                    json.dumps(
                        {
                            "username": u,
                            "status": "sent",
                            "followed": follow_ok,
                            "story_reply": story_ok,
                            "story_skipped": story_skipped,
                            "story_pk": story_pk,
                            "story_variant": story_variant,
                            "liked": like_ok,
                            "commented": comment_ok,
                            "comment_variant": comment_variant,
                            "dm": True,
                            "outreach_url": outreach_url,
                            "variant": dm_variant,
                        }
                    )
                    + "\n"
                )
            sent += 1
            print(
                f"done attempt={attempted}/{cap} sent={sent} @{u} "
                f"follow={follow_ok} "
                f"story={story_ok or ('skip' if story_skipped else False)} "
                f"like={like_ok} comment={comment_ok} "
                f"dm={dm_ok} variant={dm_variant}"
            )

            if attempted >= cap:
                break
            engage_sleep(gap_sec, "before next person")

        except (ChallengeRequired, LoginRequired, FeedbackRequired) as e:
            t["status"] = "blocked"
            t["error"] = f"{type(e).__name__}: {e}"
            t["followed"] = follow_ok
            t["story_reply"] = story_ok
            t["dm"] = dm_ok
            batch_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n"
            )
            with results_path.open("a") as f:
                f.write(
                    json.dumps(
                        {
                            "username": u,
                            "status": "blocked",
                            "followed": follow_ok,
                            "story_reply": story_ok,
                            "dm": dm_ok,
                            "error": t["error"],
                        }
                    )
                    + "\n"
                )
            print(f"STOP: {type(e).__name__}: {e}")
            return 3
        except Exception as e:
            t["status"] = "failed"
            t["error"] = f"{type(e).__name__}: {e}"
            t["followed"] = follow_ok
            t["story_reply"] = story_ok
            t["dm"] = dm_ok
            batch_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n"
            )
            with results_path.open("a") as f:
                f.write(
                    json.dumps(
                        {
                            "username": u,
                            "status": "failed",
                            "followed": follow_ok,
                            "story_reply": story_ok,
                            "dm": dm_ok,
                            "error": t["error"],
                        }
                    )
                    + "\n"
                )
            print(f"failed @{u}: {e}")
            # Failed delivery is not a contacted lead. Leave it available for
            # explicit review instead of silently suppressing future retries.
            engage_sleep(gap_sec, "after failure before next")

    print(
        f"done attempted={attempted} sent={sent} "
        f"contacted_total={len(contacted)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
