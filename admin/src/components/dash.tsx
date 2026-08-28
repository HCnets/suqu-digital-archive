/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import {  useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type {  AdminUser, AcceptanceEvidenceFile, AcceptanceManualRecord, HealthStatus, Api } from '../types'
import { EMPTY_ACCEPTANCE_MANUAL_RECORD, ACCEPTANCE_CONCLUSION_OPTIONS } from '../constants'
import {  statusLabel, formatTime, formatReadableTimeValue } from '../utils'

export function acceptanceConclusionLabel(value: string) {
  return ACCEPTANCE_CONCLUSION_OPTIONS.find(item => item.value === value)?.label || '待验收'
}

export function Dashboard({ api, user, onJump }: { api: Api; user: AdminUser; onJump: Dispatch<SetStateAction<string>> }) {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [latestAcceptance, setLatestAcceptance] = useState<AcceptanceEvidenceFile | null>(null)
  const [acceptanceManual, setAcceptanceManual] = useState<AcceptanceManualRecord>(EMPTY_ACCEPTANCE_MANUAL_RECORD)
  const [launchCheckError, setLaunchCheckError] = useState('')
  const canViewOps = Boolean(user.permissions?.includes('backup.restore'))
  const mysqlReady = health?.store === 'mysql'
    && health.configuredStore === 'mysql'
    && health.database?.runtimeClient === 'mysql'
    && health.database?.runtimeAligned === true
  const machineAcceptanceReady = Boolean(latestAcceptance?.ok)
  const manualConclusionText = acceptanceConclusionLabel(acceptanceManual.conclusion)
  const manualAcceptanceReady = acceptanceManual.conclusion === 'passed' || acceptanceManual.conclusion === 'conditional'
  const cards = [
    ['当前账号', user.username],
    ['角色', user.roleName],
    ['可用功能', String(user.permissions?.length || 0)],
    ['账号状态', statusLabel(user.status)],
  ]
  const launchChecks = [
    {
      title: 'MySQL 运行状态',
      value: mysqlReady ? '正常' : health ? '待检查' : '加载中',
      note: health
        ? `${health.store || '-'} / ${health.database?.runtimeClient || '-'} / ${health.database?.runtimeAligned ? '已对齐' : '未对齐'}`
        : '正在读取服务状态',
      ok: mysqlReady,
    },
    {
      title: '机器验收记录',
      value: canViewOps ? (machineAcceptanceReady ? '已通过' : latestAcceptance ? '有待处理' : '未生成') : '运维可见',
      note: canViewOps
        ? latestAcceptance
          ? formatReadableTimeValue(latestAcceptance.checkedAt) || formatTime(latestAcceptance.updatedAt)
          : '运维页可刷新查看'
        : '需要运维功能查看详细记录',
      ok: canViewOps ? machineAcceptanceReady : true,
    },
    {
      title: '人工验收结论',
      value: canViewOps ? manualConclusionText : '运维可见',
      note: canViewOps
        ? acceptanceManual.updatedAt
          ? `最近保存：${formatTime(acceptanceManual.updatedAt)}`
          : '正式部署前需要登记'
        : '需要运维功能查看详细登记',
      ok: canViewOps ? manualAcceptanceReady : true,
    },
  ]
  const shortcuts = [
    { label: '进入新建中心', note: '按目标选择新增点位、口述历史、素材上传或审核任务', target: 'create-center' },
    user.permissions?.includes('content.edit') ? { label: '进入内容管理', note: '新建或修改资料', target: 'contents' } : null,
    user.permissions?.includes('media.manage') ? { label: '上传媒体素材', note: '图片、音频、视频、授权文件', target: 'media' } : null,
    user.permissions?.includes('content.review') || user.permissions?.includes('content.final_review')
      ? { label: '处理审核任务', note: '先核查来源，再决定通过或退回', target: 'reviews' }
      : null,
    user.permissions?.includes('users.read') ? { label: '查看账号职责', note: '分配岗位角色和可管理地区', target: 'users' } : null,
    user.permissions?.includes('backup.restore') ? { label: '进入运维管理', note: '备份、数据迁入迁出和高危操作', target: 'ops' } : null,
  ].filter(Boolean) as Array<{ label: string; note: string; target: string }>
  const reminders = [
    '新建内容建议先补齐来源依据，再准备媒体素材。',
    '口述历史涉及真实人物时，授权文件和公开版本都要补齐。',
    '高危操作会要求二次确认，建议先在运维页完成备份。',
  ]

  useEffect(() => {
    let mounted = true
    const loadLaunchChecks = async () => {
      setLaunchCheckError('')
      try {
        const [healthPayload, evidencePayload, manualPayload] = await Promise.all([
          api<HealthStatus>('/health'),
          canViewOps ? api<{ items: AcceptanceEvidenceFile[] }>('/admin/acceptance-evidence') : Promise.resolve({ items: [] }),
          canViewOps ? api<AcceptanceManualRecord>('/admin/acceptance-manual-record') : Promise.resolve(EMPTY_ACCEPTANCE_MANUAL_RECORD),
        ])
        if (!mounted) return
        setHealth(healthPayload)
        setLatestAcceptance(evidencePayload.items[0] || null)
        setAcceptanceManual({ ...EMPTY_ACCEPTANCE_MANUAL_RECORD, ...manualPayload })
      } catch (err) {
        if (!mounted) return
        setLaunchCheckError(err instanceof Error ? err.message : '上线检查状态加载失败')
      }
    }
    loadLaunchChecks()
    return () => {
      mounted = false
    }
  }, [api, canViewOps])

  return (
    <div className="dashboard-stack">
      <div className="grid-cards">
        {cards.map(([label, value]) => (
          <section className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </section>
        ))}
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>上线检查</h2>
            <p>部署前最关键的运行状态和验收结论。</p>
          </div>
          {canViewOps && <button type="button" className="secondary" onClick={() => onJump('ops')}>查看运维记录</button>}
        </div>
        {launchCheckError && <div className="error">{launchCheckError}</div>}
        <div className="launch-check-grid">
          {launchChecks.map(item => (
            <article key={item.title} className={`launch-check-card${item.ok ? ' ok' : ' warn'}`}>
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="dashboard-panels">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>今日建议</h2>
              <p>把常用操作放在眼前，减少来回找页面。</p>
            </div>
          </div>
          <div className="shortcut-grid">
            {shortcuts.map((item) => (
              <button key={item.label} type="button" className="shortcut-card secondary" onClick={() => onJump(item.target)}>
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>首次使用流程</h2>
              <p>不看开发文档也能按顺序完成一次完整操作。</p>
            </div>
          </div>
          <ol className="dashboard-list">
            <li>先上传媒体素材，再创建内容。</li>
            <li>按页面提示补齐来源、地区和资料。</li>
            <li>保存草稿后提交审核，再由审核员检查发布。</li>
          </ol>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>重要提醒</h2>
              <p>这些规则会直接影响发布和审核。</p>
            </div>
          </div>
          <ul className="dashboard-list">
            {reminders.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}

