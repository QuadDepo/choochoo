---
name: choochoo
description: Automates downloading Dutch NS railway expense declarations (PDFs) and extracting trip data from ns.nl using the `choochoo` CLI. Use when the user wants to download NS travel declarations for expense reimbursement, extract a list of NS train trips for a period, generate monthly travel reports from NS, scaffold an NS automation config, or asks about the `choochoo` command. Covers config setup, period/date-range selection, trip filtering modes, headed-mode debugging, and common errors (Akamai bot blocks, auth failures, missing trips).
---

# choochoo — NS.nl travel declaration automation

`choochoo` is a Node CLI that drives a real Chrome browser via Playwright to log into ns.nl, list a user's train trips, and download the official PDF declaration NS issues for expense reimbursement.

## Prerequisites the user must satisfy

1. **Real Google Chrome installed locally.** Not Chromium, not Edge. NS uses Akamai bot detection which fingerprints the browser; only a real Chrome build passes.
2. **Node.js >= 22.**
3. **Package installed globally:** `npm i -g @choochoo/cli`. The binary is `choochoo`.
4. **NS.nl account** with a registered OV-chipkaart / NS-Flex card.

If any are missing, surface that *before* attempting commands — running `choochoo` without Chrome installed produces an opaque Playwright error.

## First-run setup

```sh
choochoo init
```

Creates `~/.config/choochoo/config.json` with `0600` perms (dir is `0700`). The user then fills in:

```json
{
  "email": "user@example.com",
  "password": "plaintext-ns-password",
  "cards": [{ "name": "personal", "id": "<card-uuid>" }],
  "tripOrder": "asc"
}
```

The **card UUID** is the tricky bit — it's not visible in the NS UI. The user has to grab it from a `card=...` query parameter on `https://www.ns.nl/mijnns#/reishistorie?card=...` after selecting a card in the dropdown. If the user doesn't know their card ID, tell them to:
1. Log into `ns.nl/mijnns` in a normal browser.
2. Go to "Reisgeschiedenis" / "Travel history".
3. Pick the card from the dropdown.
4. Copy the `card=` UUID out of the URL.

Multiple cards can be configured; the first entry is the default. Override with `--card <name>`.

`tripOrder` is `asc` (oldest first) or `desc` (newest first, NS's native order). It only affects display order in `extract`, not the PDF.

## Commands

All commands take an optional positional `<period>` plus shared flags. Defaults to `this-month`.

### `choochoo` (no subcommand) — interactive mode

Walks the user through period selection and trip picking with prompts. Best for one-off runs. Add `--headed` to watch the browser.

### `choochoo extract [period]`

Prints the trip list for the period and the total cost. Does not download a PDF.

Flags:
- `--json` — also write trips to JSON at `<downloadsDir>/trips-<period>-<date>.json`.
- `--output <path>` — override JSON path (implies `--json`).
- `--card <name>` — pick a non-default card.
- `--headed` — show the Chrome window.
- `--from DD-MM-YYYY --to DD-MM-YYYY` — custom date range (both required, overrides the positional period).

### `choochoo download [period]`

Downloads the official NS PDF declaration for the period.

Flags:
- `--select <mode>` — what trips to include in the declaration:
  - `paid` *(default)* — only non-zero-cost trips, using NS's "declaratie" radio.
  - `all` — every transaction including zero-cost (free trips, top-ups, etc.).
  - `1,2,3` — comma-separated trip numbers from the `extract` output. Numbers refer to NS's native ordering (newest first), not the `tripOrder`-adjusted display order.
- `--output <path>` — override PDF path. Defaults to `<downloadsDir>/ns-declaratie-<period>-<date>.pdf`.
- All shared flags above (`--card`, `--headed`, `--from`/`--to`).

### `choochoo init`

Scaffolds the config file. Idempotent — won't overwrite an existing config.

## Periods

Valid positional period values:

| Slug | Meaning |
|---|---|
| `this-month` | Current calendar month (default) |
| `previous-month` | Last full calendar month |
| `past-year` | Trailing 12 months |
| `last-7-days` | Last 7 days |
| `everything` | All available history |

For anything else, use `--from DD-MM-YYYY --to DD-MM-YYYY`. Both flags are required together.

**Watch out:** the user-facing slug is `previous-month`, not `last-month`. NS-internal slugs differ (`vorige-maand`, etc.); the CLI translates.

## Configuration file precedence

`choochoo` reads config in this order (first wins):
1. `./config.json` in the **current working directory** — this is a footgun. Running `choochoo` from a project dir that happens to have a `config.json` will silently use it instead of the real config.
2. `~/.config/choochoo/config.json` — the canonical location.

If a run mysteriously uses the wrong card or fails on credentials, check the cwd for a stray `config.json`.

Credentials may also be supplied as env vars (`NS_EMAIL`, `NS_PASSWORD`), which override the file. Useful for Docker/cron without writing secrets to disk.

## Output locations

PDFs and JSON default to `~/.config/choochoo/downloads/`. Override globally by setting `"downloadsDir": "/path/to/dir"` in config, or per-invocation with `--output`.

## Errors and how to react

The CLI prints concise messages and exits non-zero. Map the error to a recommendation:

- **`NsAuthError: Login timed out. Check your credentials.`** — almost always wrong email/password in config. Tell the user to verify by logging into ns.nl manually first.
- **`NsAuthError: Blocked by Akamai.`** — bot detection tripped. Re-run with `--headed` so the user can complete any Cloudflare/Akamai challenge by hand once; the cookie is then cached at `~/.config/choochoo/session.json` for ~30 min.
- **`No trips found for this period.`** — the period genuinely contains no trips, or the wrong card is selected. Try `--card <name>` or widen the period.
- **`NsDownloadError`** — usually a bad `--select` value or no qualifying trips. Run `extract` first to confirm what's there.
- **Playwright "browser not found"** — real Chrome isn't installed. The package uses `playwright-core` (no bundled browser) on purpose; the user needs to install Chrome system-wide.

## Session caching

After a successful login, cookies are written to `~/.config/choochoo/session.json` (mode `0600`). The next run reuses them, skipping the login form. Sessions expire within ~30 min — there's no value in trying to extend them; just re-login when prompted.

## What this skill should NOT do

- **Do not try to "fix" Akamai blocks programmatically.** The fix is `--headed` + manual challenge. Don't suggest user-agent spoofing, proxies, etc.
- **Do not edit the user's `config.json` to add credentials.** Tell them what to put in it; let them fill it in. Credentials are plaintext and sensitive.
- **Do not run `choochoo download` without first confirming the period has trips** (via `extract`) unless the user explicitly asks for a blind download. Failed downloads waste a login round-trip.
- **Do not commit `~/.config/choochoo/` or `session.json` / `config.json`** to git. They contain plaintext NS credentials.

## Quick reference

```sh
# First time
choochoo init
# (user edits ~/.config/choochoo/config.json)

# Most common: download last month's declaration
choochoo download previous-month

# See what's in this month before downloading
choochoo extract this-month
choochoo download this-month --select paid

# Custom range, specific trips
choochoo extract --from 01-03-2026 --to 15-03-2026
choochoo download --from 01-03-2026 --to 15-03-2026 --select 1,3,5

# Debug a failure
choochoo download this-month --headed
```
