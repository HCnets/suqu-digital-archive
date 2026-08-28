param(
  [string]$Distro = 'Ubuntu-24.04'
)

$ErrorActionPreference = 'Stop'

function Convert-ToWslPath {
  param([Parameter(Mandatory = $true)][string]$WindowsPath)

  $normalized = $WindowsPath -replace '\\', '/'
  if ($normalized -match '^([A-Za-z]):/(.*)$') {
    return "/mnt/$($matches[1].ToLower())/$($matches[2])"
  }

  throw "Unsupported Windows path: $WindowsPath"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$wslProjectRoot = Convert-ToWslPath -WindowsPath $projectRoot
$keepAliveMarker = 'szht-wsl-docker-keepalive'

wsl.exe -d $Distro -u root -- bash -lc "cd '$wslProjectRoot' && docker compose -p szht -f docker-compose.yml down"

$keepAliveProcesses = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq 'wsl.exe' -and
    $_.CommandLine -like "*$Distro*" -and
    $_.CommandLine -like "*$keepAliveMarker*"
  }

foreach ($process in $keepAliveProcesses) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}
