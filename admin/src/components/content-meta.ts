/**
 * 内容录入表单的纯逻辑（从 content.tsx 拆出的内容表单元数据/向导）
 */
import type { ContentModule, CreateIntentKey, PublishPositions } from '../types'
import { FALLBACK_PUBLISH_POSITIONS } from '../constants'

export function modulePublishDefaults(modules: ContentModule[], moduleKey: string): PublishPositions {
  return modules.find(item => item.key === moduleKey)?.defaultPublishPositions || FALLBACK_PUBLISH_POSITIONS
}

export function applyPublishDefaultsToContentForm<T extends {
  publishOnMap: boolean
  publishInList: boolean
  publishOnHome: boolean
  publishInTopic: boolean
  publishInGuide: boolean
}>(form: T, defaults: PublishPositions): T {
  return {
    ...form,
    publishOnMap: defaults.map,
    publishInList: defaults.list,
    publishOnHome: defaults.home,
    publishInTopic: defaults.topic,
    publishInGuide: defaults.guide,
  }
}

export function contentEntryModuleKey(intent: Extract<CreateIntentKey, 'archive' | 'oral_history'>) {
  return intent === 'oral_history' ? 'oral_history' : 'archive'
}

export function contentCreationPlaybook(moduleKey: string) {
  if (moduleKey === 'oral_history') {
    return {
      title: '口述历史录入向导',
      summary: '先确认授权，再上传音视频，最后整理公开稿并提交审核。',
      materials: ['讲述人姓名、身份和采访地点', '授权文件或授权照片', '采访音频 / 视频', '公开稿、整理稿或 AI 摘要'],
      steps: ['先填写讲述人、采访信息和所属地区。', '再上传授权文件与音视频素材。', '最后整理公开稿、敏感片段和关联点位。'],
    }
  }
  return {
    title: '档案点位录入向导',
    summary: '适合新增革命旧址、展陈点、路线节点和地图点位。',
    materials: ['点位名称、简介和年代', '地址、经纬度或高德搜索结果', '来源依据、档号和采集说明', '封面图、展陈图或讲解素材'],
    steps: ['先填写标题、地区和点位基础信息。', '再补充来源依据、地图位置和展示区块。', '保存草稿后查看详情，确认无误再提交审核。'],
  }
}

export function contentGuideSteps(moduleKey: string) {
  if (moduleKey === 'oral_history') {
    return [
      { key: 'base', title: '基础信息', hint: '先确认讲述人、地区和采访信息。' },
      { key: 'module', title: '素材与授权', hint: '补充音视频、授权文件和口述工作台。' },
      { key: 'final', title: '来源与正文', hint: '核对来源、公开稿和提交前说明。' },
    ]
  }
  return [
    { key: 'base', title: '基础信息', hint: '先确定内容类型、标题、地区和敏感等级。' },
    { key: 'module', title: '主题内容', hint: '补齐当前内容类型的专有字段和展示安排。' },
    { key: 'final', title: '来源与正文', hint: '最后整理来源依据、正文和补充说明。' },
  ]
}
