# Maintaining the MAMO data

Use build_public.py to regenerate the public projection and test_public.py / test_stats.js to validate it. The generated data files belong in the published site; private ledgers and OCR evidence do not.

## Local OCR

Install and initialize the local-ocr skill on this machine first. The project wrapper reads that skill's local-runtimes.json and delegates one image at a time to its generated guarded launcher:

powershell -File tools/ocr-pulls.ps1 -Path "C:\path\to\photo.webp"

An optional -Output parameter chooses a new private JSON file. Read the returned confidence and coverage warnings; an OCR token is a candidate, not automatic proof of a serial. Do not promote incomplete digits, substitute an unstated suffix, or infer a zero-hit result from missing image text.

The launcher enforces its own CPU, RAM, cooldown and hourly budgets. Stop on safety deferral. Do not run the old Windows OCR implementation as a way around those controls. Runtime registries, virtual environments, caches and budgets stay on this machine and are never committed or synced.

The older fix-ascii, fix-hex-quotes and patch-regions scripts were written for the pre-September-6 single-file dashboard and should not be used on the current data model.
