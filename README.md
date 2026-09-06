# MAMO serial tracker

A static Magnificent Monsters dashboard: reported GMR serial identities, country-level locations, reviewed opening results, and explicit print-run scenarios.

Live: https://mastersquidwardo-blip.github.io/mamo/

## Data workflow

The ignored private ledgers are the source of truth:

- _private/serial-ledger.json — full source references, exact serial reports and unresolved images.
- _private/opening-ledger.json — source/session reconciliation, exact exposures, individual rarity counts and review decisions.

Run python tools/build_public.py after reviewing either ledger. It projects an explicit allowlist into data.js, serials.csv and openings.json. Never copy private ledgers or evidence photos into the public site. Missing hit counts are null, not zero. A full set number and serial suffix identify a card; listing country does not identify its print pool.

## Preview and validate

Serve this directory on localhost with python -m http.server 8767 --bind 127.0.0.1. Open http://127.0.0.1:8767/ . No npm packages or build service are required.

- node tools/test_stats.js
- python tools/test_public.py

The map outline is bundled locally in world-paths.js; see THIRD_PARTY_NOTICES.txt. No remote scripts, analytics or collector image requests run in the dashboard.

The September 6 review replaces unsupported default print-run inference with a labeled assumption explorer. Earlier implementations remain in Git history (baseline 41198f7). Public reports do not establish a complete worldwide pull count, population odds, remaining sealed supply, ownership or completed sale prices.
