# Local tools (MAMO)

## OCR pull screenshots
Uses **Windows built-in OCR** (WinRT) on this PC — no cloud, no token burn.

1. Drop images into `_private/ocr-inbox/`
2. Run: `powershell -ExecutionPolicy Bypass -File .\tools\ocr-pulls.ps1`
3. Read `_private/ocr-out/*.json` (raw text + heuristic boxes/packs/GMR/serials)
4. Merge country-only fields into the dashboard; keep handles/cities private

Optional: install Tesseract later for a second engine (`winget install UB-Mannheim.TesseractOCR`).
