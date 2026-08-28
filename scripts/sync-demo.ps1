# 同步：生产库（原项目 server/） -> demo（桌面 demo/）
# 用法：先停掉 demo 的 server（关掉"启动演示.bat"），再运行本脚本
# 单一事实来源 = 苏区镇建模/server/，demo 是它的可再生快照
$root = Split-Path $PSScriptRoot -Parent
$demo = Join-Path $HOME "Desktop\demo"
if (-not (Test-Path $demo)) { Write-Host "未找到 demo 目录: $demo" -ForegroundColor Red; exit 1 }

Write-Host "=== 同步生产库 -> demo ===" -ForegroundColor Cyan

# 1) server：源码 + 数据 + public（排除缓存/备份/日志）
robocopy "$root\server" "$demo\server" /E `
  /XD ".npm-cache-ffmpeg" ".npm-cache-lock" "node_modules\.cache" "data\backups" "data\imports" "data\acceptance" `
  /NFL /NDL /NJH /NJS /R:1 /W:1 /MT:16 | Out-Null

# 2) 前端展示端 dist-server
robocopy "$root\client\dist-server" "$demo\client\dist-server" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /MT:16 | Out-Null

# 3) 管理端 dist
robocopy "$root\admin\dist" "$demo\admin\dist" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /MT:16 | Out-Null

# 4) 新图片资源（resource-hub 等）
robocopy "$root\server\public\images\resource-hub" "$demo\server\public\images\resource-hub" /E /NFL /NDL /NJH /NJS /R:1 /W:1 /MT:16 | Out-Null

Write-Host "同步完成 ✅" -ForegroundColor Green
Write-Host "  源码/数据/dist/图片 已从生产库刷新到 demo" 
Write-Host "  重新双击 启动演示.bat 即可（端口 3001）"
