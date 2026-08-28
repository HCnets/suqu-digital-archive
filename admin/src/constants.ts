import type { AcceptanceManualRecord, ArchiveDetailBlock, PublishPositions, MenuGroupKey, MenuItem, HelpArticle, PresetOption, DraftAutoSaveFrequency } from './types'
/**
 * 后台常量/选项定义（从 App.tsx 拆分）
 */
export const EMPTY_ACCEPTANCE_MANUAL_RECORD: AcceptanceManualRecord = {
  conclusion: 'pending',
  environment: '',
  owner: '',
  governmentRepresentative: '',
  narratorRepresentative: '',
  technicalOperator: '',
  testedAt: '',
  mobileResult: '',
  publicDomainResult: '',
  realMaterialResult: '',
  blockers: '',
  followUps: '',
  notes: '',
  updatedAt: null,
  updatedBy: '',
}

export const ACCEPTANCE_CONCLUSION_OPTIONS = [
  { value: 'pending', label: '待验收', hint: '还没有完成正式域名和真实素材验收' },
  { value: 'passed', label: '通过', hint: '必选项全部完成，没有阻塞问题' },
  { value: 'conditional', label: '有条件通过', hint: '仅剩不影响上线的轻微事项，并已登记负责人' },
  { value: 'failed', label: '不通过', hint: '存在阻塞项，修复后需要重新验收' },
]

export const ARCHIVE_DETAIL_BLOCK_OPTIONS: ArchiveDetailBlock[] = [
  { type: 'basic', title: '基本信息', order: 1, enabled: true },
  { type: 'history', title: '历史背景', order: 2, enabled: true },
  { type: 'oral_history', title: '口述历史', order: 3, enabled: true },
  { type: 'media', title: '图片/视频', order: 4, enabled: true },
  { type: 'ai_narration', title: 'AI 讲解', order: 5, enabled: true },
  { type: 'timeline', title: '展陈时间线', order: 6, enabled: true },
  { type: 'related_people', title: '相关人物', order: 7, enabled: true },
  { type: 'related_events', title: '相关事件', order: 8, enabled: true },
  { type: 'learning_questions', title: '学习问题', order: 9, enabled: true },
  { type: 'route', title: '参观路线', order: 10, enabled: true },
  { type: 'messages', title: '群众留言', order: 11, enabled: true },
  { type: 'sources', title: '来源依据', order: 12, enabled: true },
  { type: 'risk_note', title: '审校说明', order: 13, enabled: true },
]

export const FALLBACK_PUBLISH_POSITIONS: PublishPositions = { map: true, list: true, home: false, topic: false, guide: false }

export const PUBLISH_POSITION_LABELS: Array<{ key: keyof PublishPositions; label: string }> = [
  { key: 'map', label: '地图' },
  { key: 'list', label: '列表' },
  { key: 'home', label: '首页' },
  { key: 'topic', label: '专题' },
  { key: 'guide', label: '导览' },
]

export const AI_PROVIDER_TASK_TYPE_OPTIONS = [
  { value: 'transcription', label: '音视频转写' },
  { value: 'public_summary', label: '可公开摘要' },
  { value: 'risk_hint', label: '风险提示' },
  { value: 'story_script', label: '故事稿' },
  { value: 'narration_script', label: '讲解稿' },
  { value: 'tts_audio', label: 'TTS 讲解音频' },
  { value: 'digital_human_video', label: '数字人视频' },
  { value: 'keyword_extract', label: '关键词' },
  { value: 'timeline', label: '事件时间线' },
] as const

export const AI_PROVIDER_OUTPUT_FORMAT_OPTIONS = [
  { value: 'json', label: '整理后的文本结果' },
  { value: 'txt', label: 'TXT 文本' },
  { value: 'srt', label: 'SRT 字幕' },
  { value: 'mp3', label: 'MP3 音频' },
  { value: 'wav', label: 'WAV 音频' },
  { value: 'mp4', label: 'MP4 视频' },
  { value: 'webm', label: 'WebM 视频' },
] as const

export const AI_PROVIDER_INPUT_EXTENSION_OPTIONS = [
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'm4a', label: 'M4A' },
  { value: 'mp4', label: 'MP4' },
  { value: 'mov', label: 'MOV' },
  { value: 'webm', label: 'WebM' },
  { value: 'pdf', label: 'PDF' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
] as const

export const AI_PROVIDER_CAPABILITY_OPTIONS = [
  { value: '大模型', label: '大模型' },
  { value: '语音转写', label: '语音转写' },
  { value: 'TTS', label: 'TTS 音频' },
  { value: '数字人', label: '数字人视频' },
  { value: '关键词提取', label: '关键词提取' },
  { value: '风险识别', label: '风险识别' },
  { value: '时间线抽取', label: '时间线抽取' },
] as const

export const AI_TARGET_TYPE_OPTIONS = [
  { value: 'oral_history', label: '口述历史' },
  { value: 'archive', label: '档案点位' },
  { value: 'content', label: '普通内容' },
] as const

export const REVIEW_COMMENT_TEMPLATES = [
  '来源依据不足，请补充采集记录、出处或授权材料后重新提交。',
  '公开表述需要脱敏处理，请删除或改写可能涉及隐私、敏感风险的片段。',
  'AI 生成内容尚未完成人工核对，请标注来源并由编辑复核后重新提交。',
  '关键信息不完整，请补齐地区、点位、时间、人物或媒体信息。',
]

export const MENU_GROUP_LABELS: Record<MenuGroupKey, string> = {
  workbench: '日常工作',
  content: '内容与素材',
  review: '审核发布',
  system: '系统管理',
}

export const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', label: '工作台', permission: '', group: 'workbench', description: '查看待办、常用入口与系统状态', mobile: true },
  { key: 'create-center', label: '新建中心', permission: ['content.create', 'media.manage', 'content.review', 'content.final_review'], group: 'workbench', description: '按任务目的开始新建、上传与提审', mobile: true },
  { key: 'contents', label: '内容管理', permission: 'content.edit', group: 'content', description: '新建内容、编辑草稿、管理区块与资料', mobile: true },
  { key: 'media', label: '媒体库', permission: 'media.manage', group: 'content', description: '上传图片、音频、视频与授权文件', mobile: true },
  { key: 'regions', label: '地区项目', permission: 'regions.manage', group: 'content', description: '维护地区范围、授权范围与公开展示', mobile: false },
  { key: 'tributes', label: '致敬计数', permission: 'settings.manage', group: 'content', description: '维护致敬相关数据与展示入口', mobile: false },
  { key: 'reviews', label: '审核任务', permission: ['content.review', 'content.final_review'], group: 'review', description: '处理待审核内容、批注与发布动作', mobile: true },
  { key: 'audit', label: '操作日志', permission: 'audit.read', group: 'review', description: '查看关键操作、审计记录与风险追踪', mobile: false },
  { key: 'users', label: '用户管理', permission: 'users.read', group: 'system', description: '创建账号、停用账号与分配可管理地区', mobile: true },
  { key: 'roles', label: '角色权限', permission: 'roles.read', group: 'system', description: '查看岗位角色和可用功能范围', mobile: false },
  { key: 'ai', label: 'AI 中心', permission: 'ai.manage', group: 'system', description: '维护 AI 服务、任务与调用记录', mobile: false },
  { key: 'ops', label: '运维管理', permission: ['backup.restore', 'import_export.manage', 'trash.purge'], group: 'system', description: '执行备份、数据迁入迁出与高危操作', mobile: true },
]

export const HELP_ARTICLE_DEFAULTS: Record<string, HelpArticle> = {
  dashboard: {
    pageKey: 'dashboard',
    title: '工作台说明',
    summary: '这里集中显示今天要处理的事情、常用入口和系统状态。',
    steps: ['先看待处理事项。', '再点快捷入口进入新建、审核或上传。', '右上角可切换字号、主题和布局模式。'],
    tips: '如不确定下一步做什么，优先从工作台推荐入口进入。',
    videoUrl: '',
  },
  'create-center': {
    pageKey: 'create-center',
    title: '新建中心说明',
    summary: '先选要完成的任务，再按准备材料和分步提示进入对应页面。',
    steps: ['先按目标选择入口，例如新增点位、录入口述历史或上传素材。', '根据页面提示准备必需材料，缺项时先补材料再继续。', '完成草稿后进入审核任务继续流转。'],
    tips: '这里是普通用户最友好的起点，不需要先理解模块结构。',
    videoUrl: '',
  },
  contents: {
    pageKey: 'contents',
    title: '内容管理说明',
    summary: '内容创建会逐步引导录入，复杂补充项会继续改造成可视化编辑。',
    steps: ['先确定内容类型。', '按步骤补齐基础信息、资料和来源依据。', '保存草稿后再提交审核。'],
    tips: '普通操作流程优先使用上传、卡片和选择器，复杂补充项会收在补充入口。',
    videoUrl: '',
  },
  media: {
    pageKey: 'media',
    title: '媒体库说明',
    summary: '媒体库用于上传并管理图片、音频、视频和授权文件。',
    steps: ['上传后先补齐分类和说明。', '优先使用自动压缩和水印。', '被引用的素材删除前要先解除关联。'],
    tips: '先入库再选用素材，比直接填写素材地址更稳妥。',
    videoUrl: '',
  },
  reviews: {
    pageKey: 'reviews',
    title: '审核任务说明',
    summary: '审核员应优先核查真实性、来源依据和风险提示。',
    steps: ['先查看来源和媒体。', '再看版本差异与风险信号。', '驳回时请选择问题类型并写清退回原因。'],
    tips: '政治敏感内容优先核查来源、授权和表述准确性。',
    videoUrl: '',
  },
  users: {
    pageKey: 'users',
    title: '用户管理说明',
    summary: '这里用于新建账号、设置地区范围和分配岗位角色。',
    steps: ['先选择岗位角色。', '再设置地区范围。', '敏感功能只给确实需要的人。'],
    tips: '尽量通过岗位角色管理可用功能，不要给普通账号叠加过多敏感能力。',
    videoUrl: '',
  },
  ops: {
    pageKey: 'ops',
    title: '运维管理说明',
    summary: '数据迁入、恢复、清空回收站等高危操作都在这里进行。',
    steps: ['先确认当前备份是否完整。', '执行高危操作前二次确认。', '完成后检查日志和系统状态。'],
    tips: '任何高危操作前都建议先做一次备份。',
    videoUrl: '',
  },
}

export const AUDIT_ACTION_FILTER_OPTIONS = [
  { value: '', label: '全部', hint: '查看所有操作记录。' },
  { value: 'create', label: '新增', hint: '新建内容、账号、地区或设置。' },
  { value: 'update', label: '修改', hint: '编辑已有记录或保存设置。' },
  { value: 'submit', label: '提交审核', hint: '内容从草稿进入审核流程。' },
  { value: 'approve', label: '审核通过', hint: '审核人员确认内容可继续发布。' },
  { value: 'reject', label: '审核退回', hint: '审核人员退回内容要求补充或修改。' },
  { value: 'upload', label: '上传素材', hint: '上传图片、音频、视频或授权文件。' },
  { value: 'backup', label: '备份', hint: '创建数据库和上传目录快照。' },
  { value: 'export', label: '迁出数据包', hint: '生成可带走的业务数据包。' },
  { value: 'import', label: '迁入数据包', hint: '把业务数据包写回系统。' },
]

export const AUDIT_ENTITY_FILTER_OPTIONS = [
  { value: '', label: '全部', hint: '查看所有对象类型。' },
  { value: 'content', label: '内容', hint: '档案点位、口述历史和其他内容记录。' },
  { value: 'media_asset', label: '媒体素材', hint: '图片、音频、视频和授权文件。' },
  { value: 'admin_user', label: '账号', hint: '后台用户账号。' },
  { value: 'region', label: '地区', hint: '地区项目和授权范围。' },
  { value: 'database', label: '业务数据包', hint: '备份、迁入和迁出相关记录。' },
  { value: 'ai_task', label: 'AI 任务', hint: 'AI 任务创建、调用和结果应用。' },
  { value: 'trash', label: '回收站', hint: '清空回收站等高危记录。' },
]

export const SOURCE_TYPE_OPTIONS = [
  { value: 'archive', label: '档案原件', hint: '馆藏档案、一手材料、扫描件' },
  { value: 'interview', label: '采访记录', hint: '口述历史、访谈纪要、录音整理' },
  { value: 'book', label: '书籍文献', hint: '正式出版物、研究资料、文献汇编' },
  { value: 'website', label: '权威网页', hint: '政府、学校、权威机构网站' },
  { value: 'news', label: '新闻报道', hint: '媒体报道、专题新闻、采访稿' },
  { value: 'other', label: '其他来源', hint: '暂不属于以上分类的材料' },
]

export const TRUST_LEVEL_OPTIONS = [
  { value: 'high', label: '高', hint: '一手材料或已多方核对' },
  { value: 'medium', label: '中', hint: '有依据，但仍建议复核' },
  { value: 'low', label: '低', hint: '待补证据或可信度不足' },
]

export const AUTHORIZATION_STATUS_OPTIONS = [
  { value: 'authorized', label: '已授权公开', hint: '可在公开端展示' },
  { value: 'pending', label: '待补授权', hint: '暂可保存，不能放心公开' },
  { value: 'restricted', label: '限制公开', hint: '仅内部或局部场景可见' },
  { value: 'revoked', label: '已撤回授权', hint: '不应继续公开使用' },
]

export const SENSITIVE_LEVEL_OPTIONS = [
  { value: 'normal', label: '普通', hint: '正常内容，可按标准流程处理' },
  { value: 'attention', label: '需注意', hint: '建议复核表述、来源或展示范围' },
  { value: 'sensitive', label: '敏感', hint: '需要重点审核，谨慎公开' },
  { value: 'critical', label: '重大敏感', hint: '必须严格审校并限制传播' },
]

export const TRANSCRIPT_REVIEW_STATUS_OPTIONS = [
  { value: 'raw_imported', label: '已录入采访素材', hint: '素材已入库，尚未整理成正式转写' },
  { value: 'transcribed', label: '已完成转写', hint: '已有完整转写文本，可继续编辑公开版' },
  { value: 'public_edited', label: '已编辑公开版本', hint: '公开版已处理，可继续人工核校' },
  { value: 'review_ready', label: '可提交审核', hint: '转写、公开版和敏感片段已基本齐备' },
]

export const AI_SUMMARY_STATUS_OPTIONS = [
  { value: 'none', label: '未使用 AI 摘要', hint: '尚未生成或补录 AI 摘要' },
  { value: 'manual_imported', label: '人工补录', hint: '由人工整理后录入摘要内容' },
  { value: 'ai_generated', label: 'AI 生成待审', hint: 'AI 已生成，需要编辑人工核对' },
  { value: 'editor_checked', label: '编辑已核对', hint: '摘要已经过人工审阅，可继续审核流程' },
]

export const REGION_LEVEL_OPTIONS = [
  { value: 'province', label: '省', hint: '适合省级整体统筹与多市聚合' },
  { value: 'city', label: '市', hint: '适合城市级项目或地级市管理' },
  { value: 'county', label: '县 / 区', hint: '适合县区级红色资源管理' },
  { value: 'town', label: '镇 / 街道', hint: '适合当前镇级主项目场景' },
  { value: 'village', label: '村 / 社区', hint: '适合基层点位归属与细分范围' },
  { value: 'site', label: '点位', hint: '适合单个馆点、遗址或专题节点' },
]

export const DISPLAY_MODE_OPTIONS = [
  { value: 'current', label: '只展示当前地区', hint: '默认只看本地区，界面最简洁' },
  { value: 'overview', label: '展示地区总览', hint: '进入后先看整个地区集合概览' },
  { value: 'auto_location', label: '按定位自动切换', hint: '可根据用户定位自动落到对应地区' },
]

export const MAP_MODE_OPTIONS = [
  { value: 'single', label: '单地区地图', hint: '只展示当前地区内的地图数据' },
  { value: 'aggregate', label: '聚合总览地图', hint: '集中展示多个地区的汇总情况' },
  { value: 'mixed', label: '混合模式', hint: '既可总览，也可切换到单地区详情' },
]

export const DASHBOARD_ACTION_OPTIONS = [
  { value: '', label: '暂不绑定动作', hint: '仅作为静态入口展示，后续可再补' },
  { value: 'heroes', label: '英雄谱', hint: '进入英雄人物专题' },
  { value: 'song_player', label: '红歌馆', hint: '进入红歌播放与资料页' },
  { value: 'party_oath', label: '入党誓词墙', hint: '进入誓词宣誓与学习模块' },
  { value: 'panorama', label: '360 全景', hint: '进入全景浏览内容' },
  { value: 'long_march', label: '长征路线沙盘', hint: '进入长征线路展示' },
  { value: 'oral_history', label: '口述历史', hint: '进入口述历史专题' },
  { value: 'resource_hub', label: '资源文库', hint: '进入资料聚合与资源文库' },
  { value: 'today_suqu', label: '今日苏区', hint: '进入今日苏区数据和动态板块' },
  { value: 'red_quiz', label: '党史答题', hint: '进入学习答题模块' },
  { value: 'party_routes', label: '党日路线', hint: '进入路线导览与活动安排' },
  { value: 'passport', label: '打卡护照', hint: '进入打卡与学习记录模块' },
  { value: 'tour_guide', label: '文旅导览', hint: '进入导览路线或讲解入口' },
  { value: 'film_archive', label: '影视资料库', hint: '进入红色影片与视频资料' },
  { value: 'cocreation', label: '群众共创', hint: '进入留言、投稿或共创入口' },
]

export const DASHBOARD_BADGE_MODE_OPTIONS = [
  { value: '', label: '不显示徽标', hint: '入口保持普通状态，不显示额外提示' },
  { value: 'checkin_progress', label: '打卡进度', hint: '在入口上显示学习或打卡进度' },
  { value: 'toggle_state', label: '开关状态', hint: '显示当前功能是否已启用或开启' },
]

export const CONTENT_STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部状态', hint: '不过滤状态，查看所有内容' },
  { value: 'draft', label: '草稿', hint: '尚未提交审核' },
  { value: 'pending_review', label: '待审核', hint: '已提交，等待进入审核流' },
  { value: 'in_review', label: '审核中', hint: '正在审核节点处理中' },
  { value: 'published', label: '已发布', hint: '已对外或对前台开放' },
  { value: 'rejected', label: '已驳回', hint: '被退回，需补充修改' },
  { value: 'unpublished', label: '已下架', hint: '曾发布但当前不展示' },
  { value: 'deleted', label: '回收站', hint: '已删除，等待恢复或清理' },
]

export const BATCH_SENSITIVE_OPTIONS = [
  { value: '', label: '保持不变', hint: '不修改当前敏感等级' },
  ...SENSITIVE_LEVEL_OPTIONS,
]

export const MEDIA_TYPE_FILTER_OPTIONS = [
  { value: '', label: '全部类型', hint: '查看所有图片、视频、音频和文档' },
  { value: 'image', label: '图片', hint: '仅查看图片素材' },
  { value: 'video', label: '视频', hint: '仅查看视频素材' },
  { value: 'audio', label: '音频', hint: '仅查看音频素材' },
  { value: 'document', label: '文档', hint: '仅查看 PDF 等文档素材' },
]

export const MEDIA_DELETED_FILTER_OPTIONS = [
  { value: '', label: '正常素材', hint: '只看当前可用的素材' },
  { value: 'true', label: '回收站', hint: '查看已删除、待恢复或清理的素材' },
]

export const MEDIA_AUTO_COMPRESS_BATCH_OPTIONS = [
  { value: '', label: '保持不变', hint: '不修改当前自动压缩设置' },
  { value: 'true', label: '开启自动压缩', hint: '后续处理时自动压缩素材' },
  { value: 'false', label: '关闭自动压缩', hint: '保持源文件，不再自动压缩' },
]

export const AI_PROVIDER_TYPE_OPTIONS = [
  { value: 'openai_compatible', label: '通用大模型服务', hint: '适合接入常见大模型、转写或生成服务' },
  { value: 'mimo_tts', label: '小米 MiMo 语音（TTS）', hint: '小米官方语音合成/克隆，用于 TTS 与数字人口型任务' },
  { value: 'manual_only', label: '仅人工补录', hint: '只保留人工上传结果，不直接调用外部服务' },
]

export const AI_RESULT_MODE_OPTIONS = [
  { value: 'sync', label: '同步返回', hint: '提交任务后通常很快返回结果，适合轻量任务' },
  { value: 'async_polling', label: '异步轮询', hint: '先创建任务，再由系统轮询等待结果' },
  { value: 'callback', label: '回调通知', hint: '由厂商在结果完成后主动回调到平台' },
  { value: 'manual', label: '人工补录结果', hint: '任务记录保留在平台中，结果由人工补录' },
]

export const RISK_LEVEL_OPTIONS = [
  { value: 'medium', label: '中', hint: '建议复核，但不一定需要最高级别处置' },
  { value: 'high', label: '高', hint: '需要重点关注并进入更严格审核' },
  { value: 'critical', label: '重大', hint: '必须优先处理并严格控制公开风险' },
]

export const WIZARD_MODE_OPTIONS = [
  { value: 'guided', label: '分步引导', hint: '适合大多数工作人员，按步骤完成录入' },
  { value: 'advanced', label: '熟练模式', hint: '适合熟悉系统的人，一屏完成更多操作' },
]

export const DRAFT_AUTOSAVE_CHOICE_OPTIONS = [
  { value: 'off', label: '关闭', hint: '只在你手动保存时写入草稿' },
  { value: '5s', label: '5 秒', hint: '最稳妥，适合重要资料录入' },
  { value: '15s', label: '15 秒', hint: '推荐默认值，兼顾稳妥和流畅' },
  { value: '30s', label: '30 秒', hint: '减少打扰，适合熟练录入' },
]

export const ARCHIVE_TYPE_OPTIONS = [
  { value: 'revolution', label: '革命遗址', hint: '旧址、纪念地、革命活动相关点位' },
  { value: 'government', label: '红色政权', hint: '苏维埃政权、机关旧址、制度建设相关内容' },
  { value: 'culture', label: '红色文化', hint: '文化传播、教育宣传、精神传承相关内容' },
]

export const HERO_CATEGORY_OPTIONS = [
  { value: 'leader', label: '组织领导', hint: '党政骨干、组织者、领导干部' },
  { value: 'soldier', label: '红军战士', hint: '战斗人员、部队成员、军属群体' },
  { value: 'civilian', label: '群众人物', hint: '地方群众、支前人员、基层代表' },
]

export const FILM_TYPE_OPTIONS = [
  { value: '电影', label: '电影', hint: '适合完整影片、电影长片资料' },
  { value: '电视剧', label: '电视剧', hint: '适合集数型剧集、连续剧资料' },
  { value: '纪录片', label: '纪录片', hint: '适合史料纪实、专题纪录影像' },
]

export const SENSITIVE_SEGMENT_LEVEL_OPTIONS = [
  { value: '待分级', label: '待分级', hint: '先记录片段，后续再确定风险等级' },
  { value: '中', label: '中', hint: '需要留意，建议公开前再复核' },
  { value: '高', label: '高', hint: '敏感度较高，必须重点审核' },
  { value: '重大', label: '重大', hint: '风险最高，必须严格控制使用范围' },
]

export const SHELL_THEME_OPTIONS = [
  { value: 'civic', label: '清爽政务', hint: '信息清晰、适合日常正式办公' },
  { value: 'heritage', label: '红色文化', hint: '更贴近项目主题表达' },
]

export const SHELL_DENSITY_OPTIONS = [
  { value: 'standard', label: '标准', hint: '信息密度和可读性保持平衡' },
  { value: 'comfortable', label: '宽松大字', hint: '更适合长时间阅读和年长用户' },
  { value: 'compact', label: '高效紧凑', hint: '一屏显示更多信息，适合熟练用户' },
]

export const SHELL_FONT_SCALE_OPTIONS = [
  { value: 'standard', label: '标准', hint: '默认字号' },
  { value: 'large', label: '大字', hint: '更适合讲解员或常规大字需求' },
  { value: 'xlarge', label: '超大字', hint: '优先保证远看和弱视阅读' },
]

export const COMMON_COLOR_PRESETS: PresetOption[] = [
  { value: '#C41E3A', label: '主红色' },
  { value: '#8B6914', label: '金棕色' },
  { value: '#2E7D32', label: '绿色' },
  { value: '#1F4E79', label: '深蓝色' },
  { value: '#5C5C5C', label: '石墨灰' },
  { value: '#FEFAF6', label: '米白底' },
]

export const ROUTE_ICON_OPTIONS: PresetOption[] = [
  { value: 'flag', label: '旗帜', preview: '旗' },
  { value: 'route', label: '路线', preview: '线' },
  { value: 'map', label: '地图', preview: '图' },
  { value: 'users', label: '队伍', preview: '队' },
  { value: 'book', label: '学习', preview: '书' },
]

export const DASHBOARD_ICON_OPTIONS: PresetOption[] = [
  { value: 'chevron', label: '箭头', preview: '>' },
  { value: 'map', label: '地图', preview: '图' },
  { value: 'route', label: '路线', preview: '线' },
  { value: 'book', label: '文库', preview: '书' },
  { value: 'flag', label: '旗帜', preview: '旗' },
  { value: 'users', label: '人物', preview: '人' },
  { value: 'music', label: '红歌', preview: '歌' },
  { value: 'mic', label: '口述', preview: '声' },
  { value: 'camera', label: '影像', preview: '影' },
  { value: 'stamp', label: '打卡', preview: '卡' },
  { value: 'compare', label: '对比', preview: '比' },
  { value: 'tv', label: '大屏', preview: '屏' },
]

export const TODAY_METRIC_ICON_OPTIONS: PresetOption[] = [
  { value: 'trending', label: '发展趋势', preview: '势' },
  { value: 'users', label: '人口群众', preview: '人' },
  { value: 'home', label: '村居民居', preview: '居' },
  { value: 'leaf', label: '生态农业', preview: '农' },
  { value: 'education', label: '教育人才', preview: '学' },
]

export const DRAFT_AUTOSAVE_OPTIONS: Array<{ value: DraftAutoSaveFrequency; label: string }> = [
  { value: 'off', label: '关闭' },
  { value: '5s', label: '5 秒' },
  { value: '15s', label: '15 秒' },
  { value: '30s', label: '30 秒' },
]

export {}
