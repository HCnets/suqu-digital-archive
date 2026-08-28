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

$existingKeepAlive = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq 'wsl.exe' -and
    $_.CommandLine -like "*$Distro*" -and
    $_.CommandLine -like "*$keepAliveMarker*"
  }

if (-not $existingKeepAlive) {
  Start-Process -FilePath 'wsl.exe' `
    -ArgumentList '-d', $Distro, '-u', 'root', '--', 'bash', '-lc', "systemctl start docker >/dev/null 2>&1; while true; do sleep 3600; done # $keepAliveMarker" `
    -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

wsl.exe -d $Distro -u root -- bash -lc "systemctl start docker >/dev/null 2>&1 && cd '$wslProjectRoot' && docker compose -p szht -f docker-compose.yml up -d mysql && docker compose -p szht -f docker-compose.yml ps"
