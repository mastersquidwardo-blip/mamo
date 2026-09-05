$path = Join-Path (Get-Location) "index.html"
$utf8 = New-Object System.Text.UTF8Encoding $false
$bytes = [System.IO.File]::ReadAllBytes($path)
$start = 0
if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) { $start = 3 }
$text = $utf8.GetString($bytes, $start, $bytes.Length - $start)

# Mojibake sequences as UTF-8 byte strings interpreted already in $text
$map = @{
  ([string][char]0x2013) = "-"
  ([string][char]0x2014) = "-"
  ([string][char]0x2212) = "-"
  ([string][char]0x00B7) = " | "
  ([string][char]0x2022) = "*"
  ([string][char]0x2026) = "..."
  ([string][char]0x2018) = "'"
  ([string][char]0x2019) = "'"
  ([string][char]0x201C) = '"'
  ([string][char]0x201D) = '"'
  ([string][char]0x00D7) = "x"
  ([string][char]0x00A0) = " "
  ([string][char]0x2192) = "->"
  ([string][char]0x2190) = "<-"
  ([string][char]0x2248) = "~"
  ([string][char]0x00C2) = ""  # stray ?
}

foreach ($k in @($map.Keys)) { $text = $text.Replace($k, $map[$k]) }

# Common mojibake multi-char (already decoded as those chars in broken files)
$moji = @(
  @([string]([char]0x00E2) + [char]0x20AC + [char]0x201C, "-"),
  @([string]([char]0x00E2) + [char]0x20AC + [char]0x201D, "-"),
  @([string]([char]0x00E2) + [char]0x20AC + [char]0x2122, "'"),
  @([string]([char]0x00C2) + [char]0x00B7, " | "),
  @(" A" + [char]0x00B7 + " ", " - "),
  @("A" + [char]0x00B7, " - ")
)
foreach ($pair in $moji) { $text = $text.Replace($pair[0], $pair[1]) }

$sb = New-Object System.Text.StringBuilder
$leftover = @{}
foreach ($ch in $text.ToCharArray()) {
  $code = [int]$ch
  if ($code -lt 128) { [void]$sb.Append($ch); continue }
  $key = "{0:X4}" -f $code
  if (-not $leftover.ContainsKey($key)) { $leftover[$key] = 0 }
  $leftover[$key]++
  $formD = $ch.ToString().Normalize([Text.NormalizationForm]::FormD)
  foreach ($c2 in $formD.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c2) -eq 'NonSpacingMark') { continue }
    if ([int]$c2 -lt 128) { [void]$sb.Append($c2) }
  }
}
$outText = $sb.ToString()
Write-Host "Leftover unicode codepoints before ASCII force:" $leftover.Count
$leftover.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 15 | ForEach-Object { Write-Host ("U+{0} x{1}" -f $_.Key, $_.Value) }

[System.IO.File]::WriteAllText($path, $outText, $utf8)
$out = [System.IO.File]::ReadAllBytes($path)
Write-Host "first bytes" ($out[0..3] -join ',') "high" (($out | Where-Object { $_ -ge 128 }).Count)

# show CI-looking strings from JS render templates
Select-String -Path $path -Pattern "80%|95%|LOW|print" | Select-Object -First 20 | ForEach-Object {
  $l = $_.Line.Trim()
  if ($l.Length -gt 140) { $l = $l.Substring(0,140) }
  Write-Host $l
}
