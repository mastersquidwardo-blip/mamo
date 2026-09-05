param(
  [string]$Path = "",
  [string]$Inbox = "",
  [string]$OutDir = "",
  [int]$Upscale = 2
)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not $Inbox) { $Inbox = Join-Path $root "_private\ocr-inbox" }
if (-not $OutDir) { $OutDir = Join-Path $root "_private\ocr-out" }
New-Item -ItemType Directory -Force -Path $Inbox, $OutDir | Out-Null

Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]
function Wait-Opr($op, [type]$T) {
  $asTaskGeneric.MakeGenericMethod($T).Invoke($null, @($op)).GetAwaiter().GetResult()
}

function Get-UpscaledCopy([string]$img, [int]$factor) {
  if ($factor -le 1) { return (Resolve-Path $img).Path }
  $src = [Drawing.Image]::FromFile((Resolve-Path $img).Path)
  try {
    $w = [int]($src.Width * $factor); $h = [int]($src.Height * $factor)
    $dst = New-Object Drawing.Bitmap $w, $h
    $g = [Drawing.Graphics]::FromImage($dst)
    $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $tmp = Join-Path $env:TEMP ("mamo-ocr-" + [guid]::NewGuid().ToString() + ".png")
    $dst.Save($tmp, [Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
    return $tmp
  } finally { $src.Dispose() }
}

function Ocr-File([string]$img) {
  $null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
  $null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
  $null = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics,ContentType=WindowsRuntime]
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  if (-not $engine) { throw "OCR engine unavailable" }
  $file = Wait-Opr ([Windows.Storage.StorageFile]::GetFileFromPathAsync($img)) ([Windows.Storage.StorageFile])
  $stream = Wait-Opr ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  try {
    $decoder = Wait-Opr ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Wait-Opr ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    if ($bitmap.BitmapPixelFormat -ne 'Bgra8' -and $bitmap.BitmapPixelFormat -ne 'Gray8') {
      $bitmap = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert($bitmap, [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8)
    }
    $result = Wait-Opr ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    return $result.Text
  } finally { $stream.Dispose() }
}

function Parse-Pull([string]$text) {
  $o = @{ boxes=$null; packs=$null; gmr=$null; of=$null; sl=$null; serials=@() }
  if ($text -match '(?i)(\d+)\s*(?:mini[- ]?)?boxes?\b') { $o.boxes = [int]$Matches[1] }
  if ($text -match '(?i)(\d+)\s*packs?\b') { $o.packs = [int]$Matches[1] }
  if ($text -match '(?i)\b(\d+)\s*gmr\b|\bgmr\D{0,4}(\d+)\b') {
    $o.gmr = [int]($(if($Matches[1]){$Matches[1]}else{$Matches[2]}))
  }
  if ($text -match '(?i)(no|zero)\s+gmr|\b0\s*gmr\b|\bgmr\D{0,4}0\b') { $o.gmr = 0 }
  if ($text -match '(?i)(\d+)\s*overframes?|\bof\D{0,4}(\d+)\b') {
    # avoid treating OCR-garbled "052/100" -> "Of" as overframe=alone; require digit
    if ($Matches[1] -or $Matches[2]) {
      $o.of = [int]($(if($Matches[1]){$Matches[1]}else{$Matches[2]}))
    }
  }
  if ($text -match '(?i)(\d+)\s*starlights?|\bsl\D{0,4}(\d+)\b') {
    $o.sl = [int]($(if($Matches[1]){$Matches[1]}else{$Matches[2]}))
  }
  # serials: 052/100, 52 / 100e, OCR variants 052 100, 052-100
  [regex]::Matches($text, '(?i)\b(\d{1,3})\s*[\/|lI]\s*(100e?)\b') | ForEach-Object {
    $o.serials += ($_.Groups[1].Value + '/' + $_.Groups[2].Value)
  }
  [regex]::Matches($text, '(?i)\b(\d{2,3})\s*[- ]\s*(100e?)\b') | ForEach-Object {
    $cand = $_.Groups[1].Value + '/' + $_.Groups[2].Value
    if ($o.serials -notcontains $cand) { $o.serials += $cand }
  }
  $o
}

$files = @()
if ($Path) { $files = @(Get-Item -LiteralPath $Path) }
else {
  $files = @(Get-ChildItem -LiteralPath $Inbox -File | Where-Object Extension -Match '\.(png|jpe?g|webp|bmp|gif)$')
}
if (-not $files.Count) {
  Write-Host "Drop pull screenshots here:`n  $Inbox"
  Write-Host "Then:  .\tools\ocr-pulls.ps1"
  exit 0
}

$rows = @()
foreach ($f in $files) {
  Write-Host "OCR $($f.Name) (upscale x$Upscale) ..."
  $work = Get-UpscaledCopy $f.FullName $Upscale
  try {
    $text = Ocr-File $work
  } finally {
    if ($work -ne (Resolve-Path $f.FullName).Path -and (Test-Path $work)) { Remove-Item $work -Force }
  }
  $parsed = Parse-Pull $text
  $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  Set-Content -LiteralPath (Join-Path $OutDir "$base.txt") -Value $text -Encoding UTF8
  [pscustomobject]@{
    file = $f.Name
    engine = "windows-ocr"
    upscale = $Upscale
    text = $text
    boxes = $parsed.boxes; packs = $parsed.packs; gmr = $parsed.gmr; of = $parsed.of; sl = $parsed.sl
    serials = @($parsed.serials)
  } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $OutDir "$base.json") -Encoding UTF8
  $rows += [pscustomobject]@{ file=$f.Name; boxes=$parsed.boxes; packs=$parsed.packs; gmr=$parsed.gmr; of=$parsed.of; sl=$parsed.sl; serials=($parsed.serials -join ', ') }
}
$rows | Format-Table -AutoSize
$rows | ConvertTo-Json | Set-Content (Join-Path $OutDir "_batch-summary.json") -Encoding UTF8
Write-Host "Output: $OutDir (gitignored)"
