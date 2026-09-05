# MAMO destruction dashboard — project scope

Living rules for Magnificent Monsters GMR depletion / chasability work.
Local path: `G:\My Drive\Grok Build\14-mamo-destruction-dashboard`
Repo: https://github.com/mastersquidwardo-blip/mamo
Live: https://mastersquidwardo-blip.github.io/mamo/
Crowd thread: https://x.com/Kramaramb/status/2095942297871426046

## 1. Anonymity (non-negotiable)

- Never publish names, handles, cities, addresses, seller IDs, or listing URLs that identify a person or place finer than country.
- Private working notes / raw feeds may hold identifiers for dedupe; the public `index.html` and Pages site must not.
- Even when the operator pastes identifying info into chat, published output stays country-level (or coarser).
- Reason: GMR serials are high-value (5-figure) and location leakage creates theft / burglary risk.

## 2. Dedup framework

Goal: count each physical rip once in likelihood samples, without collapsing legitimate multi-day activity.

### Keep separate when
- Same reporter, different calendar day (or clearly different session)
- Different pack/box counts, or different card outcomes that can't be the same rip
- Same person reporting Americas `/100` vs Europe `/100e` (different print pools)

### Merge when
- Same source post (or quote-repost of the same numbers)
- Same reporter + same day + same boxes/packs + same GMR/OF/SL counts (near-identical claims)
- Cross-platform mirrors (X ↔ Reddit) of the same rip text / screenshot

### Working keys (private; not published)
1. `source_url` or platform+post id (strongest)
2. Else `reporter_id_hash` + `date` + `boxes` + `packs` + `gmr` + `of` + `sl` + `region`
3. Serial sightings: dedupe on `set` + `serial` + `region` (`049/100` is one card worldwide for that print)

### Published fields only
- Crowd rips: `country`, packs, boxes, gmr, of, sl (aggregated)
- Serial map: `country` (null → "unknown", not plotted), card, serial, Americas vs E-suffix region

## 3. Local-first

- Prefer scripts and files on this machine over large remote agent runs.
- Use cloud coding agents only for focused repo edits when needed; keep digests and raw tables local.

## 4. Geographic / product scope

| In scope | Out of scope |
| --- | --- |
| Americas GMR `/100` | International OF / Starlight pull-rate modeling |
| Europe-distributed GMR `/100e` on the map + serial registry | Non-GMR chase economics outside NA |
| Global map of **GMR serial locations** (country only) | City/state heatmaps |

OF/SL in **North America crowd samples** may still appear as ancillary stats on the Crowd tab; they do not drive international rate inference.

## 5. Model accuracy

- Keep refining R (print run) likelihood, depletion curves, and chase pressure as samples grow.
- Public GMR tweets **without a box denominator** stay out of the likelihood; they belong on the serial / map side only.
- Crowd sample toggle stays the bridge from anonymized rips → print inference.

## 6. Sources (priority)

1. Operator crowd thread (X): Kramaramb status 2095942297871426046
2. X public pulls / listings (anonymize before publish)
3. Reddit (same rules)

## Status snapshot (2026-09-05)

- Shipped: overview, print inference, depletion, crowd log, chase, evidence; Sep 4 crowd rips + serial 052/100.
- Local uncommitted: country-only anonymization + D3/topojson GMR country map (baseline for privacy rule #1).
