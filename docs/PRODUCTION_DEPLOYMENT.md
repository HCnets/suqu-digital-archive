# 正式部署说明

目标域名：

- 展示端：`https://szht.online`
- 管理端：`https://admin.szht.online`
- 后端 API：两个站点的 `/api/` 反向代理到本机 `http://127.0.0.1:3001`

当前 V1.0 上线基础版以 MySQL 作为正式运行数据库。SQLite 只作为历史迁移源和本地开发参考，不作为生产运行库。

## 1. 构建产物

在服务器或干净构建环境分别安装依赖并构建：

```bash
cd /www/wwwroot/szht/client
npm install
npm run build:server

cd /www/wwwroot/szht/admin
npm install
npm run build
```

产物目录：

- 展示端：`client/dist-server`
- 管理端：`admin/dist`

不要把本机 `node_modules` 当作上线产物上传。

## 2. MySQL 数据库

在宝塔 MySQL 或服务器 MySQL 中创建生产库和独立账号，账号只授权当前业务库：

```sql
CREATE DATABASE szht_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'szht_user'@'127.0.0.1' IDENTIFIED BY '请替换为强密码';
GRANT ALL PRIVILEGES ON szht_cms.* TO 'szht_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

首次部署空库时导入表结构：

```bash
cd /www/wwwroot/szht/server
mysql -h127.0.0.1 -uszht_user -p szht_cms < schema/mysql.sql
```

如果是从现有 SQLite 数据迁移，先保留 `DATA_DIR` 下的 `suqu.db` 备份，再执行：

```bash
cd /www/wwwroot/szht/server
npm run db:migrate:mysql
npm run db:preflight:mysql
```

`db:preflight:mysql` 不应出现 blockers；如果已经切到 MySQL 正式运行态，`/api/health` 的 `nextAction` 会是 `runtime_already_on_mysql`。

## 3. 后端环境变量

复制生产模板为服务器实际 `.env`：

```bash
cd /www/wwwroot/szht/server
cp .env.production.example .env
```

必须确认：

- `NODE_ENV=production`
- `DB_CLIENT=mysql`
- `DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD` 为生产 MySQL 信息
- `DATA_DIR=/www/wwwroot/szht-data`，且不在 Nginx 静态根目录内
- `CORS_ORIGIN=https://szht.online,https://admin.szht.online`
- `SESSION_COOKIE_DOMAIN=admin.szht.online`
- `ADMIN_TOKEN=` 默认留空，避免继续依赖旧 token 写接口

`DATA_DIR` 需要 Node 进程可读写，上传文件与备份快照都会放在该目录下。

## 4. 宝塔 Node / PM2 启动

后端启动命令必须加载 `.env`。本项目提供生产启动入口：

```bash
cd /www/wwwroot/szht/server
npm install --omit=dev
npm run start:prod
```

PM2 示例：

```bash
cd /www/wwwroot/szht/server
pm2 start npm --name szht-api -- run start:prod
pm2 save
```

宝塔 Node 项目配置建议：

- 项目目录：`/www/wwwroot/szht/server`
- 启动命令：`npm run start:prod`
- 运行端口：`3001`
- Node 进程只监听内网或受防火墙保护的端口
- 日志开启并保留最近异常日志

## 5. 运行态健康检查

启动后先检查本机接口：

```bash
curl http://127.0.0.1:3001/api/health
```

必须确认：

- `store = mysql`
- `configuredStore = mysql`
- `database.runtimeClient = mysql`
- `database.runtimeAligned = true`

随后执行 MySQL 全链路验收：

```bash
cd /www/wwwroot/szht/server
npm run db:smoke:mysql:acceptance
npm run acceptance:v1:evidence
```

全链路验收覆盖后台核心读写、内容读写、公开接口一致性、导入导出、备份恢复等关键链路。证据采集命令会在 `DATA_DIR/acceptance` 下生成 JSON 和 Markdown 记录，便于归档。

## 6. Nginx 配置

展示端 `szht.online`：

```nginx
server {
    listen 80;
    server_name szht.online www.szht.online;
    return 301 https://szht.online$request_uri;
}

server {
    listen 443 ssl http2;
    server_name szht.online;

    root /www/wwwroot/szht/client/dist-server;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

管理端 `admin.szht.online`：

```nginx
server {
    listen 80;
    server_name admin.szht.online;
    return 301 https://admin.szht.online$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.szht.online;

    root /www/wwwroot/szht/admin/dist;
    index index.html;
    client_max_body_size 120m;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

生产环境必须启用 HTTPS；管理端不要和展示端混放在同一个静态根目录。

## 7. 首次管理员与账号

首次访问 `https://admin.szht.online`，如果还没有管理员，页面会引导创建超级管理员。已有管理员时初始化入口关闭。

重置管理员密码只能在服务器本地执行：

```bash
cd /www/wwwroot/szht/server
npm run admin:reset-password -- admin
```

命令会生成一次性显示的新密码，并写入审计日志。

## 8. MySQL 备份计划

立即创建 MySQL 逻辑备份与上传目录快照：

```bash
cd /www/wwwroot/szht/server
npm run db:backup:mysql
```

宝塔计划任务或 cron 示例，每天 03:20 执行：

```cron
20 3 * * * cd /www/wwwroot/szht/server && npm run db:backup:mysql >> /www/wwwroot/szht-data/backups/mysql-cron.log 2>&1
```

备份文件默认写入 `DATA_DIR/backups`，上传目录会生成同名快照。正式推广前建议再接入异地备份和保留周期策略。

## 9. V1.0 上线前检查

正式上线前必须填写 `docs/V1_ACCEPTANCE_CHECKLIST.md`。本节只列技术侧最低门槛，业务全链路以验收清单为准。

- 服务器执行 `npm install`，不要复制本机 `node_modules`。
- 后端执行 `npm audit --omit=dev --audit-level=high`，确认没有 high/critical 漏洞。
- 展示端执行 `npm run build:server`。
- 管理端执行 `npm run build`。
- 后端执行 `npm run db:smoke:mysql:acceptance`。
- 后端执行 `npm run acceptance:v1:evidence` 并归档生成的证据文件。
- `/api/health` 必须显示 MySQL 正式运行态并且 `runtimeAligned=true`。
- `DATA_DIR` 不在 Nginx 静态根目录内，且 Node 进程有读写权限。
- `admin.szht.online` 只服务管理端。
- 登录、上传、创建档案、地图点选、提交审核、审核发布、公开接口读取、口述历史授权文件、导入导出、备份恢复都要在正式域名下走一遍。
- 手机端后台至少完成查看待办、审核内容、管理媒体三个动作。
- 在后台 `运维管理 -> V1.0 上线验收登记` 保存最终结论和遗留事项。

出现任一阻塞项时，不得正式上线；修复后重新执行机器验收和人工业务验收。
