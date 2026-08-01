# Cueful Instagram outreach

Portable public discovery and capped outreach tooling. Discovery is logged-out
Playwright and never uses the sending account. Sending is limited to one run of
at most 15 account attempts per local day, with immediate stop on authentication
or checkpoint errors.

## Setup

```bash
cd tools/instagram-outreach
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/playwright install chromium
export INSTAGRAM_MCP_DIR=/absolute/path/to/instagram-mcp
export OUTREACH_DATA_DIR=/absolute/path/to/private/outreach-data
```

Copy `contacted.json` into `OUTREACH_DATA_DIR` before designating a new sending
device. Never run two sending devices concurrently.

## Continuous discovery and daily capped sending

Discovery-only is the default:

```bash
.venv/bin/python growth_loop.py
```

After authentication has been verified and the account is healthy, enable one
capped send window per day:

```bash
OUTREACH_ENABLE_SEND=1 .venv/bin/python growth_loop.py
```

The loop discovers every six hours, merges deduplicated candidates into
`pool.json`, and records state under `OUTREACH_DATA_DIR`. Set
`OUTREACH_DISCOVERY_INTERVAL`, `OUTREACH_SEND_HOUR`, `OUTREACH_TIMEZONE`, and
`OUTREACH_HASHTAGS` to customize it.

Logs:

- `growth_loop.log`
- `outreach_day_run.log`
- `<batch>_log.jsonl`

Secrets, sessions, logs, and outreach data are ignored by Git.
