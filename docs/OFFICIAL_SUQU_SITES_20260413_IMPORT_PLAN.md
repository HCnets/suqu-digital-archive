# 苏区革命旧遗址 39 处资料迁移计划

更新时间：2026-07-19

## 1. 本轮口径

甲方已明确要求严格按照 Word 文献素材推进，因此本轮以 `苏区革命旧遗址39处--2026.04.13(1).docx` 作为官方基准资料。

外部网络资料只作为后续复核，不阻塞本轮迁移。正式入库仍需要保留来源记录，避免后续无法说明内容出处。

## 2. 已完成的结构化抽取

已新增 dry-run 脚本：

```powershell
cd C:\Users\HCnets\Desktop\苏区镇建模\server
npm run official:suqu-sites:dry-run -- --docx "C:\Users\HCnets\Documents\xwechat_files\wxid_a9ekpnpofueg22_5975\temp\RWTemp\2026-07\6a2d83d86122b149ca579abdd8a53bfa\苏区革命旧遗址39处--2026.04.13(1).docx"
```

输出文件：

```text
C:\Users\HCnets\Desktop\苏区镇建模\server\data\imports\official-suqu-sites-20260413-plan.json
```

当前 dry-run 结果：

- 官方条目：39 处
- Word 内嵌媒体：42 个
- 当前 MySQL archive 内容：17 条
- 自动匹配现有点位：8 条
- 待新增或待人工确认：31 条
- 明确已灭失或原建筑拆除：8 条

村组分布：

- 赤溪村：4 处
- 龙上村：1 处
- 炮子村：22 处
- 青溪村：5 处
- 小北村：2 处
- 永光村：1 处
- 永坑村：4 处

## 3. 迁移原则

1. 已匹配现有动态点位的条目，优先沿用现有公开 ID 和坐标，只补充官方正文、来源、保护状态。
2. 未匹配条目先创建后台草稿，不直接发布到地图。
3. 坐标缺失的条目，列表可准备草稿，地图发布位必须保持关闭。
4. 已灭失或原建筑拆除的条目，前台必须显示“原址 / 已灭失”说明，不能按普通可参观点误导展示。
5. Word 内嵌图片先作为待归属素材，不自动绑定到具体遗址。
6. 当前动态库里不属于官方 39 处的内容，保留为配套设施或延伸资源，不混入官方 39 处主清单。

## 4. 下一步开发

下一轮建议直接做正式导入前的后台能力：

1. 增加“官方资料导入审核台”页面入口。
2. 读取 `official-suqu-sites-20260413-plan.json`，用业务化列表展示 39 处。
3. 每条显示：所属村、官方标题、现存/已灭失、匹配情况、坐标状态、图片状态、建议动作。
4. 支持运营人员逐条确认：沿用现有点位、新建草稿、暂不导入、标记待定位。
5. 确认后再执行写入 MySQL 草稿，最后走现有审核发布流程。

## 5. 验收要求

每轮修改后继续执行：

```powershell
cd C:\Users\HCnets\Desktop\苏区镇建模\admin
& 'C:\Users\HCnets\Desktop\苏区镇建模\client\node_modules\.bin\vite.cmd' build

cd C:\Users\HCnets\Desktop\苏区镇建模\server
npm run db:smoke:mysql:acceptance

cd C:\Users\HCnets\Desktop\苏区镇建模
Invoke-RestMethod -Uri 'http://localhost:3001/api/health' | ConvertTo-Json -Depth 6
```

健康检查必须保持：

- `store = mysql`
- `configuredStore = mysql`
- `database.runtimeClient = mysql`
- `database.runtimeAligned = true`
