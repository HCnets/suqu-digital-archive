/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction, FormEvent, ChangeEvent } from 'react'
import type { Permission, Role, AdminUser, AuditLog, BackupFile, AcceptanceEvidenceFile, AcceptanceManualRecord, HelpArticle, TrashPurgeResult, ImportResult, CreateIntentKey, TributeState, Region, Api } from '../types'
import { EMPTY_ACCEPTANCE_MANUAL_RECORD, ACCEPTANCE_CONCLUSION_OPTIONS, AUDIT_ACTION_FILTER_OPTIONS, AUDIT_ENTITY_FILTER_OPTIONS } from '../constants'
import {  parseStringArrayJson, auditActionLabel, formatAuditObject, statusLabel, formatTime, formatReadableTimeValue, formatBytes } from '../utils'
import { Input, ChoiceChipField, DataTable } from './fields'
import { buildRegionTreeRows, RoleBindingSelect, RegionMultiSelectField, OptionCardSelect, HelpArticleBindingSelect } from './bindings'
import { acceptanceConclusionLabel } from './dash'
import { StringArrayEditor } from './editors'
import { useConfirm } from './confirm'

export function CreateCenterPage({
  user,
  onStartContent,
  onJump,
}: {
  user: AdminUser
  onStartContent: (intent: Extract<CreateIntentKey, 'archive' | 'oral_history'>) => void
  onJump: Dispatch<SetStateAction<string>>
}) {
  const canCreate = Boolean(user.permissions?.includes('content.create'))
  const canUploadMedia = Boolean(user.permissions?.includes('media.manage'))
  const canReview = Boolean(user.permissions?.includes('content.review') || user.permissions?.includes('content.final_review'))
  const cards = [
    canCreate ? {
      key: 'archive',
      title: '新增档案点位',
      summary: '适合录入地图点位、革命旧址、展陈点和路线节点。',
      materials: ['点位名称与简介', '地点、坐标或地址', '来源依据与档号', '图片或视频素材'],
      nextStep: '进入内容管理并自动切到档案点位草稿。',
      actionLabel: '开始新增点位',
      onClick: () => onStartContent('archive' as const),
    } : null,
    canCreate ? {
      key: 'oral_history',
      title: '录入口述历史',
      summary: '适合采访老党员、整理授权文件、音视频与公开稿。',
      materials: ['讲述人基本信息', '授权文件', '音频或视频素材', '公开稿或整理稿'],
      nextStep: '进入内容管理并自动切到口述历史草稿。',
      actionLabel: '开始录入口述历史',
      onClick: () => onStartContent('oral_history' as const),
    } : null,
    canUploadMedia ? {
      key: 'media',
      title: '上传媒体素材',
      summary: '先把图片、音频、视频和授权文件入库，后续选用时直接从素材库选择。',
      materials: ['待入库素材文件', '分类信息', '说明文字', '是否加水印和压缩'],
      nextStep: '进入媒体库上传并整理素材。',
      actionLabel: '进入媒体库',
      onClick: () => onJump('media'),
    } : null,
    canReview ? {
      key: 'review',
      title: '处理审核任务',
      summary: '适合审核员、终审员集中查看待办、风险提示和驳回原因。',
      materials: ['核对来源依据', '检查版本差异', '查看风险标签', '决定通过或退回'],
      nextStep: '进入审核任务页处理当前待办。',
      actionLabel: '进入审核任务',
      onClick: () => onJump('reviews'),
    } : null,
  ].filter(Boolean) as Array<{
    key: string
    title: string
    summary: string
    materials: string[]
    nextStep: string
    actionLabel: string
    onClick: () => void
  }>

  return (
    <div className="create-center-stack">
      <section className="panel create-center-hero">
        <div>
          <h2>按要做的事情开始</h2>
          <p>不用先理解后台分类规则，先选目标，我们再带你进入对应页面。</p>
        </div>
        <button type="button" className="secondary" onClick={() => onJump('dashboard')}>返回工作台</button>
      </section>
      <div className="create-center-grid">
        {cards.map((card) => (
          <section key={card.key} className="panel create-center-card">
            <div className="create-center-card-head">
              <div>
                <h3>{card.title}</h3>
                <p>{card.summary}</p>
              </div>
              <span className="status-pill primary">推荐入口</span>
            </div>
            <div className="create-center-list">
              <strong>开始前准备</strong>
              <ul>
                {card.materials.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <p className="create-center-next">{card.nextStep}</p>
            <button type="button" onClick={card.onClick}>{card.actionLabel}</button>
          </section>
        ))}
      </div>
    </div>
  )
}

export function TributesPage({ api }: { api: Api }) {
  const [tribute, setTribute] = useState<TributeState | null>(null)
  const [count, setCount] = useState('')
  const [delta, setDelta] = useState('100')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const payload = await api<TributeState>('/admin/tributes')
    setTribute(payload)
    setCount(String(payload.count))
  }, [api])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  const saveCount = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      await api<TributeState>('/admin/tributes', {
        method: 'PUT',
        body: JSON.stringify({ count: Number(count) }),
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  const adjust = async (value: number) => {
    setError('')
    try {
      await api<TributeState>('/admin/tributes/adjust', {
        method: 'POST',
        body: JSON.stringify({ delta: value }),
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '调整失败')
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>致敬计数</h2>
          <p>前台点击会自动累加，后台调整会写入操作日志</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="grid-cards tribute-metrics">
        <section className="metric">
          <span>当前计数</span>
          <strong>{tribute ? tribute.count.toLocaleString('zh-CN') : '-'}</strong>
        </section>
      </div>
      <form className="inline-form tribute-form" onSubmit={saveCount}>
        <Input label="设定计数" value={count} onChange={setCount} />
        <button>保存计数</button>
      </form>
      <div className="inline-form tribute-form">
        <Input label="调整步长" value={delta} onChange={setDelta} />
        <button className="secondary" type="button" onClick={() => adjust(-Math.abs(Number(delta) || 0))}>减少</button>
        <button type="button" onClick={() => adjust(Math.abs(Number(delta) || 0))}>增加</button>
      </div>
    </section>
  )
}

export function UsersPage({ api, currentUser }: { api: Api; currentUser: AdminUser }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [regionDrafts, setRegionDrafts] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ username: '', realName: '', email: '', phone: '', department: '', roleId: 'content_editor', password: '', regionIds: [] as string[] })

  const canWrite = currentUser.permissions?.includes('users.write')
  const treeRows = useMemo(() => buildRegionTreeRows(regions), [regions])
  const load = useCallback(async () => {
    const [userRows, roleRows, regionRows] = await Promise.all([
      api<AdminUser[]>('/admin/users'),
      api<Role[]>('/admin/roles'),
      api<Region[]>('/admin/region-options'),
    ])
    setUsers(userRows)
    setRoles(roleRows)
    setRegions(regionRows)
    setRegionDrafts(Object.fromEntries(userRows.map(item => [item.id, item.regionIds || []])))
  }, [api])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  const createUser = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      await api<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(form) })
      setForm({ username: '', realName: '', email: '', phone: '', department: '', roleId: 'content_editor', password: '', regionIds: [] })
      setFormOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    }
  }

  const toggleFormRegion = (regionId: string, checked: boolean) => {
    setForm(current => ({
      ...current,
      regionIds: checked
        ? Array.from(new Set([...current.regionIds, regionId]))
        : current.regionIds.filter(id => id !== regionId),
    }))
  }

  const toggleUserRegion = (userId: string, regionId: string, checked: boolean) => {
    setRegionDrafts(current => {
      const existing = current[userId] || []
      return {
        ...current,
        [userId]: checked
          ? Array.from(new Set([...existing, regionId]))
          : existing.filter(id => id !== regionId),
      }
    })
  }

  const saveUserRegions = async (target: AdminUser) => {
    setError('')
    setBusy(target.id)
    try {
      await api<AdminUser>(`/admin/users/${target.id}`, {
        method: 'PUT',
        body: JSON.stringify({ regionIds: regionDrafts[target.id] || [] }),
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存可管理地区失败')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>管理员账号</h2>
          <p>{users.length} 个账号</p>
        </div>
        {canWrite && <button onClick={() => setFormOpen(!formOpen)}>{formOpen ? '收起' : '新建用户'}</button>}
      </div>
      {error && <div className="error">{error}</div>}
      {formOpen && (
        <form className="inline-form" onSubmit={createUser}>
          <Input label="用户名" value={form.username} onChange={username => setForm({ ...form, username })} />
          <Input label="真实姓名" value={form.realName} onChange={realName => setForm({ ...form, realName })} />
          <Input label="邮箱" value={form.email} onChange={email => setForm({ ...form, email })} />
          <Input label="手机号" value={form.phone} onChange={phone => setForm({ ...form, phone })} />
          <Input label="部门" value={form.department} onChange={department => setForm({ ...form, department })} />
          <RoleBindingSelect
            label="角色"
            value={form.roleId}
            roles={roles}
            onChange={roleId => setForm({ ...form, roleId })}
          />
          <Input label="初始密码" type="password" value={form.password} onChange={password => setForm({ ...form, password })} />
          <RegionMultiSelectField
            label="可管理地区"
            selectedIds={form.regionIds}
            regions={regions}
            onToggle={toggleFormRegion}
            hint="不选择时，默认只管理当前默认地区。"
          />
          <button>创建</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>部门</th>
              <th>角色</th>
              <th>状态</th>
              <th>可管理地区</th>
              <th>最近登录</th>
              {canWrite && <th>操作</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(item => (
              <tr key={item.id}>
                <td>{item.username}</td>
                <td>{item.realName}</td>
                <td>{item.department || '-'}</td>
                <td>{item.roleName}</td>
                <td>{statusLabel(item.status)}</td>
                <td>
                  {item.allRegions ? (
                    <span className="status-pill primary">全部地区</span>
                  ) : (
                    <RegionMultiSelectField
                      label="可管理地区"
                      selectedIds={regionDrafts[item.id] || []}
                      regions={regions}
                      onToggle={(regionId, checked) => toggleUserRegion(item.id, regionId, checked)}
                      disabled={!canWrite}
                    />
                  )}
                </td>
                <td>{item.lastLoginAt ? formatTime(item.lastLoginAt) : '-'}</td>
                {canWrite && (
                  <td>
                    <button className="secondary" disabled={busy === item.id || item.allRegions} onClick={() => saveUserRegions(item)}>
                      {busy === item.id ? '保存中...' : '保存地区'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function RolesPage({ api }: { api: Api }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api<Role[]>('/admin/roles'), api<Permission[]>('/admin/permissions')])
      .then(([roleRows, permissionRows]) => {
        setRoles(roleRows)
        setPermissions(permissionRows)
      })
      .catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [api])

  const permissionName = useMemo(() => new Map(permissions.map(item => [item.code, item.name])), [permissions])

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>角色权限</h2>
          <p>{roles.length} 个岗位角色，{permissions.length} 项可用功能范围</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="role-grid">
        {roles.map(role => (
          <article className="role-card" key={role.id}>
            <h3>{role.name}</h3>
            <p>{role.description}</p>
            <div className="tags">
              {role.permissions.map(code => <span key={code}>{permissionName.get(code) || '未命名功能'}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AuditPage({ api }: { api: Api }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ q: '', action: '', entityType: '', actor: '', from: '', to: '' })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const search = new URLSearchParams({ pageSize: '100' })
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value.trim()) search.set(key, value.trim())
    })
    const payload = await api<{ items: AuditLog[]; total: number }>(`/audit-logs?${search}`)
    setLogs(payload.items)
    setTotal(payload.total)
  }, [api, appliedFilters])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  const submitFilter = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setAppliedFilters(filters)
  }

  const clearFilter = () => {
    const empty = { q: '', action: '', entityType: '', actor: '', from: '', to: '' }
    setFilters(empty)
    setAppliedFilters(empty)
    setError('')
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>操作日志</h2>
          <p>共 {total} 条，当前显示 {logs.length} 条</p>
        </div>
      </div>
      <form className="inline-form audit-filter" onSubmit={submitFilter}>
        <Input label="关键词" value={filters.q} onChange={q => setFilters({ ...filters, q })} />
        <ChoiceChipField
          label="常见动作"
          value={filters.action}
          options={AUDIT_ACTION_FILTER_OPTIONS}
          onChange={action => setFilters({ ...filters, action })}
        />
        <ChoiceChipField
          label="记录对象"
          value={filters.entityType}
          options={AUDIT_ENTITY_FILTER_OPTIONS}
          onChange={entityType => setFilters({ ...filters, entityType })}
        />
        <details className="wide-field json-raw-details">
          <summary>查找少见记录</summary>
          <div className="advanced-raw-grid">
            <Input label="操作类型" value={filters.action} onChange={action => setFilters({ ...filters, action })} placeholder="用于查找按钮中没有列出的少见操作" />
            <Input label="记录对象" value={filters.entityType} onChange={entityType => setFilters({ ...filters, entityType })} placeholder="用于查找按钮中没有列出的少见对象" />
          </div>
        </details>
        <Input label="操作人" value={filters.actor} onChange={actor => setFilters({ ...filters, actor })} />
        <Input label="开始日期" type="date" value={filters.from} onChange={from => setFilters({ ...filters, from })} />
        <Input label="结束日期" type="date" value={filters.to} onChange={to => setFilters({ ...filters, to })} />
        <button>筛选</button>
        <button type="button" className="secondary" onClick={clearFilter}>清空</button>
      </form>
      {error && <div className="error">{error}</div>}
      <DataTable
        columns={['时间', '操作人', '动作', '对象', 'IP']}
        rows={logs.map(item => [
          formatTime(item.createdAt),
          item.actor || '-',
          auditActionLabel(item.action),
          formatAuditObject(item),
          item.ip || '-',
        ])}
      />
    </section>
  )
}

export function OperationsPage({ api, currentUser, onSessionInvalidated }: { api: Api; currentUser: AdminUser; onSessionInvalidated: (message: string) => void }) {
  const { confirm, confirmDialog } = useConfirm()
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [acceptanceEvidence, setAcceptanceEvidence] = useState<AcceptanceEvidenceFile[]>([])
  const [acceptanceManual, setAcceptanceManual] = useState<AcceptanceManualRecord>(EMPTY_ACCEPTANCE_MANUAL_RECORD)
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([])
  const [helpPageKey, setHelpPageKey] = useState('dashboard')
  const [helpForm, setHelpForm] = useState({ title: '', summary: '', stepsText: '[]', tips: '', videoUrl: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportFile, setExportFile] = useState<{ url: string; name: string } | null>(null)
  const [exportText, setExportText] = useState('')
  const permissions = currentUser.permissions || []
  const canBackup = permissions.includes('backup.restore')
  const canExport = permissions.includes('import_export.manage')
  const canImport = permissions.includes('import_export.manage')
  const canPurge = permissions.includes('trash.purge')
  const canManageSettings = permissions.includes('settings.manage')
  const latestAcceptance = acceptanceEvidence[0]
  const manualConclusionText = acceptanceConclusionLabel(acceptanceManual.conclusion)
  const manualAcceptanceSummary = acceptanceManual.updatedAt
    ? `人工结论：${manualConclusionText} · ${formatTime(acceptanceManual.updatedAt)}`
    : `人工结论：${manualConclusionText} · 尚未保存正式登记`

  const loadBackups = useCallback(async () => {
    if (!canBackup) return
    const payload = await api<{ items: BackupFile[] }>('/admin/backups')
    setBackups(payload.items)
  }, [api, canBackup])

  const loadAcceptanceEvidence = useCallback(async () => {
    if (!canBackup) return
    const payload = await api<{ items: AcceptanceEvidenceFile[] }>('/admin/acceptance-evidence')
    setAcceptanceEvidence(payload.items)
  }, [api, canBackup])

  const loadAcceptanceManual = useCallback(async () => {
    if (!canBackup) return
    const payload = await api<AcceptanceManualRecord>('/admin/acceptance-manual-record')
    setAcceptanceManual({ ...EMPTY_ACCEPTANCE_MANUAL_RECORD, ...payload })
  }, [api, canBackup])

  const loadHelpArticles = useCallback(async () => {
    if (!canManageSettings) return
    const rows = await api<HelpArticle[]>('/admin/help-articles')
    setHelpArticles(rows)
  }, [api, canManageSettings])

  useEffect(() => {
    loadBackups().catch(err => setError(err instanceof Error ? err.message : '备份列表加载失败'))
  }, [loadBackups])

  useEffect(() => {
    loadAcceptanceEvidence().catch(err => setError(err instanceof Error ? err.message : '上线验收记录加载失败'))
  }, [loadAcceptanceEvidence])

  useEffect(() => {
    loadAcceptanceManual().catch(err => setError(err instanceof Error ? err.message : '上线验收登记加载失败'))
  }, [loadAcceptanceManual])

  useEffect(() => {
    loadHelpArticles().catch(err => setError(err instanceof Error ? err.message : '帮助中心加载失败'))
  }, [loadHelpArticles])

  useEffect(() => {
    const current = helpArticles.find((item) => item.pageKey === helpPageKey) || helpArticles[0]
    if (!current) return
    setHelpPageKey(current.pageKey)
    setHelpForm({
      title: current.title,
      summary: current.summary,
      stepsText: JSON.stringify(current.steps || [], null, 2),
      tips: current.tips || '',
      videoUrl: current.videoUrl || '',
    })
  }, [helpArticles, helpPageKey])

  useEffect(() => {
    return () => {
      if (exportFile) URL.revokeObjectURL(exportFile.url)
    }
  }, [exportFile])

  const createBackup = async () => {
    setError('')
    setNotice('')
    setBusy('backup')
    try {
      const item = await api<BackupFile>('/admin/backup', { method: 'POST' })
      setNotice(`备份已创建：${item.name}`)
      await loadBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : '备份创建失败')
    } finally {
      setBusy('')
    }
  }

  const exportData = async () => {
    setError('')
    setNotice('')
    setBusy('export')
    try {
      const payload = await api<Record<string, unknown>>('/admin/export')
      const text = JSON.stringify(payload, null, 2)
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const fileName = `suqu-export-${new Date().toISOString().slice(0, 10)}.json`
      if (exportFile) URL.revokeObjectURL(exportFile.url)
      setExportFile({ url, name: fileName })
      setExportText(text)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      setNotice('业务数据包已生成。如浏览器没有自动下载，请点击下方链接保存。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '业务数据包生成失败')
    } finally {
      setBusy('')
    }
  }

  const copyExportText = async () => {
    if (!exportText) return
    try {
      await navigator.clipboard.writeText(exportText)
      setNotice('业务数据包内容已复制到剪贴板。')
    } catch {
      setNotice('浏览器不允许直接复制，请展开下方数据包预览后手动复制。')
    }
  }

  const onImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('')
    setNotice('')
    setImportFile(event.target.files?.[0] || null)
  }

  const importData = async () => {
    if (!importFile) {
      setError('请先选择要迁入的业务数据包。')
      return
    }
    setError('')
    setNotice('')
    setBusy('import')
    try {
      const payload = JSON.parse(await importFile.text())
      const result = await api<ImportResult>('/admin/import', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const total = Object.values(result.counts || {}).reduce((sum, count) => sum + Number(count || 0), 0)
      setImportFile(null)
      if (result.sessionInvalidated) {
        onSessionInvalidated(`迁入完成，共处理 ${total} 条记录。请重新登录。`)
      } else {
        setNotice(`迁入完成，共处理 ${total} 条记录。`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '迁入失败')
    } finally {
      setBusy('')
    }
  }

  const restoreBackup = async (name: string) => {
    if (!await confirm(`确认将备份 ${name} 恢复到当前数据库吗？`)) return
    setError('')
    setNotice('')
    setBusy(`restore:${name}`)
    try {
      const item = await api<BackupFile>(`/admin/backups/${encodeURIComponent(name)}/restore`, { method: "POST" })
      setNotice(`备份已恢复：${item.name}`)
      await loadBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败')
    } finally {
      setBusy('')
    }
  }

  const purgeTrash = async () => {
    if (!await confirm('确认立即清空回收站吗？这会永久删除回收站中的内容和媒体记录。')) return
    setError('')
    setNotice('')
    setBusy('purge')
    try {
      const result = await api<TrashPurgeResult>('/admin/trash/purge', { method: 'POST' })
      setNotice(`回收站已清空：内容 ${result.contentPurged} 条，媒体 ${result.mediaPurged} 条`)
      await loadBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空回收站失败')
    } finally {
      setBusy('')
    }
  }

  const saveHelpArticle = async () => {
    setError('')
    setNotice('')
    setBusy('help')
    try {
      await api<HelpArticle>(`/admin/help-articles/${encodeURIComponent(helpPageKey)}`, {
        method: 'PUT',
        body: JSON.stringify({
          pageKey: helpPageKey,
          title: helpForm.title,
          summary: helpForm.summary,
          steps: parseStringArrayJson(helpForm.stepsText),
          tips: helpForm.tips,
          videoUrl: helpForm.videoUrl,
        }),
      })
      setNotice('帮助内容已保存。')
      await loadHelpArticles()
    } catch (err) {
      setError(err instanceof Error ? err.message : '帮助内容保存失败')
    } finally {
      setBusy('')
    }
  }

  const saveAcceptanceManual = async () => {
    setError('')
    setNotice('')
    setBusy('acceptance-manual')
    try {
      const saved = await api<AcceptanceManualRecord>('/admin/acceptance-manual-record', {
        method: 'PUT',
        body: JSON.stringify(acceptanceManual),
      })
      setAcceptanceManual({ ...EMPTY_ACCEPTANCE_MANUAL_RECORD, ...saved })
      setNotice('V1.0 上线验收登记已保存。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上线验收登记保存失败')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="panel">
      {confirmDialog}
      <div className="panel-head">
        <div>
          <h2>运维管理</h2>
          <p>备份恢复、数据迁入迁出和回收站维护</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}
      {exportFile && (
        <div className="export-fallback">
          <a className="download-link" href={exportFile.url} download={exportFile.name}>
            下载业务数据包：{exportFile.name}
          </a>
          <button type="button" className="secondary" onClick={copyExportText}>复制数据包内容</button>
          <details>
            <summary>查看数据包预览（仅管理员）</summary>
            <textarea readOnly value={exportText} />
          </details>
        </div>
      )}
      <div className="ops-grid">
        {canBackup && (
          <article className="ops-card">
            <h3>数据备份</h3>
            <p>创建当前数据库和上传目录的本地快照。</p>
            <button onClick={createBackup} disabled={busy === 'backup'}>{busy === 'backup' ? '备份中...' : '立即备份'}</button>
          </article>
        )}
        {canBackup && (
          <article className="ops-card">
            <h3>上线验收记录</h3>
            <p>
              {latestAcceptance
                ? `${latestAcceptance.ok ? '最近一次通过' : '最近一次有待处理'} · ${formatReadableTimeValue(latestAcceptance.checkedAt) || formatTime(latestAcceptance.updatedAt)}`
                : '暂未生成验收记录，请先在服务器执行验收证据采集。'}
            </p>
            <div className="ops-card-meta">{manualAcceptanceSummary}</div>
            <button
              type="button"
              className="secondary"
              onClick={() => loadAcceptanceEvidence().catch(err => setError(err instanceof Error ? err.message : '刷新验收记录失败'))}
            >
              刷新记录
            </button>
          </article>
        )}
        {canExport && (
          <article className="ops-card">
            <h3>数据迁出</h3>
            <p>将内容、审核、媒体、账号和操作记录生成业务数据包。</p>
            <button onClick={exportData} disabled={busy === 'export'}>{busy === 'export' ? '生成中...' : '生成业务数据包'}</button>
          </article>
        )}
        {canImport && (
          <article className="ops-card">
            <h3>数据迁入</h3>
            <p>将业务数据包写回系统，并刷新账号范围与审核流程。</p>
            <label className="file-field">
              <span>业务数据包</span>
              <input type="file" accept=".json,application/json" onChange={onImportFileChange} />
            </label>
            <button onClick={importData} disabled={busy === 'import' || !importFile}>{busy === 'import' ? '迁入中...' : '开始迁入'}</button>
            {importFile && <p className="file-hint">已选择：{importFile.name}</p>}
          </article>
        )}
        {canPurge && (
          <article className="ops-card danger">
            <h3>清空回收站</h3>
            <p>永久删除已经进入回收站的内容和媒体记录。</p>
            <button onClick={purgeTrash} disabled={busy === 'purge'}>{busy === 'purge' ? '清空中...' : '清空回收站'}</button>
          </article>
        )}
      </div>
      {canBackup && (
        <>
          <div className="panel-head compact-head">
            <div>
              <h2>上线验收记录</h2>
              <p>{acceptanceEvidence.length ? `最近 ${acceptanceEvidence.length} 条证据记录` : '暂无验收证据记录'}</p>
            </div>
            <button className="secondary" onClick={() => loadAcceptanceEvidence().catch(err => setError(err instanceof Error ? err.message : '刷新验收记录失败'))}>刷新</button>
          </div>
          <DataTable
            columns={['采集时间', '结果', 'MySQL 状态', '失败项', '记录文件']}
            rows={acceptanceEvidence.map(item => [
              formatReadableTimeValue(item.checkedAt) || formatTime(item.updatedAt),
              item.ok ? '通过' : '有待处理',
              `${item.healthStore || '-'} / ${item.runtimeClient || '-'} / ${item.runtimeAligned ? '已对齐' : '未对齐'}`,
              item.failedChecks.length ? item.failedChecks.join('、') : '无',
              `${item.name}（${formatBytes(item.sizeBytes)}）`,
            ])}
          />
        </>
      )}
      {canBackup && (
        <section className="module-defaults-panel">
          <div className="module-defaults-head">
            <div>
              <strong>V1.0 上线验收登记</strong>
              <p>
                {acceptanceManual.updatedAt
                  ? `最近由 ${acceptanceManual.updatedBy || '管理员'} 保存：${formatTime(acceptanceManual.updatedAt)}`
                  : '用于记录正式域名、手机端和真实素材验收结论。'}
              </p>
            </div>
          </div>
          <div className="region-form-grid">
            <OptionCardSelect
              label="最终结论"
              value={acceptanceManual.conclusion}
              options={ACCEPTANCE_CONCLUSION_OPTIONS}
              onChange={conclusion => setAcceptanceManual(current => ({ ...current, conclusion }))}
            />
            <Input label="验收环境" value={acceptanceManual.environment} onChange={environment => setAcceptanceManual(current => ({ ...current, environment }))} placeholder="例如：正式域名 / 服务器测试环境" />
            <Input label="验收日期" value={acceptanceManual.testedAt} onChange={testedAt => setAcceptanceManual(current => ({ ...current, testedAt }))} placeholder="例如：2026-07-19" />
            <Input label="负责人" value={acceptanceManual.owner} onChange={owner => setAcceptanceManual(current => ({ ...current, owner }))} />
            <Input label="工作人员代表" value={acceptanceManual.governmentRepresentative} onChange={governmentRepresentative => setAcceptanceManual(current => ({ ...current, governmentRepresentative }))} />
            <Input label="讲解员代表" value={acceptanceManual.narratorRepresentative} onChange={narratorRepresentative => setAcceptanceManual(current => ({ ...current, narratorRepresentative }))} />
            <Input label="运维人员" value={acceptanceManual.technicalOperator} onChange={technicalOperator => setAcceptanceManual(current => ({ ...current, technicalOperator }))} />
            <label className="wide-field">
              <span>正式域名验收结果</span>
              <textarea value={acceptanceManual.publicDomainResult} onChange={event => setAcceptanceManual(current => ({ ...current, publicDomainResult: event.target.value }))} placeholder="记录 szht.online / admin.szht.online 登录、上传、审核、公开读取结果" />
            </label>
            <label className="wide-field">
              <span>手机端验收结果</span>
              <textarea value={acceptanceManual.mobileResult} onChange={event => setAcceptanceManual(current => ({ ...current, mobileResult: event.target.value }))} placeholder="记录手机端查看待办、审核内容、管理媒体结果" />
            </label>
            <label className="wide-field">
              <span>真实素材验收结果</span>
              <textarea value={acceptanceManual.realMaterialResult} onChange={event => setAcceptanceManual(current => ({ ...current, realMaterialResult: event.target.value }))} placeholder="记录图片、音频、视频、授权文件、档案点位、口述历史、红歌、讲解路线结果" />
            </label>
            <label className="wide-field">
              <span>阻塞问题</span>
              <textarea value={acceptanceManual.blockers} onChange={event => setAcceptanceManual(current => ({ ...current, blockers: event.target.value }))} placeholder="没有阻塞问题可填写：无" />
            </label>
            <label className="wide-field">
              <span>后续事项</span>
              <textarea value={acceptanceManual.followUps} onChange={event => setAcceptanceManual(current => ({ ...current, followUps: event.target.value }))} placeholder="记录有条件通过时的负责人和完成时间" />
            </label>
            <label className="wide-field">
              <span>补充说明</span>
              <textarea value={acceptanceManual.notes} onChange={event => setAcceptanceManual(current => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          <div className="actions-cell">
            <button type="button" onClick={saveAcceptanceManual} disabled={busy === 'acceptance-manual'}>
              {busy === 'acceptance-manual' ? '保存中...' : '保存验收登记'}
            </button>
            <button type="button" className="secondary" onClick={() => loadAcceptanceManual().catch(err => setError(err instanceof Error ? err.message : '刷新验收登记失败'))}>刷新登记</button>
          </div>
        </section>
      )}
      {canManageSettings && (
        <section className="module-defaults-panel">
          <div className="module-defaults-head">
            <div>
              <strong>帮助中心内容</strong>
              <p>按页面维护帮助标题、步骤、提示和教程链接。右上角帮助入口会读取这里的内容。</p>
            </div>
          </div>
          <div className="region-form-grid">
            <HelpArticleBindingSelect
              value={helpPageKey}
              articles={helpArticles}
              onChange={setHelpPageKey}
            />
            <Input label="帮助标题" value={helpForm.title} onChange={title => setHelpForm(current => ({ ...current, title }))} />
            <label className="wide-field">
              <span>帮助摘要</span>
              <textarea value={helpForm.summary} onChange={event => setHelpForm(current => ({ ...current, summary: event.target.value }))} />
            </label>
            <StringArrayEditor
              title="操作步骤"
              hint="按步骤维护这页的操作引导，帮助入口会自动显示为操作清单。"
              value={helpForm.stepsText}
              onChange={stepsText => setHelpForm(current => ({ ...current, stepsText }))}
              itemLabel="步骤"
              placeholder="例如：先看待办事项，再点击对应功能入口开始处理"
            />
            <label className="wide-field">
              <span>补充提示</span>
              <textarea value={helpForm.tips} onChange={event => setHelpForm(current => ({ ...current, tips: event.target.value }))} placeholder="用于提醒审核重点、风险点或常见误操作" />
            </label>
            <Input label="教程链接（可选）" value={helpForm.videoUrl} onChange={videoUrl => setHelpForm(current => ({ ...current, videoUrl }))} />
          </div>
          <div className="actions-cell">
            <button type="button" onClick={saveHelpArticle} disabled={busy === 'help'}>{busy === 'help' ? '保存中...' : '保存帮助内容'}</button>
          </div>
        </section>
      )}
      {canBackup && (
        <>
          <div className="panel-head compact-head">
            <div>
              <h2>备份文件</h2>
              <p>{backups.length} 个本地备份</p>
            </div>
            <button className="secondary" onClick={() => loadBackups().catch(err => setError(err instanceof Error ? err.message : '刷新失败'))}>刷新</button>
          </div>
          <DataTable
            columns={['名称', '数据库', '上传快照', '创建时间', '更新时间']}
            rows={backups.map(item => [
              item.name,
              formatBytes(item.sizeBytes),
              item.hasUploads ? formatBytes(item.uploadSizeBytes || 0) : '无快照',
              formatTime(item.createdAt),
              formatTime(item.updatedAt),
            ])}
          />
          <div className="backup-actions">
            {backups.map(item => (
              <button
                key={item.name}
                className="secondary"
                onClick={() => restoreBackup(item.name)}
                disabled={busy === `restore:${item.name}`}
              >
                {busy === `restore:${item.name}` ? '恢复中...' : '恢复'}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

