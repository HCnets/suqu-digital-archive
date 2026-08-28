/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import {  useMemo, useState } from 'react'
import {  DRAFT_AUTOSAVE_OPTIONS } from '../constants'
import {  parseStringArrayJson, contentStatusLabel, aiProviderTypeLabel } from '../utils'
import type { ManagedContent, Region, ContentModule, Role, PublishPositions, HelpArticle, AiProvider } from '../types'

export function ArchiveBindingSelect({
  label,
  value,
  options,
  onChange,
  placeholder = '请选择已发布档案点位',
}: {
  label: string
  value: string
  options: ManagedContent[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const selectedItem = useMemo(() => options.find(item => item.id === value) || null, [options, value])
  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return options
    return options.filter(item => {
      const title = (item.title || '').toLowerCase()
      const region = (item.regionName || '').toLowerCase()
      const status = contentStatusLabel(item.status).toLowerCase()
      return title.includes(keyword) || region.includes(keyword) || status.includes(keyword)
    })
  }, [options, query])

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>{selectedItem ? '已选择 1 个点位' : '当前未选择点位'}</small>
      </div>
      <label className="wide-field">
        <span>搜索点位</span>
        <input
          value={query}
          placeholder="输入点位名称或地区快速筛选"
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div className="json-rows-list">
        {selectedItem ? (
          <article className="json-row-card">
            <div className="json-row-card-head">
              <span>当前已绑定</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" onClick={() => onChange('')}>清空</button>
              </div>
            </div>
            <div className="json-row-fields">
              <label>
                <span>点位名称</span>
                <input value={selectedItem.title} readOnly />
              </label>
              <label>
                <span>状态</span>
                <input value={contentStatusLabel(selectedItem.status)} readOnly />
              </label>
            </div>
          </article>
        ) : (
          <div className="json-empty">{placeholder}</div>
        )}
      </div>
      <div className="archive-multi-select-list">
        {filteredOptions.map(item => (
          <label key={item.id} className="check-row archive-multi-select-item">
            <input
              type="radio"
              name={`archive-binding-${label}`}
              checked={value === item.id}
              onChange={() => onChange(item.id)}
            />
            <span>{item.title}</span>
            <small>{contentStatusLabel(item.status)}</small>
          </label>
        ))}
      </div>
      {!filteredOptions.length && <p className="form-hint">没有匹配的点位，换个关键词试试。</p>}
    </div>
  )
}

export function RegionBindingSelect({
  label,
  value,
  regions,
  onChange,
  placeholder = '请选择地区',
  excludedIds = [],
}: {
  label: string
  value: string
  regions: Region[]
  onChange: (value: string) => void
  placeholder?: string
  excludedIds?: string[]
}) {
  const [query, setQuery] = useState('')
  const treeRows = useMemo(() => buildRegionTreeRows(regions), [regions])
  const selectedRow = useMemo(() => treeRows.find(item => item.region.id === value) || null, [treeRows, value])
  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const visibleRows = treeRows.filter(({ region }) => !excludedIds.includes(region.id))
    if (!keyword) return visibleRows
    return visibleRows.filter(({ region }) => {
      const name = (region.name || '').toLowerCase()
      const code = (region.code || '').toLowerCase()
      return name.includes(keyword) || code.includes(keyword)
    })
  }, [excludedIds, query, treeRows])

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>{selectedRow ? '已选择地区' : '当前未选择地区'}</small>
      </div>
      <label className="wide-field">
        <span>搜索地区</span>
        <input
          value={query}
          placeholder="输入地区名称或编码快速筛选"
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div className="json-rows-list">
        {selectedRow ? (
          <article className="json-row-card">
            <div className="json-row-card-head">
              <span>当前已选地区</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" onClick={() => onChange('')}>清空</button>
              </div>
            </div>
            <div className="json-row-fields">
              <label>
                <span>地区名称</span>
                <input value={selectedRow.region.name} readOnly />
              </label>
              <label>
                <span>地区层级</span>
                <input value={selectedRow.region.level || '-'} readOnly />
              </label>
            </div>
          </article>
        ) : (
          <div className="json-empty">{placeholder}</div>
        )}
      </div>
      <div className="archive-multi-select-list">
        {filteredRows.map(({ region, depth }) => (
          <label key={region.id} className="check-row archive-multi-select-item">
            <input
              type="radio"
              name={`region-binding-${label}`}
              checked={value === region.id}
              onChange={() => onChange(region.id)}
            />
            <span>{`${'　'.repeat(depth)}${region.name}`}</span>
            <small>{region.code || region.level || '-'}</small>
          </label>
        ))}
      </div>
      {!filteredRows.length && <p className="form-hint">没有匹配的地区，换个关键词试试。</p>}
    </div>
  )
}

export function RegionMultiSelectField({
  label,
  selectedIds,
  regions,
  onToggle,
  hint,
  disabled = false,
}: {
  label: string
  selectedIds: string[]
  regions: Region[]
  onToggle: (regionId: string, checked: boolean) => void
  hint?: string
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const treeRows = useMemo(() => buildRegionTreeRows(regions), [regions])
  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return treeRows
    return treeRows.filter(({ region }) => {
      const name = (region.name || '').toLowerCase()
      const code = (region.code || '').toLowerCase()
      return name.includes(keyword) || code.includes(keyword)
    })
  }, [query, treeRows])

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>已选择 {selectedIds.length} 个地区</small>
      </div>
      <label className="wide-field">
        <span>搜索地区</span>
        <input
          value={query}
          placeholder="输入地区名称或编码快速筛选"
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div className="archive-multi-select-list">
        {filteredRows.map(({ region, depth }) => (
          <label key={region.id} className="check-row archive-multi-select-item">
            <input
              type="checkbox"
              disabled={disabled}
              checked={selectedIds.includes(region.id)}
              onChange={event => onToggle(region.id, event.target.checked)}
            />
            <span>{`${'　'.repeat(depth)}${region.name}`}</span>
            <small>{region.code || region.level || '-'}</small>
          </label>
        ))}
      </div>
      {!filteredRows.length && <p className="form-hint">没有匹配的地区，换个关键词试试。</p>}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  )
}

export function ModuleBindingSelect({
  label,
  value,
  modules,
  onChange,
  placeholder = '请选择内容类型',
}: {
  label: string
  value: string
  modules: ContentModule[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const selectedItem = useMemo(() => modules.find(item => item.key === value) || null, [modules, value])
  const filteredModules = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return modules
    return modules.filter(item => {
      const name = (item.name || '').toLowerCase()
      const key = (item.key || '').toLowerCase()
      return name.includes(keyword) || key.includes(keyword)
    })
  }, [modules, query])

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>{selectedItem ? '已选择内容类型' : '当前未选择内容类型'}</small>
      </div>
      <label className="wide-field">
        <span>搜索内容类型</span>
        <input
          value={query}
          placeholder="输入内容类型名称快速筛选"
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div className="json-rows-list">
        {selectedItem ? (
          <article className="json-row-card">
            <div className="json-row-card-head">
              <span>当前已选内容类型</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" onClick={() => onChange('')}>清空</button>
              </div>
            </div>
            <div className="json-row-fields">
              <label>
                <span>内容类型</span>
                <input value={selectedItem.name} readOnly />
              </label>
            </div>
          </article>
        ) : (
          <div className="json-empty">{placeholder}</div>
        )}
      </div>
      <div className="archive-multi-select-list">
        {filteredModules.map(item => (
          <label key={item.key} className="check-row archive-multi-select-item">
            <input
              type="radio"
              name={`module-binding-${label}`}
              checked={value === item.key}
              onChange={() => onChange(item.key)}
            />
            <span>{item.name}</span>
          </label>
        ))}
      </div>
      {!filteredModules.length && <p className="form-hint">没有匹配的内容类型，换个关键词试试。</p>}
    </div>
  )
}

export function RoleBindingSelect({
  label,
  value,
  roles,
  onChange,
}: {
  label: string
  value: string
  roles: Role[]
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const selectedRole = useMemo(() => roles.find(item => item.id === value) || null, [roles, value])
  const filteredRoles = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return roles
    return roles.filter(item => {
      const name = (item.name || '').toLowerCase()
      const desc = (item.description || '').toLowerCase()
      const id = (item.id || '').toLowerCase()
      return name.includes(keyword) || desc.includes(keyword) || id.includes(keyword)
    })
  }, [roles, query])

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>{selectedRole ? '已选择角色' : '当前未选择角色'}</small>
      </div>
      <label className="wide-field">
        <span>搜索角色</span>
        <input
          value={query}
          placeholder="输入角色名称快速筛选"
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div className="json-rows-list">
        {selectedRole ? (
          <article className="json-row-card">
            <div className="json-row-card-head">
              <span>当前已选角色</span>
            </div>
            <div className="json-row-fields">
              <label>
                <span>角色名称</span>
                <input value={selectedRole.name} readOnly />
              </label>
              <label>
                <span>角色说明</span>
                <input value={selectedRole.description || '-'} readOnly />
              </label>
            </div>
          </article>
        ) : (
          <div className="json-empty">请选择角色。</div>
        )}
      </div>
      <div className="archive-multi-select-list">
        {filteredRoles.map(role => (
          <label key={role.id} className="check-row archive-multi-select-item">
            <input
              type="radio"
              name={`role-binding-${label}`}
              checked={value === role.id}
              onChange={() => onChange(role.id)}
            />
            <span>{role.name}</span>
            <small>{role.description || role.id}</small>
          </label>
        ))}
      </div>
      {!filteredRoles.length && <p className="form-hint">没有匹配的角色，换个关键词试试。</p>}
    </div>
  )
}

export function OptionCardSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string; hint?: string }>
  onChange: (value: string) => void
}) {
  const selected = options.find(item => item.value === value) || null
  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>{selected ? `当前：${selected.label}` : '当前未选择'}</small>
      </div>
      <div className="archive-multi-select-list">
        {options.map(option => (
          <label key={option.value} className="check-row archive-multi-select-item">
            <input
              type="radio"
              name={`option-card-${label}`}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
            <small>{option.hint || option.value}</small>
          </label>
        ))}
      </div>
    </div>
  )
}

export function PublishPositionField({
  values,
  onChange,
}: {
  values: PublishPositions
  onChange: (patch: Partial<PublishPositions>) => void
}) {
  const options: Array<{ key: keyof PublishPositions; label: string; hint: string }> = [
    { key: 'map', label: '进入地图', hint: '在地图主界面作为点位或入口展示' },
    { key: 'list', label: '进入内容列表', hint: '出现在公开内容列表或聚合列表中' },
    { key: 'home', label: '首页推荐', hint: '作为首页重点内容展示' },
    { key: 'topic', label: '专题页', hint: '纳入专题或主题聚合页面' },
    { key: 'guide', label: '移动端导览', hint: '在手机导览或讲解路线中可见' },
  ]
  const selectedCount = options.filter(item => values[item.key]).length

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>发布位置</span>
        <small>已选择 {selectedCount} 个位置</small>
      </div>
      <div className="archive-multi-select-list">
        {options.map(option => (
          <label key={option.key} className="check-row archive-multi-select-item">
            <input
              type="checkbox"
              checked={Boolean(values[option.key])}
              onChange={event => onChange({ [option.key]: event.target.checked })}
            />
            <span>{option.label}</span>
            <small>{option.hint}</small>
          </label>
        ))}
      </div>
      <p className="form-hint">至少建议选择一个发布位置；是否进入首页、专题或导览，可由超级管理员按展示策略决定。</p>
    </div>
  )
}

export function ArchiveMultiSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: ManagedContent[]
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const selectedIds = useMemo(() => parseStringArrayJson(value), [value])
  const optionMap = useMemo(() => new Map(options.map(item => [item.id, item])), [options])
  const selectedItems = useMemo(
    () => selectedIds.map(id => optionMap.get(id)).filter((item): item is ManagedContent => Boolean(item)),
    [optionMap, selectedIds],
  )
  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return options
    return options.filter(item => {
      const title = (item.title || '').toLowerCase()
      const region = (item.regionName || '').toLowerCase()
      const status = contentStatusLabel(item.status).toLowerCase()
      return title.includes(keyword) || region.includes(keyword) || status.includes(keyword)
    })
  }, [options, query])

  const toggle = (id: string, checked: boolean) => {
    const next = checked ? Array.from(new Set([...selectedIds, id])) : selectedIds.filter(item => item !== id)
    onChange(next.join('\n'))
  }

  const moveSelected = (id: string, direction: -1 | 1) => {
    const index = selectedIds.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= selectedIds.length) return
    const next = [...selectedIds]
    const [picked] = next.splice(index, 1)
    next.splice(target, 0, picked)
    onChange(next.join('\n'))
  }

  const removeSelected = (id: string) => {
    onChange(selectedIds.filter(item => item !== id).join('\n'))
  }

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>已选择 {selectedIds.length} 个点位</small>
      </div>
      <label className="wide-field">
        <span>搜索点位</span>
        <input
          value={query}
          placeholder="输入点位名称或地区快速筛选"
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div className="json-rows-list">
        {selectedItems.length ? selectedItems.map((item, index) => (
          <article key={item.id} className="json-row-card">
            <div className="json-row-card-head">
              <span>第 {index + 1} 站</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" disabled={index === 0} onClick={() => moveSelected(item.id, -1)}>上移</button>
                <button type="button" className="secondary" disabled={index === selectedItems.length - 1} onClick={() => moveSelected(item.id, 1)}>下移</button>
                <button type="button" className="secondary" onClick={() => removeSelected(item.id)}>移除</button>
              </div>
            </div>
            <div className="json-row-fields">
              <label>
                <span>点位名称</span>
                <input value={item.title} readOnly />
              </label>
              <label>
                <span>状态</span>
                <input value={contentStatusLabel(item.status)} readOnly />
              </label>
            </div>
          </article>
        )) : (
          <div className="json-empty">尚未选择路线点位，请先在下方勾选要纳入路线的已发布点位。</div>
        )}
      </div>
      <div className="archive-multi-select-list">
        {filteredOptions.map(item => (
          <label key={item.id} className="check-row archive-multi-select-item">
            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={event => toggle(item.id, event.target.checked)} />
            <span>{item.title}</span>
            <small>{contentStatusLabel(item.status)}</small>
          </label>
        ))}
      </div>
      {!filteredOptions.length && <p className="form-hint">没有匹配的点位，换个关键词试试。</p>}
      <p className="form-hint">先勾选路线点位，再在上方“已选择”列表里调整顺序。系统会按上方顺序生成路线。</p>
    </div>
  )
}

export function HelpArticleBindingSelect({
  value,
  articles,
  onChange,
}: {
  value: string
  articles: HelpArticle[]
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const selected = articles.find(item => item.pageKey === value) || null
  const filtered = articles.filter(item => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return true
    return item.title.toLowerCase().includes(keyword) || item.pageKey.toLowerCase().includes(keyword) || item.summary.toLowerCase().includes(keyword)
  })

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>帮助页面</span>
        <small>{selected ? `当前：${selected.title}` : '当前未选择页面'}</small>
      </div>
      <label className="wide-field">
        <span>搜索页面</span>
        <input value={query} placeholder="输入页面名称快速筛选" onChange={event => setQuery(event.target.value)} />
      </label>
      <div className="json-rows-list">
        {selected ? (
          <article className="json-row-card">
            <div className="json-row-card-head">
              <span>当前编辑页面</span>
            </div>
            <div className="json-row-fields">
              <label>
                <span>页面标题</span>
                <input value={selected.title} readOnly />
              </label>
            </div>
          </article>
        ) : (
          <div className="json-empty">请选择一个帮助页面。</div>
        )}
      </div>
      <div className="archive-multi-select-list">
        {filtered.map(item => (
          <label key={item.pageKey} className="check-row archive-multi-select-item">
            <input type="radio" name="help-article-binding" checked={value === item.pageKey} onChange={() => onChange(item.pageKey)} />
            <span>{item.title}</span>
            <small>{item.summary || '维护这一页的帮助说明'}</small>
          </label>
        ))}
      </div>
      {!filtered.length && <p className="form-hint">没有匹配页面，换个关键词试试。</p>}
    </div>
  )
}

export function ProviderBindingSelect({
  value,
  providers,
  onChange,
}: {
  value: string
  providers: AiProvider[]
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const selected = providers.find(item => item.id === value) || null
  const filtered = providers.filter(item => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return true
    return item.name.toLowerCase().includes(keyword) || (item.defaultModel || '').toLowerCase().includes(keyword) || (item.baseUrl || '').toLowerCase().includes(keyword)
  })

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>供应商</span>
        <small>{selected ? `当前：${selected.name}` : '稍后选择 / 人工补录'}</small>
      </div>
      <label className="wide-field">
        <span>搜索供应商</span>
        <input value={query} placeholder="输入供应商名称、模型或地址快速筛选" onChange={event => setQuery(event.target.value)} />
      </label>
      <div className="archive-multi-select-list">
        <label className="check-row archive-multi-select-item">
          <input type="radio" name="provider-binding" checked={value === ''} onChange={() => onChange('')} />
          <span>稍后选择 / 人工补录</span>
          <small>先创建任务，结果后补或人工补录</small>
        </label>
        {filtered.map(item => (
          <label key={item.id} className="check-row archive-multi-select-item">
            <input type="radio" name="provider-binding" checked={value === item.id} onChange={() => onChange(item.id)} />
            <span>{item.name}</span>
            <small>{item.defaultModel ? `默认模型：${item.defaultModel}` : aiProviderTypeLabel(item.providerType)}</small>
          </label>
        ))}
      </div>
      {!filtered.length && <p className="form-hint">没有匹配的供应商，换个关键词试试。</p>}
    </div>
  )
}

export function ContentBindingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: ManagedContent[]
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const selected = options.find(item => item.id === value) || null
  const filtered = options.filter(item => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return true
    return item.title.toLowerCase().includes(keyword)
      || item.moduleName.toLowerCase().includes(keyword)
      || contentStatusLabel(item.status).toLowerCase().includes(keyword)
  })

  return (
    <div className="wide-field archive-multi-select">
      <div className="archive-multi-select-head">
        <span>{label}</span>
        <small>{selected ? `当前：${selected.title}` : '当前未选择内容'}</small>
      </div>
      <label className="wide-field">
        <span>搜索内容</span>
        <input value={query} placeholder="输入标题、内容类型或状态快速筛选" onChange={event => setQuery(event.target.value)} />
      </label>
      <div className="json-rows-list">
        {selected ? (
          <article className="json-row-card">
            <div className="json-row-card-head">
              <span>当前已关联内容</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" onClick={() => onChange('')}>清空</button>
              </div>
            </div>
            <div className="json-row-fields">
              <label>
                <span>内容标题</span>
                <input value={selected.title} readOnly />
              </label>
              <label>
                <span>内容类型 / 状态</span>
                <input value={`${selected.moduleName} / ${contentStatusLabel(selected.status)}`} readOnly />
              </label>
            </div>
          </article>
        ) : (
          <div className="json-empty">请选择要关联的内容。</div>
        )}
      </div>
      <div className="archive-multi-select-list">
        {filtered.map(item => (
          <label key={item.id} className="check-row archive-multi-select-item">
            <input type="radio" name={`content-binding-${label}`} checked={value === item.id} onChange={() => onChange(item.id)} />
            <span>{item.title}</span>
            <small>{item.moduleName} / {contentStatusLabel(item.status)}</small>
          </label>
        ))}
      </div>
      {!filtered.length && <p className="form-hint">没有匹配内容，换个关键词试试。</p>}
    </div>
  )
}

export function buildRegionTreeRows(regions: Region[]) {
  const children = new Map<string, Region[]>()
  const roots: Region[] = []
  for (const region of regions) {
    const key = region.parentId || ''
    if (!children.has(key)) children.set(key, [])
    children.get(key)?.push(region)
  }
  for (const region of regions) {
    if (!region.parentId || !regions.some(item => item.id === region.parentId)) roots.push(region)
  }
  const sortRegions = (items: Region[]) => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'zh-CN'))
  const rows: Array<{ region: Region; depth: number }> = []
  const visit = (items: Region[], depth: number) => {
    for (const region of sortRegions(items)) {
      rows.push({ region, depth })
      visit(children.get(region.id) || [], depth + 1)
    }
  }
  visit(roots, 0)
  return rows
}

