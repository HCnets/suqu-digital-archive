# 苏区镇数字化档案 — 技术维护手册

> 版本：v2.7.2 | 更新日期：2026-05-17 | 维护者：HCnets

---

## 1. 项目架构概览

```
苏区镇建模/
├── client/                     # React 18 + TypeScript 前端
│   ├── public/                 # 静态资源（Favicon、验证文件）
│   │   ├── favicon.svg         # 浏览器标签页图标
│   │   ├── icons.svg           # PWA 大图标
│   │   └── *.txt               # SSL/域名验证文件
│   ├── src/
│   │   ├── App.tsx             # 主入口：GIS地图 + 所有UI叠加层
│   │   ├── main.tsx            # ReactDOM 挂载点
│   │   ├── index.css           # 全局样式、主题色、移动端媒体查询
│   │   ├── store/index.ts      # Zustand 状态管理 + 16条静态档案数据
│   │   └── components/
│   │       ├── map/GisMap.tsx  # MapLibre GL JS 3D地图引擎
│   │       └── ui/             # 全部UI组件
│   ├── dist/                   # 构建输出（GitHub Pages用，base=/suqu-digital-archive/）
│   ├── dist-server/            # 构建输出（自有服务器用，base=/）
│   ├── vite.config.ts          # GitHub Pages 构建配置
│   ├── vite.config.server.ts   # 自有服务器构建配置
│   └── package.json
├── server/                     # Express 后端 API（可选，前端有静态回退）
│   ├── index.js                # 主服务入口
│   └── archives.json           # 档案数据源
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions 自动部署流水线
├── docs/
│   └── MAINTENANCE.md          # 本文件
└── README.md                   # 项目纪年表
```

---

## 2. 双线部署架构

```
                  ┌──────────────────┐
                  │   开发者本地构建   │
                  └────────┬─────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼                             ▼
   npm run build                  npm run build:server
   (dist/ 目录)                   (dist-server/ 目录)
   base=/suqu-digital-archive/    base=/
            │                             │
            ▼                             ▼
   git push origin main          FTP/宝塔上传到 szht.online
   └→ GitHub Actions             └→ /www/wwwroot/szht.online/
      └→ gh-pages 分支
         └→ hcnets.github.io
```

### 2.1 GitHub Pages 部署

每次 `git push origin main` 自动触发 `.github/workflows/deploy.yml`：
1. `npm ci` → `npm run build` → `peaceiris/actions-gh-pages` → 推送 `gh-pages` 分支
2. GitHub 内置 `pages-build-deployment` 自动发布

### 2.2 自有服务器部署（szht.online 宝塔面板）

1. 本地构建：`npm run build:server`
2. 宝塔面板 → 文件管理器 → `/www/wwwroot/szht.online/`
3. 上传 `dist-server/` 下所有文件覆盖
4. Nginx 配置（见第 3 节）

---

## 3. 宝塔 Nginx 完整配置

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name szht.online;
    index index.html index.htm default.htm default.html;
    root /www/wwwroot/szht.online;
    include /www/server/panel/vhost/nginx/extension/szht.online/*.conf;
    include /www/server/panel/vhost/nginx/well-known/szht.online.conf;

    # SPA 前端路由 — 必须保留
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|\.project|LICENSE|README.md) {
        return 404;
    }

    location ~ \.well-known{
        allow all;
    }

    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$ {
        expires 30d;
        error_log /dev/null;
        access_log /dev/null;
    }

    location ~ .*\.(js|css)?$ {
        expires 12h;
        error_log /dev/null;
        access_log /dev/null;
    }

    access_log /www/wwwlogs/szht.online.log;
    error_log /www/wwwlogs/szht.online.error.log;
}
```

---

## 4. 关键技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 18 | UI 渲染 |
| 语言 | TypeScript | ~6.0 | 静态类型 |
| 构建 | Vite | ~8.0 | 开发/打包 |
| 样式 | Tailwind CSS | V4 | 原子化样式 |
| 状态 | Zustand | - | 全局状态管理 |
| 地图 | MapLibre GL JS | - | 3D GIS 引擎 |
| 3D | Three.js | - | 文物展台/BIM |
| 后端 | Express.js | - | API（可选） |

---

## 5. 主题色规范

| 用途 | 色值 | 用途 |
|------|------|------|
| 中国红 | `#C41E3A` | 革命遗址标识、主要按钮、重点文字 |
| 琉璃金 | `#8B6914` | 文化阵地标识、金色按钮、装饰线 |
| 锌灰 | `#5C5C5C` | 党政点位标识、次要文字 |
| 博物馆白底 | `#FEFAF6` | 全局背景、卡片底色 |
| 边框色 | `#E8DFD5` | 卡片边框、分隔线 |
| 深墨色 | `#1A1A1A` | 标题文字、重要内容 |

字体：标题/正文使用 Noto Serif SC（宋体），数据使用系统等宽字体。

---

## 6. z-index 层级系统

修改 z-index 时必须严格遵守此规范：

```
z-[100]   开场幕布
z-[80]    ArchiveDetailModal 档案详情模态框
z-[60]    POI 信息卡（地图点位弹出卡片）
z-50      SwipeMode / FpsOverlay / RelicShowcase / IndoorBim 全屏模式
z-[50]    HudDashboard（移动端叠加层）
z-[45]    移动端遮罩
z-40      HudDashboard / RightDataPanel / TimeSlider / WeatherSystem
z-10      GisMap 上层 UI（Header、MapStyleSwitcher 等）
z-0       GisMap 地图层
```

---

## 7. 档案数据管理

档案数据存储在 `client/src/store/index.ts` 的 `STATIC_ARCHIVES` 对象中。

### 添加新档案步骤：

1. 打开 `client/src/store/index.ts`
2. 在 `STATIC_ARCHIVES` 对象中新增一个 key（格式参考现有条目）
3. 在 `HudDashboard.tsx` 的 `LEARNING_COURSES` 中添加对应课程
4. `npm run build && npm run build:server` 重新构建
5. 双线部署

### 档案字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识，kebab-case |
| title | string | 档案标题 |
| year | number | 建立年份 |
| type | 'revolution'\|'government'\|'culture' | 分类 |
| description | string | 简介（POI卡片用） |
| content | string | 正文（模态框用，支持 \u201C\u201D 中文引号） |
| longitude | number | 经度 |
| latitude | number | 纬度 |
| media | array | 图片列表，url 支持外部 URL，加载失败自动回退 SVG 占位图 |

---

## 8. 常见问题排查

### 页面白屏 / 空白
1. **GitHub Pages**：检查 base 是否为 `/suqu-digital-archive/`（看 `vite.config.ts`）
2. **自有服务器**：检查是否用了 `dist-server/` 文件（base=`/`）
3. 打开浏览器 F12 → Console 看报错信息

### 地图不显示
1. MapLibre GL JS 需要 WebGL 支持
2. 底图瓦片可能被墙（自有服务器无此问题）

### 图片不显示
- 所有图片加载失败时自动回退为博物馆风格 SVG 占位图，不影响使用

### 点击没反应
- 检查浏览器控制台是否有 JS 错误
- 检查 z-index 层级是否被其他元素遮挡

### 服务器刷新 404
- 确认 Nginx 配置中有 `try_files $uri $uri/ /index.html;`

---

## 9. 构建命令速查

```bash
cd client

# GitHub Pages 构建
npm run build                 # 输出到 dist/

# 自有服务器构建
npm run build:server          # 输出到 dist-server/

# 本地开发
npm run dev                   # 启动开发服务器

# 手动部署到 GitHub Pages
npx gh-pages -d dist
```

---

## 10. SSL 证书 / 域名验证

### 添加验证文件
1. 将验证 `.txt` 文件放入 `client/public/` 目录
2. 同时复制到 `client/dist/` 和 `client/dist-server/`（构建时自动包含）
3. 部署后通过 `https://域名/验证文件名` 即可访问

### 当前验证记录
| 文件名 | 状态 |
|--------|------|
| `fbb492fadd72421448b363f6e14b4d9a.txt` | ✅ 已部署 |

---

## 11. GitHub 仓库信息

| 项 | 值 |
|----|-----|
| 仓库地址 | https://github.com/HCnets/suqu-digital-archive |
| Pages 地址 | https://hcnets.github.io/suqu-digital-archive/ |
| 主分支 | main |
| Pages 分支 | gh-pages |
| CI/CD | .github/workflows/deploy.yml |
