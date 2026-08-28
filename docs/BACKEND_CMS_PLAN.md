# 苏区镇数字档案 CMS 后端化总计划书

## 1. 项目目标

将当前展示型前端升级为“展示端 + 独立管理端 + 后端内容管理系统”的正式生产架构。

目标：

- 展示端只消费已发布、已审核的数据。
- 管理端独立部署在 `admin.szht.online`，与展示端隔离。
- 所有前端静态内容逐步迁移到数据库，由后台统一管理。
- 支持多账号、多角色、自定义权限、可配置审核流。
- 支持资料来源、敏感等级、版本留痕、操作审计、回收站、备份恢复。
- 支持图片/视频上传、分类管理、自定义水印、缩略图与压缩能力预留。
- 面向 Linux + 宝塔 + Nginx + MySQL + Node.js 正式服务器部署。

## 2. 站点架构

正式域名规划：

- 展示端：`https://szht.online`
- 管理端：`https://admin.szht.online`
- API：建议 `https://api.szht.online`，也可先由管理端/展示端反代到同一 Node 服务。

本地开发规划：

- 展示端：`http://localhost:3001`
- 管理端：`http://admin.localhost:3001` 或 `http://localhost:3002`
- API：`http://localhost:3001/api`

应用结构建议：

- `client/`：现有展示端，仅负责展示。
- `admin/`：新增独立 React 管理端。
- `server/`：Node.js + Express API 服务。
- `server/uploads/`：本地上传文件目录。
- `server/scripts/`：管理员初始化、密码重置、备份恢复等命令脚本。

## 3. 技术选型

后端：

- Node.js + Express
- MySQL 8.x
- JWT + Refresh Token 或服务端 Session
- bcrypt/argon2 密码哈希
- multer 文件上传
- sharp 图片压缩、缩略图、水印
- ffmpeg 能力预留，服务器安装后启用视频压缩与封面截帧

前端：

- 展示端继续使用现有 React/Vite。
- 管理端新增独立 React/Vite 应用，实用型 CMS 风格，高密度、强筛选、强表格操作。

数据库：

- 本地开发优先用 Docker MySQL；如果本机暂时没有 Docker，可以先写好 MySQL 代码与迁移脚本，再用服务器测试库联调。
- 正式部署使用服务器已有 MySQL，通过 phpMyAdmin 可查看数据，但业务操作仍走后台。

## 4. 账号与安全

账号初始化：

- 首次部署时，网页端展示初始化向导，创建第一个超级管理员。
- 超管创建后，初始化入口永久关闭。
- 后续不能在网页查看任何管理员明文密码。
- 忘记密码只能通过服务器命令重置，例如：
  - `npm run admin:reset-password username`
  - `npm run admin:create-login-link username`

登录安全：

- 默认登录有效期 8 小时。
- “记住我”有效期 7 天。
- 强密码策略。
- 登录失败锁定。
- 登录/登出/失败登录全部写入审计日志。
- 生产环境必须启用 HTTPS。

账号字段：

- 用户名
- 真实姓名
- 手机号
- 邮箱
- 部门
- 角色
- 状态
- 备注
- 最近登录时间
- 创建人
- 创建时间

## 5. 角色与权限

默认角色：

- 超级管理员：全权限。
- 内容编辑：创建草稿、编辑内容、提交审核、上传媒体、查看自己的内容。
- 审核员：审核/驳回/下架内容、查看来源依据、处理留言。
- 数据运营：导入导出、批量编辑、统计查看，不默认拥有终审权限。
- 讲解员：查看已发布内容、查看导览资料、可提交修订建议。
- 只读观察员：只读查看后台内容和统计。

权限支持角色模板 + 单账号额外权限覆盖。

权限点：

- 用户管理
- 角色管理
- 内容创建
- 内容编辑
- 内容删除
- 审核
- 终审
- 发布/下架
- 媒体管理
- 导入导出
- 备份恢复
- 日志查看
- 系统设置
- 批量编辑
- 回收站清空

## 6. 内容模型

采用“统一内容主表 + 模块扩展字段”的设计。

统一内容能力：

- 标题
- 摘要
- 正文
- 内容类型
- 分类
- 标签
- 状态
- 版本号
- 来源依据
- 敏感等级
- 风险类型
- 审核流程
- 创建人
- 当前负责人
- 发布时间
- 下架时间
- 删除时间

模块扩展：

- 档案点位：经纬度、年份、点位类型、媒体、地图展示配置。
- 群众留言：称呼、身份、留言内容、IP、审核状态。
- 致敬计数：计数规则、展示值、统计日志。
- 红歌：歌名、歌词、作者/来源、音频、时代背景。
- 红色影视：片名、年份、类型、海报、简介、关联说明。
- 英雄谱：姓名、生卒年、身份、事迹、头像、关联档案。
- 党史题库：题目、选项、答案、解析、难度、分类。
- 党日路线：路线名称、站点序列、时长、适用对象、导出文本。
- 全景点位：全景图/视频、热点、说明。
- 导览路线：路线、讲解词、音频/文本、适用场景。
- 打卡护照：打卡点、徽章、规则、记录。
- 群众共创：回信、投稿、共创内容、审核备注。

## 7. 审核流

审核状态：

- 草稿
- 待审核
- 初审中
- 终审中
- 已发布
- 已驳回
- 已下架
- 已删除

流程规则：

- 档案/史料：编辑提交 -> 审核员初审 -> 超管终审 -> 发布。
- 群众留言：审核员一审 -> 发布。
- 红歌/影视/路线/题库/英雄谱：审核员初审 -> 超管终审 -> 发布。
- 审核流程必须支持后台按模块配置。
- 驳回原因可选。
- 驳回回到被驳回节点。
- 已发布内容再编辑时生成新版本，旧版本继续展示，新版本审核通过后替换。

前台展示规则：

- 只展示 `已发布` 内容。
- 草稿、待审核、驳回、下架、删除内容不进入前台公开 API。

## 8. 来源依据与敏感等级

每条内容必须支持来源依据：

- 来源类型
- 来源标题
- 来源链接
- 出版物/档案编号
- 页码
- 采集人
- 采集时间
- 附件
- 可信等级
- 审核备注

敏感等级：

- 普通
- 需注意
- 敏感
- 重大敏感

风险类型：

- 史实来源不足
- 政治表述风险
- 人物称谓风险
- 地图边界/地名风险
- 版权风险
- 其他

## 9. 媒体库与上传

上传能力：

- 图片：jpg、jpeg、png、webp、gif。
- 视频：mp4、mov、webm。
- 按模块分类目录保存。
- 自动生成缩略图。
- 图片压缩。
- 自定义水印文字、位置、透明度、是否启用。
- 视频压缩与封面截帧预留 ffmpeg，服务器安装后开启。

目录建议：

- `/uploads/archives/`
- `/uploads/heroes/`
- `/uploads/songs/`
- `/uploads/films/`
- `/uploads/panoramas/`
- `/uploads/routes/`
- `/uploads/sources/`

## 10. 导入导出与备份

导入：

- Excel
- CSV
- JSON

导入策略：

- 跳过错误行。
- 成功行入库。
- 错误行生成错误报告下载。
- 支持批量替换图片路径。

导出：

- Excel 内容导出。
- CSV 快速导出。
- JSON 全量导出。
- Word/PDF 审核报告预留。

备份恢复：

- MySQL 逻辑备份。
- 上传文件目录备份。
- 一键创建备份。
- 备份列表查看。
- 备份恢复。
- 所有备份/恢复行为写审计日志。

## 11. 回收站

删除采用逻辑删除。

能力：

- 删除后进入回收站。
- 支持恢复。
- 支持永久删除。
- 支持立即清空回收站。
- 清空操作必须有高权限，并写审计日志。

## 12. 后台页面规划

基础页面：

- 登录页
- 首次初始化页
- 工作台首页
- 用户管理
- 角色与权限
- 审核流程配置
- 系统设置
- 操作日志
- 备份恢复

内容页面：

- 档案点位管理
- 留言审核
- 致敬计数管理
- 媒体库
- 红歌管理
- 影视资料管理
- 英雄谱管理
- 党史题库管理
- 党日路线管理
- 全景点位管理
- 导览路线管理
- 打卡护照管理
- 群众共创管理

列表通用能力：

- 关键词搜索
- 状态筛选
- 分类筛选
- 创建人筛选
- 审核人筛选
- 时间范围
- 批量操作
- 导入导出
- 列显示配置

## 13. API 规划

认证：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/setup/admin`

用户权限：

- `/api/admin/users`
- `/api/admin/roles`
- `/api/admin/permissions`

内容：

- `/api/admin/contents`
- `/api/admin/contents/:id/versions`
- `/api/admin/contents/:id/submit`
- `/api/admin/contents/:id/review`
- `/api/admin/contents/:id/publish`
- `/api/admin/contents/:id/unpublish`
- `/api/admin/contents/:id/trash`
- `/api/admin/contents/:id/restore`

媒体：

- `/api/admin/media`
- `/api/admin/media/upload`
- `/api/admin/media/:id`

运维：

- `/api/admin/audit-logs`
- `/api/admin/backups`
- `/api/admin/import`
- `/api/admin/export`
- `/api/admin/settings`

前台公开 API：

- 只返回已发布内容。
- 不返回后台审核信息、来源附件内部信息、操作日志等敏感字段。

## 14. 数据库主要表

核心表：

- `admin_users`
- `roles`
- `permissions`
- `role_permissions`
- `user_role_overrides`
- `sessions`
- `login_attempts`
- `contents`
- `content_versions`
- `content_sources`
- `content_review_tasks`
- `review_workflows`
- `review_workflow_steps`
- `media_assets`
- `audit_logs`
- `backups`
- `import_jobs`
- `system_settings`

模块扩展表：

- `archive_details`
- `message_details`
- `tribute_counters`
- `song_details`
- `film_details`
- `hero_details`
- `quiz_details`
- `route_details`
- `panorama_details`
- `checkin_details`
- `cocreation_details`

## 15. 开发阶段

### 阶段 1：基础后台骨架

- 新增 `admin/` 独立管理端。
- 后端切换 MySQL 配置层。
- 初始化超管流程。
- 登录、退出、会话刷新。
- 用户、角色、权限基础表。
- 审计日志基础能力。

### 阶段 2：统一内容与审核流

- 统一内容模型。
- 内容版本管理。
- 可配置审核流程。
- 草稿/提交/审核/驳回/发布/下架/删除。
- 前台 API 改为只读已发布内容。

### 阶段 3：档案、留言、媒体库

- 档案点位后台管理。
- 留言审核。
- 媒体上传、缩略图、图片压缩、水印。
- 现有档案数据迁移。

### 阶段 4：全模块迁移

- 红歌、影视、英雄谱、题库、路线、全景、导览、打卡、共创全部迁移。
- 前端移除静态主数据依赖。
- 每个模块接入统一审核与版本。

### 阶段 5：导入导出、备份恢复、批量能力

- Excel/CSV/JSON 导入导出。
- 错误报告。
- 批量发布、下架、删除、分类修改、图片路径替换。
- MySQL 与上传目录备份恢复。
- 回收站清空。

### 阶段 6：部署与加固

- Nginx 反代配置。
- `szht.online`、`admin.szht.online`、可选 `api.szht.online`。
- HTTPS。
- PM2 或 Docker 部署。
- 生产环境安全检查。
- 数据库备份计划。

## 16. 当前优先执行顺序

第一步先做阶段 1：

1. 创建 `admin/` 管理端项目。
2. 后端引入 MySQL 配置和迁移脚本。
3. 建立账号、角色、权限、会话、审计日志表。
4. 实现首次初始化超管。
5. 实现登录和权限校验。
6. 管理端完成登录页、初始化页、后台框架页、用户管理页。

阶段 1 完成后，再推进统一内容和审核流。
