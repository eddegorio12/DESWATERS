param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"

if (-not $Args -or $Args.Count -eq 0) {
  throw "Usage: npm run design:search -- ""<query>"" [--design-system] [other search.py flags]"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot ".codex\skills\ui-ux-pro-max\scripts\search.py"

if (-not (Test-Path $scriptPath)) {
  throw "ui-ux-pro-max search script not found at $scriptPath"
}

function Test-UsablePythonPath {
  param([string]$Candidate)

  if (-not $Candidate) {
    return $false
  }

  if (-not (Test-Path $Candidate)) {
    return $false
  }

  $item = Get-Item $Candidate -ErrorAction SilentlyContinue
  if (-not $item) {
    return $false
  }

  return $item.Length -gt 0
}

$candidates = [System.Collections.Generic.List[string]]::new()

if ($env:DWDS_PYTHON) {
  $candidates.Add($env:DWDS_PYTHON)
}

$command = Get-Command python -ErrorAction SilentlyContinue
if ($command -and (Test-UsablePythonPath $command.Source)) {
  $candidates.Add($command.Source)
}

$commonPaths = @(
  "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
  "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
  "C:\Program Files\PostgreSQL\18\pgAdmin 4\python\python.exe",
  "C:\Program Files\NVIDIA Corporation\RTX Remix\kit\python\python.exe"
)

foreach ($path in $commonPaths) {
  if (Test-UsablePythonPath $path) {
    $candidates.Add($path)
  }
}

$python = $candidates | Select-Object -Unique | Select-Object -First 1

if (-not $python) {
  throw "No usable Python interpreter found. Install Python or set DWDS_PYTHON to a valid python.exe path."
}

& $python $scriptPath @Args
$exitCode = $LASTEXITCODE

if ($null -ne $exitCode -and $exitCode -ne 0) {
  exit $exitCode
}
