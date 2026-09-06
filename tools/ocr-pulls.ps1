param(
  [Parameter(Mandatory = $true)][string]$Path,
  [string]$Output = ""
)
$ErrorActionPreference = 'Stop'
$ocrCodexRoot = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$skillRoot = Join-Path $ocrCodexRoot 'skills\local-ocr'
$registryPath = Join-Path $skillRoot 'local-runtimes.json'
if (-not (Test-Path -LiteralPath $registryPath)) { throw 'Initialize the installed local-ocr skill on this machine first.' }
$entries = @((Get-Content -LiteralPath $registryPath -Raw | ConvertFrom-Json).PSObject.Properties)
if ($entries.Count -ne 1) { throw 'Multiple device registrations found. Use the current machine launcher documented by the local-ocr skill.' }
$runtime = $entries[0].Value
$launcher = Join-Path $runtime.state ('devices\' + $entries[0].Name + '\run_ocr.py')
$inputPath = (Resolve-Path -LiteralPath $Path).Path
if (-not $Output) {
  $privateOutput = Join-Path (Split-Path $PSScriptRoot -Parent) '_private\ocr-out'
  New-Item -ItemType Directory -Path $privateOutput -Force | Out-Null
  $Output = Join-Path $privateOutput (([guid]::NewGuid().ToString()) + '.json')
}
if (Test-Path -LiteralPath $Output) { throw 'Choose a new output file; existing OCR evidence will not be overwritten.' }
& $runtime.python $launcher $inputPath --max-chars 1500 --output $Output
exit $LASTEXITCODE
