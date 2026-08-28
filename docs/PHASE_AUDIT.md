# 当前阶段审计

更新时间：2026-07-15

## 阶段结论

上一阶段不是“全量完美完成”，但核心功能已经进入可继续推进状态。

已完成的部分包括后台运维入口、JSON 导入导出、SQLite 数据库备份恢复、回收站清空、内容与媒体批量编辑、审计日志筛选、内容详情/版本/来源/审核记录查看，以及媒体与内容回收站恢复/永久删除。

仍需继续收口的部分包括生产部署脚本、正式服务器 Nginx 配置、备份定时任务、后台依赖安装环境问题、后台中文文案乱码清理、MySQL 数据层迁移评估，以及已登录管理员端到端接口冒烟测试。

## 已完成

- 公共前端已收回为只读浏览，不再保留档案新增入口。
- 地图点击不再进入前台编辑草稿态。
- 管理端保持独立应用，使用 `HttpOnly Cookie + CSRF` 管理员登录态。
- 首次启动支持网页端创建超级管理员；创建后初始化入口关闭。
- 旧版管理写接口不再因为开发环境缺少 `ADMIN_TOKEN` 自动放行。
- 服务端已补充 `SESSION_COOKIE_DOMAIN` 和 `CORS_ORIGIN` 生产部署参数。
- 后台新增运维管理入口，支持备份列表、立即备份、JSON 导出、JSON 导入、备份恢复、清空回收站。
- 操作日志支持关键词、动作、对象类型、操作者与日期范围筛选。
- 内容管理新增筛选、详情查看、版本记录、来源证据查看。
- 内容详情新增审核记录，包含节点、角色、状态、审核人、意见与处理时间。
- 回收站内容支持单条恢复与单条永久删除。
- 媒体库支持上传、分类/水印/压缩元数据管理、查看回收站、单条恢复与单条永久删除。
- 媒体接口不再向管理端响应暴露服务端存储绝对路径。
- 内容批量编辑已实现，可批量更新模块、分类、敏感等级。
- 媒体批量编辑已实现，可批量更新分类、替代文本、说明、水印、压缩开关。
- 批量编辑会写入审计日志。
- 内容批量编辑复用版本与审核安全逻辑，更新后回到草稿态，并取消旧待审任务。
- 已新增正式部署说明，覆盖 `szht.online`、`admin.szht.online`、Nginx 反向代理、环境变量、首次管理员、备份计划。
- 已新增服务器本地备份脚本，备份 SQLite 数据库与上传目录快照，供宝塔计划任务或 cron 调用。
- 后台立即备份会同时生成数据库备份和同名上传目录快照；恢复时会优先恢复同名上传目录快照。
- 导入接口已补充坏 JSON 处理，不合法 JSON 现在返回 `400 INVALID_JSON`，不再返回 `500 INTERNAL_ERROR`。
- 全量导入成功后会明确返回 `sessionInvalidated`，后台会提示重新登录，避免后续操作才突然 401。
- 后台 API 遇到 `401` 会自动回到登录态并显示会话提示。
- `/api/health` 已移除数据库绝对路径，避免生产环境暴露服务器目录结构。
- 生产环境响应头会增加 `Strict-Transport-Security`。
- 本地初始化超级管理员时发现弱密码等错误提示偏英文，已补充后端中文错误消息和前端错误码中文化。
- 后台媒体库、内容管理批量编辑、运维管理等高频页面英文文案已中文化。
- 审核员验收发现审核任务只能看到列表摘要，无法查看正文和来源证据；已放开审核员/终审员读取内容详情权限，并在审核任务页增加“详情”入口。
- 登录页默认用户名已改为空，避免退出后默认暴露 `admin`。
- 前台验收发现档案地图是点位型展示，普通已发布档案内容如果缺少经纬度会被转成 `0,0` 点位，并可能覆盖旧地图点；已修复 `/api/archives`，现在保留原有有效点位，只合并带有效经纬度的已发布 CMS 档案。
- 媒体库验收通过上传、编辑、删除、回收站恢复流程；处理备注中 `Image compressed...` 等英文已在后台展示层翻译为中文。
- Codex 内置浏览器不支持下载导出文件时，运维页已增加“复制 JSON”和“查看导出内容”兜底。

## 已验证

- `server/index.js` 语法检查通过。
- `server/scripts/create-backup.js` 语法检查通过。
- `server/scripts/reset-admin-password.js` 语法检查通过。
- `admin` 生产构建通过。
- `client` 服务器生产构建通过。
- `npm run db:backup` 已真实生成本地 SQLite 备份文件和同名上传目录快照。
- 隔离临时库已完成登录态冒烟测试：首次管理员创建、内容批量编辑、坏 JSON 导入、JSON 导出、JSON 导入、备份、恢复、导入后重新登录均通过。
- 本地 3001 后端已重启到最新代码，`/api/health` 正常返回。
- 本地 3001 的 `/api/health` 已确认不再包含 `database` 字段。
- `http://localhost:3001/admin` 已加载最新后台构建资源。
- 管理端 HTML、JS、CSS 资源 HTTP 状态均为 `200`。
- `server` 生产依赖 `npm audit --omit=dev --audit-level=moderate` 结果为 0 漏洞。
- 本地真实库已完成首次超级管理员创建，`/api/setup/status` 返回 `needsSetup: false`。
- 后台中文化构建通过，`/admin` 已加载最新构建资源。
- 内容编辑账号已完成新建内容和提交审核测试，待审任务已生成。
- 审核员账号已完成初审通过测试，内容已进入超级管理员终审节点。
- 审核任务详情修复后后台构建通过，`/admin` 已加载最新构建资源。
- 超级管理员终审通过后，公开内容接口可看到测试内容；地图点位接口已验证仍返回 16 个有效点位且不存在 `0,0` 坐标。
- 媒体库真实上传测试已写入审计日志，包含 upload、update、trash、restore。
- 媒体处理状态中文化构建通过，`/admin` 已加载最新构建资源。
- 导出 JSON 兜底交互构建通过，`/admin` 已加载最新构建资源。
- 前台展示联动本地验收通过：页面、地图点位、原有点位详情、前台互动均正常。
- `client` lint 通过，保留既有 10 条警告。
- `GET /api/health` 正常返回。
- 未登录访问审计日志、备份、导出、清空回收站均返回 `401`。
- 未登录访问内容管理、内容详情、单条永久删除均返回 `401`。
- 未登录访问媒体回收站、媒体恢复、媒体永久删除均返回 `401`。

## 本轮发现的问题

- `admin/node_modules` 仍是指向 `client/node_modules` 的临时 Junction，已移除。
- 本机 npm 安装 `admin` 依赖时反复遇到 `EBUSY` 缓存文件锁，使用新缓存目录也未成功；这是本机环境问题，仍需处理。
- `client` 依赖审计仍报告 Vite `8.0.13` 的 high 漏洞；`npm audit fix` 因本机 npm `EBUSY` 文件锁失败。该问题主要影响开发服务器，正式静态构建运行面较小，但 push/部署前建议在服务器或干净环境升级到修复版本。
- 当前数据库实现是 SQLite，不是最终服务器规划里的 MySQL；可以先本地开发和小规模上线试运行，但正式长期运行前建议单独做 MySQL 迁移阶段。
- 后台部分 UI 文案仍有中英混杂，早期文件存在乱码历史，后续需要统一清理。
- 导入/恢复/批量接口已在隔离临时库完成登录态冒烟测试；真实本地库还未创建超级管理员，所以真实库登录态测试尚未执行。
- 备份已覆盖 SQLite 数据库文件和上传目录快照，但还未实现异地备份、压缩打包和保留周期策略。
- 当前真实本地库已创建超级管理员；下一步需要继续做真实账号下的用户、权限、内容、审核、媒体、备份恢复全链路验收。
- 档案点位内容目前仍依赖“扩展数据 JSON”填写经纬度、年份、类型等地图字段；后续应把这些字段做成结构化表单，避免编辑人员发布无法上图的档案内容。
- 当前系统已完成从纯静态展示到可管理后台框架的本地闭环，但前端体验、内容建模、部署自动化、安全加固和数据迁移仍有优化空间。
- Vite 开发依赖审计仍需在干净 npm 环境中升级处理。

## 下一步

1. 处理本机 npm `EBUSY` 文件锁，让 `admin` 可以独立 `npm install && npm run build`。
2. 升级 `client` 的 Vite 到修复版本，并重新构建前后台。
3. 清理后台中文文案乱码和中英混杂问题。
4. 增加备份压缩打包、异地备份与备份保留策略。
5. 使用真实本地超级管理员继续跑后台登录态全链路验收。
6. 下一阶段重点进入“正式部署与安全加固”，随后再评估 MySQL 迁移。
## Phase 9 第一块：地区/项目配置中心

更新时间：2026-07-15

本轮已完成“地区/项目配置中心”的第一版真实后端与后台管理入口，作为后续多地区、多点位、前端展示模式、地图模式、地区权限和省级推广的基础设施。

### 已完成

- 后端新增 `regions` 数据表，支持省、市、县/区、镇/街道、村/社区、点位六级结构。
- 后端新增 `regions.manage` 权限，超级管理员默认拥有该权限。
- 后端默认种子地区树：广东省 / 河源市 / 紫金县 / 苏区镇，并将苏区镇设为默认项目。
- 后端新增地区项目 API：`GET /api/admin/regions`、`POST /api/admin/regions`、`PUT /api/admin/regions/:id`、`DELETE /api/admin/regions/:id`。
- 地区写入校验已覆盖：必填名称、合法层级、合法前端展示模式、合法地图模式、父级存在、不能选择自己或下级作为父级、编码不重复、默认地区不能直接删除、有子地区不能删除。
- JSON 导入导出、备份恢复已纳入 `regions` 表，避免地区配置丢失。
- 后台左侧新增“地区项目”菜单。
- 后台新增地区项目页面，支持层级树查看、新建地区、编辑地区、添加子级、删除非默认无子级地区、启用/停用、设为默认项目、配置前端展示模式与地图模式。

### 已验证

- `node --check server/index.js` 通过。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地后端已重启并监听 `http://localhost:3001`。
- `GET /api/health` 正常。
- 未登录访问 `GET /api/admin/regions` 返回 `401`。
- 本地 SQLite 已确认默认地区树存在，且苏区镇为默认项目。
- 使用一次性本地测试超级管理员完成真实接口链路验证：登录、读取地区树、新建测试点位、更新测试点位、删除测试点位均通过。
- 一次性测试账号、测试会话与测试地区已清理。

### 后续衔接

- 下一块建议进入“档案点位结构化表单”，把经纬度、年份、类型、封面、媒体、来源、风险等级从扩展 JSON 中拆出来，和地区树建立真实归属关系。
- 之后再做前端点位详情页重构，让公开端根据默认地区和地图模式读取后台配置，而不是继续依赖静态展示逻辑。

## Phase 9 第二块：档案点位结构化表单

更新时间：2026-07-15

本轮开始前先复核了上一块“地区/项目配置中心”。主流程已完成：权限、菜单、地区树、CRUD、默认地区、真实接口烟测、后台构建均通过。本轮额外发现一个兼容性缺口：旧版 JSON 快照缺少 `regions` 表时会被新导入逻辑拒绝，已修复为兼容旧快照并在导入后自动种子默认地区。

### 已完成

- 后端新增 `GET /api/admin/region-options`，允许内容创建/编辑账号读取启用地区列表，不要求拥有地区管理权限。
- 档案点位内容创建新增结构化校验：
  - 必须选择有效所属地区。
  - 档案类型必须为 `revolution`、`government` 或 `culture`。
  - 年份必须在 1800 到 2100 之间。
  - 经纬度必须有效，且不能为 `0,0`。
  - 媒体列表必须为数组，最多 30 项。
- 档案点位结构化字段会写入内容版本 `data`，并保留兼容字段：`regionId`/`region_id`、`archiveType`/`archive_type`、`coverImage`/`cover_image`。
- 公开档案接口 `rowToPublicArchive` 已输出地区、地址、封面图等结构化字段，为后续前端点位详情页重构铺路。
- 后台内容管理在“档案点位”模块下新增结构化表单字段：
  - 所属地区
  - 档案类型
  - 年份
  - 经度
  - 纬度
  - 地址/位置说明
  - 封面图片路径
  - 媒体列表 JSON
- 后台内容详情新增“结构化数据”展示，审核员可直接查看入库后的点位字段。

### 已验证

- `node --check server/index.js` 通过。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地后端已重启并监听 `http://localhost:3001`。
- 使用一次性本地测试超级管理员完成真实接口烟测：读取地区选项、创建带地区/年份/经纬度的档案点位草稿、读取内容详情并确认结构化数据写入成功。
- 无效经纬度 `0,0` 的档案点位创建请求返回 `400`，后端校验生效。
- 一次性测试账号、测试会话与测试内容已清理。

### 注意

- 旧快照缺少 `regions` 表的兼容逻辑已写入并通过语法/构建检查；尝试启动第二个隔离 Node 服务做导入测试时，Windows 偶发返回“拒绝访问”，为避免干扰本地 3001 主服务，暂未继续强行跑隔离导入测试。

## Phase 9 第三块：公开端点位详情联动

更新时间：2026-07-15

本轮开始前复核了“档案点位结构化表单”。后端语法、后台构建、主服务健康、默认地区树、结构化点位真实创建、详情读取、无效坐标拦截、测试数据清理均通过。

### 已完成

- 公开端 `ArchiveData` 类型新增 `regionId`、`regionName`、`address`、`coverImage` 字段。
- 公开端档案读取逻辑兼容 `/api/archives` 返回数组或 `{ items }` 两种格式。
- 公开端档案数据归一化会过滤无效坐标，并规范媒体、封面图、类型等字段。
- 公开端详情弹窗优先使用后台封面图/媒体路径，失败后回退到本地兜底图，再失败才显示展陈占位图。
- 公开端详情弹窗新增“所属地区、资源类型、位置说明、经纬度”的展陈信息区。
- 后端旧档案接口 `rowToArchive` 已补齐 `regionId`、`regionName`、`address`、`coverImage`，让旧点位与后台发布点位使用同一公开端字段结构。

### 已验证

- `node --check server/index.js` 通过。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地后端已重启并监听 `http://localhost:3001`。
- `GET /api/health` 正常。
- `GET /api/archives` 返回 16 个点位，首个旧档案已包含 `regionId`、`regionName`、`address`、`coverImage`。
- `/` 与 `/admin` 均返回 HTTP 200。

### 后续衔接

- 下一步建议继续做“点位详情页深度展陈”：来源证据公开展示、媒体画廊选择、点位时间线、审核状态/可信度标记。
- 再下一步可把前端地图过滤与后台地区展示模式联动，让默认地区、总览模式、定位模式真正控制公开端地图范围。

## Phase 9 第四块：点位详情深度展陈

更新时间：2026-07-15

本轮开始前复核了“公开端点位详情联动”。后端语法、公开端服务端构建、后台构建、主服务健康、公开接口字段、页面 200、测试数据清理均通过。本轮发现一个部署流程风险：如果在服务运行时直接构建 `client/dist-server`，Vite 清空目录的瞬间访问 `/` 会短暂找不到 `index.html`。正式部署时应采用“构建到临时目录后原子切换”或先停服务再切换产物。

### 已完成

- 公开档案接口为后台发布点位新增公开来源证据字段 `sources`。
- 公开档案接口新增 `trustLevel`、`auditStatus`、`publishedAt` 字段。
- 旧基础点位补充来源兜底，标记为“历史基础资料”，不伪造具体权威证据。
- 公开端档案数据归一化新增来源证据、可信度、审核状态、发布时间、创建/更新时间字段。
- 点位详情弹窗新增媒体缩略图选择，用户可切换主图。
- 点位详情弹窗新增“展陈时间线”，展示历史年份、资料入库、最近更新、审核发布等信息。
- 点位详情弹窗新增“来源证据”，展示来源类型、标题、编号、页码、采集人、采集时间、可信度、备注和来源链接。
- 公开端继续保留无图时的展陈占位图兜底。

### 已验证

- `node --check server/index.js` 通过。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地后端已重启并监听 `http://localhost:3001`。
- `GET /api/health` 正常。
- `GET /api/archives` 返回 16 个点位，首个旧档案包含 1 条来源兜底，`trustLevel` 为“基础资料”，`auditStatus` 为 `legacy`。
- `/` 与 `/admin` 均返回 HTTP 200。
- 测试账号、测试内容残留为 0。

### 后续衔接

- 下一步建议进入“地区展示模式联动”：后台默认地区、总览模式、定位模式控制公开端地图点位范围和初始视角。
- 同时需要把运行中直接构建 `dist-server` 的部署风险写入正式部署流程，避免服务器上出现短暂前端 500。

## Phase 9 第五块：地区展示模式与公开端地图联动

更新时间：2026-07-15

本轮开始前复核了上一块“点位详情深度展陈”。后端语法、公开端服务端构建、后台构建、健康接口、公开档案字段、页面 200、测试数据清理均通过。本轮发现并补齐的关键缺口是：后台已经能管理默认地区、前端展示模式和地图模式，但公开端地图仍使用硬编码初始视角与全量点位列表，尚未真正受后台地区配置控制。

### 已完成

- 后端新增公开地区配置接口：`GET /api/regions/public-config`。
- 公开地区配置返回启用地区列表、默认地区、展示模式、地图模式、当前展示范围 `scopeRegionIds`、地图初始视角 `mapView`。
- `mapView` 会根据当前展示范围内的有效档案点位推导中心点、缩放、俯仰角与方位角；当前苏区镇默认结果为 `115.3405, 23.36, zoom 15`。
- 后端公开档案接口新增地区筛选能力：`GET /api/archives?regionId=region-suqu`，并支持父级地区自动包含下级地区。
- 公开端 store 新增 `regionConfig` 与 `fetchRegionConfig`，启动时读取后端地区配置。
- 公开端 `getAllArchives()` 已按后台展示模式过滤点位：`overview` 显示全部，`current` 和 `auto_location` 当前按默认地区范围兜底显示。
- 公开端地图初始化飞行动画、配置变更 flyTo、进入/退出第一人称视角均改为使用后端配置的 `mapView`。
- 公开端地图新增当前地区状态提示，展示地区名称、展示模式、地图模式和当前可见点位数量，便于验收配置是否真实生效。
- 修复公开端 lint 中的历史 Hook 问题：详情弹窗媒体状态、自动讲解依赖、3D 模式 cleanup、口述历史残留 ref、红歌播放器 cleanup。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端生产构建通过：`vite build --config vite.config.server.ts`。
- `admin` 生产构建通过：`vite build`。
- 本地 3001 服务已重启到最新后端代码。
- `GET /api/regions/public-config` 返回默认地区“广东省河源市紫金县苏区镇”、`displayMode=current`、`mapMode=single`、`scopeRegionIds=region-suqu`。
- `GET /api/archives` 返回 16 个有效点位。
- `GET /api/archives?regionId=region-suqu` 返回 16 个苏区镇点位。
- `GET /api/archives?regionId=region-not-exist` 返回空列表，不暴露异常。
- `/` 与 `/admin` 均返回 HTTP 200。
- 本地测试账号、测试内容残留为 0；地区节点数量为 4。

### 注意

- `client` 构建仍提示主包超过 500 kB，这是既有性能优化项，不影响本轮功能正确性。后续应拆分地图、Three.js、展陈弹窗等大模块。
- `auto_location` 当前按默认地区兜底，后续进入“地区切换/定位推荐”阶段时再接浏览器定位、IP 定位或展陈大屏配置策略。
- 当前地区配置已经能驱动公开端地图范围和初始视角；下一步可进入“地区切换、地区权限与内容归属联动”，让后台账号地区权限、公开端地区选择器、内容列表筛选进一步闭环。

## Phase 9 第六块：地区切换、账号地区权限与内容归属联动

更新时间：2026-07-15

本轮开始前复核了上一块“地区展示模式与公开端地图联动”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`GET /api/regions/public-config` 返回默认苏区镇配置，`GET /api/archives?regionId=region-suqu` 返回 16 个点位。上一块核心闭环成立。

### 已完成

- 后端新增 `user_regions` 表，用于记录后台账号可管理的地区节点。
- `user_regions` 已纳入 JSON 导入导出，并兼容旧快照缺少该表的情况。
- 后台用户返回体新增 `regionIds`、`regionScopeIds`、`allRegions`。
- 地区权限规则已落地：
  - `super_admin` 或拥有 `regions.manage` 的账号拥有全部地区。
  - 普通账号只能访问被授权地区及其下级地区。
  - 旧账号未配置地区时兜底到当前默认地区，避免现有本地测试流程突然失效。
- `GET /api/admin/region-options` 会按当前账号地区权限返回地区选项。
- 内容管理列表 `GET /api/admin/contents` 已按账号地区权限过滤。
- 内容详情、编辑、批量编辑、提交审核、审核、下架、移入回收站、恢复、永久删除均增加地区权限校验，防止知道内容 ID 后越权操作。
- 创建内容时校验目标 `regionId`，不能在未授权地区创建内容。
- 后台“用户管理”新增地区授权能力：
  - 新建用户时可勾选地区权限。
  - 用户列表中可调整普通账号地区权限并保存。
  - 超级管理员/全地区账号显示“全部地区”。
- 公开端 `GET /api/regions/public-config` 支持 `regionId` 参数。
- 公开端 store 新增 `selectedRegionId` 与 `selectRegion()`。
- 公开端地图左上地区状态条支持切换地区；当前只有苏区镇点位，切换上级地区时仍能通过下级范围看到苏区镇点位。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端生产构建通过：`vite build --config vite.config.server.ts`。
- `admin` 生产构建通过：`vite build`。
- 本地 3001 服务已重启到最新后端代码。
- `GET /api/regions/public-config?regionId=region-guangdong` 返回 `region-guangdong`、`displayMode=overview`、`mapMode=aggregate`、范围包含 4 个地区节点。
- `/` 与 `/admin` 均返回 HTTP 200。
- `user_regions` 表已自动创建。
- `GET /api/archives?regionId=region-guangdong` 返回 16 个点位，`region-suqu` 返回 16 个点位。
- 使用临时账号 `codex-region-test` 完成真实登录态验证：
  - 账号只授权 `region-suqu`。
  - `/api/auth/login` 返回 `allRegions=false`、`regionIds=region-suqu`、`regionScopeIds=region-suqu`。
  - `/api/admin/region-options` 只返回 `region-suqu`。
  - 尝试在 `region-guangdong` 创建内容返回 `403 REGION_FORBIDDEN`。
  - 临时账号、会话和授权记录已清理，测试残留为 0。

### 注意

- 当前内容地区归属主要来自档案点位结构化字段 `data.regionId`；非档案模块暂按默认地区兜底。后续做红歌、英雄谱、口述史等模块结构化时，应把 `regionId` 做成所有模块的通用字段。
- 公开端地区切换当前是手动切换；定位推荐仍按默认地区兜底，待后续“定位/展陈设备配置”阶段接入。
- `client` 构建仍提示主包超过 500 kB，仍属于性能优化项。

## Phase 9 第七块：所有内容模块统一地区归属

更新时间：2026-07-15

本轮开始前复核了上一块“地区切换、账号地区权限与内容归属联动”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`GET /api/regions/public-config?regionId=region-guangdong` 返回省级总览配置，`GET /api/archives?regionId=region-suqu` 返回 16 个点位，测试账号、测试内容、测试地区授权残留均为 0。上一块核心闭环成立。

### 已完成

- 后端内容规范化新增通用地区归属处理，所有内容模块都会写入：
  - `data.regionId`
  - `data.region_id`
  - `data.regionName`
  - `data.region_name`
- 非档案模块不再只隐式依赖默认地区；创建时可明确选择地区。
- 档案点位仍保留原有结构化校验：地区、类型、年份、经纬度、封面、媒体等字段继续强校验。
- 后台内容列表支持 `regionId` 筛选，并与当前账号地区权限同时生效。
- 公开内容接口 `GET /api/contents` 支持 `regionId` / `region_id` 筛选。
- 公开内容接口返回体新增 `regionId`、`regionName`，便于后续红歌、英雄谱、口述史、影视、群众共创等公开板块按地区取数。
- 后台内容创建表单将“所属地区”提升为所有模块通用字段，不再只出现在档案点位中。
- 后台内容列表新增“地区”列。
- 后台内容详情在当前版本信息中展示“所属地区”。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端生产构建通过：`vite build --config vite.config.server.ts`。
- `admin` 生产构建通过：`vite build`。
- 本地 3001 服务已重启到最新后端代码。
- 使用临时超级管理员账号创建非档案模块 `song` 内容，详情中确认：
  - `regionId=region-suqu`
  - `regionName=广东省河源市紫金县苏区镇`
  - `currentVersion.data.regionId=region-suqu`
- 使用临时普通账号仅授权 `region-suqu`，尝试创建 `region-guangdong` 的非档案 `song` 内容，后端返回 `403 REGION_FORBIDDEN`。
- 临时账号、会话、授权记录和测试内容已清理，测试残留为 0。
- `/` 与 `/admin` 均返回 HTTP 200。
- `GET /api/contents?regionId=region-suqu` 正常返回地区筛选结果。
- `GET /api/contents?regionId=region-not-exist` 返回空列表，不暴露异常。

### 注意

- 目前只是统一“地区归属”这个横切字段；各非档案模块自己的专属字段，例如红歌歌词/音频、英雄人物生平、口述史音频、影视链接等，仍需后续逐模块结构化。
- 批量编辑暂未开放批量迁移地区，避免误把敏感内容跨地区移动；后续可单独加“批量变更地区”并要求二次确认和审计日志。
- `client` 构建仍提示主包超过 500 kB，仍属于性能优化项。

## Phase 9 第八块：首批非档案模块专属结构化字段

更新时间：2026-07-15

本轮开始前复核了上一块“所有内容模块统一地区归属”：`server/index.js` 语法检查通过，`client` lint 通过，`GET /api/contents?regionId=region-suqu` 可返回苏区镇内容，`region-not-exist` 返回空列表，临时测试用户、内容、地区授权残留均为 0。上一块核心闭环成立。

### 已完成

- 后端内容模块新增 `oral_history`，名称为“口述历史”，并纳入既有通用双审流程。
- 后端 `normalizeContentInput()` 新增首批非档案模块专属归一化：
  - `song`：规范 `title`、`source`、`origin`、`year`、`years`、`lyrics`、`audioUrl`、`singer`、`composer`、`lyricist`。
  - `hero`：规范 `name`、`role`、`years`、`category`、`story`、`legacy`、`quote`、`portraitUrl`。
  - `film`：规范 `title`、`year`、`type`、`description`、`connection`、`coverImage`、`videoUrl`、`accent`。
  - `oral_history`：规范 `narrator`、`name`、`age`、`title`、`content`、`transcript`、`date`、`recordedAt`、`emotion`、`audioUrl`。
- 服务端继续保留所有模块通用地区字段：`regionId`、`region_id`、`regionName`、`region_name`。
- 后台“统一内容”新建表单新增模块专属字段，不再要求管理员靠手写扩展 JSON 完成首批模块录入。
- 后台红歌表单支持年份、来源、演唱者、作词、作曲、音频路径和逐行歌词。
- 后台英雄谱表单支持人物姓名、身份/职务、生卒/活动年代、人物类别、头像/照片路径、精神传承/引语。
- 后台红色影视表单支持年份、影视类型、封面图片路径、视频路径、主题色、本地资源关联说明。
- 后台口述历史表单支持讲述人、年龄、记录时间/来源、情感标签、音频路径、口述正文。
- 公开端口述历史组件新增 CMS 接入：优先读取 `GET /api/contents?moduleKey=oral_history` 的已发布内容，无数据或接口不可用时保留本地兜底记录。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端生产构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启到最新后端代码。
- 真实接口烟测通过：使用临时超级管理员会话创建并读取 `song`、`hero`、`film`、`oral_history` 内容，确认结构化字段写入并可从详情读回。
- 额外验证 `film` 的中文类型“纪录片”“电影”可正确保留，不会被归一化成默认类型。
- `content_modules` 已写入 `oral_history`。
- `/` 与 `/admin` 均返回 HTTP 200。
- 临时测试账号、会话、内容残留均为 0。

### 注意

- 公开端红歌、英雄谱、红色影视此前已经能读取 CMS；本轮主要补齐后台结构化字段与后端校验。口述历史是本轮新增真实 CMS 接入。
- 本轮只覆盖首批 4 个高频展示模块；红色家书、标语、法令、英烈名录、妇女革命、地名渊源、根据地史、文物图鉴、题库、党日路线、全景点位、导览路线、打卡护照、群众共创等仍需继续逐模块字段化。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第九块：资源文库模块结构化字段

更新时间：2026-07-15

本轮开始前复核了上一块“首批非档案模块专属结构化字段”：`server/index.js` 语法检查通过，`client` lint 通过，`GET /api/contents?moduleKey=song|hero|film|oral_history` 均返回正常结构，`content_modules` 中存在 `song`、`hero`、`film`、`oral_history`，临时结构化测试内容与测试账号残留均为 0。上一块核心闭环成立。

### 已完成

- 后端新增 `RESOURCE_HUB_MODULES`，覆盖：
  - `letters` 红色家书
  - `slogans` 红军标语
  - `decrees` 苏维埃法令
  - `martyrs` 英烈名录
  - `women` 妇女革命
  - `origin` 地名渊源
  - `history` 根据地史
  - `relics` 文物图鉴
- 后端 `normalizeContentInput()` 对上述 8 个资源文库模块新增统一结构化归一化。
- 资源文库模块统一支持：
  - `pageTitle` / `page_title`
  - `title`
  - `subtitle`
  - `time`
  - `date`
  - `source`
  - `location`
  - `author`
  - `imageUrl` / `image_url`
  - `text`
  - `description`
  - `items`
- `items` 支持多条卡片，每条规范为 `title`、`subtitle`、`text`、`year`、`source`、`location`、`author`、`imageUrl`。
- 后端校验要求资源文库内容至少有正文，或至少有一个有效条目，避免空内容进入审核链路。
- 后台“统一内容”新建表单对 8 个资源文库模块新增专属字段：
  - 文库栏目标题
  - 条目副标题
  - 时间/年代
  - 来源/分类
  - 地点
  - 作者/人物
  - 图片路径
  - 多条目 JSON（可选）
- 公开端 `RedResourceHub` 修复“苏区歌谣”模块键：从不存在的 `songs` 改为后端真实模块 `song`，让后台红歌可以进入资源文库展示。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端生产构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启到最新后端代码。
- 真实接口烟测通过：使用临时超级管理员会话分别创建并读取 `letters`、`slogans`、`decrees`、`martyrs`、`women`、`origin`、`history`、`relics` 8 类内容，确认 `items`、`pageTitle`、地区字段均正确写入并可从详情读回。
- `GET /api/contents?moduleKey=song&pageSize=1` 返回结构正常。
- `/` 与 `/admin` 均返回 HTTP 200。
- 临时测试账号、会话、测试内容残留均为 0。

### 注意

- 资源文库这批模块采用统一“栏目 + 条目卡片”模型，适合当前 `RedResourceHub` 展示形态；后续如果某一类需要更复杂字段，例如英烈名录的籍贯/牺牲时间/部队番号，文物图鉴的尺寸/材质/馆藏编号，可在此模型上继续细分。
- 目前后台的“多条目 JSON”仍是可选增强入口，单条内容已可通过普通字段完成录入；后续可升级成可增删排序的可视化条目编辑器。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十块：互动与路线模块结构化字段

更新时间：2026-07-15

本轮开始前复核了上一块“资源文库模块结构化字段”：`server/index.js` 语法检查通过，`client` lint 通过，`GET /api/contents?moduleKey=letters|slogans|decrees|martyrs|women|origin|history|relics|song` 均返回正常结构，8 个资源文库模块均存在，临时资源文库测试内容与测试账号残留均为 0。上一块核心闭环成立。

### 已完成

- 后端新增 `INTERACTIVE_MODULES`，覆盖：
  - `quiz` 党史题库
  - `party_route` 党日路线
  - `tour_route` 导览路线
  - `panorama` 全景点位
  - `checkin` 打卡护照
  - `cocreation` 群众共创
- 后端 `normalizeContentInput()` 对上述 6 个互动/路线模块新增专属归一化。
- `quiz` 支持题目数组 `questions`，每题规范为 `q/question`、`options`、`answer`、`explanation`，并校验正确答案序号。
- `party_route` 支持 `target`、`duration`、`iconKey`、`color`、`pois`、`opening`、`description`，并校验至少一个点位 ID。
- `tour_route` 支持 `name/title`、`desc/description`、`color`、`icon/iconChar`、`items/stops`，每个站点规范为 `id`、`name/title`、`time`、`duration`、`description`。
- `panorama` 支持 `bgColor`、`accentColor`、`features`、`lat/lng`、`latitude/longitude`、`imageUrl`，并校验经纬度范围。
- `checkin` 支持 `certificateTitle`、`description`、`totalCount`、`stampLabel`、`certificateText`。
- `cocreation` 支持 `prompts/letters/items`，每条共创素材规范为 `author/name`、`role`、`excerpt`、`fullText`、`avatar`。
- 后台“统一内容”新建表单新增 6 类互动/路线模块专属字段：
  - 党日路线：适用对象、预计时长、图标关键词、主题色、路线点位 ID、开场讲解词。
  - 导览路线：路线图标、主题色、导览站点 JSON。
  - 党史题库：题库等级/分类、题目 JSON。
  - 全景点位：背景色、强调色、经纬度、全景图片路径、点位特征。
  - 打卡护照：打卡总数、证书标题、印章标签。
  - 群众共创：共创素材 JSON。
- 公开端 `RedQuiz` 新增 CMS 接入，优先读取 `quiz` 已发布题目，无数据时保留本地题库。
- 公开端 `RedPanorama` 新增 CMS 接入，优先读取 `panorama` 已发布全景点位，无数据时保留本地全景。
- 公开端 `PeopleCoCreation` 新增 CMS 共创素材接入，优先读取 `cocreation` 已发布家书/提示素材；留言提交继续走已有留言审核链路。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端生产构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启到最新后端代码。
- 真实接口烟测通过：使用临时超级管理员会话分别创建并读取 `quiz`、`party_route`、`tour_route`、`panorama`、`checkin`、`cocreation` 6 类内容，确认结构化字段、数组字段、经纬度和地区字段均正确写入并可从详情读回。
- `/` 与 `/admin` 均返回 HTTP 200。
- 临时测试账号、会话、测试内容残留均为 0。
- `git diff --check` 对本轮相关文件未发现 whitespace 错误。

### 注意

- `party_route` 与 `tour_route` 原本已经有公开端 CMS 读取，本轮主要补后端强校验与后台录入字段。
- `quiz`、`panorama`、`cocreation` 本轮从纯静态展示升级为优先读取已发布 CMS 内容；无审核发布内容时仍保留本地兜底，避免空屏。
- `checkin` 本轮完成后端和后台结构化字段，公开端证书配置尚未读取 CMS；下一步可把打卡总数、证书标题、证书正文接入展示端。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十一块：打卡护照公开端 CMS 配置接入

更新时间：2026-07-15

本轮开始前复核了上一块“互动与路线模块结构化字段”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`quiz`、`party_route`、`tour_route`、`panorama`、`checkin`、`cocreation` 的公开内容接口均返回正常结构，临时测试用户和内容残留为 0。上一块核心闭环成立，但确认 `CheckInPassport` 仍使用本地写死的打卡总数和证书文案，因此进入本块修复。

### 已完成
- 公开端 `CheckInPassport` 新增 CMS 配置读取，优先读取已发布 `checkin` 内容。
- 打卡护照支持从后台发布内容读取 `title`、`description`、`totalCount`、`certificateTitle`、`stampLabel`、`certificateText`。
- `HudDashboard` 侧栏打卡进度、完成状态和弹窗参数改为读取后台 `checkin.totalCount`，不再固定写死 16。
- 无已发布打卡配置或接口不可用时，保留本地默认 16 枚打卡兜底，避免公开端空白。

### 已验证
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启，`GET /api/health` 返回 200。
- 真实审核链路烟测通过：使用临时超级管理员创建 `checkin` 内容，提交审核，完成双审发布，公开接口 `GET /api/contents?moduleKey=checkin&pageSize=1` 可读取后台发布的 `totalCount=18`、证书标题和印章标签。
- `/` 与 `/admin` 均返回 HTTP 200。
- 临时测试账号、会话、内容版本、审核任务、内容残留均为 0。

### 注意
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十二块：今日苏区公开端 CMS 配置接入

更新时间：2026-07-15

本轮开始前复核了上一块“打卡护照公开端 CMS 配置接入”：后端语法、公开端 lint、后台构建、公开端双构建、真实 `checkin` 双审发布读取链路均通过，测试数据残留为 0。随后横向扫描公开端组件，确认 `TodaySuqu` 仍存在 `TODAY_DATA`、`BEFORE_AFTER` 静态数据，尚未纳入后台统一管理，因此进入本块修复。

### 已完成
- 后端新增内容模块 `today_suqu`，名称为“今日苏区”，纳入现有通用双审流程。
- 后端 `normalizeContentInput()` 新增 `today_suqu` 结构化归一化，支持：
  - `beforeYear` / `afterYear`
  - `transitionLabel`
  - `introBefore` / `introAfter`
  - `metrics` 数据指标数组
  - `comparisons` 今昔对比数组
- 后台统一内容创建表单新增“今日苏区”专属录入项：起始年份、对比年份、过渡标签、过去介绍、今日介绍、数据指标 JSON、今昔对比 JSON。
- 公开端 `TodaySuqu` 改为优先读取已发布 `today_suqu` CMS 内容，动态渲染顶部今昔说明、数据指标卡片、旧址今貌对比。
- 公开端保留本地兜底数据；无已发布 CMS 内容或接口不可用时不空屏。

### 已验证
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启，`GET /api/health` 返回 200。
- `content_modules` 已初始化出 `today_suqu`。
- 真实审核链路烟测通过：使用临时超级管理员创建 `today_suqu` 内容，提交审核，完成双审发布，公开接口 `GET /api/contents?moduleKey=today_suqu&pageSize=1` 可读取后台发布的数据指标和今昔对比。
- `/` 与 `/admin` 均返回 HTTP 200。
- 临时测试账号、会话、内容版本、审核任务、内容残留均为 0。

### 注意
- 当前“今日苏区”的后台多条数据仍通过 JSON 数组录入，已经能被后端校验和公开端渲染；后续可升级为可增删排序的可视化条目编辑器。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十三块：入党誓词互动墙 CMS 配置接入

更新时间：2026-07-15

本轮开始前复核了上一块“今日苏区公开端 CMS 配置接入”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`/api/health`、`/`、`/admin` 均返回 HTTP 200，`content_modules` 中存在 `today_suqu`，临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。随后横向扫描公开端静态数据，确认 `PartyOathWall` 的誓词全文、分句、完成提示和证书文案仍写死在前端，因此进入本块修复。

### 已完成
- 后端新增内容模块 `party_oath`，名称为“入党誓词”，纳入现有通用双审流程。
- 后端 `normalizeContentInput()` 新增 `party_oath` 结构化归一化，支持：
  - `oathText` / `oath_text`
  - `segments` / `oathSegments` / `oath_segments`
  - `completionTitle` / `completionText`
  - `certificateTitle` / `certificateText`
- 后端支持未填写分句时按誓词全文标点自动拆分，并限制分句数量，避免异常大数组进入审核链路。
- 后台统一内容创建表单新增“入党誓词”专属录入项：誓词全文、誓词分句 JSON、完成标题、完成提示、证书标题、证书说明。
- 公开端 `PartyOathWall` 改为优先读取已发布 `party_oath` CMS 内容，动态渲染标题、说明、分句进度、完成提示、证书标题和证书说明。
- 公开端保留本地默认入党誓词兜底；无已发布 CMS 内容或接口不可用时不空屏。

### 已验证
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启，`GET /api/health` 返回 200。
- `content_modules` 已初始化出 `party_oath`。
- 真实审核链路烟测通过：使用临时超级管理员创建 `party_oath` 内容，提交审核，完成双审发布，公开接口 `GET /api/contents?moduleKey=party_oath&pageSize=1` 可读取后台发布的分句、完成标题和证书标题。
- 临时测试账号、会话、内容版本、审核任务、内容残留均为 0。

### 注意
- 当前“入党誓词”的分句增强入口仍采用 JSON 数组；普通情况下只填写全文即可，后端会自动拆句。后续可升级为可视化分句编辑器。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十四块：历史时间轴 CMS 配置接入

更新时间：2026-07-15

本轮开始前复核了上一块“入党誓词互动墙 CMS 配置接入”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`/api/health`、`/`、`/admin` 均返回 HTTP 200，`content_modules` 中存在 `party_oath`，临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。随后继续横向扫描公开端静态数据，确认 `TimeSlider` 的年份范围、关键年份标记、历史事件标题/副标题仍写死在前端，因此进入本块修复。

### 已完成
- 后端新增内容模块 `timeline`，名称为“历史时间轴”，纳入现有通用双审流程。
- 后端 `normalizeContentInput()` 新增 `timeline` 结构化归一化，支持：
  - `minYear` / `maxYear`
  - `marks` / `markYears`
  - `events` / `items`
  - `helperText`
- 后端校验时间轴起止年份范围、结束年份大于起始年份、事件数组有效性和关键年份数量。
- 后台统一内容创建表单新增“历史时间轴”专属录入项：起始年份、结束年份、关键年份、历史事件 JSON、底部提示语。
- 公开端 `TimeSlider` 改为优先读取已发布 `timeline` CMS 内容，动态渲染年份范围、关键年份、当前事件标题/副标题和底部提示语。
- 公开端保留本地默认时间轴兜底；无已发布 CMS 内容或接口不可用时不空屏。
- 公开端对 CMS 年份范围做边界夹取，避免当前年份越界导致滑块比例异常。

### 已验证
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启，`GET /api/health` 返回 200。
- `content_modules` 已初始化出 `timeline`。
- 真实审核链路烟测通过：使用临时超级管理员创建 `timeline` 内容，提交审核，完成双审发布，公开接口 `GET /api/contents?moduleKey=timeline&pageSize=1` 可读取后台发布的起止年份、关键年份和事件数组。
- 临时测试账号、会话、内容版本、审核任务、内容残留均为 0。

### 注意
- 当前“历史时间轴”的事件增强入口仍采用 JSON 数组；后续可升级为可视化事件编辑器，并支持按地区/展陈设备切换不同时间轴版本。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十五块：档案点位展陈时间线字段接入

更新时间：2026-07-15

本轮开始前复核了上一块“历史时间轴 CMS 配置接入”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`/api/health`、`/`、`/admin` 均返回 HTTP 200，`content_modules` 中存在 `timeline`，临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。随后继续横向扫描公开端静态数据，确认 `ArchiveDetailModal` 的“展陈时间线”仍由前端根据年份、创建时间、更新时间、发布时间临时拼接，不能由后台按具体档案点位审核管理，因此进入本块修复。

### 已完成
- 后端档案点位 `archive` 结构化数据新增 `displayTimeline` / `display_timeline` 字段。
- 后端新增档案展陈时间线校验：要求数组结构，最多 40 项，每项规范为 `label` + `value`。
- 公开档案接口 `rowToPublicArchive()` 返回 `displayTimeline`，让 `/api/archives` 和 `/api/archives/:id` 都能暴露后台发布的展陈时间线。
- 后台“档案点位”创建表单新增“展陈时间线 JSON（可选）”，录入后随档案点位进入双审流程。
- 公开端 `ArchiveData` 类型和归一化逻辑新增 `displayTimeline`。
- 公开端 `ArchiveDetailModal` 的“展陈时间线”优先展示后台发布字段；未配置时保留原有自动生成兜底。

### 已验证
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启，`GET /api/health` 返回 200。
- 真实审核链路烟测通过：使用临时超级管理员创建带 `displayTimeline` 的 `archive` 内容，提交审核，完成双审发布，公开接口 `GET /api/archives/:id` 可读取后台发布的 2 条展陈时间线。
- 临时测试账号、会话、内容版本、审核任务、内容残留均为 0。

### 注意
- 当前档案点位展陈时间线仍通过 JSON 数组录入；后续可升级为后台可视化条目编辑器，支持拖拽排序、日期类型、来源绑定。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十六块：致敬仪式 CMS 配置接入

更新时间：2026-07-15

本轮开始前复核了上一块“档案点位展陈时间线字段接入”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`/api/health`、`/`、`/admin` 均返回 HTTP 200，档案模块存在，临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。随后继续横向扫描公开端静态数据，确认 `TributeCeremony` 的仪式标题、入党誓词、默哀说明、苏区精神和按钮文案仍写死在前端，因此进入本块修复。

### 已完成
- 后端新增内容模块 `tribute_ceremony`，名称为“致敬仪式”，与既有 `tribute` 致敬计数分离，纳入现有通用双审流程。
- 后端 `normalizeContentInput()` 新增 `tribute_ceremony` 结构化归一化，支持：
  - 仪式标题与说明
  - 誓词标题与正文
  - 默哀按钮、标题、说明、标语、倒计时秒数
  - 完成标题与说明
  - 苏区精神标题、文案、来源
  - 关闭按钮文案
- 后台统一内容创建表单新增“致敬仪式”专属录入项，覆盖完整三阶段仪式文案。
- 公开端 `TributeCeremony` 改为优先读取已发布 `tribute_ceremony` CMS 内容，动态渲染仪式、默哀、完成三个阶段。
- 公开端保留本地默认致敬仪式兜底；无已发布 CMS 内容或接口不可用时不空屏。

### 已验证
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`vite build`。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 本地 3001 服务已重启，`GET /api/health` 返回 200。
- `content_modules` 已初始化出 `tribute_ceremony`。
- 真实审核链路烟测通过：使用临时超级管理员创建 `tribute_ceremony` 内容，提交审核，完成双审发布，公开接口 `GET /api/contents?moduleKey=tribute_ceremony&pageSize=1` 可读取后台发布的默哀秒数、苏区精神文案和按钮文案。
- 临时测试账号、会话、内容版本、审核任务、内容残留均为 0。

### 注意
- `tribute_ceremony` 管理仪式文案；`tribute` 仍只负责致敬计数，两者职责已分离。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十七块：公开端档案静态兜底与图片托管收口

更新时间：2026-07-15

本轮开始前复核了上一块“致敬仪式 CMS 配置接入”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`/api/health`、`/`、`/admin` 均返回 HTTP 200，`/api/contents?moduleKey=tribute_ceremony&pageSize=1` 可读取已发布致敬仪式配置，临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。随后继续检查公开端是否仍携带未审核档案兜底，确认 `client/src/store/index.ts` 仍保留大段 `STATIC_ARCHIVES`，且档案详情页仍会按 `archive.id` 拼接前端静态图片路径，因此进入本块修复。

### 已完成

- 公开端移除 `STATIC_ARCHIVES` 大段静态档案数据，初始档案状态改为 `EMPTY_ARCHIVES`。
- `fetchArchives()` 在后端不可用、返回空数据或请求失败时，不再展示未审核的前端档案兜底。
- 档案详情页移除 `${BASE_URL}images/archives/${archive.id}.jpg` 这类按 ID 猜测图片的前端兜底，只展示后端返回的 `media.url` 或 `coverImage`。
- 将 `client/public/images` 迁移到 `server/public/images`，现有种子档案仍可通过后端 `/images/...` 路径访问，但不再被公开端构建打包。
- 后端新增 `PUBLIC_ASSET_DIR`，并在 SPA 静态托管之前注册 `/images` 静态资源出口，用于兼容现有 `/images/archives/...` 种子媒体路径。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务返回正常：`GET /api/health`、`GET /`、`GET /admin` 均为 HTTP 200。
- `GET /api/archives` 返回 16 个后端档案。
- `GET /images/archives/suqu-red-house.jpg` 返回 HTTP 200，确认迁移后的后端图片托管可用。
- 重新构建后，`client/dist` 与 `client/dist-server` 不再生成 `images` 目录。
- 源码中不再存在 `STATIC_ARCHIVES`，也不再存在档案详情页按 ID 拼接 `images/archives` 的前端兜底。
- 临时测试账号、测试内容、`codex-smoke` 会话残留均为 0。
- `git diff --check` 对本轮相关源码未发现 whitespace 错误，仅提示既有 LF/CRLF 转换警告。

### 注意

- 当前只是把现有种子媒体从“前端静态包”迁移到“后端托管静态资源”。后续正式内容应继续通过媒体库上传、压缩、水印、缩略图和审核流程进入 `/uploads`。
- 公开端仍有若干模块保留本地兜底文案或演示项，例如学习路线、导览路线、题库、群众互动默认留言等；下一轮应继续逐模块收口到后台可配置内容。
- `admin` 目录当前没有独立 `node_modules`。本机直接执行 `admin` 下的 `npm run build` 会因为缺少本地 `vite` 失败；尝试 `npm install` 时遇到 Windows npm 缓存文件锁 `EBUSY`。源码已用共享 Vite 构建验证通过，待文件锁释放后需要在 `admin` 目录补跑一次 `npm install`，让后台应用恢复独立构建闭环。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十八块：群众互动留言与致敬计数真实性收口

更新时间：2026-07-15

本轮开始前复核了上一块“公开端档案静态兜底与图片托管收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用用共享 Vite 构建通过；`/api/health`、`/`、`/admin` 均返回 HTTP 200；`/api/archives` 返回 16 个后端档案；`/images/archives/suqu-red-house.jpg` 返回真实 `image/jpeg`；公开端构建产物不再生成 `images` 目录；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。随后继续横向扫描公开端静态展示数据，确认 `RightDataPanel` 仍有 5 条写死的“群众心声”兜底留言，且致敬计数有前端初始值和本地自增兜底，因此进入本块修复。

### 已完成

- 公开留言接口 `GET /api/messages` 改为只返回已发布的 `message` CMS 内容。
- 当没有已审核发布留言时，公开接口返回空数组；不再回退读取旧 `messages` 种子表。
- 公开端 `RightDataPanel` 移除 5 条前端写死的群众留言兜底。
- 公开端群众留言面板仅展示后端返回的已审核发布留言；无数据时显示“当前暂无已审核发布留言”。
- 公开端致敬计数移除前端写死初始值，未同步时显示“待同步”。
- 点击致敬时不再本地自增造数；只有后端 `/api/tributes` 成功写入后才更新显示，失败时给出错误提示。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- 当前旧 `messages` 表仍有 6 条历史种子留言，但 `GET /api/messages` 返回 0 条，因为没有已发布 `message` CMS 内容，确认旧表不再绕过审核公开展示。
- 真实审核链路烟测通过：公开提交唯一测试留言返回 202；审核前 `GET /api/messages` 不包含该留言；临时超管通过后台审核接口审批后，`GET /api/messages` 才包含该留言。
- 烟测清理完成后，测试留言不再公开；临时测试账号、会话、内容残留均为 0。
- 本轮相关源码与构建产物中不再存在 `FALLBACK_MESSAGES`、`fallback-*` 伪留言、`useStaticMessages` 或前端伪计数自增逻辑。
- `git diff --check` 对本轮相关源码未发现 whitespace 错误，仅提示既有 LF/CRLF 转换警告。

### 注意

- 旧 `messages` 表保留为历史兼容数据和删除接口兼容对象，但公开展示已经不再读取它。后续可单独做“旧留言迁移/归档/清空”运维动作，避免历史种子数据长期留在生产库。
- 后端 `DEFAULT_TRIBUTE_COUNT` 仍作为数据库首次初始化种子值存在，之后由后端数据库和后台“致敬计数”统一管理；公开端已经不再携带伪初始计数。
- `admin` 目录独立 `node_modules` 仍受本机 npm 缓存锁影响，待文件锁释放后仍需补跑 `npm install`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第十九块：思政学习课程 CMS 接入

更新时间：2026-07-15

本轮开始前复核了上一块“群众互动留言与致敬计数真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用用共享 Vite 构建通过；`/api/messages` 在无已发布留言时返回 0，旧 `messages` 种子表不再公开展示；`/api/health`、`/`、`/admin` 均返回 HTTP 200；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。随后继续扫描公开端静态数据，确认 `HudDashboard` 中“苏区思政大课堂”的 8 门学习课程仍写死在前端，包含课程标题、说明、排序和点位绑定，因此进入本块修复。

### 已完成

- 后端新增内容模块 `learning_course`，名称为“学习课程”，纳入现有通用双审流程。
- 后端 `normalizeContentInput()` 新增 `learning_course` 结构化归一化，支持：
  - `title` 课程标题
  - `subtitle` 课程说明
  - `archiveId` / `archive_id` / `poiId` 绑定档案点位
  - `order` / `sortOrder` 排序
- 后端校验学习课程必须填写标题、说明、有效档案点位 ID，排序需为 0 到 1000 的整数。
- 后端绑定点位校验支持已发布 CMS 档案和 legacy 档案，确保现有 16 个点位和未来后台发布点位都可绑定。
- 后台统一内容创建表单新增“学习课程”专属字段：绑定档案点位 ID、排序。
- 公开端 `HudDashboard` 移除前端写死的 8 门学习课程。
- 公开端学习课程列表改为读取已发布 `learning_course` 内容，并按排序渲染。
- 无已审核发布学习课程时，公开端显示“当前暂无已审核发布的学习课程”，不再展示未经审核的固定课程。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `learning_course`。
- 当前没有已发布学习课程时，`GET /api/contents?moduleKey=learning_course&pageSize=50` 返回 0 条。
- 真实审核链路烟测通过：临时超管创建 `learning_course` 内容，绑定 `suqu-red-house`，提交审核，完成通用双审发布；审核前公开接口不包含该课程，终审发布后公开接口可读取课程标题、排序、绑定点位和点位标题。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- 源码中不再存在 `LEARNING_COURSES` 或“第一课：政权归于人民”等前端固定课程文本。
- `git diff --check` 对本轮相关源码未发现 whitespace 错误，仅提示既有 LF/CRLF 转换警告。

### 注意

- 本轮将“学习课程入口”改为后台审核发布驱动；因此当前后台未发布课程时，公开端课程列表会显示空态。这是符合数据真实性要求的行为。
- 后续可继续把学习面板里的“辅助学习工具”“红色互动体验”“资源文库”等入口顺序、是否显示、文案和图标做成后台可配置模块，实现用户之前要求的板块拖动和预览。
- `admin` 目录独立 `node_modules` 仍受本机 npm 缓存锁影响，待文件锁释放后仍需补跑 `npm install`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十块：学习面板入口 CMS 配置化

更新时间：2026-07-15

本轮开始前复核了上一块“思政学习课程 CMS 接入”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用用共享 Vite 构建通过；`/api/health`、`/`、`/admin` 均返回 HTTP 200；`content_modules` 中存在 `learning_course`；`GET /api/contents?moduleKey=learning_course&pageSize=50` 当前返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。

### 已完成

- 后端新增内容模块 `dashboard_entry`，名称为“学习面板入口”，纳入现有通用双审流程。
- 后端新增学习面板入口动作键白名单，当前支持：
  - `historical_route`
  - `heroes`
  - `soviet_region`
  - `song_player`
  - `party_oath`
  - `panorama`
  - `long_march`
  - `oral_history`
  - `resource_hub`
  - `today_suqu`
  - `red_quiz`
  - `party_routes`
  - `passport`
  - `tour_guide`
  - `film_archive`
  - `cocreation`
- 后端 `normalizeContentInput()` 新增 `dashboard_entry` 结构化归一化，支持分组标识、分组标题、动作键、按钮名称、按钮图标键、分组图标键、徽标模式和排序。
- 后端校验入口必须填写按钮名称、分组标识和受支持的动作键，避免后台配置未知前端动作。
- 后台统一内容创建表单新增“学习面板入口”专属字段：分组标识、分组标题、动作键、按钮图标键、分组图标键、排序、徽标模式。
- 公开端 `HudDashboard` 移除“辅助学习工具 / 红色互动体验 / 红色资源文库”三组固定入口按钮。
- 公开端学习面板改为读取已发布 `dashboard_entry` 内容，按后台配置的分组和排序动态渲染入口。
- 公开端入口点击仍调用现有稳定功能动作；显示、隐藏、分组、排序、文案、图标由后台已审核发布内容控制。
- 无已审核发布入口时，公开端显示“当前暂无已审核发布的学习面板入口。”，不再展示未审核固定入口。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `dashboard_entry`。
- 当前没有已发布学习面板入口时，`GET /api/contents?moduleKey=dashboard_entry&pageSize=50` 返回 0 条。
- 真实审核链路烟测通过：临时超管创建 `dashboard_entry` 内容，动作键为 `heroes`，分组为 `codex-smoke-tools`，提交审核，完成通用双审发布；审核前公开接口不包含该入口，终审发布后公开接口可读取入口动作键、分组和排序。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `HudDashboard` 源码中不再存在旧的三组固定入口区域和旧固定入口按钮文案。

### 注意

- 本轮先完成“入口显隐 / 分组 / 排序 / 文案 / 图标 / 动作键”的后台化，入口背后的各互动组件内部内容仍有部分静态兜底，后续需要逐个模块继续迁移。
- `dist` 中仍可能命中其他组件内部静态文案，例如打卡护照、党日路线、文旅导览、影视资料库等；这些不属于本轮入口配置，但应作为后续阶段继续收口。
- `admin` 目录独立 `node_modules` 仍受本机 npm 缓存锁影响，待文件锁释放后仍需补跑 `npm install`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十一块：打卡护照配置真实性收口

更新时间：2026-07-15

本轮开始前复核了上一块“学习面板入口 CMS 配置化”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用用共享 Vite 构建通过；`/api/health`、`/`、`/admin` 均返回 HTTP 200；`content_modules` 中存在 `dashboard_entry`；`GET /api/contents?moduleKey=dashboard_entry&pageSize=50` 当前返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。

### 已完成

- 后端 `checkin` 内容归一化移除隐式默认值，不再自动生成 16 个打卡点、不再默认“红色传承人”证书标题。
- 后端 `checkin` 配置改为显式必填校验：
  - 标题
  - 说明
  - 大于 0 的打卡总数
  - 证书标题
  - 印章标签
  - 证书正文
- 公开端 `CheckInPassport` 移除 `DEFAULT_CHECKIN_CONFIG`，不再携带默认标题、默认 16 点位说明、默认证书标题、默认印章标签和默认证书正文。
- 公开端打卡护照弹窗改为读取已发布 `checkin` 内容；未发布配置时显示“打卡护照未配置”状态，不展示未审核证书内容。
- 公开端打卡护照新增加载状态，避免接口读取过程中短暂展示空字段或默认字段。
- 公开端 `HudDashboard` 的打卡总数不再默认 16；无已发布 `checkin` 配置时，打卡入口徽标显示“未配置”，有配置时才显示真实进度。
- 打卡护照入口仍由上一阶段 `dashboard_entry` 控制是否显示，本轮负责入口背后的护照配置真实性。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `checkin`。
- 当前没有已发布打卡护照配置时，`GET /api/contents?moduleKey=checkin&pageSize=50` 返回 0 条。
- 后端校验烟测通过：缺少证书标题的 `checkin` 创建请求返回 400 `INVALID_CONTENT`。
- 真实审核链路烟测通过：临时超管创建完整 `checkin` 配置，提交审核，完成通用双审发布；审核前公开接口不包含该配置，终审发布后公开接口可读取打卡总数、证书标题、印章标签和证书正文。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `CheckInPassport`、`HudDashboard` 和 `server/index.js` 源码中不再存在 `DEFAULT_CHECKIN_CONFIG`、默认“红色传承人”、默认“兹证明”证书正文、`totalCount: 16` 等打卡护照静态兜底。

### 注意

- 本轮只收口“打卡护照配置”；点位访问进度仍使用现有访客本地/后端进度逻辑，后续如需学校账号学习记录，应继续接入账号维度学习进度。
- `checkin` 后台创建表单目前仍复用通用正文框填写证书正文，后续可升级为专属多行字段、证书预览和打卡点位清单选择器。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十二块：主题党日路线真实性收口

更新时间：2026-07-15

本轮开始前复核了上一块“打卡护照配置真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用用共享 Vite 构建通过；`/api/health`、`/`、`/admin` 均返回 HTTP 200；`content_modules` 中存在 `checkin`；`GET /api/contents?moduleKey=checkin&pageSize=50` 当前返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。

### 已完成

- 后端 `party_route` 内容归一化加强必填校验：标题、副标题或摘要、适用对象、预计时长、至少一个点位 ID、路线说明、开场讲解词均必须显式填写。
- 后端校验每个党日路线点位 ID 必须能对应公开档案点位，避免后台发布不可导航或不可解释的路线。
- 后端移除开场讲解词对路线说明的隐式兜底，讲解词必须作为独立字段进入审核。
- 公开端 `PartyDayRoutes` 移除“初心之旅 / 理论之路 / 少年信仰 / 群众路线 / 隐蔽战线”等前端写死路线。
- 公开端主题党日路线改为仅读取已发布 `party_route` 内容；接口失败或无已发布路线时显示空态，不再展示未审核路线。
- 公开端路线点位名称改为从当前档案数据中解析，不再用前端硬编码 ID 映射。
- 公开端解析已发布路线时也要求标题、副标题、适用对象、预计时长、路线说明、开场讲解词和点位齐全；异常旧数据不会被展示或启动。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务正常，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `party_route`。
- 当前没有已发布主题党日路线时，`GET /api/contents?moduleKey=party_route&pageSize=50` 返回 0 条。
- 后端校验烟测通过：缺少开场讲解词的 `party_route` 创建请求返回 400 `INVALID_CONTENT`。
- 真实审核链路烟测通过：临时超管创建完整 `party_route`，绑定 `suqu-red-house` 和 `blood-field`，提交审核，完成通用双审发布；审核前公开接口不包含该路线，终审发布后公开接口可读取点位数组和开场讲解词。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `PartyDayRoutes` 源码中不再存在旧路线预设标题、`const ROUTES` 或 `opening` 从 `description` 兜底的逻辑。
- `git diff --check` 对本轮相关源码未发现 whitespace 错误，仅提示既有 LF/CRLF 转换警告。

### 注意

- 本轮收口的是“主题党日路线”弹窗；`TourGuide` 文旅导览路线中的前端预设已在第二十三块继续收口。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十三块：文旅导览路线真实性收口

更新时间：2026-07-15

本轮开始前复核了上一块“主题党日路线真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用用共享 Vite 构建通过；`/api/health`、`/`、`/admin` 均返回 HTTP 200；`content_modules` 中存在 `party_route`；`GET /api/contents?moduleKey=party_route&pageSize=50` 当前返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态路线，确认 `TourGuide` 仍保留“主题党日路线 / 缅怀先烈路线 / 少年信仰路线”等前端预设，因此进入本块修复。

### 已完成

- 后端 `tour_route` 内容归一化加强必填校验：路线名称、路线说明、至少一个导览站点均必须显式填写。
- 后端导览站点校验改为逐项严格报错，不再静默丢弃缺字段站点。
- 后端要求每个导览站点必须填写名称、到达时间、预计时长和说明，避免发布不完整导览手册。
- 后端统一 `name/title`、`desc/description`、`icon/iconChar/icon_char` 字段，确保公开端读取到一致结构。
- 公开端 `TourGuide` 移除三组前端写死路线及其站点内容。
- 公开端文旅导览改为仅读取已发布 `tour_route` 内容；接口失败或无已发布路线时显示“当前暂无已审核发布的文旅导览路线。”。
- 公开端新增加载状态，避免接口读取过程中闪现空字段。
- 公开端导览手册下载只在存在已发布路线时可用，手册内容来自后台审核发布数据。
- 公开端解析旧数据时要求路线说明、站点名称、时间、时长和说明齐全；异常旧数据不会展示。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `tour_route`。
- 当前没有已发布文旅导览路线时，`GET /api/contents?moduleKey=tour_route&pageSize=50` 返回 0 条。
- 后端校验烟测通过：缺少到达时间的 `tour_route` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `tour_route`，包含 2 个站点，提交审核，完成通用双审发布；审核前公开接口不包含该路线，终审发布后公开接口可读取 2 个带时间、时长和说明的站点。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `TourGuide` 源码中不再存在 `ROUTE_A`、`ROUTE_B`、`ROUTE_C`、旧三条路线标题或本地兜底注释。
- `git diff --check` 对本轮相关源码未发现 whitespace 错误，仅提示既有 LF/CRLF 转换警告。

### 注意

- 本轮只收口文旅导览路线；公开端仍可继续横向迁移 `LongMarchRoute`、`OralHistory`、`RedQuiz`、`RedFilmArchive` 等组件内部的静态演示内容。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十四块：口述历史真实性收口

更新时间：2026-07-15

本轮开始前复核了上一块“文旅导览路线真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用使用共享 Vite 构建通过，`/api/health`、`/`、`/admin` 均返回 HTTP 200；`content_modules` 中存在 `tour_route`，当前无已发布文旅导览路线时 `GET /api/contents?moduleKey=tour_route&pageSize=50` 返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `OralHistory` 仍保留 10 条前端写死的口述历史记录，因此进入本块修复。

### 已完成

- 公开端 `OralHistory` 移除 10 条前端写死的口述历史记录，不再以内置人物、标题、正文、日期和情绪标签兜底展示。
- 公开端口述历史改为只读取已审核发布的 `oral_history` CMS 内容；接口失败或暂无已发布内容时展示空状态，不展示未经审核的演示记录。
- 公开端新增加载状态，避免接口读取过程中短暂显示空字段或旧兜底数据。
- 公开端播放逻辑改为在存在有效记录时才允许朗读，避免空记录状态下触发语音合成。
- 公开端解析已发布口述历史时要求讲述人、标题、正文、日期和情绪/分类字段齐全，异常旧数据不会被展示。
- 后端 `oral_history` 结构化归一化加强必填校验：讲述人、口述正文、采集日期和情绪/分类必须显式填写。
- 后端统一支持 `date`、`recordedAt`、`recorded_at` 作为采集日期输入，并规范输出为 `date`，避免前后端字段分裂。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `oral_history`。
- 当前没有已发布口述历史时，`GET /api/contents?moduleKey=oral_history&pageSize=50` 返回 0 条。
- 后端校验烟测通过：缺少采集日期和来源字段的 `oral_history` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `oral_history` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该记录，终审发布后公开接口可读取讲述人、标题、正文、日期和情绪字段。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `OralHistory` 与 `server/index.js` 源码中不再存在 `const RECORDS`、旧 10 条口述历史人物记录、`RECORDS[0]` 或本地口述历史兜底逻辑。
- `git diff --check` 对本轮相关源码未发现 whitespace 错误，仅提示既有 LF/CRLF 转换警告。

### 注意

- 本轮只收口 `OralHistory` 组件自身的口述历史弹窗；公开端其他模块仍可能引用相同人物或红色故事名称，例如 `DirectorModeController`、`PeopleCoCreation`、`HeroesPanel`、`RedQuiz`、`RedResourceHub`、`RedFilmArchive` 以及后端种子档案数据。这些不属于本轮组件闭环，但应作为后续阶段继续迁移。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十五块：党史题库真实性收口

更新时间：2026-07-15

本轮开始前复核了上一块“口述历史真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用使用共享 Vite 构建通过，`/api/health`、`/`、`/admin` 均返回 HTTP 200；`content_modules` 中存在 `oral_history`，当前无已发布口述历史时 `GET /api/contents?moduleKey=oral_history&pageSize=50` 返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续检查公开端静态题库，确认 `RedQuiz` 虽已尝试读取 CMS，但接口失败或无已发布题库时仍会使用前端内置题库，因此进入本块修复。

### 已完成

- 公开端 `RedQuiz` 移除前端内置 `QUESTIONS` 题库，不再携带未经后台审核的固定题目、选项、答案和解析。
- 公开端党史答题改为只读取已审核发布的 `quiz` CMS 内容；接口失败或暂无已发布题库时展示空状态，不再展示前端兜底题。
- 公开端新增加载状态，读取过程中显示“正在读取已审核发布的党史题库”。
- 公开端开始答题前会确认题库非空，题库数量少于难度题数时自动按真实题库数量抽选，避免空题库或越界导致异常。
- 公开端解析已发布题目时要求题干、选项、答案和解析齐全，异常旧数据不会进入答题流程。
- 后端 `quiz` 题库归一化加严：题目列表中的坏题不再被静默跳过，任何一题结构不完整都会拒绝创建/更新。
- 后端 `quiz` 题目必填校验覆盖题干、至少 2 个选项、有效正确答案和答案解析。
- 后端正确答案支持数字序号、A-H 字母和选项文本匹配，便于后台录入，但最终统一归一化为选项下标。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `quiz`。
- 当前没有已发布题库时，`GET /api/contents?moduleKey=quiz&pageSize=50` 返回 0 条。
- 后端校验烟测通过：缺少答案解析的 `quiz` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `quiz` 题库，提交审核，完成通用双审发布；审核前公开接口不包含该题库，终审发布后公开接口可读取 2 道题及其题干、选项、答案和解析。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `RedQuiz`、`server/index.js`、`client/dist`、`client/dist-server` 中不再存在 `QUESTIONS`、本地题库兜底注释或烟测题目残留。
- `git diff --check` 对本轮相关源码未发现 whitespace 错误，仅提示既有 LF/CRLF 转换警告。

### 注意

- 本轮只收口党史答题题库内容；难度档位名称和题数仍属于前端交互配置，暂未后台化。后续如需完全可视化运营，可将答题难度、题数、评分文案和勋章规则继续迁移为后台配置。
- 公开端其他模块仍有静态内容需要继续迁移，例如 `RedFilmArchive`、`RedResourceHub`、`HeroesPanel`、`DirectorModeController`、`RedPanorama` 和 `LongMarchRoute`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十六块：红色影视真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“党史题库真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用使用共享 Vite 构建通过；`content_modules` 中存在 `quiz`，当前无已发布题库时 `GET /api/contents?moduleKey=quiz&pageSize=50` 返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续检查公开端静态影视数据，确认 `RedFilmArchive` 仍携带本地 `FILMS` 片单，因此进入本块修复。

### 已完成

- 公开端 `RedFilmArchive` 移除前端内置 `FILMS` 影视片单，不再携带未经后台审核的固定片名、年份、类型、简介和关联说明。
- 公开端红色影视资料库改为只读取已审核发布的 `film` CMS 内容；接口失败或暂无已发布影视时展示空状态。
- 公开端新增影视资料加载状态，读取过程中显示“正在读取已审核发布的红色影视资料”。
- 公开端解析已发布影视时要求标题、年份、类型、简介和“与苏区的关联说明”齐全，异常旧数据不会进入展示。
- 后端 `film` 结构化归一化加严：年份、类型、摘要/简介、与苏区的关联说明均为必填。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- 当前没有已发布红色影视时，`GET /api/contents?moduleKey=film&pageSize=50` 返回 0 条。
- 后端校验烟测通过：缺少“与苏区的关联说明”的 `film` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `film` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该影视，终审发布后公开接口可读取影视类型、年份和关联说明。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `RedFilmArchive` 与 `server/index.js` 源码中不再存在 `const FILMS`、旧影视片单或本地影视兜底逻辑。

### 注意

- 源码层已无旧影视片单；构建包内仍可能命中其他未迁移模块的静态文案，例如红歌、英雄谱、资源文库、全景和长征路线。后续继续逐块收口。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十七块：红歌馆真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“红色影视真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，公开端双构建通过，后台应用使用共享 Vite 构建通过；`/api/health`、`/`、`/admin` 均返回 HTTP 200；当前无已发布影视时 `GET /api/contents?moduleKey=film&pageSize=50` 返回 0 条；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `RedSongPlayer` 仍保留内置 `SONGS` 歌单并在 CMS 离线时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `RedSongPlayer` 移除前端内置 `SONGS` 歌单，不再携带未经后台审核的固定歌名、来源、年份和歌词。
- 公开端红歌馆改为只读取已审核发布的 `song` CMS 内容；接口失败或暂无已发布红歌时展示空状态。
- 公开端新增红歌资料加载状态，读取过程中显示“正在读取已审核发布的红歌资料”。
- 无有效红歌时播放、上一首、下一首和展开歌单按钮自动禁用，避免空数据状态下触发语音合成或取模越界。
- 公开端解析已发布红歌时要求标题、来源、年份和歌词齐全，异常旧数据不会进入播放器。
- 后端 `song` 结构化归一化加严：创作/流传年份、来源说明、歌词均为必填。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- 当前没有已发布红歌时，`GET /api/contents?moduleKey=song&pageSize=50` 返回 0 条。
- 源码残留扫描通过：`RedSongPlayer` 与 `server/index.js` 中不再存在 `const SONGS`、旧歌单标题或本地红歌兜底注释。
- 后端校验烟测通过：缺少来源说明的 `song` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `song` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该红歌，终审发布后公开接口可读取年份、来源和歌词数组。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。

### 注意

- 本轮只收口红歌播放器自身的歌单数据；资源文库中的“苏区歌谣”栏目仍属于 `RedResourceHub` 的独立文库内容，后续需要单独收口。
- 公开端仍有静态内容需要继续迁移，例如 `HeroesPanel`、`RedResourceHub`、`DirectorModeController`、`RedPanorama` 和 `LongMarchRoute`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十八块：英雄谱真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“红歌馆真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `song`，当前无已发布红歌时 `GET /api/contents?moduleKey=song&pageSize=50` 返回 0 条；`RedSongPlayer` 与 `server/index.js` 源码中不再存在 `const SONGS`、旧歌单标题或本地红歌兜底注释；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `HeroesPanel` 仍保留内置 `HEROES` 人物主数据并在 CMS 不可用时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `HeroesPanel` 移除前端内置 `HEROES` 英雄谱，不再携带未经后台审核的固定姓名、身份、年代、事迹和精神传承。
- 公开端英雄谱改为只读取已审核发布的 `hero` CMS 内容；接口失败或暂无已发布英雄谱时展示空状态。
- 公开端新增英雄谱资料加载状态，读取过程中显示“正在读取已审核发布的英雄谱资料”。
- 公开端解析已发布英雄谱时要求姓名、身份/职务、生卒/活动年代、人物类别、事迹正文和精神传承/引语齐全，异常旧数据不会进入展示。
- 后端 `hero` 结构化归一化加严：人物姓名、身份/职务、生卒年或活动年代、人物类别、人物事迹正文、精神传承或人物引语均为必填。
- 后端不再把缺失或错误的人物类别默认为 `leader`，避免审核链路中混入类别不明的人物资料。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- 当前没有已发布英雄谱时，`GET /api/contents?moduleKey=hero&pageSize=50` 返回 0 条。
- 源码残留扫描通过：`HeroesPanel` 与 `server/index.js` 中不再存在 `const HEROES`、旧英雄人物标题或本地英雄谱兜底注释。
- 后端校验烟测通过：缺少精神传承/人物引语的 `hero` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `hero` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该人物，终审发布后公开接口可读取人物类别和精神传承字段。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。

### 注意

- 本轮只收口英雄谱弹窗自身的英雄人物资料；其他模块仍可能引用相同人物或相关故事名称，例如 `RedResourceHub`、`DirectorModeController`、`RedPanorama` 和 `LongMarchRoute`，后续需要逐块迁移。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第二十九块：资源文库真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“英雄谱真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `hero`，当前无已发布英雄谱时 `GET /api/contents?moduleKey=hero&pageSize=50` 返回 0 条；`HeroesPanel` 与 `server/index.js` 源码中不再存在 `const HEROES`、旧英雄人物标题或本地英雄谱兜底注释；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `RedResourceHub` 仍保留内置 `CONTENT` 资源文库正文并在 CMS 不可用或无发布内容时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `RedResourceHub` 移除前端内置 `CONTENT` 资源文库正文，不再携带未经后台审核的红色家书、苏区歌谣、红军标语、法令文献、英烈名录、妇女革命、地名溯源、根据地史和文物图鉴正文。
- 资源文库栏目导航保留为界面结构；栏目内真实标题、条目、副标题和正文只读取已审核发布的 CMS 内容。
- 公开端资源文库改为只读取已审核发布的 `letters`、`song`、`slogans`、`decrees`、`martyrs`、`women`、`origin`、`history`、`relics` 内容；接口失败或暂无已发布内容时展示空状态。
- 公开端新增资源文库加载状态，读取过程中显示“正在读取已审核发布的资源文库资料”。
- 公开端解析已发布资源文库时要求条目标题、副标题和正文齐全；红歌栏目可从已发布 `song` 的来源、年份和歌词生成展示条目。
- 后端 `resource hub` 结构化归一化加严：单条资源必须有标题、副标题和正文；数组条目中任何条目格式错误、缺标题、缺副标题或缺正文都会拒绝创建/更新。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- 当前没有已发布红色家书和红歌内容时，`GET /api/contents?moduleKey=letters&pageSize=50` 与 `GET /api/contents?moduleKey=song&pageSize=50` 均返回 0 条。
- 源码残留扫描通过：`RedResourceHub` 中不再存在 `const CONTENT`、旧资源正文或本地资源文库兜底注释。
- 后端校验烟测通过：缺少正文的资源文库条目创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `letters` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该资源，终审发布后公开接口可读取完整 `items` 条目。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。

### 注意

- 本轮只收口资源文库组件自身内容；`DirectorModeController`、`RedPanorama` 和 `LongMarchRoute` 仍有静态展陈内容，需要后续继续迁移。
- README 中仍有早期功能说明文字命中旧资源标题，这是文档描述，不参与前台展示；后续可单独更新文档说明。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十块：全景点位真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“资源文库真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `letters`，当前无已发布红色家书时 `GET /api/contents?moduleKey=letters&pageSize=50` 返回 0 条；`RedResourceHub` 源码中不再存在 `const CONTENT`、旧资源正文或本地资源文库兜底注释；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `RedPanorama` 仍保留内置 `PANORAMAS` 全景点位，并在 CMS 无数据或不可用时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `RedPanorama` 移除前端内置 `PANORAMAS` 全景点位，不再携带未经后台审核的固定点位标题、说明、经纬度和场景特色。
- 公开端全景模块改为只读取已审核发布的 `panorama` CMS 内容；接口失败或暂无已发布全景时展示空状态。
- 公开端新增全景点位加载状态，读取过程中显示“正在读取已审核发布的全景点位”。
- 公开端解析已发布全景时要求标题、说明、场景特色和经纬度齐全，异常旧数据不会进入展示。
- 后端 `panorama` 结构化归一化加严：标题、说明、至少一个场景特色、纬度、经度均为必填。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- 当前没有已发布全景点位时，`GET /api/contents?moduleKey=panorama&pageSize=50` 返回 0 条。
- 源码残留扫描通过：`RedPanorama` 与 `server/index.js` 中不再存在 `const PANORAMAS`、旧全景点位标题或本地全景兜底注释。
- 后端校验烟测通过：缺少场景特色的 `panorama` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `panorama` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该全景，终审发布后公开接口可读取经纬度和场景特色。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。

### 注意

- 本轮只收口全景点位弹窗自身内容；`DirectorModeController` 和 `LongMarchRoute` 仍有静态展陈内容，需要后续继续迁移。
- 当前全景视觉仍使用图标化占位呈现；正式内容的全景图/视频路径已保留 `imageUrl` 字段，后续可继续增强为真实全景媒体渲染。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十一块：长征路线沙盘真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“全景点位真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `panorama`，当前无已发布全景点位时 `GET /api/contents?moduleKey=panorama&pageSize=50` 返回 0 条；`RedPanorama` 与 `server/index.js` 中不再存在 `const PANORAMAS`、旧全景点位标题或本地全景兜底注释；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `LongMarchRoute` 仍保留内置 `STAGES` 历史阶段，并完全依赖前端静态展陈，因此进入本块修复。

### 已完成

- 后端新增 `long_march` 内容模块，名称为“长征路线沙盘”，纳入既有通用双审流程。
- 后端新增 `long_march` 结构化归一化：路线标题、路线说明、至少一个历史阶段均为必填。
- 长征阶段必须填写年份、标题、地点和说明；可选经纬度会进行范围校验。
- 后台统一内容创建表单支持 `long_march` 模块，复用路线阶段 JSON 输入，并以“摘要”作为路线说明、“正文”作为长征精神或补充说明。
- 公开端 `LongMarchRoute` 移除前端内置 `STAGES` 历史阶段，不再携带未经后台审核的固定年份、事件、地点和说明。
- 公开端长征路线沙盘改为只读取已审核发布的 `long_march` CMS 内容；接口失败或暂无已发布内容时展示空状态。
- 公开端新增加载状态，读取过程中显示“正在读取已审核发布的长征路线沙盘”。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `long_march`。
- 当前没有已发布长征路线沙盘时，`GET /api/contents?moduleKey=long_march&pageSize=50` 返回 0 条。
- 源码残留扫描通过：`LongMarchRoute` 与 `server/index.js` 中不再存在 `const STAGES` 或旧长征阶段正文；后台表单仅保留录入示例占位文本，不参与公开展示。
- 后端校验烟测通过：缺少阶段地点的 `long_march` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `long_march` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该路线，终审发布后公开接口可读取 2 个历史阶段。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。

### 注意

- 本轮只收口长征路线沙盘自身内容；`DirectorModeController` 仍有静态自动讲解内容，需要后续继续迁移。
- 后台当前使用 JSON 录入长征阶段，功能可用但不够友好；后续可升级为可视化阶段编辑器。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十二块：自动讲解脚本真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“长征路线沙盘真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `long_march`，当前无已发布长征路线沙盘时 `GET /api/contents?moduleKey=long_march&pageSize=50` 返回 0 条；`LongMarchRoute` 与 `server/index.js` 中不再存在 `const STAGES` 或旧长征阶段正文；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `DirectorModeController` 仍保留自动讲解固定讲解词和点位序列，因此进入本块修复。

### 已完成

- 后端新增 `director_script` 内容模块，名称为“自动讲解脚本”，纳入既有通用双审流程。
- 后端新增 `director_script` 结构化归一化：脚本标题、脚本说明、至少一个讲解场景均为必填。
- 自动讲解场景必须填写讲解词；可选点位 ID、事件标签、是否打开详情、是否显示历史路线、开始前等待时间、结束后等待时间。
- 后台统一内容创建表单支持 `director_script` 模块，使用场景 JSON 录入自动讲解序列。
- 公开端 `DirectorModeController` 移除内置自动讲解固定讲解词，不再携带未经后台审核的开场白、点位讲解和结束语。
- 公开端自动讲解启动时只读取已审核发布的 `director_script` CMS 内容；没有已发布脚本时自动退出讲解模式，不播放任何静态兜底内容。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `director_script`。
- 当前没有已发布自动讲解脚本时，`GET /api/contents?moduleKey=director_script&pageSize=50` 返回 0 条。
- 源码残留扫描通过：`DirectorModeController` 中不再存在旧固定讲解正文；仅保留执行序列所需变量名。
- 后端校验烟测通过：缺少讲解词的 `director_script` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `director_script` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该脚本，终审发布后公开接口可读取 2 个讲解场景。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。

### 注意

- 后台当前使用 JSON 录入自动讲解场景，功能可用但不够友好；后续可升级为可视化脚本编排器，支持拖拽排序、点位选择器和试听。
- 当前自动讲解只执行第一条已审核发布脚本；如后续需要多套讲解路线，可增加默认脚本配置或按地区/设备选择脚本。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十三块：群众共创家书真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“自动讲解脚本真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `director_script`，当前无已发布自动讲解脚本时 `GET /api/contents?moduleKey=director_script&pageSize=50` 返回 0 条；`DirectorModeController` 中不再存在旧固定讲解正文；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续横向扫描公开端静态内容，确认 `PeopleCoCreation` 仍保留前端内置 `LETTERS` 家书数组，并在 CMS 不可用或无发布素材时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `PeopleCoCreation` 移除前端内置 `LETTERS` 家书数组，不再携带未经后台审核的固定人物、身份、节选、正文和图标。
- 公开端群众共创改为只读取已审核发布的 `cocreation` CMS 内容；接口失败或暂无已发布素材时展示空状态，不开放续写入口。
- 公开端新增加载状态，读取过程中显示“正在读取已审核发布的共创素材”，明确不会展示本地未审核家书。
- 公开端留言墙仍保留读取已审核留言的能力；无共创素材时可查看留言墙，但不能向不存在的本地家书提交回复。
- 后端 `cocreation` 结构化归一化加严：每条共创素材必须是对象，并且必须填写作者/人物名称、身份/角色说明、家书节选和完整正文。
- 后端不再静默跳过格式错误或缺字段的共创素材，任一条不完整都会返回 400，避免不完整数据进入审核链。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `cocreation`。
- 当前没有已发布群众共创内容时，数据库中 `publishedCocreation` 为 0，公开端应进入空状态而不是展示本地兜底。
- 源码残留扫描通过：`PeopleCoCreation` 与 `server/index.js` 中不再存在 `const LETTERS`、旧家书人物名称或本地提示兜底注释；后台表单仅保留录入示例占位文本，不参与公开展示。
- 后端校验烟测通过：缺少身份/角色说明和家书节选的 `cocreation` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `cocreation` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该素材，终审发布后公开接口可读取完整 `prompts` 字段。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 后台当前使用 JSON 录入群众共创素材，功能可用但不够友好；后续可升级为可视化家书素材编辑器，支持条目增删、排序、字段校验和预览。
- 本轮只收口群众共创家书素材本身；公开端仍存在其他历史/配置类默认数据需要继续逐块排查，例如 `TodaySuqu`、`PartyOathWall`、`TimeSlider` 和 `TributeCeremony`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十四块：今日苏区真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“群众共创家书真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `cocreation`，当前无已发布群众共创内容时数据库 `publishedCocreation` 为 0；`PeopleCoCreation` 与 `server/index.js` 中不再存在 `const LETTERS`、旧家书人物名称或本地提示兜底注释；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照技术文档扫描公开端静态主数据，确认 `TodaySuqu` 仍保留 `DEFAULT_TODAY_CONFIG`，包含固定今昔说明、数据指标和旧址今貌对比，并在 CMS 不可用或无发布内容时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `TodaySuqu` 移除前端内置 `DEFAULT_TODAY_CONFIG`，不再携带未经后台审核的固定年份、今昔说明、数据指标和旧址今貌对比。
- 公开端今日苏区改为只读取已审核发布且字段完整的 `today_suqu` CMS 内容；接口失败、暂无发布内容或发布内容结构不完整时展示空状态。
- 公开端新增加载状态，读取过程中显示“正在读取已审核发布的今日苏区资料”，明确不会展示本地未审核今昔数据。
- 公开端对数据指标和今昔对比进行完整性过滤，缺少数值、名称、说明或对比正文的旧数据不会进入展示。
- 后端 `today_suqu` 结构化归一化加严：标题、起始年份、对比年份、过渡标签、过去介绍、今日介绍、至少一个完整数据指标和至少一个完整今昔对比均为必填。
- 后端不再静默跳过格式错误或缺字段的数据指标/今昔对比，任一条不完整都会返回 400，避免半成品内容进入审核链。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `today_suqu`。
- 当前没有已发布今日苏区内容时，数据库中 `publishedToday` 为 0，公开端应进入空状态而不是展示本地兜底。
- 源码残留扫描通过：`TodaySuqu` 与 `server/index.js` 中不再存在 `DEFAULT_TODAY_CONFIG`、旧固定今昔文案、旧指标或本地兜底注释。
- 后端校验烟测通过：缺少数据指标说明的 `today_suqu` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `today_suqu` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该资料，终审发布后公开接口可读取完整指标、今昔对比和基础字段。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 后台当前使用 JSON 录入今日苏区的数据指标和今昔对比，功能可用但不够友好；后续可升级为可视化数据看板编辑器，支持指标卡片增删、排序、图标选择和预览。
- 本轮只收口今日苏区自身内容；公开端仍存在其他历史/配置类默认数据需要继续逐块排查，例如 `PartyOathWall`、`TimeSlider` 和 `TributeCeremony`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十五块：入党誓词互动墙真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“今日苏区真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `today_suqu`，当前无已发布今日苏区内容时数据库 `publishedToday` 为 0；`TodaySuqu` 与 `server/index.js` 中不再存在 `DEFAULT_TODAY_CONFIG`、旧固定今昔文案、旧指标或本地兜底注释；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照技术文档扫描公开端静态主数据，确认 `PartyOathWall` 仍保留 `DEFAULT_OATH_TEXT` 和 `DEFAULT_OATH_CONFIG`，包含完整誓词、分句、完成提示和证书文案，并在 CMS 不可用或无发布内容时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `PartyOathWall` 移除前端内置 `DEFAULT_OATH_TEXT` 和 `DEFAULT_OATH_CONFIG`，不再携带未经后台审核的固定誓词全文、分句、完成提示和证书说明。
- 公开端入党誓词互动墙改为只读取已审核发布且字段完整的 `party_oath` CMS 内容；接口失败、暂无发布内容或发布内容结构不完整时展示空状态。
- 公开端新增加载状态，读取过程中显示“正在读取已审核发布的入党誓词资料”，明确不会展示本地未审核誓词内容。
- 无已发布 `party_oath` 内容时，公开端不开放逐句诵读、完成弹窗和证书生成入口，避免用户基于本地静态誓词完成互动。
- 后端 `party_oath` 结构化归一化加严：标题、说明、誓词全文、至少一句誓词分句、完成标题、完成提示、证书标题和证书说明均为必填。
- 后端移除默认“誓言铭心”和“宣誓证书”兜底值，分句数组中任一空项都会返回 400，避免半成品内容进入审核链。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `party_oath`。
- 当前没有已发布入党誓词内容时，数据库中 `publishedPartyOath` 为 0，公开端应进入空状态而不是展示本地兜底。
- 源码残留扫描通过：`PartyOathWall` 与 `server/index.js` 中不再存在 `DEFAULT_OATH_TEXT`、`DEFAULT_OATH_CONFIG`、旧固定誓词分句、旧完成提示或本地兜底注释。
- 后端校验烟测通过：缺少证书说明的 `party_oath` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `party_oath` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该资料，终审发布后公开接口可读取完整分句和证书字段。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 后台当前使用 JSON 录入誓词分句，功能可用但不够友好；后续可升级为可视化分句编辑器，支持自动拆分、逐句排序和预览。
- 本轮只收口入党誓词互动墙自身内容；公开端仍存在其他历史/配置类默认数据需要继续逐块排查，例如 `TimeSlider` 和 `TributeCeremony`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十六块：历史时间轴真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“入党誓词互动墙真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `party_oath`，当前无已发布入党誓词内容时数据库 `publishedPartyOath` 为 0；`PartyOathWall` 与 `server/index.js` 中不再存在 `DEFAULT_OATH_TEXT`、`DEFAULT_OATH_CONFIG`、旧固定誓词分句、旧完成提示或本地兜底注释；临时测试账号、会话、内容残留均为 0。复核时同步发现后台誓词表单仍预填“誓言铭心”和“宣誓证书”，本轮已一并改为空，避免管理员误提交默认文案。上一块核心闭环成立。本轮继续对照技术文档扫描公开端静态主数据，确认 `TimeSlider` 仍保留 `DEFAULT_TIMELINE_CONFIG`，包含固定年份范围、关键年份、历史事件和底部提示语，并在 CMS 不可用或无发布内容时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `TimeSlider` 移除前端内置 `DEFAULT_TIMELINE_CONFIG`，不再携带未经后台审核的固定年份范围、关键年份、历史事件标题/副标题和底部提示语。
- 公开端历史时间轴改为只读取已审核发布且字段完整的 `timeline` CMS 内容；接口失败、暂无发布内容或发布内容结构不完整时不渲染时间轴控件。
- 公开端不再在 CMS 不可用时保留本地时间轴，避免首页地图底部继续展示未审核历史事件。
- 后端 `timeline` 结构化归一化加严：起始年份、结束年份、标题、说明、底部提示语和至少一个完整事件均为必填。
- 后端不再默认补 1920/2030；事件必须填写年份、标题和副标题/说明，且事件年份必须位于时间轴起止年份范围内。
- 后台内容表单移除时间轴起止年份和底部提示语的预填默认值，管理员必须主动填写后才能提交。
- 后台内容表单同步移除上一块誓词模块的“誓言铭心”和“宣誓证书”预填默认值，与后端必填校验保持一致。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `timeline`。
- 当前没有已发布历史时间轴内容时，数据库中 `publishedTimeline` 为 0，公开端不会渲染本地兜底时间轴。
- 源码残留扫描通过：`TimeSlider`、`server/index.js` 与后台表单中不再存在 `DEFAULT_TIMELINE_CONFIG`、旧固定事件标题、旧时间轴提示语或 1920/2030 预填默认值。
- 后端校验烟测通过：缺少事件副标题/说明的 `timeline` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `timeline` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该时间轴，终审发布后公开接口可读取完整事件、关键年份和基础字段。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 历史时间轴当前在无已发布内容时不渲染控件，因此首页底部会留出更干净的地图视野；后续如果需要运营提示，可单独做后台可配置空状态。
- 后台当前使用 JSON 录入历史事件，功能可用但不够友好；后续可升级为可视化事件编辑器，支持年份范围校验、拖拽排序和事件预览。
- 本轮只收口历史时间轴自身内容；公开端仍存在其他历史/配置类默认数据需要继续逐块排查，例如 `TributeCeremony`。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十七块：致敬仪式真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“历史时间轴真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `timeline`，当前无已发布历史时间轴内容时数据库 `publishedTimeline` 为 0；`TimeSlider`、`server/index.js` 与后台表单中不再存在 `DEFAULT_TIMELINE_CONFIG`、旧固定事件标题、旧时间轴提示语或 1920/2030 预填默认值；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照技术文档扫描公开端静态主数据，确认 `TributeCeremony` 仍保留 `DEFAULT_TRIBUTE_CEREMONY`，包含固定仪式说明、入党誓词、默哀文案、苏区精神和关闭按钮文案，并在 CMS 不可用或无发布内容时兜底展示，因此进入本块修复。

### 已完成

- 公开端 `TributeCeremony` 移除前端内置 `DEFAULT_TRIBUTE_CEREMONY`，不再携带未经后台审核的固定仪式说明、誓词正文、默哀文案、精神文案和按钮文案。
- 公开端致敬仪式改为只读取已审核发布且字段完整的 `tribute_ceremony` CMS 内容；接口失败、暂无发布内容或发布内容结构不完整时展示空状态。
- 无已发布 `tribute_ceremony` 内容时，公开端不开放敬献、默哀倒计时和完成仪式，避免用户基于本地静态文案完成互动。
- 后端 `tribute_ceremony` 结构化归一化加严：标题、仪式说明、誓词标题、誓词/朗诵正文、默哀按钮、默哀标题、默哀说明、默哀标语、默哀倒计时、完成标题、完成说明、精神标题、精神文案、精神来源和关闭按钮均为必填。
- 后端移除默认“入党誓词标题”“默哀致敬”“全体默哀”“致敬英烈”“苏区精神”“铭记历史”等兜底值，默哀倒计时也不再默认补 10 秒。
- 后台内容表单移除致敬仪式相关预填默认值，管理员必须主动填写后才能提交。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `tribute_ceremony`。
- 当前没有已发布致敬仪式内容时，数据库中 `publishedTributeCeremony` 为 0，公开端应进入空状态而不是展示本地兜底。
- 源码残留扫描通过：`TributeCeremony`、`server/index.js` 与后台表单中不再存在 `DEFAULT_TRIBUTE_CEREMONY`、旧固定仪式文案或致敬仪式预填默认值；扫描中命中的入党誓词 JSON 示例属于 `party_oath` 后台占位符，不参与致敬仪式公开展示。
- 后端校验烟测通过：缺少精神来源的 `tribute_ceremony` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `tribute_ceremony` 内容，提交审核，完成通用双审发布；审核前公开接口不包含该仪式，终审发布后公开接口可读取完整仪式字段和默哀秒数。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮只收口致敬仪式自身内容；公开端剩余静态风险需要继续通过全局扫描逐块确认，尤其是地区配置、天气/数据面板、展示入口等配置类默认值是否会承载未审核事实内容。
- 后台当前仍使用统一内容表单录入致敬仪式，功能可用但字段较多；后续可升级为分阶段可视化编辑器，按“开场-默哀-完成”拆分预览。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十八块：档案详情展陈时间线真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“致敬仪式真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过；`content_modules` 中存在 `tribute_ceremony`，当前无已发布致敬仪式内容时数据库 `publishedTributeCeremony` 为 0；`TributeCeremony`、`server/index.js` 与后台表单中不再存在 `DEFAULT_TRIBUTE_CEREMONY`、旧固定仪式文案或致敬仪式预填默认值；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续全局扫描公开端静态风险，确认 `ArchiveDetailModal` 仍会在档案未配置 `displayTimeline` 时，根据档案年份、入库时间、更新时间、发布时间和审核状态自动拼接“展陈时间线”，因此进入本块修复。

### 已完成

- 公开端 `ArchiveDetailModal` 移除自动生成的 `fallbackTimeline`，不再用档案年份、入库时间、更新时间、发布时间或审核状态拼接展陈时间线。
- 档案详情页现在只展示后台审核发布数据中的 `displayTimeline`；未配置时不渲染“展陈时间线”区块。
- 后端 `archive` 点位结构化归一化加严：`displayTimeline` / `display_timeline` / `timeline` 必须至少包含一条完整记录。
- 后端展陈时间线条目不再静默跳过缺字段项；任一条格式错误、缺标签或缺内容都会返回 400。
- 后台档案点位表单将“展陈时间线 JSON（可选）”改为“展陈时间线 JSON”，与后端必填校验保持一致。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- `content_modules` 中已存在 `archive`，当前数据库中 `publishedArchives` 为 1。
- 源码残留扫描通过：`ArchiveDetailModal`、`server/index.js` 与后台表单中不再存在 `fallbackTimeline`、`formatArchiveDate`、`资料入库`、`最近更新` 或“展陈时间线 JSON（可选）”。扫描剩余的“已审核发布”仅为审核状态标签，不参与自动展陈时间线生成。
- 后端校验烟测通过：缺少展陈时间线的 `archive` 创建请求返回 400。
- 真实审核链路烟测通过：临时超管创建完整 `archive` 内容，提交审核，完成通用双审发布；审核前公开内容接口和公开档案列表均不包含该点位，终审发布后两者均可读取，且展陈时间线为 2 条。
- 烟测清理完成后，临时测试账号、会话、内容残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮只收口档案详情页的展陈时间线；档案详情页仍保留图片加载失败时的后端封面图/媒体路径候选切换和最终占位图，这属于媒体显示容错，不承载历史事实内容。
- 后续应继续扫描公开端配置类默认值，例如地区配置、天气/数据面板和入口状态，区分“纯 UI/定位配置”与“会承载事实内容的静态数据”。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第三十九块：地图模拟地理图层与地区兜底真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“档案详情展陈时间线真实性收口”：`server/index.js` 语法检查通过，公开端 `eslint` 通过，`ArchiveDetailModal`、`server/index.js` 与后台表单中不再存在 `fallbackTimeline`、`formatArchiveDate`、`资料入库`、`最近更新` 或“展陈时间线 JSON（可选）”；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照技术文档扫描公开端配置类与地图类静态数据，确认 `GisMap` 仍内置苏区镇坐标、模拟边界、模拟革命辐射线、模拟历史行军路线、静态苏维埃区域多边形和固定历史事件名联动，`store/index.ts` 也保留本地默认地区配置，因此进入本块修复。

### 已完成

- 公开端地区配置兜底改为空安全配置：`defaultRegion`、`regions`、`scopeRegionIds` 均为空，地图视图兜底改为经纬度 `0/0`、低缩放中性世界视角。
- `fetchRegionConfig` 读取失败时不再继续使用本地默认苏区镇配置，而是清空地区配置并提示当前不展示本地地区兜底数据。
- `normalizeRegionConfig` 不再在后端缺少默认地区或范围地区时补回前端本地苏区镇 ID。
- 公开端地图初始化不再内置苏区镇坐标；地图视角只来自后端地区配置，后端缺失时使用中性技术兜底。
- `GisMap` 移除前端内置的苏区镇边界图层、革命辐射拓扑网、历史行军路线和静态苏维埃区域多边形。
- `GisMap` 移除基于固定历史事件名的卫星图环境色彩联动，避免前端用静态事件名称驱动地图叙事。
- 后台学习面板入口动作键移除 `historical_route` 与 `soviet_region`，后端校验、公开端动作白名单和后台下拉选项保持一致，避免发布无后台数据源的空开关。
- 自动讲解脚本不再消费 `showHistoricalRoute` 字段；自动讲解仍保留后台审核脚本驱动点位、详情和讲解词。
- 后端地区公开配置在无有效点位时不再推断苏区镇坐标，改为中性地图视图。
- 后台表单示例移除旧固定点位 ID、旧历史事件示例和 `showHistoricalRoute` 提示，改为要求填写已审核发布点位 ID 与经审核文案。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config` 均返回 HTTP 200。
- 源码残留扫描通过：关键文件中不再存在 `suqu-boundary`、`spark-topology`、`historical-route`、`historical_route`、`soviet_region`、`showHistoricalRoute`、`showSovietRegion`、旧苏区镇坐标 `115.3415/23.3610`、旧固定事件名或旧点位 ID 示例。
- 数据库残留检查通过：临时 Codex 用户、会话、内容残留均为 0；当前数据库保留既有已发布档案 `publishedArchives` 为 1。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮只移除了前端本地模拟地理/路线/区域图层；如果后续确实需要边界、路线、区域态势等地图叠加层，应作为新的后台审核发布模块实现，包含 GeoJSON/坐标录入、来源记录、审核流程和公开端只读渲染。
- 后端地区种子仍保留当前项目默认地区，这是数据库初始化与后台管理基线，不是公开前端本地兜底；公开端失败时不会再使用 TS/TSX 本地苏区镇地区数据。
- 当前地图仍会根据已审核发布档案点位生成 3D 视觉占位，这是对后台点位坐标的表现增强，不新增历史事实内容。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十块：档案详情视觉占位与三维展台真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“地图模拟地理图层与地区兜底真实性收口”：`server/index.js` 语法检查通过，关键文件中不再存在 `suqu-boundary`、`spark-topology`、`historical-route`、`historical_route`、`soviet_region`、`showHistoricalRoute`、`showSovietRegion`、旧苏区镇坐标 `115.3415/23.3610`、旧固定事件名或旧点位 ID 示例；本地 3001 的 `GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config` 均返回 HTTP 200；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续扫描公开端档案详情和三维展示组件，确认 `ArchiveDetailModal`、`IndoorBimMode`、`RelicShowcaseMode` 仍存在按旧档案 ID 生成具体建筑/文物占位、固定地点兜底和“1:1 扫描/材质分析”等未经后台审核的展示表述，因此进入本块修复。

### 已完成

- `ArchiveDetailModal` 的 `MuseumPlaceholder` 移除按旧档案 ID 分支生成红屋、纪念碑、兵工厂、医院、交通站、政府大楼等具体建筑 SVG 的逻辑。
- 档案媒体缺失时只渲染通用媒体待补充占位，仍显示后台已审核字段中的标题、年份和类型，不再携带本地旧点位形制暗示。
- 档案详情页移除 `苏区镇红色资源点`、`苏区镇` 等前端地点兜底；缺少地区或地址时显示“未配置地区”“位置待补充”。
- 档案详情页移除旧 `suqu-monument` 专属“敬献花篮 · 重温誓词”入口，避免通过前端旧 ID 触发特殊仪式分支；革命类点位统一保留通用文物展台入口。
- `IndoorBimMode` 移除固定“苏区镇政府大楼”标题兜底，并明确当前为程序化室内结构占位，不代表真实测绘 BIM 模型。
- `RelicShowcaseMode` 移除按旧档案 ID 生成不同文物几何体和纹理色相的逻辑，改为通用程序化展台。
- `RelicShowcaseMode` 移除“全息扫描档案”“三维激光扫描”“1:1 重建”“扫描精度”“材质分析”等未由后台审核数据支撑的文案，改为“待后台上传/待审核补充”。
- 后端 `rowToArchive` 不再给旧 `archives` 表行补 `region-suqu`、完整地区名和“苏区镇红色资源点”地址，避免 API 层静态补事实地点。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/archives` 均返回 HTTP 200。
- `GET /api/archives` 样本验证通过：旧 `archives` 表返回的 `regionId`、`regionName`、`address` 已为空，不再由后端补固定苏区镇地点。
- 文件级残留扫描通过：`ArchiveDetailModal`、`IndoorBimMode`、`RelicShowcaseMode` 中不再存在旧点位 ID、旧具体建筑注释、`苏区镇红色资源点`、`苏区革命文物`、`1:1`、`扫描精度`、`材质分析` 或 `苏区镇政府大楼`。
- 数据库残留检查通过：临时 Codex 用户、会话、内容残留均为 0；当前数据库保留既有已发布档案 `publishedArchives` 为 1。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮没有移除后端地区种子和既有旧 `archives` 表本身；它们属于当前数据库初始化/历史迁移遗留。公开端仍应逐步改为只展示审核发布的 CMS 档案内容，旧表后续可单独迁移、归档或下线。
- 本机未安装 Playwright / @playwright/test，无法执行自动浏览器截图和 canvas 像素检查；本轮已通过 TypeScript/lint/生产构建/HTTP/API 字段烟测确认功能链路。
- 三维展台现在是明确的程序化占位。后续若要展示真实建筑 BIM、文物模型、倾斜摄影或全景媒体，应通过后台媒体库上传、来源记录和审核发布后再在公开端渲染。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十一块：资源文库栏目与后台示例真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“档案详情视觉占位与三维展台真实性收口”：`server/index.js` 语法检查通过；`ArchiveDetailModal`、`IndoorBimMode`、`RelicShowcaseMode` 中不再存在旧点位 ID、旧具体建筑注释、`苏区镇红色资源点`、`苏区革命文物`、`1:1`、`扫描精度`、`材质分析` 或 `苏区镇政府大楼`；本地 3001 的 `GET /api/health`、`GET /`、`GET /admin`、`GET /api/archives` 均返回 HTTP 200；旧 `archives` 表返回样本中的 `regionId`、`regionName`、`address` 已为空；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续扫描公开端资源文库与后台录入示例，确认 `RedResourceHub` 在无内容时仍会显示“全国唯一苏区命名乡镇”“苏区牺牲烈士名册”等事实性栏目副标题，后台表单也仍保留“红屋”“红军开始长征”“江西于都”等示例，因此进入本块修复。

### 已完成

- 公开端 `RedResourceHub` 栏目标签改为中性分类：家书文献、歌谣资料、标语资料、法令文献、英烈资料、妇女专题、地名资料、历史资料、文物资料。
- `RedResourceHub` 所有栏目副标题统一改为“后台审核资料”，不再在没有已发布内容时展示未经审核的具体史实判断。
- `RedResourceHub` 面板标题由“苏区红色资源文库”改为“红色资源文库”，降低前端本地品牌文案对具体地区事实的承载。
- 后台导览路线/长征阶段 JSON 示例移除“红屋”“红军开始长征”“江西于都”等固定示例，改为“请填写经审核”的通用占位。
- 后台今日苏区今昔对比 JSON 示例移除“红屋”“过去说明”“今日说明”等容易被直接复制的旧示例，改为通用前项/后项文本。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/contents?moduleKey=letters&pageSize=1` 均返回 HTTP 200。
- 源码残留扫描通过：`RedResourceHub` 与后台相关表单中不再存在旧资源文库副标题、旧栏目事实文案、`红屋`、`红军开始长征`、`江西于都`、`参观说明`、`过去说明` 或 `今日说明`。
- 数据库残留检查通过：临时 Codex 用户、会话、内容残留均为 0；当前数据库保留既有已发布档案 `publishedArchives` 为 1。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮只收口资源文库的前端栏目文案和后台录入示例；后端内容模块名称仍作为管理分类存在，不直接替代公开内容正文。
- 资源文库仍按固定模块分类读取后台已审核发布内容。后续如果需要完全后台自定义栏目名称、排序、图标和显示开关，可新增“资源文库栏目配置”模块并纳入审核发布。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十二块：公开端固定地区与系统署名真实性收口

更新时间：2026-07-16

本轮开始前复核了上一块“资源文库栏目与后台示例真实性收口”：`server/index.js` 语法检查通过；`RedResourceHub` 与后台相关表单中不再存在旧资源文库副标题、旧栏目事实文案、`红屋`、`红军开始长征`、`江西于都`、`参观说明`、`过去说明` 或 `今日说明`；本地 3001 的 `GET /api/health`、`GET /`、`GET /admin`、`GET /api/contents?moduleKey=letters&pageSize=1` 均返回 HTTP 200；临时 Codex 用户、会话、内容残留均为 0。上一块核心闭环成立。本轮继续扫描公开端固定地区/系统署名文案，确认 `App`、`GisMap`、`TourGuide`、`CheckInPassport`、`PartyOathWall`、`FpsOverlay`、`RedPanorama`、`RedFilmArchive`、`ErrorBoundary`、`store/index.ts` 与后台登录/题库示例仍存在固定“苏区镇/广东省苏区镇”品牌、导览、证书、占位示例或日志前缀文案，因此进入本块修复。

### 已完成

- 公开端主标题不再硬编码“广东省苏区镇数字化档案”，改为优先读取后端地区公开配置中的 `fullName/name` 生成“某地区数字化档案”；未配置地区时显示通用“红色文化数字档案”。
- 地图加载层标题同步改为后端地区配置驱动；未配置地区时显示“红色文化数字档案”。
- 公开端开场幕布和顶部说明改为通用项目定位：“AI赋能红色传承”“已审核档案 · 可信来源 · 多地区共建”，不再在前端本地携带固定地区或未经审核的地区精神/史料整理提示。
- 文旅导览标题、导出手册标题、出品署名和下载文件名改为基于后端地区配置生成；未配置地区时使用通用“红色文旅导览/数字化红色档案系统”。
- 打卡护照和入党誓词证书底部署名改为通用“数字化档案系统”，避免证书在未配置或多地区场景下固定写入旧地区名。
- 第一人称漫游提示由“降落至苏区镇地表”改为“进入当前档案点位视角”，并说明点击的是已审核发布档案。
- 全景面板标题由“苏区镇红色遗址360°全景”改为“红色遗址360°全景”；红色影视详情中的“与苏区镇的关联”改为“关联说明”。
- 后台登录副标题改为“红色文化数字档案 CMS”；题库 JSON 占位示例改为通用“请填写经审核的题干/解析”，不再提供可误复制的固定地区事实示例。
- 本地开发错误日志和后端读取失败日志前缀由固定地区品牌改为“红色文化数字档案”，方便后续残留扫描和多地区部署。

### 已验证

- 源码残留扫描通过：关键公开端、后端主文件与后台入口中不再存在 `广东省苏区镇数字化档案`、`苏区镇数字化档案`、`苏区镇数字档案`、`苏区镇红色文旅导览`、`苏区镇红色导览`、`苏区镇红色遗址`、`与苏区镇的关联`、`您已降落至苏区镇地表`、`苏区镇史料`、`正在整理苏区`、`苏区镇在哪个省` 或 `苏区镇位于广东`。
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=tour_route&pageSize=1` 均返回 HTTP 200。
- 数据库残留检查通过：临时 Codex 用户、会话、内容残留均为 0；当前数据库保留既有已发布档案 `publishedArchives` 为 1，已发布导览路线 `publishedTourRoutes` 为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮只收口固定地区品牌、系统署名和导出标题，不改变后台地区配置模型本身。当前地区配置仍由后端 `/api/regions/public-config` 提供。
- 如果后续希望“平台名称、Slogan、证书署名、导出模板、开场幕布”完全由后台可视化配置，应新增“站点视觉与文案配置”模块，纳入权限、审核、预览和发布流程。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十三块：旧档案表公开读取链路下线

更新时间：2026-07-16

本轮开始前对照技术文档重新审计“除 MySQL 外”的关键差距：当前后台、权限、审核、地区和内容模型已有基础闭环，但公开端 `/api/archives`、地区公开配置地图视图推断、党日路线/学习课程点位绑定仍会通过旧 `archives` 表兜底。旧表属于历史迁移遗留和早期种子数据，不完整承载统一内容版本、来源依据和审核发布流程；继续进入公开端会违背“前台只读已发布数据”和“前端主数据不再依赖旧静态/迁移数据”的技术红线。因此本轮优先下线旧 `archives` 表的公开读取链路，MySQL 迁移继续后置。

### 已完成

- 公开接口 `GET /api/archives` 不再合并旧 `archives` 表，只返回统一 CMS `contents` 中 `module_key = 'archive'` 且 `status = 'published'` 的已发布版本。
- 公开接口 `GET /api/archives/:id` 不再 fallback 到旧 `archives` 表；未找到已发布 CMS 档案时返回 404。
- 地区公开配置 `/api/regions/public-config` 的地图视图推断不再读取旧 `archives` 表，只基于已发布 CMS 档案点位计算地图中心和缩放。
- 党日路线、学习课程等需要绑定点位的后端校验不再接受旧表点位 ID，只认可已审核发布且坐标有效的 CMS 档案。
- 旧 `archives` 表、旧 token 写接口和迁移函数暂时保留为历史迁移/兼容遗留，但不再参与公开展示、地图和公开点位绑定校验。

### 已验证

- 源码扫描通过：`/api/archives` 公开 GET 链路不再调用 `listArchives(req.query)`，`mergeArchiveLists` 已移除，`listAllPublicArchiveMapPoints` 中不再读取旧 `archives` 表，`findPublicArchiveById` 不再 fallback 到 `findArchive`。
- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config` 均返回 HTTP 200。
- `GET /api/archives?pageSize=100` 返回 `total = 1`，返回 ID 为当前已发布 CMS 档案 `content-1784097509643-324d1a97`；数据库旧 `archives` 表仍有 16 条，但不再进入公开档案列表。
- 直接请求旧点位 ID `GET /api/archives/suqu-red-house` 返回 404，证明旧种子点位不再通过公开详情接口泄露。
- 数据库残留检查通过：临时 Codex 用户、会话、内容残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮没有删除旧 `archives` 表和 `server/archives.json` 种子文件；删除或归档旧表需要单独做数据库迁移方案，避免破坏历史数据追溯。
- 旧 `/api/archives` 的 POST/PUT/DELETE 仍受旧 `ADMIN_TOKEN`/管理员兼容机制保护，但不应作为新后台入口使用；后续应在迁移完成后下线这些旧写接口。
- 当前公开地图如果没有已发布 CMS 档案，会回到中性地图视图，这是符合真实性优先原则的空状态，不应再用旧种子数据兜底。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十四块：档案点位专门化字段与发布位置控制

更新时间：2026-07-16

本轮开始前复核了上一块“旧档案表公开读取链路下线”：`server/index.js` 语法检查通过；源码扫描确认 `/api/archives` 公开 GET 链路不再调用 `listArchives(req.query)`，`mergeArchiveLists` 已移除，`listAllPublicArchiveMapPoints` 中不再读取旧 `archives` 表，`findPublicArchiveById` 不再 fallback 到 `findArchive`；旧点位 ID `suqu-red-house` 已返回 404；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。按用户要求 MySQL 后置，本轮继续对照阶段 9 技术文档，聚焦“档案点位专门化”和“发布位置控制”：当前后台档案表单已有标题、摘要、正文、类型、年份、经纬度、地址、媒体、展陈时间线、来源，但缺少历史时期、相关人物、相关事件和地图/列表/首页/专题/导览发布位置的结构化录入与后端校验，因此进入本块修复。

### 已完成

- 后台档案点位表单新增结构化字段：历史时期、相关人物、相关事件。
- 后台档案点位表单新增发布位置勾选：进入地图、进入内容列表、首页推荐、专题页、移动端导览。
- 后台提交档案时将相关人物/相关事件按换行或英文逗号归一为数组，并将发布位置写入 `publishPositions`。
- 后端 `archive` 内容归一化新增字段：`historyPeriod/history_period`、`relatedPeople/related_people`、`relatedEvents/related_events`、`publishPositions/publish_positions`。
- 后端档案点位校验加严：必须填写详细地址或位置说明、历史时期，且至少选择一个发布位置。
- 公开档案输出新增 `historyPeriod`、`relatedPeople`、`relatedEvents`、`publishPositions` 字段，为后续新版点位详情和多端展示编排打基础。
- 公开 `/api/archives` 增加地图发布位置过滤：`publishPositions.map = false` 的已发布档案不会进入公开地图点位列表；旧数据缺少该字段时按兼容默认可进入地图。
- 公开 `/api/archives` 增加有效经纬度过滤：经纬度无效或为 `0,0` 的已发布档案不会进入地图点位列表，落实“没有有效经纬度的内容不得进入地图点位”。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config` 均返回 HTTP 200。
- `GET /api/archives?pageSize=100` 当前返回 `total = 0`；数据库中仍有 1 条已发布 CMS 档案，但该测试档案经纬度为 `0,0`，因此不再进入公开地图点位列表，符合技术文档要求。
- 数据库残留检查通过：旧 `archives` 表仍有 16 条迁移遗留，已发布 CMS 档案 1 条，公开地图合格 CMS 档案 0 条；临时 Codex 用户、会话、内容残留均为 0。
- 源码扫描确认新增字段和发布位置控制已同时出现在后台表单、提交数据、后端归一化、公开输出和公开坐标/发布位置过滤逻辑中。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮完成的是档案点位专门化的第一层结构字段；阶段 9 要求的独立档案点位编辑页、板块拖拽、PC/移动/大屏预览、历史背景/口述历史/AI 讲解/学习问题等详情板块配置仍未完成。
- 当前已有那条“本地测试内容”因坐标无效不再进入地图；如需前台地图显示，需要在后台创建或修正一条带有效经纬度、历史时期、发布位置和展陈时间线的档案，并走审核发布。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十五块：点位详情后台板块配置闭环

更新时间：2026-07-16

本轮开始前复核了上一块“档案点位专门化字段与发布位置控制”：`server/index.js` 语法检查通过；后台档案表单、提交数据、后端归一化、公开输出和公开坐标/发布位置过滤逻辑中均保留历史时期、相关人物、相关事件、发布位置和有效坐标校验；本地 `GET /api/archives?pageSize=100` 当前返回 0 条，原因是唯一已发布 CMS 档案经纬度为 `0,0`，被阶段 44 的真实性规则正确过滤；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照阶段 9 技术文档，聚焦“点位详情页由后台板块配置驱动”：此前后台虽然能录入部分详情板块，但前台详情页仍按固定顺序渲染，且口述历史、AI 讲解、学习问题、参观路线、群众留言等技术文档指定板块类型尚未完整纳入公开端识别范围，因此进入本块修复。

### 已完成

- 后端档案详情板块白名单扩展为技术文档要求的完整集合：基本信息、历史背景、口述历史、图片/视频、AI 讲解、时间线、相关人物、相关事件、学习问题、参观路线、群众留言、来源依据、风险提示/审校说明。
- 后台档案点位表单的“详情板块顺序”默认配置同步扩展上述完整集合，后台提交时继续以 `type|title` 的结构写入 `detailBlocks`，并由后端校验类型、标题、排序和重复项。
- 公开档案接口新增输出 `oralHistories`、`aiNarration`、`learningQuestions`、`routeTips`、`publicMessages` 等详情扩展字段，为口述史、AI 讲解、学习题、路线和留言板块提供真实数据入口。
- 公开端 `ArchiveData` 类型与归一化补齐 `historyPeriod`、`relatedPeople`、`relatedEvents`、`publishPositions`、`detailBlocks` 及上述详情扩展字段，避免前台靠隐式字段读取。
- 公开端点位详情弹窗改为按后台 `detailBlocks.order` 逐块渲染；后台关闭某个板块、调整顺序或修改标题后，前台详情结构会随公开数据变化。
- 详情弹窗新增口述历史、AI 讲解、学习问题、参观路线、群众留言板块渲染分支；没有已审核公开数据时只显示明确空态，不使用前端静态演示内容兜底。
- 基本信息板块新增历史时期展示；来源依据、风险提示、媒体画廊、展陈时间线、相关人物/事件等旧能力保留并纳入统一板块渲染框架。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- `GET /api/archives?pageSize=100` 当前返回 `items: []`、`total: 0`，与阶段 44 的无效坐标过滤规则一致；数据库中仍有 1 条已发布 CMS 档案和 16 条旧 `archives` 遗留表数据，但旧表不进入公开链路。
- 数据库残留检查通过：临时 Codex 用户、会话、内容残留均为 0。
- 源码扫描确认 `oral_history`、`ai_narration`、`learning_questions`、`route`、`messages`、`detailBlocks`、`oralHistories`、`aiNarration`、`learningQuestions`、`routeTips`、`publicMessages` 已覆盖后台表单、后端公开输出、前端数据归一化和点位详情渲染。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮完成的是“点位详情板块配置驱动”的公开端闭环；后台仍是文本方式配置板块顺序，技术文档中的拖拽排序、PC/移动/大屏预览仍需后续继续做。
- 口述历史、AI 讲解、学习问题、参观路线、群众留言现在已有公开端字段和板块渲染入口，但更完整的专属后台编辑体验、关联选择器、AI 任务生成、审核差异对比仍属于后续阶段。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十六块：点位详情板块可视化排序与设备预览

更新时间：2026-07-16

本轮开始前复核了上一块“点位详情后台板块配置闭环”：`server/index.js` 语法检查通过；`client` lint 通过；后台表单、后端公开输出、前端数据归一化和公开详情渲染均已覆盖 `basic/history/oral_history/media/ai_narration/timeline/related_people/related_events/learning_questions/route/messages/sources/risk_note`；本地 `GET /api/archives?pageSize=100` 仍因当前唯一已发布 CMS 档案坐标为 `0,0` 返回空列表，符合阶段 44 的真实性过滤规则；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“后台应支持拖拽排序和 PC/移动/大屏预览”的缺口，将后台详情板块从手写文本配置升级为可视化编辑器。

### 已完成

- 后台档案点位表单将详情板块配置从 `type|title` 文本域升级为结构化数组状态，减少手写类型错误。
- 新增详情板块可视化编辑器：支持拖拽排序、上移/下移、启用/停用、标题修改和恢复默认。
- 新增后台详情发布预览：支持 PC、移动、大屏三种设备模式，展示当前标题、年份、历史时期、位置说明和启用板块顺序。
- 后台提交档案时直接从结构化板块状态生成 `detailBlocks`，保留 `type/title/order/enabled`，继续走后端统一校验和审核流程。
- 后端档案点位校验新增“至少启用一个详情板块”，避免所有板块关闭后公开详情空白。
- 后台样式新增紧凑型板块列表、拖拽态、禁用态、设备切换和响应式布局，窄屏下自动改为单列。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- `GET /api/archives?pageSize=100` 当前返回 `items: []`、`total: 0`，与无效坐标过滤规则一致。
- 数据库残留检查通过：旧 `archives` 表 16 条迁移遗留、已发布 CMS 档案 1 条、临时 Codex 用户/会话/内容残留均为 0。
- 源码扫描确认 `detailBlocksText` 已从后台表单链路移除，新的结构化 `detailBlocks`、拖拽排序、设备预览和“至少启用一个详情板块”校验已接入。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮完成的是后台创建表单内的详情板块可视化排序与预览；独立档案点位编辑页、已发布内容的可视化回填编辑、真实前台截图级预览仍需后续阶段继续做。
- 设备预览当前是后台结构预览，用于确认板块顺序和开关；还不是完整公开端渲染 iframe。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十七块：已有档案点位结构化回填编辑

更新时间：2026-07-16

本轮开始前复核了上一块“点位详情板块可视化排序与设备预览”：`server/index.js` 语法检查通过；`client` lint 通过；后台源码中存在结构化 `detailBlocks`、拖拽排序、PC/移动/大屏预览和“至少启用一个详情板块”后端校验；本地 `GET /api/archives?pageSize=100` 仍因当前唯一已发布 CMS 档案坐标为 `0,0` 返回空列表，符合阶段 44 的真实性过滤规则；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“后台完全管理档案点位”的要求，修复“新建时可结构化配置，但已有内容详情只能查看 JSON，无法回填编辑”的缺口。

### 已完成

- 后台内容详情面板新增档案点位编辑区，仅对 `archive` 模块且非回收站内容显示。
- 编辑区会从当前版本 `data` 回填结构化字段：地区、档案类型、年份、经纬度、地址、历史时期、封面、相关人物、相关事件、发布位置、媒体、展陈时间线和正文。
- 已有 `detailBlocks` 支持回填到同一套可视化板块编辑器，可继续拖拽排序、上移/下移、启用/停用、修改标题和恢复默认。
- 编辑区保留“编辑预览”，支持 PC、移动、大屏三种结构预览，方便在详情页内直接确认板块顺序。
- 保存使用既有 `PUT /admin/contents/:id`，更新后内容回到草稿/当前版本，需要重新提交审核，继续遵守审核闭环。
- 编辑保存时会保留未被表单单独管理的扩展数据字段，避免结构化编辑覆盖后续 AI/口述史等扩展数据。
- 保存成功后刷新详情与列表，让后台看到最新草稿版本和状态变化。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- `GET /api/archives?pageSize=100` 当前返回 `items: []`、`total: 0`，与无效坐标过滤规则一致。
- 数据库残留检查通过：旧 `archives` 表 16 条迁移遗留、已发布 CMS 档案 1 条、临时 Codex 用户/会话/内容残留均为 0。
- 源码扫描确认 `ArchiveContentEditPanel`、`createArchiveEditForm`、扩展数据保留、档案点位保存为草稿版本和 `archive-edit` 后台样式已接入。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮完成已有档案点位的结构化回填编辑；其他内容模块仍以原有创建表单和详情 JSON 为主，后续可逐步补专属编辑器。
- 详情编辑区目前复用后台结构预览，不是完整公开端 iframe 级预览。
- 如果编辑已发布内容，后端会按既有逻辑生成新版本并回到草稿，需要重新提交审核后才会再次公开。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十八块：口述历史原始素材、公开版本与授权闭环

更新时间：2026-07-16

本轮开始前复核了上一块“已有档案点位结构化回填编辑”：`server/index.js` 语法检查通过；`client` lint 通过；后台源码中存在 `ArchiveContentEditPanel`、`createArchiveEditForm`、档案点位保存为草稿版本和 `archive-edit` 样式；本地 `GET /api/archives?pageSize=100` 仍因当前唯一已发布 CMS 档案坐标为 `0,0` 返回空列表，符合真实性过滤规则；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“口述历史模块”的要求，重点补齐原始素材与公开版本区分、授权状态、授权文件、敏感片段标记、采访采集信息和关联档案点位。

### 已完成

- 后台口述历史新建表单新增字段：身份说明、采集地点、采访人、采集时间、音频路径、视频路径、关联档案点位 ID、授权状态、授权文件路径、原始转写文本、可公开版本、AI 摘要、敏感片段标记。
- 后端 `oral_history` 归一化升级：结构化保存 `rawTranscript/raw_transcript`、`publicTranscript/public_transcript`、`aiSummary/ai_summary`、`sensitiveSegments/sensitive_segments`、`authorizationStatus/authorization_status`、`authorizationFile/authorization_file`、`relatedArchiveId/related_archive_id` 等字段。
- 后端校验加强：讲述人、身份说明、采集地点、采访人、原始转写、可公开版本、采集时间、情感标签、授权状态均为必填；授权状态为“已授权公开”时必须填写授权文件路径。
- 关联档案点位 ID 会校验对应 CMS 内容存在且为 `archive` 模块，避免口述历史关联到无效对象。
- 公开 `/api/contents?moduleKey=oral_history` 只返回授权状态为 `authorized` 的口述历史。
- 公开内容输出新增口述历史专用脱敏：前台只拿到可公开版本、AI 摘要、公开采集信息、公开媒体路径和关联点位 ID，不输出原始转写、敏感片段、授权文件路径等内部字段。
- 公开端 `OralHistory` 面板改为读取可公开版本，展示身份、采集地点、采访人、关联点位、已审核 AI 摘要、公开音频/视频入口；无真实音频时仍可朗读公开文本。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 当前无已发布口述历史时，`GET /api/contents?moduleKey=oral_history&pageSize=100` 返回 `items: []`、`total: 0`，符合无已审核内容不兜底展示的原则。
- 数据库残留检查通过：旧 `archives` 表 16 条迁移遗留、已发布 CMS 档案 1 条、已发布口述历史 0 条、临时 Codex 用户/会话/内容残留均为 0。
- 源码扫描确认后台保存原始字段、后端授权校验和公开脱敏函数 `sanitizePublicOralHistoryData` 已接入；公开端未读取 `rawTranscript`、`sensitiveSegments` 或 `authorizationFile`。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮完成的是口述历史创建、后端校验、公开脱敏和公开展示增强；已有口述历史的详情回填编辑器还未单独实现。
- 关联档案点位当前通过 ID 输入；后续可升级为后台点位选择器，避免人工复制 ID。
- 公开端现在只展示授权状态为 `authorized` 的口述历史；待补授权、限制公开、撤回授权的记录即使误发布也不会通过公开列表输出。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第四十九块：已有口述历史结构化回填编辑

更新时间：2026-07-16

本轮开始前复核了上一块“口述历史原始素材、公开版本与授权闭环”：`server/index.js` 语法检查通过；`client` lint 通过；后台口述历史创建表单已包含原始转写、可公开版本、授权状态、授权文件、敏感片段、采集信息和关联档案点位；后端已接入授权校验和公开脱敏 `sanitizePublicOralHistoryData`；公开端未读取 `rawTranscript`、`sensitiveSegments` 或 `authorizationFile`；当前 `GET /api/contents?moduleKey=oral_history&pageSize=100` 返回空列表，符合无已审核内容不兜底展示原则；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续补齐“已有口述历史后续维护”缺口，让已经创建的采访记录也能结构化回填编辑。

### 已完成

- 后台内容详情面板新增口述历史编辑区，仅对 `oral_history` 模块且非回收站内容显示。
- 编辑区会从当前版本 `data` 回填结构化字段：地区、讲述人、年龄、身份说明、采集地点、采访人、采集时间、情感标签、音频、视频、关联档案点位、授权状态、授权文件、原始转写、可公开版本、AI 摘要、敏感片段标记。
- 编辑区保留未被表单单独管理的扩展数据字段，避免后续 AI 任务或其他扩展字段被结构化编辑覆盖。
- 保存使用既有 `PUT /admin/contents/:id`，更新后内容回到草稿/当前版本，需要重新提交审核，继续遵守审核闭环。
- 编辑保存时继续走后端口述历史强校验、授权文件校验、关联档案点位校验和公开脱敏链路。
- 保存成功后刷新详情与列表，让后台看到最新草稿版本和状态变化。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 当前无已发布口述历史时，`GET /api/contents?moduleKey=oral_history&pageSize=100` 返回 `items: []`、`total: 0`。
- 数据库残留检查通过：旧 `archives` 表 16 条迁移遗留、已发布 CMS 档案 1 条、已发布口述历史 0 条、临时 Codex 用户/会话/内容残留均为 0。
- 源码扫描确认 `OralHistoryContentEditPanel`、`createOralHistoryEditForm`、`extractOralHistoryExtraData` 和“保存为草稿版本”已接入后台详情页。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 关联档案点位当前仍通过 ID 输入；后续应升级为“已发布/有权限档案点位选择器”。
- 口述历史详情编辑区当前是结构化表单，不是完整采访素材管理工作台；后续可继续做音视频上传、授权文件上传、敏感片段时间轴和 AI 转写任务联动。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十块：口述历史关联点位选择器与上传入口增强

更新时间：2026-07-16

本轮开始前复核了上一块“已有口述历史结构化回填编辑”：`server/index.js` 语法检查通过；`client` lint 通过；后台详情页已接入 `OralHistoryContentEditPanel`、`createOralHistoryEditForm`、`extractOralHistoryExtraData` 和“保存为草稿版本”；当前 `GET /api/contents?moduleKey=oral_history&pageSize=100` 返回空列表，符合无已审核口述历史不兜底展示原则；临时测试账号、会话、内容残留均为 0。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“口述历史可关联档案点位、后台上传、权限分工和审核安全闭环”的要求，修复人工复制点位 ID 和素材路径录入体验不足的问题。

### 已完成

- 后台内容管理页加载真实后台档案点位候选：调用 `/admin/contents?moduleKey=archive&pageSize=100`，过滤回收站内容后作为口述历史关联点位选项。
- 口述历史新建表单把“关联档案点位 ID”升级为下拉选择器，选项展示点位标题与状态，避免人工复制 ID。
- 已有口述历史结构化编辑区同步升级为关联点位选择器，维护旧记录时也走同一套后台候选数据。
- 口述历史新建表单新增视频上传入口，支持 `mp4/mov/webm`，上传成功后自动回填视频路径。
- 已有口述历史编辑区新增视频上传入口，上传后自动回填当前编辑表单的视频路径。
- 口述历史新建与编辑表单新增授权扫描件上传入口，支持 `png/jpg/webp`，上传成功后自动回填授权文件路径。
- 上传入口复用既有 `/admin/media-assets/upload`，自动写入分类、替代文本、说明和自动压缩标记，继续走媒体库真实存储与权限控制。
- 没有 `media.manage` 权限的账号不会启用上传入口，并显示可填写已有路径的提示。
- 审核任务页详情入口同步接入新版 `ContentDetailPanel` 参数，避免审核页仍使用旧详情组件调用方式。
- 内容编辑区显式绑定 `content.edit` 权限：审核员可查看详情并审核，只有具备内容编辑权限的账号才显示档案/口述历史结构化编辑与上传入口。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 当前无已发布口述历史时，`GET /api/contents?moduleKey=oral_history&pageSize=100` 返回空列表，继续符合无已审核内容不公开展示原则。
- 数据库残留检查通过：旧 `archives` 表 16 条迁移遗留、已发布 CMS 档案 1 条、已发布口述历史 0 条、临时 Codex 用户/会话/内容残留均为 0。
- 源码扫描确认新建表单、已有口述历史编辑区、内容管理详情页、审核任务详情页、`uploadMediaAsset` 共享上传函数和 `canEditContent` 权限门禁均已接入。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 当前媒体后端白名单只支持图片和视频；因此本轮只接入“视频上传”和“授权扫描图片上传”。纯音频上传、PDF 授权文件上传需要扩展媒体后端的 MIME 白名单、校验、元数据处理和预览策略后再做。
- 关联点位候选当前最多读取 100 条后台档案内容；后续推广到县、市、省级大量点位时，应升级为带搜索、分页和地区过滤的选择器。
- 具备 `content.review` 但不具备 `content.edit` 的审核员不会看到编辑上传区，这是权限分工要求，不是功能缺失。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十一块：音频与 PDF 授权文件媒体后端扩展

更新时间：2026-07-16

本轮开始前复核了上一块“口述历史关联点位选择器与上传入口增强”：后台新建与编辑口述历史均已使用真实档案点位候选；视频上传和授权扫描图片上传已接入 `/admin/media-assets/upload`；审核任务详情入口已同步新版 `ContentDetailPanel`；内容编辑区已按 `content.edit` 权限显示；本地 3001 烟测、构建和数据库残留检查均通过。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“口述历史音频、授权文件、后台上传和媒体统一管理”的要求，补齐纯音频和 PDF 授权文件不能进入媒体库的缺口。

### 已完成

- 后端媒体白名单新增音频类型：`audio/mpeg`、`audio/mp3`、`audio/wav`、`audio/x-wav`、`audio/ogg`、`audio/mp4`、`audio/m4a`、`audio/x-m4a`、`audio/aac`、`audio/webm`。
- 后端媒体白名单新增 PDF 授权文件类型：`application/pdf`。
- 后端上传签名校验新增 MP3、WAV、OGG、M4A/MP4、AAC、WebM 音频和 PDF 文件头校验，避免仅靠扩展名或浏览器声明入库。
- `media_assets.media_type` 约束从 `image/video` 升级为 `image/video/audio/document`。
- 新增 SQLite 迁移：老库启动时自动重建 `media_assets` 表约束并保留原有媒体记录、索引和字段。
- 新增音频处理链路：原始音频可直接保存并读取基础时长；开启自动压缩时优先用 ffmpeg 转码为 MP3，失败时保存原文件并写入处理说明。
- 新增文档处理链路：PDF 通过签名校验后原样保存为媒体资产，进入媒体库统一管理、删除、恢复、永久删除和审计链路。
- 后台媒体库上传入口支持音频和 PDF；类型筛选新增“音频”“文档”。
- 后台媒体库预览升级：图片显示缩略图，视频显示视频预览，音频显示播放器，PDF 显示打开文件入口。
- 口述历史新建表单新增“上传音频”，上传成功后自动回填音频路径。
- 已有口述历史编辑区新增“上传音频”，维护旧记录时也能直接回填音频路径。
- 口述历史授权文件上传支持 PDF，与图片扫描件共用同一授权文件路径字段。
- 媒体处理状态新增音频和 PDF 的中文说明，避免后台出现原始英文处理备注。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- SQLite 表约束检查通过：`media_assets` schema 已包含 `audio` 与 `document`。
- 使用回滚事务验证 `media_type = 'audio'` 与 `media_type = 'document'` 可正常入库，事务回滚后测试媒体残留为 0。
- 数据库残留检查通过：旧 `archives` 表 16 条迁移遗留、已发布 CMS 档案 1 条、已发布口述历史 0 条、临时 Codex 用户/会话/内容/媒体残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 音频自动压缩依赖 ffmpeg；本地或服务器缺少 ffmpeg 时会保存原文件并标记处理失败说明，不会丢失上传素材。
- PDF 当前只做签名校验、存储和打开入口，不做正文解析、OCR 或缩略图生成；后续如需授权文件快速审阅，可接 OCR/文档预览队列。
- 音频与授权文件已经进入媒体库统一管理，但口述历史仍缺少“素材工作台”：转写任务、敏感片段时间轴、授权有效期/撤回记录、原始素材与公开版本并排审校仍需后续阶段继续做。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十二块：口述历史素材工作台与公开脱敏加固

更新时间：2026-07-16

本轮开始前复核了上一块“音频与 PDF 授权文件媒体后端扩展”：后端媒体白名单已支持常见音频和 PDF；`media_assets` 约束已扩展为 `image/video/audio/document`；媒体库可筛选、预览和管理音频/PDF；口述历史新建与编辑均可上传音频和 PDF 授权文件；SQLite 约束回滚事务测试通过，临时媒体残留为 0。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“口述历史模块”“AI 结果必须进入审核”“必须区分原始素材与公开版本”的要求，补齐口述历史素材审校工作台，并加固公开接口脱敏。

### 已完成

- 后台已有口述历史编辑区新增“口述历史素材工作台”，集中展示音频、视频、授权文件、授权状态、转写审校状态和 AI 摘要状态。
- 工作台新增原始转写与可公开版本并排审校，便于编辑人员对照原始素材生成公开文本。
- 工作台新增敏感片段时间轴输入，提供标准模板 `[00:00-00:00][待分级] 片段摘要 -> 处理意见`，继续保存为后台内部字段，不公开输出。
- 工作台新增授权范围、授权有效期、限制/撤回说明，补齐授权文件之外的授权上下文。
- 工作台新增转写审校状态：已导入原始素材、已完成转写、已编辑公开版本、可提交审核。
- 工作台新增 AI 摘要状态：未使用 AI 摘要、手动导入、AI 生成待审、编辑已核对。
- 服务端 `oral_history` 归一化新增授权范围、授权有效期、限制/撤回说明、转写审校状态和 AI 摘要状态清洗。
- 服务端公开脱敏加固：`aiSummaryStatus = ai_generated` 的 AI 待审摘要不会进入公开接口。
- 服务端公开脱敏加固：口述历史公开 `body` 强制使用可公开版本，避免旧数据或误保存把原始转写正文公开。
- 后台样式新增素材工作台布局、状态条、素材卡片和并排审校文本区，移动窄屏下自动单列。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 临时公开脱敏探针通过：插入已发布口述历史测试数据后，公开接口只返回 `PUBLIC_OK_TEXT`，`RAW_SECRET_DO_NOT_LEAK`、`RAW_BODY_SECRET_DO_NOT_LEAK`、`AI_SECRET_DO_NOT_LEAK` 均未泄漏；测试数据已清理。
- 数据库残留检查通过：旧 `archives` 表 16 条迁移遗留、已发布 CMS 档案 1 条、已发布口述历史 0 条、临时 Codex 用户/会话/内容/媒体残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 工作台当前仍以人工审校和手动导入为主；真实 AI 转写、摘要生成、TTS 生成和任务队列仍属于后续“AI 配置与任务中心”阶段。
- 敏感片段时间轴当前以规范文本行保存，后续可升级为结构化片段编辑器，支持开始时间、结束时间、风险等级、公开处理方式分列管理。
- 授权有效期和撤回说明已纳入后台保存与审校，但还未做自动到期提醒；后续可接运维提醒或审核任务。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十三块：AI 配置与任务中心底座

更新时间：2026-07-16

本轮开始前复核了上一块“口述历史素材工作台与公开脱敏加固”：口述历史后台已区分原始转写、可公开版本、授权上下文、敏感片段和 AI 摘要状态；公开接口已强制使用可公开版本，且 `aiSummaryStatus = ai_generated` 的待审 AI 摘要不会公开；临时脱敏探针和数据库残留检查均通过。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“AI 接入底座”“AI 任务中心”“API Key 超管管理”“AI 结果必须审核后才能前台展示”的要求，补齐 AI 供应商配置、任务框架、真实调用入口、手动导入和调用日志。

### 已完成

- 新增 `ai.manage` 权限点，超级管理员默认拥有 AI 配置与任务管理权限。
- 新增 `ai_providers`、`ai_tasks`、`ai_call_logs` 数据表，分别管理 AI 供应商、AI 任务和调用记录。
- 后台新增“AI 中心”菜单，超管可统一管理供应商、API 地址、默认模型、能力类型、启用/停用状态和测试连接。
- AI API Key 使用 AES-256-GCM 加密保存，后台列表和编辑回填均只返回 `hasApiKey`，不明文回显密钥。
- AI 供应商支持 OpenAI 兼容接口和“仅手动导入”两类；真实调用接口会自动拼接 `/chat/completions`，手动导入供应商不执行外部调用。
- 服务端严格解析启用状态，避免 `"false"` 字符串被误判为启用；后台表单新增“启用供应商”开关。
- AI 任务中心支持音视频转写、可公开摘要、风险提示、故事稿、讲解稿、TTS 讲解音频、关键词、事件时间线等任务类型。
- AI 任务可创建、真实调用或手动导入结果；任务结果只保存在后台任务中心，不会自动写入内容正文或公开发布。
- 供应商测试、任务真实调用、手动导入均写入 `ai_call_logs` 和系统审计日志。
- 后台 AI 状态显示中文化，测试状态和调用状态不再直接暴露 `ok/failed` 原始值。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 临时 Bearer 超管会话烟测通过：可创建手动 AI 供应商，响应不泄漏 `apiKey`；可用 `"false"` 更新为停用；可测试手动供应商；可创建 AI 任务并手动导入结果；任务列表和调用日志均可查询到对应记录。
- 数据库残留检查通过：临时 Codex 用户/会话/内容/媒体/AI 供应商/AI 任务/AI 调用日志残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 当前已完成 AI 配置与任务中心底座，但“AI 结果应用到内容草稿并进入审核流”还未做；下一块应把 AI 任务结果转为可审校内容版本，并标记 AI 来源。
- 生产环境建议设置并妥善备份 `AI_SECRET_KEY`；若不设置，系统会在数据目录生成本地 `.ai-secret-key`，迁移服务器或恢复备份时必须保留，否则旧 API Key 无法解密。
- TTS 音频生成、语音转写和数字人等能力当前已有任务类型与供应商能力框架，具体供应商参数、文件输入输出和媒体库落库还需后续按真实模型逐项接入。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十四块：审核驳回理由与记录导出增强

更新时间：2026-07-16

本轮开始前复核了上一块“AI 配置与任务中心底座”：`ai.manage` 权限、AI 供应商、API Key 加密保存、启用/停用、测试连接、AI 任务创建、真实调用入口、手动导入和调用日志均已落地；临时 Bearer 超管会话烟测确认密钥不回显、`"false"` 可正确停用供应商、手动导入结果不会自动发布，AI 临时数据残留为 0。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“审核增强”的要求，优先补齐政治敏感项目最基础的审核留痕能力：驳回必须有理由、审核意见模板和审核记录导出。

### 已完成

- 服务端审核接口新增强制校验：`decision = reject` 时必须填写 `comment`，否则返回 `REJECT_REASON_REQUIRED`。
- 审核接口相关错误提示中文化，包括审核决定不正确、内容不存在、没有待审核任务、无当前节点权限等。
- 新增 `/api/admin/review-records/export`，具备 `content.review` 或 `content.final_review` 权限的账号可导出审核记录 JSON。
- 审核记录导出按当前账号地区权限过滤，包含内容 ID、标题、模块、内容状态、敏感等级、风险标签、审核节点、所需权限、角色、状态、审核人、审核意见、创建时间和处理时间。
- 导出审核记录会写入系统审计日志，动作标记为 `export_review_records`。
- 后台审核任务页新增审核意见输入区，支持“通过可选填、驳回必填”的交互约束。
- 后台审核任务页新增常用审核意见模板，覆盖来源依据不足、公开脱敏、AI 生成待核对、结构化字段不完整等高频场景。
- 后台审核任务页新增“导出审核记录”按钮，并提供下载链接、复制 JSON、展开查看内容三种兜底方式，适配 Codex 内置浏览器下载不稳定的情况。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 临时审核链路烟测通过：无理由驳回返回 HTTP 400 和 `REJECT_REASON_REQUIRED`；带理由驳回成功并将内容置为 `rejected`；审核记录导出能查询到驳回状态和驳回意见。
- 数据库残留检查通过：临时 Codex 用户/会话/内容/版本/审核任务/媒体/AI 供应商/AI 任务/AI 调用日志残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮完成的是审核增强中的“驳回理由、意见模板、记录导出”底座；“退回指定节点”和“版本差异对比”尚未完成，应作为下一块继续推进。
- AI 内容标记当前已在 AI 任务和口述历史 AI 摘要状态中具备基础字段，但审核页还没有专门的 AI 风险标识和差异视图，后续应与版本对比一起强化。
- 审核记录导出当前为 JSON，后续可按实际汇报/归档需要增加 CSV 或 PDF 版式。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十五块：退回指定节点与版本差异对比

更新时间：2026-07-16

本轮开始前复核了上一块“审核驳回理由与记录导出增强”：驳回必填理由、审核意见模板、审核记录 JSON 导出、导出审计日志和临时审核链路烟测均已完成；`server/index.js` 语法检查通过，文档已记录第 54 块剩余项为“退回指定节点”和“版本差异对比”。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“审核增强”的要求，补齐退回节点控制和审核详情差异视图。

### 已完成

- 服务端审核接口支持 `returnStepId`，驳回时可指定内容下次重新提交后回到哪个审核节点。
- 服务端校验退回节点必须属于同一审核流程，且不能晚于当前审核节点，避免越权跳转或跳到未来节点。
- 未显式指定退回节点时，默认退回当前审核节点，符合“哪个节点打回就回到哪个节点”的工作流预期。
- 已驳回内容重新提交时，优先读取保存的 `current_step_id` 作为目标审核节点，不再一律回到第一步。
- 审核任务列表返回可退回节点列表，后台审核页新增“退回节点”下拉。
- 内容详情接口新增 `workflowSteps`，用于后台理解当前内容的审核流程节点。
- 内容详情接口新增 `versionDiff`，自动对比当前版本与已发布版本；若没有已发布版本，则对比上一版本。
- 版本差异覆盖标题、摘要、正文和结构化数据，并使用稳定 JSON 排序输出结构化字段差异，便于审核员识别事实字段变化。
- 后台内容详情新增“版本差异”区块，展示对比基准、当前版本号和每个变化字段的前后文本。
- 后台差异视图增加长文本滚动、自动换行和移动端单列布局，避免正文或 JSON 过长撑破页面。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 临时审核状态机烟测通过：内容详情返回摘要、正文和结构化数据差异；终审任务可选择退回初审；驳回后内容保存 `currentStepId = step-archive-review`；重新提交后新的待审核任务确实回到初审节点。
- 数据库残留检查通过：临时 Codex 用户/会话/内容/版本/审核任务/媒体/AI 供应商/AI 任务/AI 调用日志残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 版本差异当前是字段级对比，不是逐字高亮；已满足审核员识别“哪些字段发生变化”的基本验收，后续可继续升级为逐段/逐词高亮。
- AI 内容标记和敏感风险标签已有基础字段，但审核详情还没有专门的醒目标识区；下一块应继续完成 AI 标记与风险标签在审核页的集中呈现。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十六块：AI 内容标记与敏感风险标签集中呈现

更新时间：2026-07-16

本轮开始前复核了上一块“退回指定节点与版本差异对比”：服务端支持 `returnStepId`，重新提交会回到保存的退回节点；内容详情已返回 `versionDiff`，后台可展示当前版本与已发布版本或上一版本的字段差异；临时审核状态机烟测和数据库残留检查均通过。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“审核增强”的要求，补齐审核页 AI 内容标记与敏感风险标签的集中呈现。

### 已完成

- 服务端新增统一 `reviewSignals` 生成逻辑，集中解释内容的敏感等级、风险标签、AI 标记、敏感片段、口述历史转写状态和授权状态。
- 内容摘要、内容详情和审核任务列表均返回同一套 `reviewSignals`，避免后台不同页面各自推断风险字段。
- `reviewSignals` 支持识别 `aiGenerated`、`aiSummaryStatus`、`aiTaskId`、`aiSummary` 等 AI 来源字段。
- `aiSummaryStatus = ai_generated` 会在审核信号中标记为“AI 摘要待人工核对”，风险级别为 `critical`。
- 敏感等级、`riskTypes`、口述历史 `sensitiveSegments`、非授权公开状态、转写未到可提交审核状态都会进入审核信号。
- 审核任务列表新增“风险信号”列，最多展示前三个关键标签，便于审核员先扫高风险待办。
- 内容详情顶部新增“审核风险信号”面板，展示最高风险等级、AI 标记范围、风险标签和敏感片段数量。
- 风险标签按 `medium/high/critical` 分级显示，重大风险使用更醒目的样式，但仍保持后台实用型界面。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 临时风险信号烟测通过：带 `aiSummaryStatus = ai_generated`、重大敏感等级、风险标签、敏感片段、授权限制的口述历史内容，在内容详情和审核任务接口中均返回 `reviewSignals`；最高风险等级为 `critical`；任务信号包含 AI 内容标记。
- 数据库残留检查通过：临时 Codex 用户/会话/内容/版本/审核任务/媒体/AI 供应商/AI 任务/AI 调用日志残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 当前风险信号是规则化标记，不会自动替审核员做事实判断；AI 待审、授权限制、敏感片段仍需要人工核对后才能发布。
- 风险标签已集中展示，但标签体系本身仍依赖编辑录入和 AI 任务产出；后续可继续增加“风险标签模板/字典管理”和“AI 风险提示导入到内容草稿”的闭环。
- 阶段 9 的审核增强条目已覆盖：驳回理由、退回指定节点、版本差异对比、AI 内容标记、敏感风险标签、审核意见模板、审核记录导出。后续应转入 AI 结果应用到内容草稿并进入审核流，或继续做前台多设备体验验收。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十七块：AI 结果应用到内容草稿与审核流

更新时间：2026-07-16

本轮开始前复核了上一块“AI 内容标记与敏感风险标签集中呈现”：服务端 `reviewSignals` 已统一输出 AI 标记、敏感等级、风险标签、敏感片段、口述历史转写状态和授权状态；审核任务列表和内容详情均可展示风险信号；临时风险信号烟测和数据库残留检查均通过。上一块核心闭环成立。本轮继续对照阶段 9 技术文档中“AI 结果必须进入审核”“AI 任务能真实调用或手动导入结果”的要求，把 AI 任务中心结果接入内容版本和审核流程。

### 已完成

- 新增 `/api/admin/ai/tasks/:id/apply-result`，可将已完成或已手动导入的 AI 任务结果应用到目标内容。
- 应用 AI 结果需要同时具备 `ai.manage` 和 `content.edit` 能力；目标内容仍按地区权限校验。
- AI 任务必须绑定目标内容且结果非空，未完成任务、空结果、已删除内容均不能应用。
- 支持应用位置：内容摘要、正文、AI 摘要待审、口述历史公开稿、口述历史原始转写、风险标签、AI 讲解稿、AI 备注。
- 应用结果会复用现有内容版本机制和 `normalizeContentInput` 校验，不绕过档案点位、口述历史等结构化内容校验。
- 应用后会写入 `aiGenerated`、`aiTaskId`、`aiTaskType`、`aiAppliedAt` 等来源字段，确保审核风险面板能识别 AI 来源。
- “应用为草稿”只生成/更新草稿版本，不公开发布。
- “应用并提交审核”会生成/更新内容版本并创建待审核任务，仍不直接公开发布。
- 风险提示类任务应用到风险标签时，会写入 AI 风险提示字段并追加“AI 风险提示待审”标签。
- AI 中心任务列表新增应用位置选择、“应用草稿”和“应用并提交审核”按钮。
- AI 应用动作写入 `ai_call_logs` 和系统审计日志，便于追踪 AI 结果何时进入内容版本。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`。
- `client` 前端生产构建通过：`vite build`。
- 使用 `client` 已安装的 Vite 可执行文件验证 `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/contents?moduleKey=oral_history&pageSize=100`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 临时 AI 应用烟测通过：公开摘要任务可应用为内容草稿，内容保持 `draft` 且带 AI 风险标记；风险提示任务可应用并提交审核，内容进入 `pending_review`，生成 1 条待审核任务，且没有直接变成 `published`。
- 数据库残留检查通过：临时 Codex 用户/会话/内容/版本/审核任务/媒体/AI 供应商/AI 任务/AI 调用日志残留均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 当前 AI 结果应用仍由后台用户手动触发，不会自动发布，也不会自动替审核员作事实判断。
- 应用位置目前是通用字段级映射；后续针对 TTS 音频、数字人视频、结构化时间线等复杂产物，还应继续接入媒体库落库和专门字段预览。
- 第一里程碑中“AI 结果必须审核后才能前台展示”的核心闭环已成立；下一步可转入前台 PC/移动/大屏体验验收，或继续做 AI 任务结果的专门化应用模板。
- `client` 构建仍提示主包超过 500 kB，属于既有性能优化项，不影响本轮功能正确性。

## Phase 9 第五十八块：内容类型默认发布位置配置

更新时间：2026-07-16

本轮开始前复核了上一块“AI 结果应用到内容草稿与审核流”：`reviewSignals`、AI 结果应用接口、应用为草稿、应用并提交审核、AI 来源字段、审计日志和“不直接发布”闭环均已完成；上一轮验证记录中 `server/index.js` 语法检查、公开端 lint、公开端双构建、后台 Vite 构建和临时 AI 应用烟测均通过，临时数据残留为 0。上一块核心闭环成立。按用户要求前台后置，本轮继续补齐技术文档 3.3 中“后台可按内容类型配置默认发布位置”的后台与后端能力。

### 已完成

- `content_modules` 表新增 `default_publish_map/list/home/topic/guide` 五个默认发布位置字段，新库建表和旧库迁移均覆盖。
- 旧库迁移首次补字段时会按内容类型初始化默认值：档案点位默认进入地图和列表，其他内容类型默认进入列表；后续管理员自定义值不会被启动过程覆盖。
- `GET /api/admin/content-modules` 返回每个内容类型的 `defaultPublishPositions`，供后台管理界面使用。
- 新增 `PUT /api/admin/content-modules/:key/default-publish-positions`，需要 `settings.manage` 权限，可修改内容类型默认发布位置。
- 修改默认发布位置会写入 `update_default_publish_positions` 操作日志，满足配置变更留痕要求。
- 档案点位后端归一化已接入默认值：当 API 未显式传入 `publishPositions` 时，使用对应内容类型的后台默认发布位置；显式传入时仍以请求内容为准。
- 后台“内容管理”新增“内容类型默认发布位置”配置面板，仅系统设置权限账号可见，可逐项勾选地图、列表、首页、专题、导览并保存。
- 后台新建档案表单切换到档案类型时，会读取当前内容类型默认发布位置；保存配置后也会同步当前表单默认值。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- `client` 前端生产构建通过：`vite build`；仍只有既有 500 kB chunk 体积提示。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`；仍只有既有 500 kB chunk 体积提示。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin`、`GET /api/regions/public-config`、`GET /api/archives?pageSize=100` 均返回 HTTP 200。
- 临时 Bearer 超管烟测通过：读取内容类型默认值、修改 `archive` 默认值、创建未显式传 `publishPositions` 的档案内容、读取详情确认 `publishPositions = { map:false, list:true, home:true, topic:false, guide:true }`，随后恢复 `archive` 默认值为 `{ map:true, list:true, home:false, topic:false, guide:false }`。
- 受保护的 `/api/admin/content-modules` 在无认证时返回 HTTP 401，符合后台接口权限预期。
- 数据库残留检查通过：临时 Codex 用户、会话、内容、版本、来源、审核任务、AI 任务、AI 供应商、AI 调用日志、临时审计记录均为 0。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 本轮完成的是“默认发布位置配置”的后台与后端闭环，不涉及公开前台视觉和多设备验收。
- 当前默认发布位置主要被档案点位后端归一化使用；其他内容类型已经具备配置存储和后台管理入口，后续如新增专题页、首页推荐、移动导览等公开端真实读取规则，可直接复用该配置。
- MySQL、正式服务器部署、公开前台多设备体验仍按用户要求后置。

## Phase 9 第五十九块：AI 专门化产物落库与风险标签字典

更新时间：2026-07-16

本轮开始前复核了上一块“AI 结果应用到内容草稿与审核流”：AI 任务结果已经能应用为草稿或提交审核，且不会直接公开发布；但技术手册中 TTS 音频、数字人视频、音视频转写等专门化产物仍停留在通用字段映射，风险标签也还没有字典化管理。因此本轮优先补齐后端真实闭环和后台操作入口，前台多设备体验、MySQL 与正式部署继续后置。

### 已完成

- 新增 `risk_tag_templates` 风险标签字典表，支持标签名称、风险等级、分类、说明、启用状态和排序。
- 启动时自动种子默认风险标签：AI 生成待审、AI 风险提示待审、来源依据不足、授权限制、敏感片段、政治表述需复核。
- 新增 `/api/admin/risk-tags` 系列接口，支持列表、创建、更新、删除，写入审计日志；旧 JSON 快照缺少该表时仍可兼容导入。
- 审核风险信号 `reviewSignals` 接入风险标签字典：内容 `riskTypes` 命中字典时，按字典等级和说明显示；未命中字典时保留原有兜底规则。
- AI 任务结果应用新增专门位置：`tts_audio`、`digital_human_video`。
- TTS 音频结果应用时会生成媒体库资产，分类为 `ai-tts`，并写入 `ttsAudioMediaId`、`ttsAudioUrl`、`aiNarrationAudioUrl` 等专门字段。
- 数字人视频结果应用时会生成媒体库资产，分类为 `ai-digital-human`，并写入 `digitalHumanVideoMediaId`、`digitalHumanVideoUrl` 等专门字段。
- 口述历史绑定 TTS/声音模拟时强制校验授权：目标内容必须 `authorizationStatus = authorized` 且存在授权文件路径，否则不能应用 TTS 音频结果。
- AI 手动导入支持可选 `resultJson`，用于保存媒体 URL、MIME 类型、时长、缩略图等结构化产物元数据。
- JSON 导入导出快照纳入 `risk_tag_templates`、`ai_providers`、`ai_tasks`、`ai_call_logs`，避免 AI 配置和任务记录在迁移时丢失。
- 后台 AI 中心新增风险标签字典管理面板，可维护标签等级、分类、说明、启用状态和排序。
- 后台 AI 任务中心新增“结果 JSON”输入框，支持导入 TTS/数字人等媒体产物元数据；任务类型和应用位置新增“数字人视频”“TTS 音频媒体”“数字人视频媒体”。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- `client` 前端生产构建通过：`vite build`；仍只有既有 500 kB chunk 体积提示。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`；仍只有既有 500 kB chunk 体积提示。
- 本地 3001 服务已重启，`GET /api/health`、`GET /`、`GET /admin` 均返回 HTTP 200。
- 临时 Bearer 超管烟测通过：风险标签列表返回默认 6 条；可创建、更新、删除临时风险标签。
- 临时授权口述历史 + TTS 烟测通过：创建 `authorizationStatus = authorized` 且带授权文件的口述历史内容，创建 TTS 任务，手动导入 `https://example.com/codex-tts.mp3` 与媒体 JSON，应用到草稿后内容保持 `draft`，写入 `ttsAudioMediaId`、`ttsAudioUrl`、`aiVoiceAuthorizationStatus = authorized`。
- 媒体库落库烟测通过：AI TTS 产物以 `mediaType = audio`、`category = ai-tts`、URL 为导入音频地址的媒体资产出现。
- 数据库残留检查通过：临时 Codex 用户、会话、内容、版本、审核任务、媒体、AI 任务、AI 调用日志、临时风险标签、临时审计记录均为 0；默认风险标签保留 6 条。
- `git diff --check` 仅提示既有 LF/CRLF 转换警告，无实际空白错误。

### 注意

- 当前 TTS/数字人媒体落库支持远程 URL 和 `/uploads/` 路径登记；具体供应商的文件上传、轮询、下载、转码和缩略图生成仍需按真实模型 API 继续适配。
- 口述历史声音模拟已经接入授权硬校验，但更细的授权范围、授权期限到期提醒、声音克隆同意书模板仍可继续增强。
- 风险标签字典已能统一等级和说明，但内容创建/编辑页还没有做成多选标签控件；目前主要通过 AI 风险提示应用、批量编辑或已有风险字段进入内容。
- 部分 JSON 增强入口尚未全部改为可视化编辑器，本轮优先完成 AI 专门化产物和审核安全字典。
## Phase 9 第六十块：转写工作台联动与重点 JSON 可视化编辑器

更新时间：2026-07-16

本轮开始前复核了上一块“AI 专门化产物落库与风险标签字典”：TTS 音频、数字人视频媒体落库、风险标签字典、AI 结果 JSON 导入、授权硬校验和导入导出覆盖均已完成；但音视频转写进入口述历史工作台仍缺少专门来源字段，部分后台内容配置仍依赖原始 JSON 文本，且本文档第五十八块顺序错位。因此本轮先补齐后台运营体验和文档秩序，公开前台、多设备验收、MySQL 与正式部署继续后置。

### 已完成

- AI 转写结果新增“口述历史转写工作台”应用位置；旧“口述历史原始转写”仍保留兼容。
- 转写应用到口述历史时，除写入 `rawTranscript/raw_transcript` 和 `transcriptReviewStatus = transcribed` 外，新增记录 `aiTranscriptionTaskId`、`aiTranscriptionAppliedAt`、`transcriptionSource`、供应商、源音视频、转写文件、语言、时长、分段和原始结果 JSON 等字段。
- 口述历史素材工作台新增“最近 AI 转写”只读来源条，展示任务、来源、供应商、时间、语言、时长、源音视频和转写文件入口，便于审核员追踪。
- 后台内容表单新增通用数组可视化编辑器，支持新增、删除、上下移动、文本、长文本、数字、布尔和多行数组字段。
- 展陈时间线、导览站点、长征阶段、自动讲解场景、题库、群众共创、今日苏区数据指标、今日苏区今昔对比、历史时间线事件已由纯 JSON textarea 升级为结构化编辑；原始 JSON 仍保留在折叠区，便于复杂场景兜底。
- 整理 `docs/PHASE_AUDIT.md` 顺序：第五十八块已从第八块后移动到第五十七块之后、第五十九块之前。

### 已验证

- `server/index.js` 语法检查。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- `client` 前端生产构建通过：`vite build`；仍只有既有 500 kB chunk 体积提示。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`；仍只有既有 500 kB chunk 体积提示。
- 本地 3001 服务已重启，`GET /api/health` 返回 HTTP 200。
- 临时口述历史 + AI 转写任务烟测通过：导入结果 JSON 后应用到“口述历史转写工作台”，详情数据保持 `status = draft`，写入 `rawTranscript`、`transcriptReviewStatus = transcribed`、`aiTranscriptionTaskId`、`transcriptionSource = ai_task`、`transcriptionLanguage = zh-CN`、`transcriptionDurationSeconds = 126`、源音视频、转写文件和 1 条分段。
- 临时烟测用户、会话、内容、版本、AI 任务、AI 调用日志和审计日志残留均为 0。
- 后台创建页重点可视化 JSON 编辑器已纳入 `admin` 生产构建验证；原始 JSON 兜底入口保留。

### 注意

- 本轮增强的是“转写结果进入工作台并可追溯”的后台链路；真实供应商的音视频文件上传、轮询、下载、转码和字幕文件解析仍需在后续供应商适配阶段继续细化。
- 可视化编辑器覆盖了当前点名的重点 JSON 字段，但完整运营体验还可继续扩展到资源文库多条目、誓词分句等低频字段。

## Phase 9 第六十一块：AI 任务文件输入输出配置

更新时间：2026-07-16

本轮开始前复核了上一块“转写工作台联动与重点 JSON 可视化编辑器”：音视频转写已经能应用到口述历史工作台并保留任务来源、源媒体、转写文件、语言、时长和分段信息；重点 JSON 字段已经升级为可视化编辑；文档顺序已整理；上一轮构建和临时烟测均通过。继续按用户要求后置公开前台和 MySQL，本轮只推进后台/后端能力，补齐 AI 任务中心对“文件输入、结构化输入、产物输出字段”的统一管理。

### 已完成

- `ai_tasks` 新增 `input_json` 字段，新库建表和旧库迁移均覆盖，用于保存源媒体、源文件、媒体库 ID、期望产物、输出格式、语言、声音对象、授权文件、分段和额外参数。
- 后端 AI 任务创建接口支持 `inputJson/input_json`，会校验输入媒体、源文件和授权文件 URL 只允许 `http(s)` 或 `/uploads/` 路径。
- AI 任务允许“输入正文”与“结构化输入文件”二选一：有源媒体、源文件或媒体库输入时，不再强制要求输入正文。
- 真实调用 OpenAI 兼容供应商时，会把任务类型、目标 ID、源媒体 URL、源文件 URL、媒体库 ID、语言、期望产物、输出格式、授权文件、分段和额外参数组装进用户消息，避免供应商调用只收到一段孤立文本。
- AI 结果导入和真实调用返回都会统一规范化结果 JSON，标准化 `mediaUrl`、`audioUrl`、`videoUrl`、`transcriptFileUrl`、`thumbnailUrl`、`mimeType`、`durationSeconds`、`sizeBytes`、`sourceMediaUrl`、`sourceFileUrl`、`language`、`segments` 等字段。
- TTS 音频和数字人视频媒体落库时，结果 URL 识别范围扩展到 `outputUrl/audioUrl/videoUrl` 等常见供应商字段。
- 后台 AI 中心创建任务表单新增源媒体 URL、源文件 URL、上传输入素材、期望产物、输出格式、语言、讲述人/声音对象、授权文件 URL 和输入 JSON。
- 后台上传 AI 输入素材会先进入媒体库，并自动回填源媒体 URL；任务列表会展示源媒体、源文件、期望产物和输出格式摘要。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- `client` 前端生产构建通过：`vite build`；仍只有既有 500 kB chunk 体积提示。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`；仍只有既有 500 kB chunk 体积提示。
- 本地 3001 服务已重启，`GET /api/health` 返回 HTTP 200。
- 临时 AI 文件输入/输出烟测通过：创建“输入正文为空、但带结构化源媒体 `/uploads/codex-aiio-source.mp3`”的转写任务，任务详情返回 `inputJson.sourceMediaUrl`。
- 手动导入供应商常见产物字段后，结果 JSON 被规范化为 `transcriptFileUrl`、`durationSeconds`、`segments`，并继承源媒体路径。
- 应用到“口述历史转写工作台”后，内容保持 `draft`，写入 `transcriptReviewStatus = transcribed`、源音视频、转写文件、时长 88 秒和 1 条分段。
- 临时用户、会话、内容、AI 任务和审计记录残留均为 0。

### 注意

- 本轮仍不做具体厂商的专有文件上传、异步轮询和下载协议；但已经把后台和后端的文件输入/输出字段统一起来，后续接入真实供应商时可以按供应商 API 逐个适配。
- 公开前台多设备体验、MySQL 和正式部署继续按用户要求后置。

## Phase 9 第六十二块：AI 供应商能力合同与任务校验

更新时间：2026-07-16

本轮开始前复核了上一块“AI 任务文件输入输出配置”：`ai_tasks.input_json`、结构化文件输入、供应商常见产物字段规范化、转写工作台应用和临时烟测均已完成；临时数据残留为 0。继续按用户要求后置公开前台和 MySQL，本轮只推进后端和后台 AI 管理能力，补齐真实厂商接入前的“能力合同”。

### 已完成

- `ai_providers` 新增 `config_json` 字段，新库建表和旧库迁移均覆盖，用于保存供应商任务类型、文件输入、输入扩展名、输出格式、结果模式、轮询地址、回调路径、超时时间和授权要求。
- AI 供应商创建、更新、列表接口返回并保存规范化后的 `configJson`，API Key 仍不明文回显。
- 后端新增供应商能力校验：如果供应商声明了支持任务类型，创建或运行任务时会拒绝未声明的任务。
- 后端新增文件输入校验：供应商关闭文件输入时，带源媒体、源文件或媒体库输入的任务会被拒绝；声明输入扩展名时会校验源文件后缀。
- 后端新增输出格式校验：任务结构化输入中的 `outputFormat` 必须落在供应商声明的 `outputFormats` 内。
- 涉及具体声音对象的 TTS/数字人任务默认要求绑定授权文件，进一步强化真实老党员声音模拟的授权前置。
- 真实调用执行器读取供应商超时时间；异步轮询、回调和手动模式可以先被登记，但通用 OpenAI 兼容执行器不会假装已经支持专有异步协议。
- 后台 AI 供应商表单新增“任务配置 JSON”入口，供应商列表新增任务配置摘要，可直接看到支持任务、文件输入、输出格式和结果模式。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- `client` 前端生产构建通过：`vite build`；仍只有既有 500 kB chunk 体积提示。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`；仍只有既有 500 kB chunk 体积提示。
- 本地 3001 服务已重启，`GET /api/health` 返回 HTTP 200。
- 临时供应商能力合同烟测通过：保存 `configJson` 后列表接口可返回规范化配置。
- 临时任务校验烟测通过：文件输入关闭时创建文件输入任务返回 400；启用文件输入并允许 `mp3/json` 后可创建“输入正文为空、结构化源媒体存在”的转写任务。
- 临时能力拦截烟测通过：供应商只声明 `transcription` 时，创建 `tts_audio` 任务返回 400。
- 临时用户、会话、供应商、任务和审计记录残留均为 0。

### 注意

- 本轮完成的是供应商能力合同与通用校验，不是某一家真实厂商的专用 SDK、文件上传、异步轮询、回调验签和下载转存适配。
- 任务配置 JSON 已可用，但为了运营人员长期维护，后续可在确定具体厂商后继续做成分能力的可视化配置表单。
- 公开前台多设备体验、MySQL 和正式部署继续按用户要求后置。

## Phase 9 第六十三块：AI 异步任务回调与外部任务生命周期

更新时间：2026-07-16

本轮开始前复核了上一块“AI 供应商能力合同与任务校验”：服务端语法检查通过，本地 3001 健康检查正常，供应商 `configJson`、任务类型/文件输入/输出格式校验和临时烟测均已记录为完成。继续按用户要求后置公开前台和 MySQL，本轮只推进后端 AI 任务真实供应商链路，补齐异步/回调型任务的安全生命周期。

### 已完成

- `ai_tasks` 新增外部任务字段：`external_job_id`、`provider_status`、`provider_request_json`、`provider_response_json`、`callback_token_hash`、`callback_received_at`，新库建表和旧库迁移均覆盖。
- 新增后台接口 `POST /api/admin/ai/tasks/:id/external-job`，用于登记供应商外部任务 ID、请求/响应快照和供应商状态。
- 外部任务登记会生成任务级一次性回调 token，只保存哈希；接口响应只在登记时返回明文 token 和回调地址。
- 新增公开回调接口 `POST /api/ai/tasks/:id/callback`，供应商必须通过 `x-ai-callback-token` 或请求体 token 校验后才能回填状态。
- 回调支持运行中、完成、失败三类状态：运行中只更新供应商状态和响应快照；完成态会规范化结果 JSON 并将任务置为 `completed`；失败态会记录错误并将任务置为 `failed`。
- 回调完成态复用现有 `normalizeAiResultJson`，继续校验媒体、转写文件、缩略图、源文件 URL 只允许 `http(s)` 或 `/uploads/` 路径。
- 外部任务登记和供应商回调均写入 `ai_call_logs` 和系统审计日志，便于追踪真实供应商何时接受、何时回传结果。
- 回调只完成 AI 任务结果，不会自动应用到内容版本，也不会绕过人工审核发布闭环。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- `client` 前端生产构建通过：`vite build`；仍只有既有 500 kB chunk 体积提示。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`；仍只有既有 500 kB chunk 体积提示。
- 本地 3001 服务已重启，`GET /api/health` 返回 HTTP 200。
- 临时异步任务烟测通过：创建 callback 模式供应商和转写任务，登记外部任务 `vendor-job-phase63` 后返回一次性回调 token。
- 错误 token 回调返回 403，正确 token 可把任务状态更新为 `processing`。
- 完成态回调通过：任务变为 `completed`，写入 `providerStatus = completed`、`callbackReceivedAt`，并将供应商 `fileUrl` 规范化为 `transcriptFileUrl`，保留 66 秒时长。
- 临时用户、会话、供应商、任务、调用日志和审计记录残留均为 0。

### 注意

- 本轮完成的是通用回调生命周期和验签入口，不是某一家供应商的专用上传、轮询、下载转存或回调签名算法适配。
- 目前回调 token 在登记外部任务时返回一次；真实部署时应由后端发起供应商任务创建并直接传入回调地址和 token，减少人工复制。
- 公开前台多设备体验、MySQL 和正式部署继续按用户要求后置。

## Phase 9 第六十四块：后台低频 JSON 入口可视化收口

更新时间：2026-07-16

本轮开始前按技术手册复核：后台/后端主闭环已经覆盖地区、权限、内容、审核、媒体、AI 任务和审计；仍未全量完成的方向包括真实 AI 厂商专用适配、部分后台 JSON 增强入口、公开端静态残留、公开前台最终验收、MySQL 和正式部署。按用户要求继续后置公开前台和 MySQL，本轮优先补齐后台运营体验中仍较明显的 JSON/行文本入口。

### 已完成

- 资源文库多条目从原始 JSON textarea 升级为结构化编辑器，支持新增、删除、上移、下移，字段包括标题、副标题、时间、来源、地点、作者、正文和图片路径。
- 入党誓词分句从原始 JSON textarea 升级为结构化编辑器，支持逐句新增、删除、排序和长文本编辑；未填写时仍保留后端按全文自动拆句兜底。
- 新建口述历史表单的“敏感片段标记”升级为专门编辑器，拆分开始时间、结束时间、风险等级、原文或摘要、公开处理方式。
- 已有口述历史素材工作台的“敏感片段时间轴”同步升级为同一套专门编辑器，创建和编辑体验保持一致。
- 敏感片段编辑器兼容原有行文本格式：旧数据会解析为结构化字段，保存时仍输出 `[开始-结束][等级] 原文或摘要 -> 处理方式`，不需要数据库迁移。
- 本轮只修改后台管理体验，不改变公开前台渲染逻辑，不触碰 MySQL。

### 已验证

- `node --check server/index.js` 通过。
- `client` lint 通过：`eslint .` 无错误无警告。
- `admin` 生产构建通过：`..\client\node_modules\.bin\vite.cmd build`。
- `client` 前端生产构建通过：`vite build`；仍只有既有 500 kB chunk 体积提示。
- `client` 服务端构建通过：`vite build --config vite.config.server.ts`；仍只有既有 500 kB chunk 体积提示。
- 本地 3001 服务健康检查正常，`GET /api/health` 返回 HTTP 200。
- 源码扫描确认 `SensitiveSegmentsEditor` 已接入新建口述历史和已有口述历史素材工作台；资源文库多条目和誓词分句已接入 `JsonRowsEditor`。

### 注意

- 本轮完成的是三类高价值低频入口的可视化；仍可继续打磨媒体列表、档案编辑页时间线、部分设备配置和 AI 供应商配置 JSON。
- 资源文库和誓词分句保存结构未变，继续走现有内容审核流程。
- 公开前台多设备体验、MySQL、正式部署和真实 AI 厂商专用适配继续后置。

## Phase 9 第六十五块：后端上线前审计与首版方向拆分

更新时间：2026-07-16

本轮按用户要求先不开新功能，先审计当前后端是否适合快速上服务器，并把“试运行上线”和“长期生产平台”分开判断。

### 已完成

- 新增 `docs/BACKEND_AUDIT.md`，记录当前后端架构、已达标模块、生产短板和推荐实施版本。
- 明确当前项目已经不是纯静态站点，而是 Node/Express 后端、独立后台应用和展示端共同运行。
- 明确当前数据层仍是 SQLite，适合本地开发和早期服务器试运行；长期正式生产仍建议做 MySQL 数据层。
- 对照技术手册复核后台与权限、内容审核、媒体库、AI 底座、备份恢复、运维基础的完成度。
- 标出影响快速上服务器的主要缺口：生产自检、环境变量校验、备份压缩与保留周期、基础上传配额、敏感操作二次确认、错误日志、部署包整理。
- 标出长期平台化缺口：MySQL、安装向导、升级包签名、升级失败回滚、模板市场、DeepSeek/Mimo 专用厂商适配、审计哈希链。
- 拆出五个可选第一实施版本：V0.9 服务器快速试运行版、V1.0 MySQL 基础版、V1.1 一键安装与升级平台版、V1.2 安全运维增强版、V1.3 DeepSeek + Mimo AI 厂商适配版。

### 审计判断

- 若目标是最快上服务器测试真实域名、后台、上传、审核和备份，建议先做 V0.9。
- 若目标是一开始就把真实长期数据放入正式生产库，建议先做 V1.0 MySQL，但上线速度会更慢。
- DeepSeek 和 Mimo 厂商适配不建议作为最快上线第一步，应在基础部署和数据库路径明确后推进。

### 注意

- 本轮只新增审计文档，没有修改运行时代码。
- 当前工作区仍显示 `server/node_modules` 有大量变更痕迹；正式推送或部署时应依赖服务器 `npm install`，不要把本机依赖目录作为上线产物。

## Phase 9 第六十六块：V1.0 友好后台与 MySQL 规格收口

更新时间：2026-07-16

本轮根据用户进一步澄清，调整“第一版快速上服务器”的方向：不是先做泛运维硬化，而是先把后台优化为政府工作人员、讲解员等非 IT 使用者也能友好操作，并同步切换到 MySQL 生产数据层。

### 已完成

- 更新 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md`，将 V1.0 定义为“友好后台 + MySQL 上线基础版”。
- 明确普通路径零 JSON：普通用户不再填写扩展数据 JSON、媒体列表 JSON 或输入 JSON。
- 明确后台采用类似 WordPress 易用性的受控区块编辑器，但通过模板和预设限制样式割裂。
- 明确全量可视化覆盖档案点位、口述历史、红歌、影片、党日路线、学习题库、今日苏区、时间轴、群众共创、宣誓墙、致敬仪式。
- 明确媒体数据改为素材选择器：上传、选择、用途过滤、拖拽排序、设为封面、裁剪封面、视频选帧、引用关系展示。
- 明确地图一次性接入高德地图，支持地址辅助定位、地图点选、经纬度高级入口、地区边界限制，并由超管按地区自定义边界。
- 明确审核页升级为审稿台：审核清单、风险标签、来源依据、审核批注、区块定位、大字审阅模式。
- 明确帮助中心、全局搜索、角色首页、讲解员工作台、手机端完整可用、主题排版风格切换、大字模式、5 分钟撤销等要求。
- 明确 MySQL 本地开发采用 Docker 方案，允许新增 `docker-compose.yml`、`server/schema/mysql.sql`、`server/scripts/migrate-sqlite-to-mysql.js`、`server/.env.mysql.example`。
- 明确 SQLite 当前数据也要迁移到 MySQL，迁移前保留 SQLite 备份，并在后台显示迁移时间。

### 开工边界

第一批 UI 范围：工作台、左侧分组菜单、新建中心、受控区块编辑器、媒体选择器、地图点选器、审核详情、大字/主题/排版切换、帮助中心骨架。

第一批 MySQL 范围：Docker MySQL 开发环境、MySQL schema、数据库适配层、SQLite 到 MySQL 迁移、MySQL 健康检查、生产 `.env` 示例。

### 注意

- 本轮只补充并收口文档，尚未开始代码实现。
- AI 厂商深度适配、升级包、模板市场、一键安装市场仍后置，不进入 V1.0 第一批。

## Phase 9 第六十七块：MySQL 运行时适配层起步与本地链路打通

更新时间：2026-07-16

本轮按用户要求，在正式进入下一步开发前先复核上一阶段是否完成，并把 V1.0 中“Docker MySQL 开发环境、SQLite 到 MySQL 迁移、数据库适配层起步、MySQL 健康检查”这一组基础工作真正落地。

### 已完成

- 复核确认：当前正式运行中的 API 仍是 SQLite，不是已经切到 MySQL；上一阶段完成的是 V1.0 文档收口与 MySQL 脚手架，不是最终运行时切库。
- 本机 WSL 中已安装并启动 Docker 与 Docker Compose，补充了 `docker-compose.yml` 本地 MySQL 方案所需的运行环境。
- 修复 `docker-compose.yml` 中不兼容 MySQL 8.4 的 `default-authentication-plugin` 启动参数，容器现已可正常启动并通过健康检查。
- 新增本地开发辅助脚本：
  - `scripts/start-local-mysql-wsl.ps1`
  - `scripts/stop-local-mysql-wsl.ps1`
  用于启动 WSL Docker 保活并管理本地 MySQL 容器，解决 WSL 空闲后 Docker 守护进程自动退出的问题。
- 修复 `server/scripts/migrate-sqlite-to-mysql.js`，处理 SQLite 与 MySQL 的真实差异：
  - 文本主键/索引列不再错误映射为不可建索引的 `LONGTEXT`
  - 主键列强制 `NOT NULL`
  - `TEXT/LONGTEXT` 字段不再写入 MySQL 不允许的默认值
- 已完成一次真实 SQLite -> MySQL 迁移，当前 `szht_cms` 库中已导入核心表数据，并记录 `migration_runs = 1`。
- 新增运行时适配层骨架：
  - `server/db/sqlite-runtime.js`
  - `server/db/mysql-observer.js`
  - `server/db/runtime.js`
- `server/index.js` 现已改为通过运行时适配层初始化 SQLite 主连接、执行 SQLite 备份与重连逻辑。
- `/api/health` 已升级为返回：
  - `store`
  - `configuredStore`
  - `compatibilityMode`
  - `database.targetStatus`
  用于明确“当前实际运行库”和“目标配置库”是否一致。
- 当配置目标为 MySQL 时，后端现在能通过适配层主动探测：
  - MySQL 是否可达
  - 版本号
  - 表数量
  - 是否存在核心表
  - 迁移记录数量

### 已验证

- `node --check server/index.js` 通过。
- `node --check server/db/runtime.js` 通过。
- `node --check server/db/sqlite-runtime.js` 通过。
- `node --check server/db/mysql-observer.js` 通过。
- `node --check server/scripts/migrate-sqlite-to-mysql.js` 通过。
- 本地 `docker compose -p szht -f docker-compose.yml up -d mysql` 可启动健康 MySQL 容器。
- `npm run db:migrate:mysql` 已真实导入 26 张表。
- 使用独立 Node 探测确认 MySQL 目标状态正常：
  - `reachable = true`
  - `schemaReady = true`
  - `migrationRuns = 1`
  - `coreTablesPresent = true`
  - `version = 8.4.10`
- 本地 `http://localhost:3001/api/health` 已返回新的 `compatibilityMode` 和 `database.targetStatus` 字段。

### 当前边界

- 当前 API 主查询层仍然是 SQLite，同步 `db.prepare(...).get/all/run()` 调用仍大面积存在于 `server/index.js`。
- 这一轮完成的是“运行时适配层起步 + MySQL 目标探测 + 迁移链路打通”，不是“全部业务查询已切换到 MySQL”。
- 因此 V1.0 的下一块应继续推进“核心业务查询下沉到数据库适配层”，优先从健康检查、会话、用户、内容列表等高频路径开始，逐段摆脱 `server/index.js` 对 SQLite 的直接依赖。

## Phase 9 第六十八块：核心后台链路数据库访问层下沉（第一批）

更新时间：2026-07-16

本轮严格按 V1.0 计划书继续推进“第三步：MySQL 数据层”中的“抽象数据库访问层”。开始前已复核上一块完成情况：MySQL 本地容器、迁移脚本、运行时适配层骨架与健康检查增强均成立，但核心后台链路仍直接散落在 `server/index.js` 中。因此本轮优先抽离登录、会话、当前用户、用户列表、角色权限、地区范围这一组高频后台基础能力。

### 已完成

- 新增 `server/db/admin-core-store.js`，作为第一批后台核心数据访问仓储层。
- 仓储层已覆盖以下能力：
  - 管理员用户创建、更新、按用户名查询、按 ID 查询、登录时间更新
  - 角色列表、角色查询、角色权限读取、用户权限覆写读取
  - 会话创建、按 token hash 查询、续期、更新时间、删除
  - 登录失败记录写入与锁定窗口内失败次数统计
  - 管理员用户列表查询
  - 地区列表、地区详情、父级查询、编码冲突检查、插入、更新、子地区计数、删除
  - 用户地区权限读取与替换
- `server/index.js` 中第一批核心路径已改为走仓储层，不再直接内联 SQL：
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/refresh`
  - `/api/admin/permissions`
  - `/api/admin/users`
  - `/api/admin/users/:id`
  - `/api/admin/regions/:id` 删除链路
  - 相关底层函数：`createSession`、`findSessionByToken`、`recordLoginAttempt`、`isLoginLocked`、`findAdminUserById`、`findAdminUserByUsername`、`listRoles`、`getRolePermissionCodes`、`listUserAssignedRegionIds`、`replaceUserRegions`、`listRegions`、`findRegion`、`insertRegion`、`updateRegion`
- 仓储层通过 `getDb()` 读取当前连接，兼容后端运行中重连 SQLite 的场景，为后续切换 MySQL 运行时预留了连接替换能力。

### 已验证

- `node --check server/db/admin-core-store.js` 通过。
- `node --check server/index.js` 通过。
- 独立 Node 烟测已通过仓储层真实读取本地库数据：
  - `roles = 6`
  - `users = 3`
  - `regions = 4`
  - `permissions = 19`
  - 不存在的 session token hash 返回空结果
- 本地 API 已重启到最新代码，`http://localhost:3001/api/health` 正常返回。
- `git diff --check -- server/index.js server/db/admin-core-store.js` 通过。

### 当前边界

- 本轮完成的是“第一批后台核心链路”的访问层下沉，不代表所有业务模块都已抽离。
- 内容列表、审核任务、内容详情、媒体库、AI 任务中心、导入导出、备份恢复等仍有大量查询留在 `server/index.js`。
- 严格按 V1.0 计划书，下一块应继续扩展数据库访问层，优先进入：
  - 内容列表/详情
  - 审核任务
  - 媒体库
  这三组是后台高频使用路径，也是后续真正切换 MySQL 运行时前最关键的第二批迁移目标。

## Phase 9 第六十九块：内容 / 审核 / 媒体读路径访问层下沉（第二批）

更新时间：2026-07-16

本轮继续严格按 V1.0 计划书中的“第三步：MySQL 数据层 -> 抽象数据库访问层”推进。开始前已复核上一块完成情况：第一批后台核心链路仓储层、语法检查、读库烟测和本地 API 运行状态均正常，因此本轮进入第二批高频读路径：内容列表/详情、审核任务、媒体库。

### 已完成

- 新增 `server/db/content-read-store.js`，作为第二批读路径仓储层。
- 新仓储层已覆盖：
  - 媒体库列表查询、媒体详情查询
  - 内容列表查询、内容摘要查询、版本列表查询、来源列表查询
  - 审核流程列表查询、流程步骤列表查询
  - 审核任务列表查询、内容维度审核任务列表、待审核任务查询
- `server/index.js` 中以下高频读路径已改为走仓储层：
  - `/api/admin/review-workflows`
  - `/api/admin/review-tasks`
  - `/api/admin/contents`
  - `/api/admin/contents/:id`
  - `/api/admin/media-assets`
  - `/api/admin/media-assets/:id`
- 与这些路由关联的底层读取函数已改为走仓储层：
  - `listContents`
  - `findContent`
  - `listMediaAssets`
  - `findMediaAsset`
  - `getWorkflowSteps`
  - `listContentReviewTasks`
  - `findPendingReviewTask`
- 第二批仓储层同样通过 `getDb()` 读取当前连接，和第一批仓储层一样兼容运行时重连，为后续真正切换 MySQL 运行时保留统一入口。

### 已验证

- `node --check server/db/content-read-store.js` 通过。
- `node --check server/index.js` 通过。
- 独立 Node 读库烟测已通过新仓储层真实读取：
  - `mediaTotal = 1`
  - `contentTotal = 17`
  - `workflowCount = 3`
  - `pendingReviewTaskCount = 0`
  - 首条内容可读到版本列表
- `git diff --check -- server/index.js server/db/content-read-store.js` 通过。
- 本地 API 已重启到最新代码，`http://localhost:3001/api/health` 正常返回。

### 当前边界

- 本轮完成的是内容、审核、媒体的“读路径”访问层下沉，不代表这些模块的写路径、批量操作、导出、回收站、审核写入和媒体处理都已抽离。
- 审核记录导出、内容创建/编辑/提审、媒体上传/恢复/删除、AI 任务中心、导入导出、备份恢复等仍大量保留在 `server/index.js`。
- 严格按 V1.0 计划书，下一块应继续推进：
  - 内容写路径
  - 审核写路径
  - 媒体写路径
  也就是把第二批模块从“只读仓储层”进一步推进到“完整读写访问层”。

## Phase 9 第七十块：内容 / 审核 / 媒体写路径访问层下沉（第三批）

更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 中“第三步：MySQL 数据层 -> 抽象数据库访问层”推进。开始前已复核上一块完成情况：`server/index.js` 与 `server/db/content-read-store.js` 语法检查通过，读层仓储直连烟测返回 `mediaTotal = 1`、`contentTotal = 17`、`workflowCount = 3`、`pendingReviewTaskCount = 0`，本地 `http://localhost:3001/api/health` 返回 HTTP 200，因此上一阶段“内容 / 审核 / 媒体读路径访问层下沉”在其既定边界内已完成。

### 已完成
- 新增 `server/db/content-write-store.js`，作为第三批高频写路径仓储层。
- 新仓储层已覆盖以下写入能力：
  - 内容主表插入、字段更新、永久删除
  - 内容版本插入、版本更新
  - 内容来源替换
  - 审核任务插入、字段更新、待审核任务取消
  - 媒体资产插入、字段更新、永久删除
- `server/index.js` 中以下高频运行时写路径已改为走写层仓储，而不再在路由中直接内联 SQL：
  - `/api/admin/contents`
  - `/api/admin/contents/:id`
  - `/api/admin/contents/actions/batch`
  - `/api/admin/contents/:id/submit`
  - `/api/admin/contents/:id/review`
  - `/api/admin/contents/:id/unpublish`
  - `/api/admin/contents/:id/trash`
  - `/api/admin/contents/:id/restore`
  - `/api/admin/contents/:id` 永久删除
  - `/api/admin/media-assets/upload`
  - `/api/admin/media-assets/:id`
  - `/api/admin/media-assets/actions/batch`
  - `/api/admin/media-assets/:id` 软删除
  - `/api/admin/media-assets/:id/restore`
  - `/api/admin/media-assets/:id/permanent`
- 与上述路由关联的底层辅助函数也已改为走写层仓储：
  - `insertMediaAsset`
  - `applyMediaMetadataUpdate`
  - `applyContentUpdate`
  - `insertContentVersion`
  - `updateContentVersion`
  - `replaceContentSources`
  - `createReviewTask`
  - `cancelPendingReviewTasks`
- AI 结果回填后“直接提交审核”的内容状态更新也已切到写层仓储，避免该链路继续绕回旧式直接 SQL。

### 已验证
- `node --check server/index.js` 通过。
- `node --check server/db/content-write-store.js` 通过。
- `git diff --check -- server/index.js server/db/content-write-store.js` 通过。
- 本地 `http://localhost:3001/api/health` 返回 HTTP 200。
- 独立 Node 事务烟测通过，且在回滚后未污染数据库：
  - 内容写层插入后可读到 `contentStatus = pending_review`
  - 版本更新后可读到 `versionTitle = Smoke Content Updated`
  - 来源替换后 `sourceCount = 1`
  - 审核任务写回后可读到 `reviewStatus = approved`
  - 媒体字段更新后可读到 `mediaCaption = updated caption`
  - 媒体自动压缩标记更新后可读到 `mediaAutoCompress = 1`

### 当前边界
- 本轮完成的是高频“运行时内容 / 审核 / 媒体写路径”访问层下沉，不代表所有低频维护逻辑都已迁走。
- `server/index.js` 中仍保留少量低频、非核心运行时的直接 SQL，例如：
  - 回收站整站清空
  - 旧档案种子迁移
  - 媒体迁移临时表整理
- 当前运行时数据层依旧是 SQLite，尚未切换到 MySQL 执行真实业务读写；本轮完成的是“为后续切库继续收敛访问层”。
- 严格按 V1.0 计划书，下一块应继续推进：
  - 其余后台高频模块访问层下沉（如导入导出、备份恢复、AI 任务中心等）
  - 或进入 MySQL 运行时切换前的剩余访问层收口与验收

## Phase 9 第七十一块：AI 中心 / 审计日志 / 回收站运维访问层下沉（第四批）

更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 中“第三步：MySQL 数据层 -> 抽象数据库访问层”推进。开始前已复核上一块完成情况：`server/index.js` 与 `server/db/content-write-store.js` 语法检查通过，写层事务烟测返回 `contentStatus = pending_review`、`sourceCount = 1`、`reviewStatus = approved`、`mediaCaption = updated caption`，本地 `http://localhost:3001/api/health` 返回 HTTP 200，因此上一阶段“内容 / 审核 / 媒体写路径访问层下沉”在其既定边界内已完成。

### 已完成
- 新增 `server/db/ai-ops-store.js`，作为第四批后台高频运维型仓储层。
- 新仓储层已覆盖以下能力：
  - AI 提供商列表/详情查询、创建、更新、测试结果写回
  - AI 任务列表/详情查询、创建、状态更新、外部任务登记、回调状态更新、回调 token hash 读取
  - AI 调用日志列表查询、总数统计、写入
  - 审计日志列表查询、总数统计、写入
  - 回收站整站清空前的已删除内容/媒体枚举，以及数据库层批量清理
- `server/index.js` 中以下模块已改为走仓储层，不再在路由或底层函数中直接内联 SQL：
  - `/api/admin/ai/providers`
  - `/api/admin/ai/providers/:id`
  - `/api/admin/ai/providers/:id/test`
  - `/api/admin/ai/tasks`
  - `/api/admin/ai/tasks/:id/run`
  - `/api/admin/ai/tasks/:id/import-result`
  - `/api/admin/ai/tasks/:id/external-job`
  - `/api/ai/tasks/:id/callback`
  - `/api/admin/ai/call-logs`
  - `/api/audit-logs`
  - `/api/admin/trash/purge`
- 与上述路由关联的底层辅助函数也已改为走仓储层：
  - `listAiProviders`
  - `findAiProvider`
  - `insertAiProvider`
  - `updateAiProvider`
  - `listAiTasks`
  - `findAiTask`
  - `insertAiTask`
  - `setAiTaskRunning`
  - `completeAiTask`
  - `registerAiExternalJob`
  - `updateAiExternalJobStatus`
  - `listAiCallLogs`
  - `insertAiCallLog`
  - `writeAudit`

### 已验证
- `node --check server/index.js` 通过。
- `node --check server/db/ai-ops-store.js` 通过。
- `git diff --check -- server/index.js server/db/ai-ops-store.js` 通过。
- 本地 `http://localhost:3001/api/health` 返回 HTTP 200。
- 独立 Node 事务烟测通过，且在回滚后未污染数据库：
  - AI 提供商测试结果写回后可读到 `providerStatus = ok`
  - AI 任务状态推进后可读到 `taskStatus = completed`
  - 回调 token hash 读取成功，返回 `callbackHash = hash-token`
  - AI 调用日志可写可读，`callLogCount = 1`
  - 审计日志可写可读，`auditCount = 1`
  - 已删除媒体和内容可被回收站枚举，`deletedMediaSeen = true`、`deletedContentSeen = true`
  - 数据库层整站回收站清空逻辑执行后，测试内容和测试媒体都不可再读，`purgedContent = true`、`purgedMedia = true`

### 当前边界
- 本轮完成的是 AI 中心、审计日志、回收站清空这一组高频运维路径的访问层下沉，不代表导入导出、备份恢复、快照导入、全表导出等数据运维链路都已迁走。
- `server/index.js` 中仍保留一些以数据库为核心的运维型直接访问逻辑，例如：
  - `buildExportPayload`
  - `importSnapshotPayload`
  - `insertSnapshotRows`
  - 备份恢复过程中的部分数据库文件切换与重建逻辑
- 当前运行时数据层依旧是 SQLite，尚未切换到 MySQL 执行真实业务读写；本轮完成的是“进一步压缩 `server/index.js` 对 SQLite 直接依赖的面积”。
- 严格按 V1.0 计划书，下一块应继续推进：
  - 导入导出 / 快照导入 / 备份恢复相关数据库访问层收口
  - 然后进入 MySQL 运行时切换前的最终访问层验收

## Phase 9 第七十二块：快照导出 / 快照导入访问层收口（第五批）

更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 中“第三步：MySQL 数据层 -> 抽象数据库访问层”推进。开始前已复核上一块完成情况：`server/index.js` 与 `server/db/ai-ops-store.js` 语法检查通过，AI / 审计 / 回收站事务烟测返回 `providerStatus = ok`、`taskStatus = completed`、`auditCount = 1`、`purgedContent = true`、`purgedMedia = true`，本地 `http://localhost:3001/api/health` 返回 HTTP 200，因此上一阶段“AI 中心 / 审计日志 / 回收站运维访问层下沉”在其既定边界内已完成。

### 已完成
- 新增 `server/db/snapshot-store.js`，作为第五批快照型数据库访问层。
- 新仓储层已覆盖以下能力：
  - 按表导出全量快照行数据
  - 按表读取列结构
  - 按表批量插入快照数据
  - 按给定快照表集合和清理表集合执行整批快照替换
- `server/index.js` 中以下与快照导出 / 导入直接相关的数据库操作已改为走仓储层：
  - `buildExportPayload`
  - `importSnapshotPayload`
- 原先散落在 `server/index.js` 中的表级直接 SQL 已从主流程移出：
  - `SELECT * FROM ${table}`
  - `PRAGMA table_info(...)`
  - 快照导入时的 `DELETE FROM ${table}`
  - 快照导入时的逐行 `INSERT INTO ${table}`

### 已验证
- `node --check server/index.js` 通过。
- `node --check server/db/snapshot-store.js` 通过。
- `git diff --check -- server/index.js server/db/snapshot-store.js` 通过。
- 本地 `http://localhost:3001/api/health` 返回 HTTP 200。
- 使用临时 SQLite 副本完成独立烟测，未污染正式本地数据库：
  - 快照导出读取成功，`archiveCount = 16`
  - 快照导出读取成功，`contentCount = 17`
  - 快照回灌返回 `importedArchiveCount = 16`
  - 快照回灌返回 `importedContentCount = 17`
  - 回灌后所有快照表计数一致，`countsMatch = true`

### 当前边界
- 本轮完成的是“快照导出 / 快照导入”的数据库访问层收口，不代表整个备份恢复流程已经全部下沉。
- `server/index.js` 中仍保留备份恢复相关的文件系统和运行时编排逻辑，例如：
  - `createBackupSet`
  - `restoreDatabaseFromBackup`
  - 备份文件复制、上传目录复制、数据库连接重开、恢复失败回滚
- 上述剩余逻辑更多属于“运行时切库 / 文件系统恢复编排”，不只是单纯 SQL；当前数据库访问层已基本收口到适合继续进入 MySQL 运行时切换前的最终验收阶段。
- 当前运行时数据层依旧是 SQLite，尚未切换到 MySQL 执行真实业务读写。
- 严格按 V1.0 计划书，下一块应继续推进：
  - MySQL 运行时切换前的最终访问层验收
  - 然后进入真实 `DB_CLIENT=mysql` 运行链路联调与验收

## Phase 9 第七十三块：剩余运行时请求访问层最终收口（第六批）

更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 中“第三步：MySQL 数据层 -> 抽象数据库访问层”推进。开始前已复核上一块完成情况：`server/index.js` 与 `server/db/snapshot-store.js` 语法检查通过，`/api/health` 返回 HTTP 200，且基于临时 SQLite 副本的快照导出/回灌烟测返回 `archiveCount = 16`、`contentCount = 17`、`importedArchiveCount = 16`、`importedContentCount = 17`、`countsMatch = true`，因此上一阶段“快照导出 / 快照导入访问层收口”在既定边界内已完成。

### 已完成
- 新增 `server/db/runtime-misc-store.js`，作为第六批剩余运行时请求访问层。
- 新访问层已覆盖以下原先散落在 `server/index.js` 中的运行时数据库访问：
  - 内容模块列表、默认发布位读取与更新
  - 风险标签模板列表、查询、重名校验、创建、更新、删除
  - 公开内容列表与详情读取
  - 公开档案列表、地图点位读取、详情读取、内容来源读取
  - 公开留言列表读取
  - 审核记录导出查询
  - 模块审核工作流查找
  - 旧档案列表、查询、创建、更新、删除
  - 留言删除、签到进度查询/写回、致敬计数读取/更新/递增
  - 上传文件 URL 到媒体资产存储路径的反查
- `server/index.js` 中上述运行时请求链路已不再直接 `db.prepare(...)` 内联 SQL，而是统一走访问层。

### 已验证
- `node --check server/index.js` 通过。
- `node --check server/db/runtime-misc-store.js` 通过。
- 本地 `http://localhost:3001/api/health` 返回 HTTP 200。
- 公开接口冒烟通过：
  - `/api/contents?page=1&pageSize=1` 返回 HTTP 200
  - `/api/archives?page=1&pageSize=1` 返回 HTTP 200
  - `/api/tributes` 返回 HTTP 200
- 基于临时 SQLite 副本的运行时访问层烟测通过，且未污染正式本地库：
  - `moduleCount = 29`
  - `workflowId = workflow-archive-default`
  - `publicContentRows = 1`
  - `archivePublishedCount = 1`
  - `messagePublishedCount = 0`
  - 风险标签临时写入/更新/删除均成功：`riskInserted = true`、`riskUpdated = true`、`riskDeleted = true`
  - 签到进度写回后可读：`checkinCount = 2`
  - 致敬计数可改可增：`tributeBefore = 11990821`、`tributeAfter = 11990827`
  - 旧档案表可读：`legacyArchiveCount = 16`

### 当前边界
- 本轮完成的是“剩余运行时请求路径”的访问层最终收口；`server/index.js` 中已不再残留运行时请求级别的 `db.prepare(...)` 直连 SQL。
- 当前仍保留的 `db.exec('BEGIN'/'COMMIT'/'ROLLBACK')` 主要是运行时事务编排；仍保留的 `db.prepare(...)` 主要集中在：
  - 启动迁移与结构补丁
  - 种子初始化
  - SQLite 备份恢复与文件级编排
- 当前运行时数据库仍是 SQLite，尚未切换到真实 MySQL 执行业务读写。
- 严格按 V1.0 计划书，下一块应继续推进：
  - 事务编排抽象与 `DB_CLIENT=mysql` 运行时切换预演
  - 然后进入真实 MySQL 运行链路联调与验收

## Phase 9 第七十四块：事务编排抽象与 MySQL 切换预演

更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 中“第三步：MySQL 数据层 -> 抽象数据库访问层”推进。开始前已复核上一块完成情况：`server/index.js` 与 `server/db/runtime-misc-store.js` 语法检查通过，`/api/health` 返回 HTTP 200，且运行时访问层临时库烟测返回 `moduleCount = 29`、`archivePublishedCount = 1`、`riskInserted = true`、`riskUpdated = true`、`riskDeleted = true`、`rollbackPreserved = true`，因此上一阶段“剩余运行时请求访问层最终收口”在既定边界内已完成。

### 已完成
- 在 `server/db/sqlite-runtime.js` 新增 `runSqliteTransaction`，并在 `server/db/runtime.js` 暴露统一 `runInTransaction` 入口，作为后续切换 MySQL 运行时的事务编排抽象。
- 在 `server/db/runtime.js` 新增运行模式摘要能力：
  - `compatibilityMode`
  - `getRuntimeModeSummary(targetStatus)`
  - `targetReady`
- `server/index.js` 中原先残留在运行时请求链路里的手写事务块已统一改为走 `runInDatabaseTransaction(...)`，覆盖：
  - 内容创建 / 编辑 / 批量编辑 / 提交审核 / 审核流转
  - 群众留言入库并进入审核
  - 媒体批量编辑
  - AI 结果应用到内容并可直接送审
  - 回收站清空
- 新增后台运行时状态接口：
  - `/api/admin/database/runtime-status`
  - 用于显示运行客户端、配置客户端、兼容模式、目标库就绪状态和下一步动作建议
- 新增 MySQL 预检脚本：
  - `server/scripts/mysql-preflight.js`
  - `npm run db:preflight:mysql`
  - 可直接对 SQLite 与 MySQL 核心表计数做对照，给出 `readyForRuntimeCutover`

### 已验证
- `node --check server/index.js` 通过。
- `node --check server/db/runtime.js` 通过。
- `node --check server/db/sqlite-runtime.js` 通过。
- `node --check server/scripts/mysql-preflight.js` 通过。
- 本地服务重启后，`http://localhost:3001/api/health` 返回 HTTP 200，且已包含：
  - `database.runtimeClient`
  - `database.configuredClient`
  - `database.targetReady`
- `/api/admin/database/runtime-status` 未登录访问返回 HTTP 401，证明新路由已注册且受到权限保护。
- 基于临时 SQLite 副本的事务烟测通过：
  - 提交事务后 `afterCommit = 11990826`
  - 抛错回滚后 `afterRollback = 11990826`
  - `rollbackPreserved = true`
  - `mysqlMode.compatibilityMode = true`
- 本地 MySQL 预检脚本真实跑通：
  - `targetStatus.reachable = true`
  - `targetStatus.schemaReady = true`
  - `targetStatus.coreTablesPresent = true`
  - `migrationRuns = 1`
  - `version = 8.4.10`
  - 核心表对照全部一致
  - `readyForRuntimeCutover = true`

### 当前边界
- 本轮完成的是“事务编排抽象 + MySQL 切换预演工具化”，不是“真实业务运行时已切到 MySQL”。
- 当前 `localhost:3001` 运行时数据库仍是 SQLite；健康接口仍显示：
  - `store = sqlite`
  - `configuredStore = sqlite`
- 但本地 MySQL 目标库已通过预检，说明“目标库准备度”这一块已经达到进入真实切换联调的条件。
- 严格按 V1.0 计划书，下一块应继续推进：
  - 真实 `DB_CLIENT=mysql` 运行链路联调
  - 数据访问层从 SQLite 同步实现逐步过渡到真正的 MySQL 运行实现

## Phase 9 第七十五块：运行时 SQL 方言兼容层收口（MySQL 切换前置）

更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进真实 MySQL 运行链路联调的前置工作。开始前已复核上一块完成情况：`server/index.js`、`server/db/runtime.js`、`server/db/sqlite-runtime.js`、`server/scripts/mysql-preflight.js` 语法检查通过；`/api/health` 返回 HTTP 200；`npm run db:preflight:mysql` 返回 `readyForRuntimeCutover = true`，因此上一阶段“事务编排抽象与 MySQL 切换预演”在既定边界内已完成。

### 已完成
- 新增 `server/db/sql-dialect.js`，作为运行时 SQL 方言帮助层，统一封装：
  - JSON 文本提取
  - JSON 类型判断
  - JSON 数值提取
  - `INSERT IGNORE / INSERT OR IGNORE`
  - `checkin_progress` 的 MySQL / SQLite upsert 差异
- `server/index.js` 中与运行时公开内容相关的 SQL 表达式已切换为走方言层：
  - 口述历史授权状态过滤
  - 内容地区权限过滤
  - 指定地区筛选
  - 档案地图显示位判断
  - 档案经纬度数值过滤
- `server/db/runtime-misc-store.js` 已切换到方言层：
  - 公开档案排序中的年份提取
  - `legacyId` 匹配
  - 地图发布位判断
  - `checkin_progress` upsert
- `server/db/admin-core-store.js` 中用户地区关系写入已切换到方言层，提前兼容 MySQL 的 `INSERT IGNORE`
- 新增 MySQL 运行时 SQL 烟测脚本：
  - `server/scripts/mysql-runtime-smoke.js`
  - `npm run db:smoke:mysql`

### 已验证
- `node --check` 通过：
  - `server/index.js`
  - `server/db/sql-dialect.js`
  - `server/db/admin-core-store.js`
  - `server/db/runtime-misc-store.js`
  - `server/scripts/mysql-runtime-smoke.js`
- 运行时方言扫描结果符合预期：
  - 剩余 `INSERT OR IGNORE` 仅集中在启动/种子逻辑
  - 运行时请求链路中的 JSON 查询与 upsert 已完成方言化
- 本地 MySQL 运行时 SQL 烟测真实跑通：
  - `oralHistoryAuthorizedCount = 0`
  - `regionScopedCount = 17`
  - `publishedArchiveCount = 0`
  - `checkinVisitedCount = 2`
  - `userRegionInsertedCount = 1`
  - `ok = true`
- 本地服务重启后继续正常：
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `/api/contents?page=1&pageSize=1` 返回 HTTP 200
  - `/api/archives?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“运行时 SQL 方言兼容层收口”，重点是把未来真实 MySQL 运行时最容易踩爆的 SQL 差异先清掉。
- 当前仍残留的 SQLite 方言主要集中在：
  - 启动建表 SQL
  - 启动迁移补丁
  - 种子初始化
- 当前 API 运行时仍然是 SQLite，尚未把 `DB_CLIENT=mysql` 真正作为主业务运行时切上去。
- 严格按 V1.0 计划书，下一块应继续推进：
  - 启动路径与种子逻辑按数据库客户端拆分
  - 然后进入真实 `DB_CLIENT=mysql` 运行链路联调与验收

## Phase 9 第七十六块：启动路径与种子逻辑按数据库客户端拆分
更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进真实 MySQL 运行链路联调前的前置工作。开始前已复核上一块完成情况：`server/index.js`、`server/db/sql-dialect.js`、`server/db/admin-core-store.js`、`server/db/runtime-misc-store.js`、`server/scripts/mysql-runtime-smoke.js` 语法检查通过；`http://localhost:3001/api/health` 返回 HTTP 200；在补齐正确的 MySQL 环境变量 `DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD` 后，`npm run db:smoke:mysql` 返回 `ok = true`，因此上一阶段“运行时 SQL 方言兼容层收口”在既定边界内已完成。

### 已完成
- 新增 `server/db/runtime-bootstrap.js`，把启动/导入/恢复时的 bootstrap 编排抽成独立模块，统一暴露：
  - `describe(reason)`
  - `apply(reason)`
- `server/index.js` 中原本散落的启动期调用已改为统一走 `applyRuntimeBootstrap(...)`：
  - 启动：`applyRuntimeBootstrap('startup')`
  - 导入：`applyRuntimeBootstrap('import')`
  - 恢复：`applyRuntimeBootstrap('restore')`
  - 恢复失败回滚：`applyRuntimeBootstrap('restore_recovery')`
- 把 SQLite 专属建表入口显式收口为 `ensurePrimarySchema()`，并只在 `runtimeClient = sqlite` 时执行。
- 启动编排与导入/恢复编排已按客户端分流：
  - SQLite 启动：主表结构 + 运行时迁移 + 系统种子 + 旧档案迁移种子
  - MySQL 启动预留：跳过 SQLite 专属 schema/migration，仅保留共享种子编排
  - SQLite 导入/恢复：保留迁移补丁 + 权限/地区/内容系统补种
  - MySQL 导入/恢复预留：跳过 SQLite 专属迁移，仅保留共享补种
- 新增 bootstrap 烟测脚本：
  - `server/scripts/runtime-bootstrap-smoke.js`
  - `npm run db:bootstrap:smoke`

### 已验证
- `node --check` 通过：
  - `server/index.js`
  - `server/db/runtime-bootstrap.js`
  - `server/scripts/runtime-bootstrap-smoke.js`
- `npm run db:bootstrap:smoke` 通过，并验证六组场景编排符合预期：
  - `sqlite + startup`
  - `sqlite + import`
  - `sqlite + restore`
  - `mysql + startup`
  - `mysql + import`
  - `mysql + restore`
- `npm run db:smoke:mysql` 在本地 MySQL 目标库继续通过：
  - `oralHistoryAuthorizedCount = 0`
  - `regionScopedCount = 17`
  - `publishedArchiveCount = 0`
  - `checkinVisitedCount = 2`
  - `userRegionInsertedCount = 1`
  - `ok = true`
- 本地服务已用新代码重启并复核：
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200
  - `http://localhost:3001/api/archives?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“启动路径/种子逻辑按客户端拆分与收口”，重点是把未来 MySQL 真实运行时最容易被 SQLite 启动逻辑卡住的部分先解耦。
- 当前 `localhost:3001` 的真实业务运行时仍是 SQLite，健康接口仍显示：
  - `store = sqlite`
  - `configuredStore = sqlite`
- 目前还没有完成的，是把 `createDatabaseRuntime(...)` 从“SQLite 运行时 + MySQL 目标观察”推进到“真实 `DB_CLIENT=mysql` 主运行时读写”。
- 严格按 V1.0 计划书，下一块应继续推进：
  - 真实 `DB_CLIENT=mysql` 运行时接管启动链路
  - 真实 MySQL 主连接读写联调与验收

## Phase 9 第七十七块：MySQL 主连接读写联调与自增结构修复
更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进“第三步：MySQL 数据层”中的真实 MySQL 主连接读写联调。开始前已复核上一块完成情况：`server/index.js`、`server/db/runtime-bootstrap.js`、`server/scripts/runtime-bootstrap-smoke.js` 语法检查通过；`npm run db:bootstrap:smoke` 返回 `ok = true`；补齐 MySQL 环境变量后，`npm run db:smoke:mysql` 返回 `ok = true`；`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段“启动路径与种子逻辑按数据库客户端拆分”在既定边界内已完成。

### 已完成
- 新增 `server/db/mysql-primary-ops.js`，补齐 MySQL 主连接的异步基础能力：
  - `withMysqlConnection(...)`
  - `withMysqlTransaction(...)`
  - `withMysqlRollbackTransaction(...)`
  - `getMysqlHealthSnapshot(...)`
- `server/db/mysql-observer.js` 改为复用 MySQL 主连接配置构造逻辑，避免连接参数分叉。
- `server/scripts/mysql-runtime-smoke.js` 已改为复用新的 MySQL 主连接工具层，不再各自手写连接。
- 新增 MySQL 主连接核心链路烟测脚本：
  - `server/scripts/mysql-primary-flow-smoke.js`
  - `npm run db:smoke:mysql:primary`
  - 覆盖健康读取、超管读取、权限读取、地区读取、模块读取、公开内容读取、会话写入、登录失败写入、签到进度写入、致敬计数更新，以及整组回滚验证。
- 本轮联调中发现并修复 MySQL 迁移结构缺口：
  - SQLite 的 `INTEGER PRIMARY KEY AUTOINCREMENT` 在迁移到 MySQL 时未正确落成 `AUTO_INCREMENT`
  - 受影响的已知表包括：
    - `login_attempts`
    - `audit_logs`
    - `ai_call_logs`
- 已修复 `server/scripts/migrate-sqlite-to-mysql.js`，使其在重新迁移时可正确识别 SQLite 自增主键并生成 `AUTO_INCREMENT`。
- 新增现有目标库结构修复脚本：
  - `server/scripts/mysql-fix-autoincrement.js`
  - `npm run db:repair:mysql:auto-increment`
- `server/scripts/mysql-preflight.js` 已补充自增字段检查：
  - 预检不仅核对核心表数量，还核对 `login_attempts / audit_logs / ai_call_logs` 的 `id` 列是否带 `AUTO_INCREMENT`

### 已验证
- `node --check` 通过：
  - `server/db/mysql-primary-ops.js`
  - `server/db/mysql-observer.js`
  - `server/scripts/mysql-runtime-smoke.js`
  - `server/scripts/mysql-primary-flow-smoke.js`
  - `server/scripts/migrate-sqlite-to-mysql.js`
  - `server/scripts/mysql-fix-autoincrement.js`
  - `server/scripts/mysql-preflight.js`
- `npm run db:repair:mysql:auto-increment` 在本地目标库修复完成：
  - `login_attempts.changed = true`
  - `audit_logs.changed = true`
  - `ai_call_logs.changed = true`
  - 全部 `autoIncrement = true`
- `npm run db:preflight:mysql` 继续通过，且新增检查通过：
  - `readyForRuntimeCutover = true`
  - `autoIncrementChecks` 全部为 `true`
- `npm run db:smoke:mysql` 继续通过：
  - `oralHistoryAuthorizedCount = 0`
  - `regionScopedCount = 17`
  - `publishedArchiveCount = 0`
  - `checkinVisitedCount = 2`
  - `userRegionInsertedCount = 1`
  - `ok = true`
- `npm run db:smoke:mysql:primary` 通过，真实结果包括：
  - `health.archiveCount = 16`
  - `health.messageCount = 6`
  - `reads.superAdminUsername = admin`
  - `reads.superAdminRoleName = 超级管理员`
  - `writes.sessionInserted = true`
  - `writes.loginAttemptInserted = true`
  - `writes.checkinVisitedCount = 3`
  - `writes.tributeDelta = 3`
  - `rollback.sessionReverted = true`
  - `rollback.loginAttemptReverted = true`
  - `rollback.checkinReverted = true`
  - `ok = true`
- 本地 SQLite 运行时服务未受回归影响：
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“真实 MySQL 主连接读写联调前置工具化 + 迁移结构缺口修复”，重点是先把 MySQL 目标库的核心读写与回滚链路跑实，并修掉会阻断真实接管的结构问题。
- 当前 `localhost:3001` 的正式业务运行时仍是 SQLite；这轮还没有把 Express 全量请求链路切换到 `DB_CLIENT=mysql` 主运行时。
- 当前已经具备的条件是：
  - MySQL 目标库核心表数量对齐
  - MySQL 目标库自增主键结构对齐
  - MySQL 主连接核心读写/回滚烟测通过
- 严格按 V1.0 计划书，下一块应继续推进：
  - 将运行时 store/请求链路从 SQLite 同步访问逐步切换到 MySQL 可用的正式实现
  - 进入真实 `DB_CLIENT=mysql` 服务启动与接口联调验收

## Phase 9 第七十八块：公开读链路 MySQL 正式 store 与对照烟测
更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进真实 MySQL 运行时接管前的正式实现落地。开始前已复核上一块完成情况：`server/db/mysql-primary-ops.js`、`server/scripts/mysql-primary-flow-smoke.js`、`server/scripts/mysql-fix-autoincrement.js`、`server/scripts/mysql-preflight.js` 语法检查通过；`npm run db:preflight:mysql` 返回 `readyForRuntimeCutover = true` 且 `autoIncrementChecks` 全部为 `true`；`npm run db:smoke:mysql:primary` 返回 `ok = true`；`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段“MySQL 主连接读写联调与自增结构修复”在既定边界内已完成。

### 已完成
- 新增 `server/db/mysql-public-read-store.js`，补齐公开读链路的正式 MySQL store，实现了：
  - `listPublicContentRows(...)`
  - `findPublishedContentRow(...)`
  - `countPublicArchiveRows(...)`
  - `listPublicArchiveRows(...)`
  - `findPublishedArchiveRow(...)`
  - `listPublicContentSourceRows(...)`
- 新增公开 API 对照烟测脚本：
  - `server/scripts/mysql-public-api-parity.js`
  - `npm run db:parity:mysql:public`
- 该对照脚本使用当前 `http://localhost:3001` 的 SQLite 公开接口作为基准，同时直接读取 MySQL 正式 store，对以下链路做结果比对：
  - `/api/contents?page=1&pageSize=5`
  - `/api/contents?moduleKey=oral_history&page=1&pageSize=5`
  - `/api/archives?page=1&pageSize=5`
  - 若存在公开档案，再补比对 `/api/archives/:id` 的标题与来源条数
- 本轮没有改变当前 Express 正式运行时，仍保持本地服务运行在 SQLite，避免在未完成全量 store 异步化前直接半切换。

### 已验证
- `node --check` 通过：
  - `server/db/mysql-public-read-store.js`
  - `server/scripts/mysql-public-api-parity.js`
- `npm run db:parity:mysql:public` 通过，当前真实比对结果为：
  - `contents.apiTotal = 1`
  - `contents.mysqlTotal = 1`
  - `contents.apiIds` 与 `contents.mysqlIds` 一致
  - `oralHistory.apiTotal = 0`
  - `oralHistory.mysqlRowsVisible = 0`
  - `archives.apiTotal = 0`
  - `archives.mysqlTotal = 0`
  - `ok = true`
- `npm run db:smoke:mysql:primary` 再次通过，说明本轮新增公开读 store 未破坏前一轮主连接读写烟测。
- 当前 SQLite 正式服务继续正常：
  - `http://localhost:3001/api/archives?page=1&pageSize=5` 返回 HTTP 200

### 当前边界
- 本轮完成的是“公开读链路的正式 MySQL store 落地与 SQLite/MySQL 结果对照”，重点是先把最适合先切的公开只读能力从“脚本级查询”推进到“正式 store 能力”。
- 当前 `localhost:3001` 的正式请求链路仍然是 SQLite，同步 store 仍未全量异步化。
- 当前已经具备的条件是：
  - MySQL 主连接基础能力已稳定
  - MySQL 公开读 store 已开始成型
  - 公开 `contents / oral_history / archives` 链路已具备 SQLite/MySQL 对照验证能力
- 严格按 V1.0 计划书，下一块应继续推进：
  - 将后台鉴权/会话/权限与后台内容查询链路逐步抽到可切换的 MySQL 正式 store
  - 为真实 `DB_CLIENT=mysql` 服务启动联调继续清除同步接口依赖

## Phase 9 第七十九块：后台核心鉴权/权限/地区链路 MySQL 正式 store
更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进“第三步：MySQL 数据层”中后台核心链路的正式 MySQL 实现。开始前已复核上一块完成情况：`server/db/mysql-public-read-store.js`、`server/scripts/mysql-public-api-parity.js` 语法检查通过；`npm run db:parity:mysql:public` 返回 `ok = true`；`npm run db:smoke:mysql:primary` 返回 `ok = true`；`http://localhost:3001/api/health` 与 `http://localhost:3001/api/archives?page=1&pageSize=5` 返回 HTTP 200，因此上一阶段“公开读链路 MySQL 正式 store 与对照烟测”在既定边界内已完成。

### 已完成
- 新增 `server/db/mysql-admin-core-store.js`，把后台高频基础能力补成正式 MySQL store，覆盖：
  - 管理员用户创建、更新、按用户名/ID 查询、登录时间更新
  - 权限列表、角色列表、角色权限读取、用户权限覆写读取
  - 管理员用户列表查询
  - 会话创建、按 token hash 查询、删除、续期、最近访问更新时间更新
  - 登录失败记录写入与失败次数统计
  - 用户地区权限读取与替换
  - 地区列表、地区详情、父地区查询、编码重复校验
  - 地区新增、更新、删除、默认地区清理、子地区数量统计
- 新增 SQLite/MySQL 后台核心 store 对照脚本：
  - `server/scripts/mysql-admin-core-parity.js`
  - `npm run db:parity:mysql:admin-core`
  - 直接使用当前 SQLite `admin-core-store` 作为基准，对比 MySQL 后台核心 store 的权限、角色、用户、地区与用户地区分配结果。
- 新增后台核心流程回滚烟测脚本：
  - `server/scripts/mysql-admin-core-flow-smoke.js`
  - `npm run db:smoke:mysql:admin-core`
  - 覆盖会话写入、登录失败写入、地区新增/更新、地区编码重复检测、父地区读取、用户地区替换，以及整组回滚恢复验证。
- `server/package.json` 已新增相应脚本入口，便于后续本地联调和部署前复核。

### 已验证
- `node --check` 通过：
  - `server/db/mysql-admin-core-store.js`
  - `server/scripts/mysql-admin-core-parity.js`
  - `server/scripts/mysql-admin-core-flow-smoke.js`
- `npm run db:parity:mysql:admin-core` 通过，真实对照结果包括：
  - `permissions.sqliteCount = 19`
  - `permissions.mysqlCount = 19`
  - 权限代码顺序一致
  - 角色 ID 列表一致
  - `super_admin` 角色权限数一致
  - 管理员用户名列表一致
  - `admin` 的角色均为 `super_admin`
  - 地区 ID 列表一致
  - `admin` 的地区分配结果一致
- `npm run db:smoke:mysql:admin-core` 通过，真实结果包括：
  - `reads.roleCount = 6`
  - `reads.permissionCount = 19`
  - `reads.regionCount = 4`
  - `writes.sessionInserted = true`
  - `writes.failedCount = 1`
  - `writes.regionInserted = true`
  - `writes.regionUpdatedName = MySQL 烟测地区已更新`
  - `writes.duplicateCodeFound = true`
  - `writes.parentId = region-suqu`
  - `rollback.sessionReverted = true`
  - `rollback.regionReverted = true`
  - `rollback.loginAttemptReverted = true`
  - `rollback.adminRegionsRestored = true`
  - `ok = true`
- `npm run db:smoke:mysql:primary` 再次通过，说明本轮后台核心 store 新增未破坏前一轮 MySQL 主连接公共能力烟测。
- 当前 SQLite 正式服务继续正常：
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“后台用户/角色/权限/会话/地区链路的正式 MySQL store 落地与验证”，重点是先把真实 MySQL 运行时最核心的后台底座从散点查询推进到可复用的数据访问层。
- 当前 `localhost:3001` 的正式请求链路仍然是 SQLite；MySQL 后台 store 目前已完成正式实现和脚本验证，但还没有接入 Express 真实运行时。
- 当前已经具备的条件是：
  - MySQL 公开读 store 已成型
  - MySQL 后台核心鉴权/权限/地区 store 已成型
  - 公开端与后台基础链路都已具备 SQLite/MySQL 对照或回滚烟测能力
- 严格按 V1.0 计划书，下一块应继续推进：
  - 将后台内容列表/详情/审核任务等后台内容查询链路继续抽到 MySQL 正式 store
  - 为真实 `DB_CLIENT=mysql` 服务启动联调继续清除 `server/index.js` 中的同步 SQLite 访问依赖

## Phase 9 第八十块：后台内容查询链路 MySQL 正式 store
更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进“第三步：MySQL 数据层”中后台内容查询链路的正式 MySQL 实现。开始前已复核上一块完成情况：`server/db/mysql-admin-core-store.js`、`server/scripts/mysql-admin-core-parity.js`、`server/scripts/mysql-admin-core-flow-smoke.js` 语法检查通过；`npm run db:parity:mysql:admin-core` 返回 `ok = true`；`npm run db:smoke:mysql:admin-core` 返回 `ok = true`；`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段“后台核心鉴权/权限/地区链路 MySQL 正式 store”在既定边界内已完成。

### 已完成
- 新增 `server/db/mysql-content-read-store.js`，把后台高频内容查询能力补成正式 MySQL store，覆盖：
  - 媒体列表与媒体详情查询
  - 内容列表查询与内容摘要详情查询
  - 内容版本列表查询
  - 内容来源列表查询
  - 审核工作流列表与工作流步骤查询
  - 审核任务列表查询
  - 单内容审核任务时间线查询
  - 当前待审核任务查询
- 新增 SQLite/MySQL 后台内容查询层对照脚本：
  - `server/scripts/mysql-content-read-parity.js`
  - `npm run db:parity:mysql:content-read`
  - 直接以当前 SQLite `content-read-store` 作为基准，对比 MySQL 内容查询 store 的媒体、内容、详情、版本、来源、工作流和审核任务结果。
- 新增 MySQL 后台内容查询烟测脚本：
  - `server/scripts/mysql-content-read-smoke.js`
  - `npm run db:smoke:mysql:content-read`
  - 覆盖媒体读取、内容列表读取、内容详情读取、版本读取、来源读取、工作流读取和审核任务读取。
- 对照脚本已处理跨数据库在相同时间戳下的并列排序差异，改为基于完整结果集和关键头部项校验，避免把排序口味差异误判成数据不一致。

### 已验证
- `node --check` 通过：
  - `server/db/mysql-content-read-store.js`
  - `server/scripts/mysql-content-read-parity.js`
  - `server/scripts/mysql-content-read-smoke.js`
- `npm run db:parity:mysql:content-read` 通过，真实对照结果包括：
  - `media.sqliteTotal = 1`
  - `media.mysqlTotal = 1`
  - `contents.sqliteTotal = 17`
  - `contents.mysqlTotal = 17`
  - 内容详情标题、版本 ID、来源 ID、审核任务 ID 均一致
  - 工作流 ID 与步骤 ID 一致
  - 待审核任务 ID 集合一致
  - `ok = true`
- `npm run db:smoke:mysql:content-read` 通过，真实结果包括：
  - `media.total = 1`
  - `contents.total = 17`
  - `detail.versionCount = 1`
  - `detail.sourceCount = 1`
  - `detail.reviewTaskCount = 2`
  - `workflows.count = 3`
  - `reviewTasks.pendingCount = 0`
  - `ok = true`
- `npm run db:smoke:mysql:primary` 再次通过，说明本轮新增后台内容查询 store 未破坏已有 MySQL 主连接公共能力烟测。
- 当前 SQLite 正式服务继续正常：
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“后台内容查询链路的正式 MySQL store 落地与对照验证”，重点是把后台内容列表、详情、版本、来源、工作流和审核任务这组高频读取能力从 SQLite 同步查询推进到可复用的 MySQL 正式数据访问层。
- 当前 `localhost:3001` 的正式请求链路仍然是 SQLite；本轮依旧没有把 Express 真正切到 `DB_CLIENT=mysql`。
- 当前已经具备的条件是：
  - MySQL 公开读 store 已成型
  - MySQL 后台核心鉴权/权限/地区 store 已成型
  - MySQL 后台内容查询 store 已成型
  - 公开端与后台关键读取链路均已具备 SQLite/MySQL 对照或烟测能力
- 严格按 V1.0 计划书，下一块应继续推进：
  - 将后台内容写入、审核流转、媒体写入等剩余高价值写链路继续抽到 MySQL 正式 store
  - 进入真实 `DB_CLIENT=mysql` 服务启动前的请求链路接线与联调准备

## Phase 9 第八十一块：后台内容写链路 MySQL 正式 store
更新时间：2026-07-16

本轮开始前先复核了上一块“后台内容查询链路 MySQL 正式 store”。复核结果通过：`server/db/mysql-content-read-store.js`、`server/scripts/mysql-content-read-parity.js`、`server/scripts/mysql-content-read-smoke.js` 语法检查通过；`npm run db:parity:mysql:content-read`、`npm run db:smoke:mysql:content-read`、`npm run db:smoke:mysql:primary` 通过；`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 新增 `server/db/mysql-content-write-store.js`，把后台内容写链路补成正式 MySQL store，覆盖：
  - 内容创建、字段更新、删除
  - 内容版本创建、更新
  - 来源证据替换
  - 审核任务创建、更新、批量取消待审
  - 媒体记录创建、字段更新、删除
- 新增回滚烟测脚本：
  - `server/scripts/mysql-content-write-smoke.js`
  - `npm run db:smoke:mysql:content-write`
- `server/package.json` 新增 `db:smoke:mysql:content-write`，便于本地联调和部署前复核。

### 已验证
- `node --check` 通过：
  - `server/db/mysql-content-write-store.js`
  - `server/scripts/mysql-content-write-smoke.js`
- `npm run db:smoke:mysql:content-write` 通过，真实结果覆盖：
  - 内容主记录写入
  - 版本 1/版本 2 写入与当前版本切换
  - 来源证据替换
  - 审核任务通过/取消
  - 媒体元数据更新
  - 整组事务回滚恢复
- 本轮复核时再次确认：
  - `npm run db:smoke:mysql:content-write` 通过
  - `npm run db:smoke:mysql:content-read` 通过
  - `npm run db:smoke:mysql:primary` 通过
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“后台内容写链路正式 MySQL store 落地 + 回滚烟测”，重点是把内容、版本、来源、审核任务、媒体写入这些核心高价值写链路，从散点脚本推进到可复用的正式数据访问层。
- 当前 `localhost:3001` 的正式业务运行时仍然是 SQLite；本轮还没有把 Express 真实请求链路切到 `DB_CLIENT=mysql`。
- 当前已经具备的条件是：
  - MySQL 主连接能力已稳定
  - MySQL 公开读 store、后台核心 store、后台内容查询 store、后台内容写 store 已成型
  - 后续可以继续清理 `server/index.js` 中仍依赖同步 SQLite 的剩余运行时链路

## Phase 9 第八十二块：运行时杂项链路 MySQL 正式 store
更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进第三步“MySQL 数据层”，开始前先审计上一块“后台内容写链路 MySQL 正式 store”。审计结果通过：`npm run db:smoke:mysql:content-write`、`npm run db:smoke:mysql:content-read`、`npm run db:smoke:mysql:primary` 全部通过；`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 新增 `server/db/mysql-runtime-misc-store.js`，把剩余仍偏向运行时杂项的能力补成正式 MySQL store，覆盖：
  - 内容模块读取与默认发布位更新
  - 风险标签模板列表、详情、去重、增删改
  - 审核记录列表与工作流读取
  - 公开端地图档案读取、公开留言读取
  - 旧档案列表/详情/增删改
  - 旧留言详情/删除
  - 签到进度读取与 upsert
  - 致敬计数读取、设置、递增
  - 媒体请求路径反查文件记录
- 新增 SQLite/MySQL 对照脚本：
  - `server/scripts/mysql-runtime-misc-parity.js`
  - `npm run db:parity:mysql:runtime-misc`
- 新增回滚烟测脚本：
  - `server/scripts/mysql-runtime-misc-smoke.js`
  - `npm run db:smoke:mysql:runtime-misc`
- `server/package.json` 新增：
  - `db:parity:mysql:runtime-misc`
  - `db:smoke:mysql:runtime-misc`

### 已验证
- `node --check` 通过：
  - `server/db/mysql-runtime-misc-store.js`
  - `server/scripts/mysql-runtime-misc-parity.js`
  - `server/scripts/mysql-runtime-misc-smoke.js`
- `npm run db:parity:mysql:runtime-misc` 通过，真实对照覆盖：
  - 内容模块键集合一致
  - `archive` 模块默认发布位一致
  - 风险标签模板全集与启用集一致
  - 审核记录 ID 集合一致
  - `archive` 工作流与兜底工作流一致
  - 公开地图档案 ID 集合一致
  - 公开留言总数一致
  - 旧档案总数、ID 集合与样本详情标题一致
  - 旧留言样本详情一致
  - 签到进度样本一致
  - 致敬计数一致
  - 媒体路径反查结果一致
- `npm run db:smoke:mysql:runtime-misc` 通过，真实结果覆盖：
  - 内容模块默认发布位更新并回滚
  - 风险标签模板插入、更新、删除并回滚
  - 旧档案插入、更新、删除并回滚
  - 旧留言删除并回滚
  - 签到进度 upsert 并回滚
  - 致敬计数设置/递增并回滚
  - 媒体请求路径查找成功
- 为避免回归，再次确认：
  - `npm run db:smoke:mysql:content-write` 通过
  - `npm run db:smoke:mysql:primary` 通过
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“运行时杂项链路的正式 MySQL store 落地 + SQLite/MySQL 对照 + 回滚烟测”，重点是继续削减 `server/index.js` 对同步 SQLite 杂项能力的依赖面。
- 当前 `localhost:3001` 仍是 SQLite 正式运行时；本轮还没有直接把这些 MySQL store 接入 Express 真实请求链路。
- 当前已经具备的条件是：
  - MySQL 公开读、后台核心、后台内容查询、后台内容写、运行时杂项 store 均已成型
  - 内容模块、风险标签、旧档案、旧留言、签到、致敬、媒体路径反查等剩余运行时能力已有正式 MySQL 实现
  - 下一块可以开始推进真正的运行时接线，把 `server/index.js` 的 store 创建与请求路径逐步切到可选 MySQL 实现，为真实 `DB_CLIENT=mysql` 启动联调做准备

## Phase 9 第八十三块：运行时 store 接线工厂
更新时间：2026-07-16

本轮继续严格按 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进第三步“MySQL 数据层”，开始前先审计上一块“运行时杂项链路 MySQL 正式 store”。审计结果通过：`npm run db:parity:mysql:runtime-misc`、`npm run db:smoke:mysql:runtime-misc`、`npm run db:smoke:mysql:content-write`、`npm run db:smoke:mysql:primary` 全部通过；`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 新增 `server/db/runtime-store-factory.js`，把运行时 store 创建逻辑抽成统一接线工厂，支持：
  - `runtimeClient=sqlite` 时创建 SQLite 正式 store
  - `runtimeClient=mysql` 时创建 MySQL 正式 store
  - 统一输出：
    - `adminCore`
    - `contentRead`
    - `contentWrite`
    - `runtimeMisc`
- 新增工厂烟测脚本：
  - `server/scripts/runtime-store-factory-smoke.js`
  - `npm run db:stores:smoke`
- `server/package.json` 新增 `db:stores:smoke`。
- `server/index.js` 已改为通过 `createRuntimeStores(...)` 获取：
  - `ADMIN_CORE_STORE`
  - `CONTENT_READ_STORE`
  - `CONTENT_WRITE_STORE`
  - `RUNTIME_MISC_STORE`
- 本轮没有改变现有运行模式；当前 `localhost:3001` 仍继续使用 SQLite 运行时，只是把“直接 new 哪个 store”的接线逻辑先统一收口。

### 已验证
- `node --check` 通过：
  - `server/db/runtime-store-factory.js`
  - `server/scripts/runtime-store-factory-smoke.js`
  - `server/index.js`
- `npm run db:bootstrap:smoke` 通过，说明运行时 bootstrap 计划在 `sqlite/mysql` 两种 runtime 下的步骤编排仍保持正确。
- `npm run db:stores:smoke` 通过，真实结果确认：
  - SQLite 工厂输出 `runtimeClient = sqlite`
  - SQLite 工厂输出 `isAsyncRuntime = false`
  - MySQL 工厂输出 `runtimeClient = mysql`
  - MySQL 工厂输出 `isAsyncRuntime = true`
  - SQLite/MySQL 两边都能通过工厂拿到角色、内容、模块数据
- 为避免回归，再次确认：
  - `npm run db:smoke:mysql:runtime-misc` 通过
  - `http://localhost:3001/api/health` 返回 HTTP 200
  - `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200

### 当前边界
- 本轮完成的是“运行时 store 创建层的统一工厂化”，重点是把 `server/index.js` 对具体 SQLite/MySQL store 构造器的直接依赖拆开，为后续真实运行时切换清路。
- 当前还没有把 Express 真实请求链路批量改成 async MySQL 调用，也还没有让 `createDatabaseRuntime(...)` 真正以 MySQL 作为正式运行时打开主连接。
- 当前已经具备的条件是：
  - MySQL store 族已基本成型
  - `index.js` 的核心 store 接线已经收口到统一工厂
  - 下一块可以继续推进真正的运行时接线，例如：
    - 先把一组高价值读接口改造成可同时兼容 sync/async store 调用
    - 再逐步把登录、会话、内容列表、内容详情、审核任务等真实请求链路切到可选 MySQL 实现
## Phase 9 第八十四块：首批真实请求链路异步兼容
更新时间：2026-07-16

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“运行时 store 接线工厂”。复核结果通过：`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 在 `server/index.js` 新增首批 async 兼容 helper，覆盖：
  - 初始化管理员判断与创建
  - 登录失败计数、锁定判断、会话创建与会话读取
  - 用户、角色、地区权限范围读取
  - 内容列表、内容详情、审核工作流、审核任务、审核记录导出
  - 风险标签字典读取与审核信号构建
- 将以下真实请求链路改造成可兼容 sync/async store 调用：
  - `/api/setup/status`
  - `/api/setup/admin`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/refresh`
  - `/api/auth/me`
  - `/api/admin/roles`
  - `/api/admin/users`
  - `/api/admin/region-options`
  - `/api/admin/review-workflows`
  - `/api/admin/review-tasks`
  - `/api/admin/review-records/export`
  - `/api/admin/contents`
  - `/api/admin/contents/:id`
- 将 `requireAuth`、`requirePermission`、`requireAnyPermission` 改为 async 中间件，保证首批接线接口在后续切到 MySQL 正式 store 时不再依赖同步调用。

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- `http://localhost:3001/api/health` 返回 HTTP 200。
- `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200。
- 使用当前代码临时启动 `http://localhost:3011` 后，未登录访问以下接口均正确返回 HTTP 401：
  - `/api/auth/me`
  - `/api/admin/contents`
  - `/api/admin/review-tasks`

### 当前边界
- 本轮完成的是“首批高价值真实请求链路的 async 兼容化”，重点是先把初始化、登录会话、角色用户读取、审核读取、内容读取这组链路从只能吃 SQLite 同步 store，推进到能够兼容后续 MySQL 正式 store。
- 当前 `localhost:3001` 的正式业务运行时仍然是 SQLite；本轮还没有把 `createDatabaseRuntime(...)` 真正切到 `DB_CLIENT=mysql`。
- 当前已经具备的条件是：
  - 运行时 store 创建已统一工厂化
  - 首批真实请求链路已具备 async 调用能力
  - 鉴权/权限中间件已能兼容后续 MySQL store
- 下一块应继续推进：
  - 第二批高价值真实写链路与剩余读链路的 async 化
  - 为真实 `DB_CLIENT=mysql` 服务启动联调做最后收口
## Phase 9 第八十五块：内容写入与审核生命周期 async 化
更新时间：2026-07-16

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“首批真实请求链路异步兼容”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 新增 async 事务底座：
  - `server/db/sqlite-runtime.js` 增加 `runSqliteTransactionAsync(...)`
  - `server/db/runtime.js` 增加 `runInTransactionAsync(...)`
  - `server/index.js` 增加 `runInDatabaseTransactionAsync(...)`
- 为内容写链路补齐 async helper，覆盖：
  - `normalizeContentInputAsync`
  - `insertContentVersionAsync`
  - `updateContentVersionAsync`
  - `replaceContentSourcesAsync`
  - `applyContentUpdateAsync`
  - `findWorkflowForModuleAsync`
  - `getNextWorkflowStepAsync`
  - `getWorkflowStepByIdAsync`
  - `createReviewTaskAsync`
  - `cancelPendingReviewTasksAsync`
- 将以下高价值真实写链路改造成 async 兼容：
  - `/api/admin/contents` 创建
  - `/api/admin/contents/:id` 更新
  - `/api/admin/contents/actions/batch` 批量编辑
  - `/api/admin/contents/:id/submit` 提交审核
  - `/api/admin/contents/:id/review` 审核流转
  - `/api/admin/contents/:id/unpublish` 下架
  - `/api/admin/contents/:id/trash` 移入回收站
  - `/api/admin/contents/:id/restore` 恢复
  - `/api/admin/contents/:id` 永久删除

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- `http://localhost:3001/api/health` 返回 HTTP 200。
- `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200。

### 当前边界
- 本轮完成的是“内容写入与审核生命周期”的 async 化，重点是把内容草稿创建、更新、批量编辑、提审、审核流转、下架、回收站和永久删除这条最核心的后台写链路，从同步 SQLite 调用模型推进到可兼容后续 MySQL 正式 store。
- 当前 `localhost:3001` 的正式业务运行时仍然是 SQLite；本轮仍未把 `createDatabaseRuntime(...)` 真正切到 `DB_CLIENT=mysql`。
- 当前已经具备的条件是：
  - 首批真实读链路已完成 async 化
  - 核心内容写链路与审核生命周期已完成 async 化
  - 事务执行层已经具备 async 兼容能力
- 下一块应继续推进：
  - 用户、地区、风险标签、模块设置等剩余后台写链路 async 化
  - 为真实 `DB_CLIENT=mysql` 服务启动联调继续收口

## Phase 9 第八十六块：剩余后台管理写链路 async 兼容
更新时间：2026-07-17

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“内容写入与审核生命周期 async 化”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 将以下后台管理接口改造成 async 兼容：
  - `/api/admin/permissions`
  - `/api/admin/users` 创建、更新
  - `/api/admin/regions` 列表、创建、更新、删除
  - `/api/admin/content-modules` 列表
  - `/api/admin/content-modules/:key/default-publish-positions`
  - `/api/admin/risk-tags` 列表、创建、更新、删除
- 在 `server/index.js` 新增并补齐 async helper：
  - `normalizeAdminUserInputAsync`
  - `normalizeUserRegionIdsInputAsync`
  - `normalizeRegionInputAsync`
  - `isRegionDescendantAsync`
  - `insertRegionAsync`
  - `updateRegionAsync`
  - `listRiskTagTemplatesAsync`
  - `findRiskTagTemplateAsync`
  - `normalizeRiskTagTemplateInputAsync`
  - `insertRiskTagTemplateAsync`
  - `updateRiskTagTemplateAsync`
- 补齐地区默认值在 async 运行时下的事务一致性：
  - SQLite 运行时继续走原同步 store 逻辑
  - 为后续 MySQL 正式运行时预留 `clearDefaultRegion` / `clearDefaultRegionExcept` + 事务包裹，避免默认地区切换出现多默认值风险

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- `http://localhost:3001/api/health` 返回 HTTP 200。
- `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200。

### 当前边界
- 本轮完成的是“剩余后台管理写链路与配套管理读链路的 async 兼容化”，重点是把用户、地区、模块默认发布位、风险标签这几组后台管理入口推进到可兼容后续 MySQL 正式 store 的调用模型。
- 当前 `localhost:3001` 仍然是 SQLite 正式运行时；本轮仍未把 `createDatabaseRuntime(...)` 真正切到 `DB_CLIENT=mysql`。
- 当前已经具备的条件是：
  - 后台核心内容读写与审核生命周期已 async 化
  - 后台用户 / 地区 / 风险标签 / 模块设置管理链路已 async 化
  - 地区默认值切换在未来 MySQL async 运行时下已有事务保护
- 下一块应继续推进：
  - 继续清点并收口剩余仍依赖同步 helper 的公开端/杂项请求链路
  - 为真实 `DB_CLIENT=mysql` 服务启动联调做最后的请求层收尾

## Phase 9 第八十七块：公开端与轻量杂项请求链路 async 兼容
更新时间：2026-07-17

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“剩余后台管理写链路 async 兼容”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health` 与 `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 将以下公开端与轻量杂项接口改造成 async 兼容：
  - `/api/regions/public-config`
  - `/api/contents`
  - `/api/contents/:id`
  - `/api/archives`
  - `/api/archives/:id`
  - `/api/messages` 读取与提交
  - `/api/checkin/progress` 读取与写入
  - `/api/admin/tributes`
  - `/api/admin/tributes/adjust`
  - `/api/tributes`
- 将旧档案后台兼容入口补成 async 兼容：
  - `/api/archives` 创建、更新、删除
  - `/api/messages/:id` 删除
- 在 `server/index.js` 补齐配套 async helper：
  - `buildPublicRegionConfigAsync`
  - `listAllPublicArchiveMapPointsAsync`
  - `rowToPublicContentAsync`
  - `listPublishedArchiveContentsAsync`
  - `findPublishedArchiveContentAsync`
  - `filterArchiveResultByRegionQueryAsync`
  - `rowToPublicArchiveAsync`
  - `getPublicContentSourcesAsync`
  - `listPublishedMessageContentsAsync`
  - `findArchiveAsync`
  - `findMessageAsync`
  - `findCheckinProgressAsync`
  - `getTributeCountAsync`
- 将群众留言提交链路切到 async 事务编排：
  - `message` 模块工作流读取改为 async
  - 留言生成内容草稿、版本和审核任务改为走 `runInDatabaseTransactionAsync(...)`

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- `http://localhost:3001/api/health` 返回 HTTP 200。
- `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/regions/public-config` 返回 HTTP 200。
- `http://localhost:3001/api/archives?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/messages?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/checkin/progress?visitorId=phase87-audit` 返回 HTTP 200。
- `http://localhost:3001/api/tributes` 返回 HTTP 200。

### 当前边界
- 本轮完成的是“公开端与轻量杂项请求层”的 async 兼容化，重点是把公开内容读取、地区公开配置、旧档案兼容接口、群众留言、打卡进度、致敬计数这一组仍依赖同步 helper 的高频接口推进到可兼容后续 MySQL 正式 store 的调用模型。
- 当前 `localhost:3001` 仍然是 SQLite 正式运行时；本轮仍未把 `createDatabaseRuntime(...)` 真正切到 `DB_CLIENT=mysql`。
- 当前已经具备的条件是：
  - 后台核心管理链路已 async 化
  - 公开端核心读取与轻量写入链路已 async 化
  - 留言提交审核流已接入 async 事务编排
- 下一块应继续推进：
  - 继续清点并收口仍依赖同步 helper 的后台媒体、AI 中心、审计导出、备份导入导出等剩余请求链路
  - 为真实 `DB_CLIENT=mysql` 服务启动联调做最后的请求层清场

## Phase 9 第八十八块：后台媒体、AI 与运维请求链路 async 兼容
更新时间：2026-07-17

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“公开端与轻量杂项请求链路 async 兼容”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health`、`/api/contents?page=1&pageSize=1`、`/api/regions/public-config`、`/api/archives?page=1&pageSize=1`、`/api/messages?page=1&pageSize=1`、`/api/checkin/progress?visitorId=phase88-audit`、`/api/tributes` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 将以下后台媒体接口改造成 async 兼容：
  - `/api/admin/media-assets`
  - `/api/admin/media-assets/:id`
  - `/api/admin/media-assets` 上传
  - `/api/admin/media-assets/:id` 更新
  - `/api/admin/media-assets/actions/batch`
  - `/api/admin/media-assets/:id` 回收站删除
  - `/api/admin/media-assets/:id/restore`
  - `/api/admin/media-assets/:id/permanent`
- 将以下 AI 供应商与任务接口改造成 async 兼容：
  - `/api/admin/ai/providers`
  - `/api/admin/ai/providers` 创建
  - `/api/admin/ai/providers/:id` 更新
  - `/api/admin/ai/providers/:id/test`
  - `/api/admin/ai/tasks`
  - `/api/admin/ai/tasks` 创建
  - `/api/admin/ai/tasks/:id/run`
  - `/api/admin/ai/tasks/:id/import-result`
  - `/api/admin/ai/tasks/:id/external-job`
  - `/api/ai/tasks/:id/callback`
  - `/api/admin/ai/tasks/:id/apply-result`
  - `/api/admin/ai/call-logs`
- 将以下审计、备份、导入导出、回收站接口改造成 async 兼容：
  - `/api/audit-logs`
  - `/api/admin/backups`
  - `/api/admin/backup`
  - `/api/admin/backups/:name/restore`
  - `/api/admin/export`
  - `/api/admin/import`
  - `/api/admin/trash/purge`
- 将 `/uploads/**` 文件解析链路改造成 async 兼容。
- 在 `server/index.js` 补齐后台媒体 / AI / 审计 / 导入导出所需 async helper，覆盖媒体资产、AI 供应商、AI 任务、AI 调用日志、导入导出载荷与审计写入。

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- `http://localhost:3001/api/health` 返回 HTTP 200。
- `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/regions/public-config` 返回 HTTP 200。
- `http://localhost:3001/api/archives?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/messages?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/checkin/progress?visitorId=phase88-audit` 返回 HTTP 200。
- `http://localhost:3001/api/tributes` 返回 HTTP 200。

### 当前边界
- 本轮完成的是“后台媒体、AI 与运维请求层 async 兼容化”，重点是把此前仍残留同步 helper 依赖的后台高价值链路纳入后续 MySQL 正式运行时可复用的调用模型。
- 当前 `localhost:3001` 仍然是 SQLite 正式运行时；本轮仍未直接切换到 `DB_CLIENT=mysql`。
- 下一块应继续推进：
  - 继续清点仍在请求层深处使用同步校验 / 同步审计写入 / 同步 fallback 的尾部链路
  - 为真实 `DB_CLIENT=mysql` 服务启动联调做最后一轮 request-layer 收口

## Phase 9 第八十九块：剩余请求层校验、审计写入与 fallback async 收口
更新时间：2026-07-17

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“后台媒体、AI 与运维请求链路 async 兼容”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health`、`/api/contents?page=1&pageSize=1`、`/api/regions/public-config`、`/api/archives?page=1&pageSize=1`、`/api/messages?page=1&pageSize=1`、`/api/checkin/progress?visitorId=phase89-audit`、`/api/tributes` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 将剩余后台审计写入统一切到 `await writeAuditAsync(...)`，覆盖：
  - 初始化管理员
  - 登录 / 登出
  - 用户创建 / 更新
  - 地区创建 / 更新 / 删除
  - 内容类型默认发布位更新
  - 风险标签创建 / 更新 / 删除
  - 审核记录导出
  - 内容创建 / 更新 / 批量更新 / 提审 / 审核 / 下架 / 回收站 / 恢复 / 永久删除
  - 旧档案创建 / 更新 / 删除
  - 留言创建 / 删除
  - 致敬计数更新 / 调整 / 递增
- 将 `requireAdmin` 改为 async 中间件，后台 fallback 管理鉴权改为使用：
  - `findSessionByTokenAsync`
  - `findAdminUserByIdAsync`
  - `getUserPermissionCodesAsync`
- 将以下请求层校验链路补成 async 兼容：
  - `/api/setup/admin` 改用 `normalizeAdminUserInputAsync(...)`
  - `/api/admin/ai/tasks` 改用 `normalizeAiTaskInputAsync(...)`
  - `/api/admin/ai/tasks/:id/apply-result` 改用 `normalizeAiTaskApplicationInputAsync(...)`
- 新增并接入一组真正依赖运行时 store 的 async 校验 helper：
  - `normalizeAiTaskInputAsync`
  - `normalizeAiTaskInputJsonAsync`
  - `normalizeAiTaskApplicationInputAsync`
  - `normalizeContentRegionDataAsync`
  - `normalizeArchivePointDataAsync`
  - `normalizeOralHistoryDataAsync`
  - `normalizePartyRouteDataAsync`
  - `normalizeLearningCourseDataAsync`
- 将 `normalizeContentInputAsync(...)` 内部仍残留的同步依赖收口，避免未来 `DB_CLIENT=mysql` 运行时在内容创建、内容更新、AI 结果回填时卡在同步 helper 上。

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- `http://localhost:3001/api/health` 返回 HTTP 200。
- `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/regions/public-config` 返回 HTTP 200。
- `http://localhost:3001/api/archives?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/messages?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/checkin/progress?visitorId=phase89-audit` 返回 HTTP 200。
- `http://localhost:3001/api/tributes` 返回 HTTP 200。

### 当前边界
- 本轮完成的是“剩余 request-layer 校验、审计写入与 fallback 管理鉴权”的 async 收口，重点是去掉那些表面路由已 async、但内部仍可能在 MySQL 正式运行时卡住的同步依赖点。
- 当前 `localhost:3001` 仍然是 SQLite 正式运行时；本轮仍未切换到 `DB_CLIENT=mysql`。
- 当前已经进一步具备的条件是：
  - 关键后台 / 公开请求链路都已具备 async 兼容形态
  - 内容录入、口述历史、党日路线、学习课程、AI 任务输入与 AI 结果回填这些高频校验路径已能兼容 MySQL 运行时
  - 后台 fallback 管理鉴权与审计写入不再依赖同步访问
- 下一块应继续推进：
  - 继续清点是否还有极少数低频 helper 仍只保留同步版本但会被请求层命中
  - 在保持现有 SQLite 可运行的前提下，准备真实 `DB_CLIENT=mysql` 启动联调与切换验收

## Phase 9 第九十块：互动内容模块异步校验覆盖对齐
更新时间：2026-07-17

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“剩余请求层校验、审计写入与 fallback async 收口”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health`、`/api/contents?page=1&pageSize=1`、`/api/regions/public-config`、`/api/archives?page=1&pageSize=1`、`/api/messages?page=1&pageSize=1`、`/api/checkin/progress?visitorId=phase90-audit`、`/api/tributes` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 对照同步版 `normalizeContentInput(...)` 与异步版 `normalizeContentInputAsync(...)`，补齐互动内容模块校验覆盖面，避免异步请求链路下不同内容类型的校验能力不一致。
- 在 `server/index.js` 新增 `normalizeInteractiveContentDataAsync(...)`，统一作为互动内容模块的 async 入口。
- 将 `normalizeContentInputAsync(...)` 中对互动内容模块的分散手写分支，收口为：
  - `INTERACTIVE_MODULES.has(moduleKey)` -> `await normalizeInteractiveContentDataAsync(...)`
- 在 `normalizeInteractiveContentDataAsync(...)` 中明确处理需要异步依赖的互动模块：
  - `party_route` -> `normalizePartyRouteDataAsync(...)`
  - `learning_course` -> `normalizeLearningCourseDataAsync(...)`
- 对其余互动模块复用现有同步专用校验器，但统一纳入异步内容创建 / 更新入口，补齐了此前异步链路未完全覆盖的模块：
  - `panorama`
  - `checkin`
  - `party_oath`
  - `tribute_ceremony`
  - `dashboard_entry`
  - 以及其他无需数据库查询的互动模块
- 这样一来，内容创建、内容编辑、AI 结果应用等走 `normalizeContentInputAsync(...)` 的真实请求链路，已经和同步版在互动模块能力上保持一致。

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:content-write` 通过。
- `npm run db:smoke:mysql:content-read` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。

### 当前边界
- 本轮完成的是“互动内容模块在异步内容校验入口中的覆盖对齐”，重点是补掉 `normalizeContentInputAsync(...)` 相比同步版缺失的互动模块专用校验，避免未来 MySQL 正式运行时出现同一内容类型在不同请求链路下校验不一致。
- 当前 `localhost:3001` 仍然是 SQLite 正式运行时；本轮仍未切换到 `DB_CLIENT=mysql`。
- 当前已经进一步具备的条件是：
  - 内容创建 / 编辑 / AI 回填所走的异步内容校验入口，与同步版模块覆盖面已基本对齐
  - 互动内容模块不再存在“同步入口能校验、异步入口直接漏过”的结构性缺口
- 下一块应继续推进：
  - 继续清点仍可能被真实请求命中的低频同步 helper 或低频同步 fallback
  - 在保持 SQLite 可运行的前提下，准备真实 `DB_CLIENT=mysql` 启动联调与切换验收

## Phase 9 第九十一块：地区权限 async 默认地区兜底收口
更新时间：2026-07-17

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“互动内容模块异步校验覆盖对齐”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:content-write`、`npm run db:smoke:mysql:content-read`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health`、`/api/contents?page=1&pageSize=1`、`/api/regions/public-config`、`/api/archives?page=1&pageSize=1`、`/api/messages?page=1&pageSize=1`、`/api/checkin/progress?visitorId=phase91-audit`、`/api/tributes` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 在 `server/index.js` 新增 `getContentRegionIdAsync(content)`，用于 async 请求链路下的内容所属地区解析。
- 将 `canUserAccessContentAsync(...)` 中原本仍走同步 `getContentRegionId(...)` 的默认地区兜底，改为走 `await getContentRegionIdAsync(...)`。
- 这样 async 地区权限判断在内容缺少 `regionId` / `region_id` 时，不再依赖同步 `getDefaultRegionId()`，而是与 MySQL 运行时兼容的 `getDefaultRegionIdAsync()` 保持一致。
- 修正 `requireContentRegionAccessAsync(...)` 的地区无权提示文案乱码，恢复为正常中文：`该内容不在你的地区权限范围内。`

### 已验证
- `node --check server/index.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:smoke:mysql:content-read` 通过。
- `npm run db:smoke:mysql:content-write` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- `http://localhost:3001/api/health` 返回 HTTP 200。
- `http://localhost:3001/api/contents?page=1&pageSize=1` 返回 HTTP 200。
- `http://localhost:3001/api/regions/public-config` 返回 HTTP 200。

### 当前边界
- 本轮完成的是“async 地区权限判断里默认地区兜底”的收口，重点是去掉真实请求 async 链路中仍残留的同步默认地区依赖。
- 当前 `localhost:3001` 仍然是 SQLite 正式运行时；本轮仍未切换到 `DB_CLIENT=mysql`。
- 当前已经进一步具备的条件是：
  - 内容地区权限判断的 async 链路已经不再混用同步默认地区 fallback
  - 内容创建、编辑、审核查看、AI 结果回填这类会走地区权限判断的关键请求链路，与未来 MySQL 运行时更一致
- 下一块应继续推进：
  - 继续清点仍可能被真实请求命中的低频同步 helper、低频同步 fallback 或 dead sync wrapper
  - 在保持 SQLite 可运行的前提下，准备真实 `DB_CLIENT=mysql` 启动联调与切换验收

## Phase 9 第九十二块：运行时切换前就绪度观测收口
更新时间：2026-07-17

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，在开始前先复核上一块“地区权限 async 默认地区兜底收口”。复核结果通过：`node --check server/index.js`、`npm run db:bootstrap:smoke`、`npm run db:stores:smoke`、`npm run db:smoke:mysql:content-write`、`npm run db:smoke:mysql:content-read`、`npm run db:smoke:mysql:runtime-misc` 全部通过，`http://localhost:3001/api/health`、`/api/contents?page=1&pageSize=1`、`/api/regions/public-config`、`/api/archives?page=1&pageSize=1`、`/api/messages?page=1&pageSize=1`、`/api/checkin/progress?visitorId=phase92-audit`、`/api/tributes` 返回 HTTP 200，因此上一阶段在既定边界内已完成。

### 已完成
- 在 `server/db/runtime.js` 增强 `getRuntimeModeSummary(...)`，补充切换前就绪度字段：
  - `runtimeAligned`
  - `readyForRuntimeSwitch`
  - `targetReachable`
  - `schemaReady`
  - `coreTablesPresent`
  - `blockers`
  - `nextAction`
- 在 `server/index.js` 的健康接口 `/api/health` 中补充数据库运行时观测字段，便于直接查看当前是否仍处于 SQLite 兼容模式，以及距离切换 MySQL 还差什么。
- 在 `/api/admin/database/runtime-status` 中补充同一组切换前就绪度字段，统一后台运维观察口径。
- 调整启动日志逻辑：
  - 不再使用过于笼统的旧提示
  - 改为按真实状态区分：
    - `MySQL target is ready, but runtime is still in SQLite compatibility mode`
    - `MySQL target is configured but not ready for runtime switch`
- 新增 `server/scripts/mysql-runtime-status-smoke.js`，专门校验：
  - `configuredClient = mysql`
  - `runtimeClient = sqlite`
  - `compatibilityMode = true`
  - `targetReady = true`
  - `readyForRuntimeSwitch = true`
  - `nextAction = switch_runtime_client`
  - `blockers = []`
- 在 `server/package.json` 新增脚本：
  - `db:status:mysql:smoke`
- 重载本地 `localhost:3001` 服务，使健康接口开始返回本轮新增字段。

### 已验证
- `node --check server/index.js` 通过。
- `node --check server/db/runtime.js` 通过。
- `node --check server/scripts/mysql-runtime-status-smoke.js` 通过。
- `npm run db:bootstrap:smoke` 通过。
- `npm run db:stores:smoke` 通过。
- `npm run db:status:mysql:smoke` 通过。
- `npm run db:smoke:mysql:content-read` 通过。
- `npm run db:smoke:mysql:content-write` 通过。
- `npm run db:smoke:mysql:runtime-misc` 通过。
- 重载服务后，`http://localhost:3001/api/health` 返回包含以下新字段：
  - `database.runtimeAligned`
  - `database.readyForRuntimeSwitch`
  - `database.targetReachable`
  - `database.schemaReady`
  - `database.coreTablesPresent`
  - `database.blockers`
  - `database.nextAction`

### 当前边界
- 本轮完成的是“真正切 MySQL 运行时之前的状态观测和就绪度收口”，重点是把“当前是不是还在 SQLite 兼容模式、MySQL 目标是否已具备切换条件、下一步应该做什么”明确暴露出来。
- 当前 `localhost:3001` 仍然是 SQLite 正式运行时；本轮依然没有直接切换到 `DB_CLIENT=mysql`。
- 当前已经进一步具备的条件是：
  - 健康接口和后台运行时状态接口都能明确表达切换前状态
  - 本地已经存在专门的 `db:status:mysql:smoke` 用于验证 MySQL 目标是否达到“ready for runtime switch”
  - 代码层面已经能区分“目标未就绪”和“目标已就绪但运行时尚未切换”这两个阶段
- 下一块应继续推进：
  - 在保持 SQLite 可运行的前提下，继续为真实 `DB_CLIENT=mysql` 运行时切换做最后清点
  - 进入真实 MySQL runtime handoff 前的联调与切换验收准备

## Phase 9 �ھ�ʮ���飺MySQL �л���������ͳһ�տ�
����ʱ�䣺2026-07-17

���ּ����ϸ��� `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` �ƽ������ڿ�ʼǰ�ȸ�����һ�顰����ʱ�л�ǰ�����ȹ۲��տڡ������˽��ͨ����`node --check server/index.js`��`node --check server/db/runtime.js`��`node --check server/scripts/mysql-runtime-status-smoke.js`��`npm run db:bootstrap:smoke`��`npm run db:stores:smoke`��`npm run db:status:mysql:smoke`��`npm run db:smoke:mysql:content-read`��`npm run db:smoke:mysql:content-write`��`npm run db:smoke:mysql:runtime-misc` ȫ��ͨ����`http://localhost:3001/api/health`��`/api/contents?page=1&pageSize=1`��`/api/regions/public-config`��`/api/archives?page=1&pageSize=1`��`/api/messages?page=1&pageSize=1`��`/api/checkin/progress?visitorId=phase93-audit`��`/api/tributes` ���� HTTP 200�������һ�׶��ڼȶ��߽�������ɡ�

### �����
- ���� `server/db/mysql-cutover-readiness.js`����ԭ�ȷ�ɢ�� `mysql-preflight` �ű���� MySQL �л�ǰ�˶��߼�ͳһ��ɿɸ���ģ�飬���������
  - `sqlitePresent`
  - `targetStatus`
  - `coreTableCounts`
  - `autoIncrementChecks`
  - `blockers`
  - `readyForRuntimeCutover`
- �� `server/scripts/mysql-preflight.js` ��Ϊ����ͳһ�� `buildMysqlCutoverReadiness(...)`������Ԥ���߼��ͺ�̨չʾ�߼��ظ�ά����
- �� `server/index.js` ������ֻ̨���ӿڣ�
  - `/api/admin/database/cutover-readiness`
  - ͳһ��������ʱ״̬��Ŀ���״̬���л�������������л��������档
- ���� `server/scripts/mysql-cutover-readiness-smoke.js`��ר��������֤��
  - SQLite Դ���Ƿ����
  - MySQL Ŀ���Ƿ�ɴ�
  - schema �Ƿ���ȫ
  - ���ı��Ƿ����
  - ���ı������Ƿ�һ��
  - �����ֶ��Ƿ���ȫ
  - �Ƿ������ﵽ `readyForRuntimeCutover`
- �� `server/package.json` �����ű���
  - `db:cutover:mysql:smoke`
- �������� `localhost:3001` ����󸴺��½ӿڣ�`GET /api/admin/database/cutover-readiness` ��ǰ����ȷ���� `401 UNAUTHENTICATED`��˵��·���ѹ��ز��ܺ�̨��Ȩ������

### ����֤
- `node --check server/index.js` ͨ����
- `node --check server/db/mysql-cutover-readiness.js` ͨ����
- `node --check server/scripts/mysql-preflight.js` ͨ����
- `node --check server/scripts/mysql-cutover-readiness-smoke.js` ͨ����
- `npm run db:bootstrap:smoke` ͨ����
- `npm run db:stores:smoke` ͨ����
- `npm run db:status:mysql:smoke` ͨ����
- `npm run db:smoke:mysql:content-read` ͨ����
- `npm run db:smoke:mysql:content-write` ͨ����
- `npm run db:smoke:mysql:runtime-misc` ͨ����
- `http://localhost:3001/api/health` ���� HTTP 200��
- `http://localhost:3001/api/admin/database/cutover-readiness` δ��¼���� HTTP 401������Ԥ�ڡ�

### ���ַ��ֵ���ʵ����
- `npm run db:preflight:mysql` δͨ����
- `npm run db:cutover:mysql:smoke` δͨ����
- ����ԭ��һ�£�`audit_logs` �� SQLite �� MySQL ֮�����������һ�£���ǰ����Ϊ��
  - SQLite `audit_logs` = 38
  - MySQL `audit_logs` = 34
  - �����룺`table_count_mismatch`
- ��˱����Ѿ���ɡ��л����������������Ŀ����ͽ��룬�����������桰���������л��� MySQL ����ʱ����

### ��ǰ�߽�
- ������ɵ��ǡ��л�ǰͳһ������������¶�����տڣ��ص�����ϵͳ�ܹ���ȷ������ά�ͳ��ܣ�
  - ��ǰ MySQL Ŀ���Ƿ�׼����
  - ��Щ���ı��Ѷ���
  - ��Щ���Դ�����������
  - �Ƿ������߱��л�����
- ��ǰ `localhost:3001` ��Ȼ�� SQLite ��ʽ����ʱ������û��ֱ�Ӱ� `createDatabaseRuntime(...)` �е� `DB_CLIENT=mysql`��
- ��ǰ�Ѿ���һ���߱��������ǣ�
  - ����ʱ״̬������л����������Ѿ��ֲ�����
  - ��̨����ֻ����ά��ڿɳ����л�ǰ���
  - �������ж��� smoke �ű���ר�����ء������� ready����������δ��ȫ���롱�����

### ��һ��Ӧ�����ƽ�
- ���޸� `audit_logs` �� SQLite / MySQL �������죬����Ǩ�ƻ�У���߼���
- �� `db:preflight:mysql` �� `db:cutover:mysql:smoke` ͬʱת�̺��ٽ�����ʵ `DB_CLIENT=mysql` ����ʱ�л����ա�

## Phase 9 �ھ�ʮ�Ŀ飺SQLite β������ͬ���� MySQL �л���������
����ʱ�䣺2026-07-17

���ּ����ϸ��� `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` �ƽ������ڿ�ʼǰ�ȸ�����һ�顰MySQL �л���������ͳһ�տڡ������˽��ͨ����`node --check server/index.js`��`node --check server/db/mysql-cutover-readiness.js`��`node --check server/scripts/mysql-preflight.js`��`node --check server/scripts/mysql-cutover-readiness-smoke.js` ȫ��ͨ����`npm run db:bootstrap:smoke`��`npm run db:stores:smoke`��`npm run db:status:mysql:smoke`��`npm run db:smoke:mysql:content-read`��`npm run db:smoke:mysql:content-write`��`npm run db:smoke:mysql:runtime-misc` ȫ��ͨ����`http://localhost:3001/api/health` ���� HTTP 200��`http://localhost:3001/api/admin/database/cutover-readiness` δ��¼���� HTTP 401��˵����һ�׶��ڼȶ��߽�������ɡ�

### �����
- ���� `server/db/mysql-tail-sync.js`��ʵ�� SQLite �� MySQL ��׷���ͱ�β������ͬ������ǰ���ǣ�
  - `audit_logs`
  - `login_attempts`
  - `ai_call_logs`
- ���� `server/scripts/mysql-sync-tail-to-mysql.js`���ṩ���ظ�ִ�е��л�ǰ�տڽű���
- �� `server/package.json` �������
  - `db:sync:mysql:tail`
- �������ø������ SQLite �����ڼ���������δͬ���� MySQL ��β�����ݲ��룬�����������������Ǩ���������л�ǰƯ�ơ�

### ����֤
- `node --check server/db/mysql-tail-sync.js` ͨ����
- `node --check server/scripts/mysql-sync-tail-to-mysql.js` ͨ����
- `npm run db:sync:mysql:tail` ͨ���������
  - `audit_logs` ����ͬ�� 4 ��
  - `login_attempts` ����ͬ�� 2 ��
  - `ai_call_logs` ����ͬ�� 0 ��
- `npm run db:preflight:mysql` ͨ����`readyForRuntimeCutover = true`��`blockers = []`��
- `npm run db:cutover:mysql:smoke` ͨ����`ok = true`��
- `npm run db:status:mysql:smoke` ͨ����`readyForRuntimeSwitch = true`��
- `http://localhost:3001/api/health` ���� HTTP 200��

### ��ǰ�߽�
- ������ɵ��ǡ�SQLite ���������ڼ��׷���ͱ�β���տڡ����ص��ǽ���л�ǰ MySQL ������ SQLite Դ�������д��������Ŀ�Ԥ��Ư�ơ�
- ��ǰ `localhost:3001` ��Ȼ�� SQLite ��ʽ����ʱ��������δֱ�Ӱ� `createDatabaseRuntime(...)` �е� `DB_CLIENT=mysql`��
- ��ǰ�Ѿ��߱��������ǣ�
  - MySQL Ŀ���ṹ��ȫ
  - ���ı������Ѷ���
  - ׷������־β���ͨ��ר�Žű����ٲ���
  - `db:preflight:mysql` �� `db:cutover:mysql:smoke` ��ͬʱת��

### ��һ��Ӧ�����ƽ�
- ������ʵ `DB_CLIENT=mysql` ����ʱ�л����������ա�
- ����ʽ�л�ǰִ��һ�� `npm run db:sync:mysql:tail`��ȷ����󴰿���������־Ҳ��ɲ��롣

## Phase 9 �ھ�ʮ��飺��ʵ MySQL ����ʱ�ӹ��������
����ʱ�䣺2026-07-17

���ּ����ϸ��� `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` �ƽ������ڿ�ʼǰ�ȸ�����һ�顰SQLite β������ͬ���� MySQL �л��������㡱�����˽��ͨ����`node --check server/db/mysql-tail-sync.js`��`node --check server/scripts/mysql-sync-tail-to-mysql.js` ͨ����`npm run db:sync:mysql:tail` ͨ����`npm run db:preflight:mysql` ͨ���� `readyForRuntimeCutover = true`��`npm run db:cutover:mysql:smoke` ͨ����`npm run db:status:mysql:smoke` ͨ����`http://localhost:3001/api/health` ���� HTTP 200�������һ�׶��ڼȶ��߽�������ɡ�

### �����
- �� `server/db/runtime.js` �ӡ�����Ϊ mysql ������ʱ�̶� sqlite����Ϊ����֧�� MySQL ����ʱ�ӹܣ�
  - `runtimeClient` ���ڸ��� `DB_CLIENT`
  - MySQL ����ʱʹ�����ӳ�
  - ʹ�� `AsyncLocalStorage` ά������������
  - `runInTransactionAsync(...)` �� MySQL ����ʱ�¿���������������
- ���� `server/db/mysql-ai-ops-store.js`������ MySQL ����ʱ�µģ�
  - AI ��Ӧ�̹���
  - AI �������
  - AI ������־
  - �����־
  - ����վ��ز�ѯ
- ���� `server/db/mysql-snapshot-store.js`������ MySQL ����ʱ�µģ�
  - ���յ���
  - ���յ����滻
  - �����������������
- ���� `server/index.js`��
  - MySQL ����ʱ�¸�Ϊ���� MySQL runtime stores / AI store / snapshot store
  - `/api/health` ��Ϊ�����첽����ʱ�������
  - SQLite ר�� seed ������ MySQL ����ʱ���Զ���������������ʱ���� SQLite ֱ���߼�
  - MySQL ����ʱ�µı��ݸ�Ϊд�� JSON ���յ������ļ�
  - MySQL ����ʱ�µĻָ���Ϊ��ȡ���ղ�ͨ��������·�ع�
- ���� `server/scripts/mysql-runtime-status-smoke.js`��ʹ����֤������ʱ�Ѿ��� MySQL �ϡ��������Ǿɵļ���ģʽ��
- ���� `server/scripts/mysql-runtime-server-smoke.js`��ֱ����ʱ���� `DB_CLIENT=mysql` �ķ���У�鹫���ӿڡ�
- �ѽ���ǰ���� `http://localhost:3001` ��������ʵ MySQL ����ʱ��

### ����֤
- `node --check server/index.js` ͨ����
- `node --check server/db/runtime.js` ͨ����
- `node --check server/db/mysql-ai-ops-store.js` ͨ����
- `node --check server/db/mysql-snapshot-store.js` ͨ����
- `node --check server/scripts/mysql-runtime-status-smoke.js` ͨ����
- `node --check server/scripts/mysql-runtime-server-smoke.js` ͨ����
- `npm run db:bootstrap:smoke` ͨ����
- `npm run db:stores:smoke` ͨ����
- `npm run db:sync:mysql:tail` ͨ����
- `npm run db:preflight:mysql` ͨ����
- `npm run db:cutover:mysql:smoke` ͨ����
- `npm run db:status:mysql:smoke` ͨ���������
  - `runtimeClient = mysql`
  - `configuredClient = mysql`
  - `runtimeAligned = true`
  - `compatibilityMode = false`
  - `nextAction = runtime_already_on_mysql`
- `npm run db:smoke:mysql:server-runtime` ͨ����
- ��ǰ `http://localhost:3001/api/health` ���� HTTP 200�����ֶ���ʾ��
  - `store = mysql`
  - `configuredStore = mysql`
  - `database.runtimeClient = mysql`
  - `database.runtimeAligned = true`
  - `database.nextAction = runtime_already_on_mysql`

### ��ǰ�߽�
- ������ɵ��ǡ���ʵ MySQL ����ʱ�ӹܡ���������أ��ص����ú�˷���������ͣ���� SQLite ��������̬��������ʽ�� MySQL �����С�
- ��ǰ���������е� `localhost:3001` �Ѿ��� MySQL ��ʽ����ʱ��
- SQLite ��Ȼ����ΪǨ��Դ����ʷ�ο���β�����˻��ߣ��������ǵ�ǰ�����������ݿ⡣

### ��һ��Ӧ�����ƽ�
- ���� MySQL ����ʱ�µĺ�̨����ȫ���ع����ա�
- �������ƻ����ƽ� UI/�����Ѻû���ʣ���̨�����ĥ�������ݿ�����ʱ�л���������ʽ��ɡ�

## Phase 9 �ھ�ʮ���飺MySQL ����ʱ�º�̨ȫ���ع������տ�
����ʱ�䣺2026-07-17

���ּ����ϸ��� `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` �ƽ������ڿ�ʼǰ�ȸ�����һ�顰��ʵ MySQL ����ʱ�ӹ�������ء������˽��ͨ����`http://localhost:3001/api/health` ���� `store = mysql`��`configuredStore = mysql`��`database.runtimeClient = mysql`��`database.runtimeAligned = true`��`npm run db:status:mysql:smoke` ���� `ok = true`��`npm run db:smoke:mysql:server-runtime` ���� `ok = true`�������һ�׶��ڼȶ��߽�������ɡ�

### �����
- ���� `server/scripts/mysql-admin-runtime-regression.js`������ MySQL ����ʱ�º�̨���ջ��ع飬ʵ�ʸ��ǣ�
  - ��¼
  - `auth/me`
  - Ȩ���б�
  - �û��б�
  - �¾�������̨��ȡ
  - ���� JSON
  - ��������
  - ����ָ�
  - ���ݻָ�
  - ����/�ָ���ĻỰʧЧ��֤
- �� `server/package.json` �������
  - `db:smoke:mysql:admin-runtime`
  - `db:smoke:mysql:acceptance`
- `db:smoke:mysql:acceptance` ���ѳ�Ϊ����������ǰ��һ��ȫ���ع���ڣ�������
  - MySQL ����ʱ״̬��֤
  - MySQL ��������ʱ��֤
  - ��̨������·
  - ���ݶ�д��·
  - ����ʱ������·
  - �����ӻ�����·
  - �����ӿڶ�����֤
  - ��̨����/����/����/�ָ��ջ���֤

### ����֤
- `node --check server/scripts/mysql-admin-runtime-regression.js` ͨ����
- `npm run db:smoke:mysql:admin-runtime` ͨ������ʵ���������
  - `permissionCount = 19`
  - `userCount = 3`
  - `exportedTableCount = 22`
  - ����ǰ�¾����������ɹ��������ָ���ԭֵ
  - ����ǰ�¾����������ɹ����ָ���ָ���ԭֵ
  - `authStatusAfterImport = 401`
  - `authStatusAfterRestore = 401`
- `npm run db:smoke:mysql:acceptance` ȫ��ͨ����
- ��ǰ `http://localhost:3001/api/health` �������� HTTP 200������Ȼ��ʾ MySQL ��ʽ����ʱ��

### ��ǰ�߽�
- ������ɵ��ǡ�MySQL ����ʱ�º�̨����ȫ���ع����ա����տڣ��ص��ǰ�ǰ�������Ŀ�� smoke������ smoke �ͺ�̨ҵ��ջ��ع�ͳһ��һ�����ظ�ִ�е�������ڡ�
- ��ǰ���� `localhost:3001` ��Ȼ���� MySQL ��ʽ����ʱ��
- ������ߵ������Ѿ��ӡ����л����ƽ����ˡ����л�����һ���ع����ա���

### ��һ��Ӧ�����ƽ�
- �������ƻ����ƽ���̨ UI/�����Ѻû���ʣ�������ĥ��
- ǰ�˹����˵Ĵ��ģ��������ɼ����ڵ�ǰ MySQL ����ʱ�������ƽ���
## Phase 9 第九十七块：MySQL 验收入口环境自举收口

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，但开始前先复审上一块“MySQL 运行时下后台全量回归验收收口”。复审时发现上一块并未完全收口：`http://localhost:3001/api/health` 仍返回 `store = mysql`、`configuredStore = mysql`、`database.runtimeClient = mysql`、`database.runtimeAligned = true`，说明服务本身已经在 MySQL 正式运行时上；但 `npm run db:smoke:mysql:acceptance` 在第一步 `db:status:mysql:smoke` 就失败，错误为 MySQL 脚本进程没有拿到 `DB_PASSWORD`，从而出现 `Access denied for user 'szht_user'@'172.18.0.1' (using password: NO)`。因此上一阶段在“可重复的一键全量验收入口”这个边界上未完全完成，本轮先做收口修复。

- 新增 `server/scripts/load-mysql-cli-env.js`，为所有 MySQL 相关 CLI/验收脚本提供统一的本地环境自举能力：
  - 按顺序尝试读取 `.env`、`.env.local`、`.env.mysql`、`.env.mysql.local`、`.env.mysql.example`
  - 仅在当前进程缺失对应环境变量时补齐，避免覆盖用户显式传入的生产/测试配置
  - 重点解决独立 smoke/parity 脚本与已启动服务进程环境不一致的问题
- 更新 `server/package.json` 中全部 MySQL 相关 npm scripts，统一改为通过 `node -r ./scripts/load-mysql-cli-env.js ...` 启动，包括：
  - `db:status:mysql:smoke`
  - `db:smoke:mysql:server-runtime`
  - `db:smoke:mysql:admin-runtime`
  - `db:smoke:mysql:acceptance` 所依赖的全部 MySQL smoke/parity 子命令
  - `db:preflight:mysql`、`db:migrate:mysql`、`db:backup:mysql`、`db:sync:mysql:tail` 等 MySQL 运维命令
- 这样处理后，“服务已经在 MySQL 上运行”与“新开一个终端直接跑 MySQL 验收/运维命令”两条路径都会走到同一套数据库连接配置，不再因为单独的 shell 会话缺少密码而误报失败。

本轮验证：

1. `node --check server/scripts/load-mysql-cli-env.js` 通过。
2. `npm run db:status:mysql:smoke` 通过，返回：
   - `runtimeClient = mysql`
   - `configuredClient = mysql`
   - `targetReady = true`
   - `targetReachable = true`
   - `schemaReady = true`
   - `coreTablesPresent = true`
   - `nextAction = runtime_already_on_mysql`
3. `npm run db:smoke:mysql:acceptance` 再次全量通过，覆盖：
   - MySQL 运行时状态 smoke
   - MySQL 服务级运行时 smoke
   - 后台核心读写 smoke
   - 内容查询与写入 smoke
   - 运行时杂项 smoke
   - 主链路 smoke
   - 公开端 parity
   - 后台登录/权限/导入导出/备份恢复真实回归

当前边界结论：

- 上一阶段“MySQL 运行时下后台全量回归验收收口”现在才算真正全量完成，因为它要求的不只是服务本身运行正常，还包括一键验收入口在新终端中可重复执行。
- 当前本地 `localhost:3001` 仍然处于 MySQL 正式运行时，且 MySQL 验收入口已经具备独立、自举、可重复执行能力。

下一步建议：

- 在已稳定的 MySQL 运行时与验收入口基础上，继续按计划书进入“后台友好化/可视化交互”剩余块，优先削减仍然偏 JSON 化的低频复杂配置入口。
## Phase 9 第九十八块：新建中心与普通路径零 JSON 首轮收口

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，开始前先复审上一块“MySQL 验收入口环境自举收口”。复审结果通过：`http://localhost:3001/api/health` 继续返回 `store = mysql`、`configuredStore = mysql`、`database.runtimeClient = mysql`、`database.runtimeAligned = true`；`npm run db:smoke:mysql:acceptance` 全量通过。因此上一阶段在既定边界内已完成，本轮进入计划书里的后台友好化下一块。

本轮对齐计划书 5.5「新建中心」、5.6「向导式录入」、6「普通路径零 JSON 原则」，完成如下：

- 在 `admin/src/App.tsx` 新增独立菜单项“新建中心”，放入工作台分组，并补充对应帮助文章。
- 新增 `CreateCenterPage`：
  - 以用户任务意图组织入口，而不是先暴露技术模块名。
  - 当前提供四类入口：新增档案点位、录入口述历史、上传媒体素材、处理审核任务。
  - 每个入口都显示“开始前准备”清单与“下一步去哪里”的说明。
- 工作台快捷入口新增“进入新建中心”，让用户可以从首页直接按任务进入，而不是先自己判断该点哪个模块。
- 内容管理页接入新建中心意图：
  - 从“新增档案点位”进入时，会自动打开内容录入表单并切到 `archive`。
  - 从“录入口述历史”进入时，会自动打开内容录入表单并切到 `oral_history`。
  - 支持从内容管理页再返回“新建中心”。
- 内容录入页新增向导说明区：
  - 根据当前模块显示不同的“开始前准备”和“建议步骤”。
  - 新增“分步引导 / 熟练模式”切换。
  - 让首次使用者不看技术文档也知道先填什么、后填什么。
- 收口普通路径 JSON：
  - `媒体列表 JSON` 与 `扩展数据 JSON` 改为仅超级管理员可见。
  - 默认隐藏，需手动点击“显示技术字段”才展开。
  - 普通操作路径不再直接把这些技术字段暴露给一般运营人员。
- 在 `admin/src/styles.css` 增补新建中心、录入向导、高级技术区的样式，并补齐移动端/窄屏响应式布局。

本轮验证：

1. 复审上一阶段：
   - `http://localhost:3001/api/health` 通过。
   - `npm run db:smoke:mysql:acceptance` 全量通过。
2. 前端构建验证：
   - `admin` 目录本地 `npm run build` 因当前机器未单独安装该子应用依赖而不可直接运行。
   - 但已使用现有 `client/node_modules/.bin/vite.cmd` 对 `admin` 执行构建，构建通过：
     - `dist/index.html`
     - `dist/admin-assets/index-DqlTbWq0.css`
     - `dist/admin-assets/index-BGKSx2BX.js`
3. 后端回归验证：
   - 改动后再次执行 `npm run db:smoke:mysql:acceptance`，整条 MySQL 验收链继续通过。

当前边界结论：

- 计划书中“新建中心”和“普通路径零 JSON”已经完成第一轮实装收口，不再只是工作台提示，而是形成了真正可进入、可引导、可回退的操作闭环。
- 当前后台对政府工作人员、讲解员、审核员的首次使用门槛比上一轮更低，普通录入路径已进一步去技术化。

下一步建议：

- 继续按计划书推进“媒体选择器”和“地图点选器”等剩余高频可视化交互块，把仍然依赖手填路径/手填坐标的地方继续做成真正傻瓜式选择。
## Phase 9 第九十九块：媒体选择器首轮实装收口

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，开始前先复审上一块“新建中心与普通路径零 JSON 首轮收口”。复审结果通过：

- `http://localhost:3001/api/health` 继续返回 `store = mysql`、`configuredStore = mysql`、`database.runtimeClient = mysql`、`database.runtimeAligned = true`
- `npm run db:smoke:mysql:acceptance` 全量通过
- `admin` 使用现有 `vite` 构建再次通过

因此上一阶段在既定边界内已完成，本轮进入计划书中“媒体选择器”“普通路径通过上传、选择完成全部操作”“内容编辑中不再复制路径”的下一块。

本轮完成内容：

- 在 `admin/src/App.tsx` 新增通用媒体字段组件 `MediaPickerField`
  - 保留原有路径输入，兼容已有数据和手工兜底
  - 新增“从素材库选择”按钮
  - 新增“清空”按钮
  - 无素材库权限时自动显示提示，而不是假装可用
- 新增 `MediaPickerDialog`
  - 直接读取后台 `/admin/media-assets`
  - 支持按允许类型过滤素材（图片 / 音频 / 视频 / 文档）
  - 支持关键字搜索文件名、分类、说明和 URL
  - 支持素材预览、大小与处理状态查看、确认选用
  - 选择后自动把 `asset.url` 写回表单字段，不再手动复制路径
- 将媒体选择器接入内容创建页的高频字段：
  - 档案点位封面图
  - 红歌音频
  - 英雄人物头像/照片
  - 红色影视封面图与视频
  - 口述历史音频、视频、授权文件
  - 资源文库图片
  - 全景图片
- 将媒体选择器接入内容详情返修编辑页：
  - 档案点位封面图编辑
  - 口述历史音频、视频、授权文件编辑
- 补充了媒体选择器相关样式：
  - 弹层遮罩与对话框
  - 素材卡片网格
  - 预览区、操作区、空状态
  - 窄屏下与现有后台布局兼容

本轮效果边界：

- 普通运营人员在最常见的内容录入路径里，已经可以通过“选素材”替代“复制 URL”这一旧流程。
- 这次优先覆盖了内容编辑中最常用、最容易出错的媒体字段，属于计划书里媒体选择器的第一轮高价值收口。
- 资源文库多条目中的 `imageUrl`、更低频复杂结构里的嵌套媒体引用，目前仍有一部分留在可视化/JSON 混合区，后续可继续逐块收口。

本轮验证：

1. 前端构建验证通过：
   - 使用 `client/node_modules/.bin/vite.cmd` 对 `admin` 构建成功
   - 构建产物更新为：
     - `dist/admin-assets/index-BMRfAwDi.css`
     - `dist/admin-assets/index-D-1dshFn.js`
2. 后端与数据库回归验证通过：
   - `npm run db:smoke:mysql:acceptance` 全量通过
3. 复审确认：
   - 本地 `localhost:3001` 继续稳定运行在 MySQL 正式运行时

下一步建议：

- 继续按计划书推进“地图点选器”，把档案点位中的经纬度/地址录入继续从手填升级为点选、检索、回填与边界校验。

## Phase 9 第一百块：地图点选器首轮友好化收口

本轮继续严格按照 `docs/V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md` 推进，开始前先复审上一块“媒体选择器首轮实装收口”。复审结果通过：

- `http://localhost:3001/api/health` 继续返回 `store = mysql`、`configuredStore = mysql`、`database.runtimeClient = mysql`、`database.runtimeAligned = true`
- `npm run db:smoke:mysql:acceptance` 全量通过
- `admin` 使用现有 `vite` 构建再次通过

因此上一阶段在既定边界内已完成，本轮进入计划书中“地图点选器”“地址检索”“地图点选”“拖动微调”“地区边界校验”的下一块。

本轮完成内容：

- 在 `admin/src/App.tsx` 收口档案点位地图定位入口 `ArchiveLocationPickerField`
  - 将入口文案改为面向普通运营人员可理解的中文说明
  - 保留“清空位置”兜底操作
  - 未配置高德地图 Key 时明确提示如何启用
- 在 `ArchiveLocationPickerDialog` 补齐高频定位闭环：
  - 支持搜索地点后直接选择候选结果
  - 支持点击地图直接回填经纬度和地址
  - 新增定位点拖动微调，解决“点中后还要细调”的实际使用问题
  - 新增“手工输入坐标”高级入口，但默认折叠，不打扰普通用户
  - 手工坐标应用后会同步更新地图中心、定位点和地址
- 接入地区边界提示与限制：
  - 当地区边界可加载时，使用统一提示文案反馈“边界内/边界外”
  - 选到边界外时阻止“使用这个位置”直接保存
  - 当地区边界暂未取回时，明确说明当前只做定位提示，不做越界限制
- 补充了地图点选器样式：
  - 定位摘要卡
  - 地图区域与右侧提示区双栏布局
  - 高级坐标输入面板
  - 移动端与窄屏下自动切换为单栏
- 修复高德地图加载失败时的乱码报错，统一为清晰中文错误说明

本轮效果边界：

- 普通录入人员已经可以优先通过“搜地点、点地图、拖一点”的方式完成定位，不必先理解经纬度。
- 地图点选器完成了计划书里第一轮高价值友好化收口，档案点位录入不再只有“手填坐标”这一种技术化路径。
- 地区边界限制已在地图点选器里生效；更深一层的后端坐标越界硬校验仍可在后续继续补强。

本轮验证：

1. 前端构建验证通过：
   - 使用 `client/node_modules/.bin/vite.cmd` 对 `admin` 构建成功
   - 构建产物更新为：
     - `dist/admin-assets/index-Cl4kdmLe.css`
     - `dist/admin-assets/index-CDaZIIsK.js`
2. 后端与数据库回归验证通过：
   - `npm run db:smoke:mysql:acceptance` 全量通过
3. 复审确认：
   - 本地 `localhost:3001` 继续稳定运行在 MySQL 正式运行时

下一步建议：

- 继续按计划书推进“审核详情审稿台”打磨，把审核页从能看能点进一步收口成更适合非技术运营人员的判定工作台。

## Phase 9 第一百零一块：审核详情审稿台首轮打磨

本轮开始前复核了上一块“地图点选器首轮友好化收口”：地图搜索、点选、拖动微调、手工坐标高级入口、边界提醒与前端保存限制均已落地；`admin` 构建、MySQL 验收和运行时健康检查继续全绿，因此进入计划书中“审核详情”“审稿台”“风险标签与审核清单集中呈现”的下一块。

本轮完成内容：

- 在 `admin/src/App.tsx` 优化审核任务页 `ReviewsPage`
  - 修正待审核任务页标题、数量说明、导出失败提示、详情加载失败提示等一批乱码与不友好文案
  - 修正审核意见模板下拉框、表头“内容”等关键操作文案
- 在 `ContentDetailPanel` 打磨审核详情阅读体验
  - 将详情头部状态文案调整为更清晰的“模块 | 状态 | 敏感级别”展示
  - 修复“恢复、永久删除、关闭、当前版本、发布版本、结构化数据”等关键按钮和标题文案
  - 增加“审稿清单”卡片，集中提示：
    - 是否已附来源依据
    - 是否存在可对比版本差异
    - 是否存在风险信号
    - 是否已有审核历史
    - 当前是否仍处于待审核流转中
- 在 `admin/src/styles.css` 新增审核清单样式
  - 通过 `done / warn / info` 三种状态降低阅读负担
  - 让审核员在详情右侧先判断“够不够审”，再进入正文细看

本轮效果边界：

- 审核详情页已经更接近计划书要求的“审稿台”体验，审核员先看清单、再看风险、再看正文，不必自己到处找信息。
- 本轮先做的是高频认知负担收口；如果后续继续深化，可再把审核动作按钮、来源依据、审核历史与差异对比进一步做成更强的一屏联动布局。

本轮验证：

1. 前端构建验证通过：
   - 使用 `client/node_modules/.bin/vite.cmd` 对 `admin` 构建成功
   - 构建产物更新为：
     - `dist/admin-assets/index-CH7Qghtn.css`
     - `dist/admin-assets/index-GqCOfbzH.js`
2. 后端与数据库回归验证通过：
   - `npm run db:smoke:mysql:acceptance` 全量通过
3. 复审确认：
   - `http://localhost:3001/api/health` 继续返回 MySQL 正式运行时健康状态

下一步建议：

- 继续对照计划书第一批 UI 范围，收口“帮助中心骨架”和“审核详情一屏联动”的剩余易用性细节，并继续清理后台局部残留乱码文案。
## Phase 9 第一百零二块：帮助中心后台可编辑与审核信号乱码清理

本轮开始前复核了上一块“审核详情审稿台首轮打磨”：`http://localhost:3001/api/health` 继续返回 MySQL 正式运行时健康状态，`npm run db:smoke:mysql:acceptance` 全量通过，`admin` 生产构建继续通过，因此按计划书第一批 UI 范围进入“帮助中心骨架”收口，并顺手清理审核底层风险信号的历史乱码。

本轮完成内容：

- 在 `server/index.js` 新增帮助中心配置能力：
  - 新增默认帮助配置常量，覆盖工作台、新建中心、内容管理、媒体库、审核任务、用户管理、运维管理等高频页面
  - 新增 `GET /api/admin/help-articles`，供已登录后台读取帮助内容
  - 新增 `PUT /api/admin/help-articles/:pageKey`，供超管在后台保存帮助内容
  - 帮助内容保存到 `server/data/help-articles.json`，并纳入导出/导入快照 `meta.helpArticles`
- 在 `admin/src/App.tsx` 将帮助抽屉接入真实配置：
  - 登录后自动拉取帮助配置并覆盖前端默认帮助文案
  - 全局搜索中的帮助结果改为搜索实时帮助内容，而不是只搜索写死常量
  - 帮助抽屉支持显示补充提示与教程链接
- 在 `OperationsPage` 增加“帮助中心配置”面板：
  - 超管可按页面选择帮助项
  - 可编辑标题、摘要、分步说明、补充提示、教程链接
  - 保存后前台帮助入口即可读取新内容
- 同步清理了一批高频乱码与隐藏风险：
  - 修正“进入审核任务”按钮文案
  - 修正移动端主导航无障碍标签
  - 修正 `buildReviewSignalsAsync(...)` 中的敏感等级、风险标签、AI 摘要、敏感片段、授权状态等底层信号文案乱码
  - 修正 `OperationsPage` 缺失的 `canImport` 本地权限变量，避免运维页潜在运行时异常

本轮效果边界：

- 帮助中心已经不再只是前端写死骨架，而是形成了“后台可编辑 -> 抽屉展示 -> 全局搜索可搜到”的闭环。
- 当前帮助配置采用后端数据文件持久化，并已纳入 JSON 导出导入；如后续继续平台化，可再进一步迁入统一数据库配置表。

本轮验证：

1. 后端语法检查通过：
   - `node --check server/index.js`
2. 前端构建验证通过：
   - 使用 `client/node_modules/.bin/vite.cmd` 对 `admin` 构建成功
   - 构建产物更新为：
     - `dist/admin-assets/index-CH7Qghtn.css`
     - `dist/admin-assets/index-B9Yl_TQF.js`
3. 后端与数据库回归验证通过：
   - `npm run db:smoke:mysql:acceptance` 全量通过
4. 运行态健康确认：
   - `http://localhost:3001/api/health` 继续返回 MySQL 正式运行时健康状态

下一步建议：

- 继续对照计划书第一批 UI 范围，收口剩余高频后台乱码与局部不够可视化的低频配置入口，并进一步强化审核详情的一屏联动体验。