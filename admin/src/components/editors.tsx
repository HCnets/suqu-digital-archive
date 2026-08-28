/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import {  useState } from 'react'
import type {  MediaPickerType, AiTask, AiResultDraft, JsonRowField, JsonRow, SensitiveSegmentRow, Api } from '../types'
import {  SENSITIVE_SEGMENT_LEVEL_OPTIONS } from '../constants'
import {  parseStringArrayJson, parseNumberArrayJson, parseSensitiveSegmentRows, serializeSensitiveSegmentRows, stringifyJsonFieldValue } from '../utils'
import { MediaPickerField } from './media'
import { InlineChoiceField } from './fields'

export function parseAiJsonObject(text: string) {
  if (!text.trim()) return {}
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

export function parseAiResultDraft(text: string): AiResultDraft {
  const source = parseAiJsonObject(text)
  return {
    mediaUrl: typeof source.mediaUrl === 'string' ? source.mediaUrl : typeof source.media_url === 'string' ? source.media_url : '',
    mimeType: typeof source.mimeType === 'string' ? source.mimeType : typeof source.mime_type === 'string' ? source.mime_type : '',
    durationSeconds: source.durationSeconds === undefined || source.durationSeconds === null
      ? (source.duration_seconds === undefined || source.duration_seconds === null ? '' : String(source.duration_seconds))
      : String(source.durationSeconds),
    transcriptFileUrl: typeof source.transcriptFileUrl === 'string' ? source.transcriptFileUrl : typeof source.transcript_file_url === 'string' ? source.transcript_file_url : '',
    subtitleFileUrl: typeof source.subtitleFileUrl === 'string' ? source.subtitleFileUrl : typeof source.subtitle_file_url === 'string' ? source.subtitle_file_url : '',
    coverImageUrl: typeof source.coverImageUrl === 'string' ? source.coverImageUrl : typeof source.cover_image_url === 'string' ? source.cover_image_url : '',
  }
}

export function stringifyAiResultDraft(draft: AiResultDraft, rawText = '') {
  const base = parseAiJsonObject(rawText)
  const next: Record<string, unknown> = { ...base }
  const setOrDelete = (key: string, value: string, transform?: (input: string) => unknown) => {
    if (value.trim()) next[key] = transform ? transform(value.trim()) : value.trim()
    else delete next[key]
  }
  setOrDelete('mediaUrl', draft.mediaUrl)
  setOrDelete('mimeType', draft.mimeType)
  setOrDelete('durationSeconds', draft.durationSeconds, input => Number(input))
  setOrDelete('transcriptFileUrl', draft.transcriptFileUrl)
  setOrDelete('subtitleFileUrl', draft.subtitleFileUrl)
  setOrDelete('coverImageUrl', draft.coverImageUrl)
  return Object.keys(next).length ? JSON.stringify(next, null, 2) : ''
}

export function AiResultJsonEditor({
  task,
  value,
  onChange,
}: {
  task: AiTask
  value: string
  onChange: (value: string) => void
}) {
  const draft = parseAiResultDraft(value)
  const updateDraft = (patch: Partial<AiResultDraft>) => {
    const nextDraft = { ...draft, ...patch }
    onChange(stringifyAiResultDraft(nextDraft, value))
  }
  const showTranscriptFields = task.taskType === 'transcription'
  const showMediaFields = ['tts_audio', 'digital_human_video', 'transcription'].includes(task.taskType)
  const showCoverField = task.taskType === 'digital_human_video'

  return (
    <div className="ai-result-editor">
      {showMediaFields && (
        <>
          <input
            className="ai-inline-input"
            value={draft.mediaUrl}
            placeholder={task.taskType === 'transcription' ? '成品文件地址（可选）' : '成品文件地址'}
            onChange={event => updateDraft({ mediaUrl: event.target.value })}
          />
          <input
            className="ai-inline-input"
            value={draft.mimeType}
            placeholder="文件格式说明，例如 MP3 音频"
            onChange={event => updateDraft({ mimeType: event.target.value })}
          />
          <input
            className="ai-inline-input"
            type="number"
            value={draft.durationSeconds}
            placeholder="时长（秒）"
            onChange={event => updateDraft({ durationSeconds: event.target.value })}
          />
        </>
      )}
      {showTranscriptFields && (
        <>
          <input
            className="ai-inline-input"
            value={draft.transcriptFileUrl}
            placeholder="转写文稿地址，例如 /uploads/transcript.txt"
            onChange={event => updateDraft({ transcriptFileUrl: event.target.value })}
          />
          <input
            className="ai-inline-input"
            value={draft.subtitleFileUrl}
            placeholder="字幕文件地址，例如 /uploads/subtitle.srt"
            onChange={event => updateDraft({ subtitleFileUrl: event.target.value })}
          />
        </>
      )}
      {showCoverField && (
        <input
          className="ai-inline-input"
          value={draft.coverImageUrl}
          placeholder="封面图地址"
          onChange={event => updateDraft({ coverImageUrl: event.target.value })}
        />
      )}
      <details className="json-raw-details ai-inline-json-details">
        <summary>其他补充记录（运维人员）</summary>
        <textarea
          value={value}
          placeholder="一般不用填写。仅在运维人员需要保留额外补充项时使用。"
          onChange={event => onChange(event.target.value)}
        />
      </details>
    </div>
  )
}

export function StringArrayEditor({
  title,
  hint,
  value,
  onChange,
  api,
  canUseLibrary,
  mediaTypes,
  pickerTitle,
  placeholder = '',
  itemLabel = '内容',
}: {
  title: string
  hint?: string
  value: string
  onChange: (value: string) => void
  api?: Api
  canUseLibrary?: boolean
  mediaTypes?: MediaPickerType[]
  pickerTitle?: string
  placeholder?: string
  itemLabel?: string
}) {
  const items = parseStringArrayJson(value)
  const emit = (nextItems: string[]) => onChange(JSON.stringify(nextItems.filter(Boolean), null, 2))
  const updateItem = (index: number, nextValue: string) => emit(items.map((item, itemIndex) => itemIndex === index ? nextValue : item))
  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [picked] = next.splice(index, 1)
    next.splice(target, 0, picked)
    emit(next)
  }
  const removeItem = (index: number) => emit(items.filter((_, itemIndex) => itemIndex !== index))

  return (
    <section className="wide-field json-rows-editor">
      <div className="json-rows-head">
        <div>
          <strong>{title}</strong>
          {hint && <p>{hint}</p>}
        </div>
        <button type="button" className="secondary" onClick={() => emit([...items, ''])}>新增一项</button>
      </div>
      <div className="json-rows-list">
        {items.length ? items.map((item, index) => (
          <article key={`${item}-${index}`} className="json-row-card">
            <div className="json-row-card-head">
              <span>第 {index + 1} 项</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" disabled={index === 0} onClick={() => moveItem(index, -1)}>上移</button>
                <button type="button" className="secondary" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>下移</button>
                <button type="button" className="secondary" onClick={() => removeItem(index)}>删除</button>
              </div>
            </div>
            {api && mediaTypes?.length ? (
              <MediaPickerField
                api={api}
                label="素材地址"
                value={item}
                onChange={nextValue => updateItem(index, nextValue)}
                mediaTypes={mediaTypes}
                canUseLibrary={Boolean(canUseLibrary)}
                pickerTitle={pickerTitle || title}
              />
            ) : (
              <label>
                <span>{itemLabel}</span>
                <input value={item} placeholder={placeholder} onChange={event => updateItem(index, event.target.value)} />
              </label>
            )}
          </article>
        )) : (
          <div className="json-empty">暂无条目，点击右上角新增。</div>
        )}
      </div>
      <details className="json-raw-details">
        <summary>补充明细（仅管理员）</summary>
        <textarea value={value} onChange={event => onChange(event.target.value)} />
      </details>
    </section>
  )
}

export function NumberArrayEditor({
  title,
  hint,
  value,
  onChange,
  placeholder = '',
  itemLabel = '数值',
}: {
  title: string
  hint?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  itemLabel?: string
}) {
  const items = parseNumberArrayJson(value)
  const emit = (nextItems: number[]) => onChange(JSON.stringify(nextItems.filter(item => Number.isFinite(item)), null, 2))
  const updateItem = (index: number, nextValue: string) => {
    const parsed = Number(nextValue)
    emit(items.map((item, itemIndex) => itemIndex === index ? (Number.isFinite(parsed) ? parsed : item) : item))
  }
  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [picked] = next.splice(index, 1)
    next.splice(target, 0, picked)
    emit(next)
  }
  const removeItem = (index: number) => emit(items.filter((_, itemIndex) => itemIndex !== index))

  return (
    <section className="wide-field json-rows-editor">
      <div className="json-rows-head">
        <div>
          <strong>{title}</strong>
          {hint && <p>{hint}</p>}
        </div>
        <button type="button" className="secondary" onClick={() => emit([...items, new Date().getFullYear()])}>新增一项</button>
      </div>
      <div className="json-rows-list">
        {items.length ? items.map((item, index) => (
          <article key={`${item}-${index}`} className="json-row-card">
            <div className="json-row-card-head">
              <span>第 {index + 1} 项</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" disabled={index === 0} onClick={() => moveItem(index, -1)}>上移</button>
                <button type="button" className="secondary" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>下移</button>
                <button type="button" className="secondary" onClick={() => removeItem(index)}>删除</button>
              </div>
            </div>
            <label>
              <span>{itemLabel}</span>
              <input
                type="number"
                value={item}
                placeholder={placeholder}
                onChange={event => updateItem(index, event.target.value)}
              />
            </label>
          </article>
        )) : (
          <div className="json-empty">暂无条目，点击右上角新增。</div>
        )}
      </div>
      <details className="json-raw-details">
        <summary>补充明细（仅管理员）</summary>
        <textarea value={value} onChange={event => onChange(event.target.value)} />
      </details>
    </section>
  )
}

export function SensitiveSegmentsEditor({
  title,
  hint,
  value,
  onChange,
}: {
  title: string
  hint?: string
  value: string
  onChange: (value: string) => void
}) {
  const rows = parseSensitiveSegmentRows(value)
  const emitRows = (nextRows: SensitiveSegmentRow[]) => onChange(serializeSensitiveSegmentRows(nextRows))
  const updateRow = (index: number, patch: Partial<SensitiveSegmentRow>) => {
    emitRows(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }
  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    const nextRows = [...rows]
    const [item] = nextRows.splice(index, 1)
    nextRows.splice(target, 0, item)
    emitRows(nextRows)
  }
  const removeRow = (index: number) => emitRows(rows.filter((_, rowIndex) => rowIndex !== index))

  return (
    <section className="wide-field json-rows-editor sensitive-segments-editor">
      <div className="json-rows-head">
        <div>
          <strong>{title}</strong>
          {hint && <p>{hint}</p>}
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => emitRows([...rows, { start: '00:00', end: '00:00', level: '待分级', text: '', action: '' }])}
        >
          新增片段
        </button>
      </div>
      <div className="json-rows-list">
        {rows.length ? rows.map((row, index) => (
          <article key={index} className="json-row-card">
            <div className="json-row-card-head">
              <span>第 {index + 1} 段</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" disabled={index === 0} onClick={() => moveRow(index, -1)}>上移</button>
                <button type="button" className="secondary" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)}>下移</button>
                <button type="button" className="secondary" onClick={() => removeRow(index)}>删除</button>
              </div>
            </div>
            <div className="json-row-fields sensitive-segment-fields">
              <label>
                <span>开始时间</span>
                <input value={row.start} placeholder="00:00" onChange={event => updateRow(index, { start: event.target.value })} />
              </label>
              <label>
                <span>结束时间</span>
                <input value={row.end} placeholder="00:12" onChange={event => updateRow(index, { end: event.target.value })} />
              </label>
              <div className="wide-field">
                <span>风险等级</span>
                <InlineChoiceField
                  value={row.level}
                  options={SENSITIVE_SEGMENT_LEVEL_OPTIONS}
                  onChange={level => updateRow(index, { level })}
                />
              </div>
              <label>
                <span>原文或摘要</span>
                  <textarea
                    value={row.text}
                    placeholder="片段摘要或说明"
                    onChange={event => updateRow(index, { text: event.target.value })}
                  />
              </label>
              <label>
                <span>公开处理方式</span>
                <textarea
                  value={row.action}
                  placeholder="删除、改写、仅内部留存等"
                  onChange={event => updateRow(index, { action: event.target.value })}
                />
              </label>
            </div>
          </article>
        )) : (
          <div className="json-empty">暂无敏感片段。</div>
        )}
      </div>
      <details className="json-raw-details">
        <summary>旧版文本（仅管理员）</summary>
        <textarea value={value} onChange={event => onChange(event.target.value)} />
      </details>
    </section>
  )
}

export function JsonRowsEditor({
  title,
  hint,
  value,
  onChange,
  newItem,
  fields,
  api,
  canUseLibrary = false,
}: {
  title: string
  hint?: string
  value: string
  onChange: (value: string) => void
  newItem: JsonRow
  fields: JsonRowField[]
  api?: Api
  canUseLibrary?: boolean
}) {
  const { rows, error } = parseJsonRows(value)
  const [showRawJson, setShowRawJson] = useState(false)
  const emitRows = (nextRows: JsonRow[]) => onChange(JSON.stringify(nextRows, null, 2))
  const updateRow = (index: number, key: string, nextValue: unknown) => {
    emitRows(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: nextValue } : row))
  }
  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    const nextRows = [...rows]
    const [item] = nextRows.splice(index, 1)
    nextRows.splice(target, 0, item)
    emitRows(nextRows)
  }
  const removeRow = (index: number) => emitRows(rows.filter((_, rowIndex) => rowIndex !== index))

  return (
    <section className="wide-field json-rows-editor">
      <div className="json-rows-head">
        <div>
          <strong>{title}</strong>
          {hint && <p>{hint}</p>}
        </div>
        <div className="json-row-head-actions">
          <button type="button" className="secondary" onClick={() => setShowRawJson(current => !current)}>
            {showRawJson ? '收起补充明细' : '显示补充明细'}
          </button>
          <button type="button" className="secondary" onClick={() => emitRows([...rows, { ...newItem }])}>新增一项</button>
        </div>
      </div>
      {error && <div className="json-rows-error">{error}</div>}
      <div className="json-rows-list">
        {rows.length ? rows.map((row, index) => (
          <article key={index} className="json-row-card">
            <div className="json-row-card-head">
              <span>第 {index + 1} 项</span>
              <div className="json-row-actions">
                <button type="button" className="secondary" disabled={index === 0} onClick={() => moveRow(index, -1)}>上移</button>
                <button type="button" className="secondary" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)}>下移</button>
                <button type="button" className="secondary" onClick={() => removeRow(index)}>删除</button>
              </div>
            </div>
            <div className="json-row-fields">
              {fields.map(field => (
                <JsonRowFieldControl
                  key={field.key}
                  field={field}
                  value={row[field.key]}
                  onChange={nextValue => updateRow(index, field.key, nextValue)}
                  api={api}
                  canUseLibrary={canUseLibrary}
                />
              ))}
            </div>
          </article>
        )) : (
          <div className="json-empty">暂无条目，点击右上角新增。</div>
        )}
      </div>
      {(error || showRawJson) && (
        <details className="json-raw-details" open={Boolean(error) || showRawJson}>
          <summary>补充明细（仅管理员）</summary>
          <textarea value={value} onChange={event => onChange(event.target.value)} />
        </details>
      )}
    </section>
  )
}

export function JsonRowFieldControl({
  field,
  value,
  onChange,
  api,
  canUseLibrary = false,
}: {
  field: JsonRowField
  value: unknown
  onChange: (value: unknown) => void
  api?: Api
  canUseLibrary?: boolean
}) {
  if (field.type === 'checkbox') {
    return (
      <label className="check-row json-check-row">
        <input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} />
        <span>{field.label}</span>
      </label>
    )
  }
  if (field.type === 'textarea') {
    return (
      <label>
        <span>{field.label}</span>
        <textarea value={stringifyJsonFieldValue(value)} placeholder={field.placeholder || ''} onChange={event => onChange(event.target.value)} />
      </label>
    )
  }
  if (field.type === 'lines') {
    return (
      <label>
        <span>{field.label}</span>
        <textarea
          value={Array.isArray(value) ? value.map(item => String(item ?? '')).join('\n') : stringifyJsonFieldValue(value)}
          placeholder={field.placeholder || ''}
          onChange={event => onChange(event.target.value.split(/\r?\n/).map(item => item.trim()).filter(Boolean))}
        />
      </label>
    )
  }
  if (field.type === 'number') {
    return (
      <label>
        <span>{field.label}</span>
        <input
          type="number"
          value={value === undefined || value === null ? '' : String(value)}
          placeholder={field.placeholder || ''}
          onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        />
      </label>
    )
  }
  if (field.type === 'select') {
    return (
      <div className="wide-field">
        <span>{field.label}</span>
        <InlineChoiceField
          value={stringifyJsonFieldValue(value)}
          options={[
            { value: '', label: field.placeholder || '未选择', hint: '当前还没有选择该项。' },
            ...((field.options || []).map(option => ({
              value: option.value,
              label: option.label,
            }))),
          ]}
          onChange={nextValue => onChange(nextValue)}
        />
      </div>
    )
  }
  if (field.type === 'media') {
    return api ? (
      <MediaPickerField
        api={api}
        label={field.label}
        value={stringifyJsonFieldValue(value)}
        onChange={nextValue => onChange(nextValue)}
        mediaTypes={field.mediaTypes || ['image']}
        canUseLibrary={canUseLibrary}
        pickerTitle={field.pickerTitle || field.label}
      />
    ) : (
      <label>
        <span>{field.label}</span>
        <input value={stringifyJsonFieldValue(value)} placeholder={field.placeholder || ''} onChange={event => onChange(event.target.value)} />
      </label>
    )
  }
  return (
    <label>
      <span>{field.label}</span>
      <input value={stringifyJsonFieldValue(value)} placeholder={field.placeholder || ''} onChange={event => onChange(event.target.value)} />
    </label>
  )
}

export function parseJsonRows(value: string): { rows: JsonRow[]; error: string } {
  if (!value.trim()) return { rows: [], error: '' }
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return { rows: [], error: '当前补充明细格式不正确，请检查后继续编辑。' }
    return {
      rows: parsed.map(item => item && typeof item === 'object' && !Array.isArray(item) ? item as JsonRow : { value: item }),
      error: '',
    }
  } catch {
    return { rows: [], error: '补充明细无法读取，请修正后继续编辑。' }
  }
}

