# V1.0 部署运行手册

适用状态：
- 后端已稳定运行 MySQL
- 管理端已完成友好化收敛
- 本地验收通过

## 当前固定验收

```powershell
& 'C:\Users\HCnets\Desktop\苏区镇建模\client\node_modules\.bin\vite.cmd' build
```

```powershell
cd C:\Users\HCnets\Desktop\苏区镇建模\server
npm run db:smoke:mysql:acceptance
```

```powershell
Invoke-RestMethod -Uri 'http://localhost:3001/api/health' | ConvertTo-Json -Depth 6
```

健康检查必须满足：
- `store=mysql`
- `configuredStore=mysql`
- `database.runtimeClient=mysql`
- `database.runtimeAligned=true`

## 生产部署目录

- 展示端：`/www/wwwroot/szht/client/dist-server`
- 管理端：`/www/wwwroot/szht/admin/dist`
- 接口服务：`http://127.0.0.1:3001`

## 部署顺序

1. 传输前端产物到服务器。
2. 安装后端依赖：`npm install --omit=dev`
3. 确认 `.env` 使用 MySQL 配置。
4. 启动后端：`npm run start:prod`
5. 执行健康检查。
6. 执行 MySQL 全链路验收。
7. 生成验收证据：`npm run acceptance:v1:evidence`

## 宝塔 Node 项目

- 运行目录：`/www/wwwroot/szht/server`
- 启动命令：`npm run start:prod`
- 监听端口：`3001`
- `DATA_DIR` 必须在 Web 根目录之外
- `admin.szht.online` 只挂管理端

## Nginx 要点

- `szht.online` 代理到展示端
- `admin.szht.online` 代理到管理端
- `/api/` 反向代理到 `127.0.0.1:3001`
- `/uploads/` 反向代理到 `127.0.0.1:3001`

## 验收留痕

正式上线前，把以下内容补到验收清单：
- 负责人
- 验收日期
- 最终结论
- MySQL 状态
- 真实素材验收结果
- 遗留事项

正式切换当天使用：
- `docs/V1_GO_LIVE_CUTOVER_CHECKLIST.md`

部署前状态总表：
- `docs/V1_DEPLOYMENT_READINESS_STATUS.md`

## 最新证据

2026-07-19 已生成：
- `server/data/acceptance/v1-acceptance-evidence-2026-07-19T13-43-46-160Z.json`
- `server/data/acceptance/v1-acceptance-evidence-2026-07-19T13-43-46-160Z.md`
