/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import {  COMMON_COLOR_PRESETS } from '../constants'
import {  formatDuration } from '../utils'
import type { PresetOption } from '../types'

export function CheckboxPillGroup({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string
  hint?: string
  options: Array<{ value: string; label: string }>
  value: string[]
  onChange: (value: string[]) => void
}) {
  const selected = new Set(value)
  return (
    <div className="choice-group wide-field">
      <div className="choice-group-head">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      <div className="choice-pill-grid">
        {options.map(option => (
          <label key={option.value} className={`choice-pill ${selected.has(option.value) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              onChange={event => {
                if (event.target.checked) onChange([...value, option.value])
                else onChange(value.filter(item => item !== option.value))
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function Input({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
    </label>
  )
}

export function DraftStatusNotice({ text }: { text: string }) {
  return <p className="draft-status-note" aria-live="polite">{text}</p>
}

export function PresetSelectField({
  label,
  value,
  options,
  onChange,
  allowCustom = true,
  customLabel = '自定义值',
}: {
  label: string
  value: string
  options: PresetOption[]
  onChange: (value: string) => void
  allowCustom?: boolean
  customLabel?: string
}) {
  const matched = options.some(item => item.value === value)
  return (
    <div className="preset-field">
      <span>{label}</span>
      <div className="preset-grid">
        {options.map(item => (
          <button
            key={item.value}
            type="button"
            className={`preset-option${value === item.value ? ' active' : ''}`}
            onClick={() => onChange(item.value)}
          >
            {item.preview && <strong>{item.preview}</strong>}
            <small>{item.label}</small>
          </button>
        ))}
      </div>
      {allowCustom && (
        <label className="preset-custom-input">
          <span>{customLabel}</span>
          <input value={matched ? '' : value} placeholder="需要特殊值时再填写" onChange={event => onChange(event.target.value)} />
        </label>
      )}
    </div>
  )
}

export function ChoiceChipField({
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
    <div className="preset-field">
      <span>{label}</span>
      <div className="preset-grid">
        {options.map(item => (
          <button
            key={item.value || '__empty__'}
            type="button"
            className={`preset-option${value === item.value ? ' active' : ''}`}
            onClick={() => onChange(item.value)}
            title={item.hint || item.label}
          >
            <strong>{item.label.slice(0, 1)}</strong>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <small className="form-hint">{selected?.hint || '请选择最符合当前操作目的的选项。'}</small>
    </div>
  )
}

export function InlineChoiceField({
  value,
  options,
  onChange,
}: {
  value: string
  options: Array<{ value: string; label: string; hint?: string }>
  onChange: (value: string) => void
}) {
  const selected = options.find(item => item.value === value) || null
  return (
    <div className="preset-field">
      <div className="preset-grid">
        {options.map(item => (
          <button
            key={item.value}
            type="button"
            className={`preset-option${value === item.value ? ' active' : ''}`}
            onClick={() => onChange(item.value)}
            title={item.hint || item.label}
          >
            <strong>{item.label.slice(0, 1)}</strong>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {selected?.hint && <small className="form-hint">{selected.hint}</small>}
    </div>
  )
}

export function QuickTemplateButtons({
  label,
  templates,
  onPick,
}: {
  label: string
  templates: string[]
  onPick: (value: string) => void
}) {
  return (
    <div className="preset-field">
      <span>{label}</span>
      <div className="preset-grid">
        {templates.map(template => (
          <button
            key={template}
            type="button"
            className="preset-option"
            onClick={() => onPick(template)}
            title={template}
          >
            <strong>{template.slice(0, 2)}</strong>
            <span>{template}</span>
          </button>
        ))}
      </div>
      <small className="form-hint">点击一条常用意见即可快速带入，再按实际情况补充修改。</small>
    </div>
  )
}

export function ReturnStepChoiceField({
  value,
  steps,
  onChange,
}: {
  value: string
  steps: Array<{ id: string; name: string }>
  onChange: (value: string) => void
}) {
  const options = [
    { value: '', label: '回到当前节点', hint: '保持在本节点继续补正后再提交' },
    ...steps.map(step => ({ value: step.id, label: `退回：${step.name}`, hint: `把内容退回到“${step.name}”节点重新处理` })),
  ]
  return <ChoiceChipField label="驳回后回退位置" value={value} options={options} onChange={onChange} />
}

export function ColorPresetField({
  label,
  value,
  options = COMMON_COLOR_PRESETS,
  onChange,
}: {
  label: string
  value: string
  options?: PresetOption[]
  onChange: (value: string) => void
}) {
  return (
    <div className="preset-field">
      <span>{label}</span>
      <div className="color-preset-grid">
        {options.map(item => (
          <button
            key={item.value}
            type="button"
            className={`color-preset-option${value === item.value ? ' active' : ''}`}
            onClick={() => onChange(item.value)}
          >
            <i style={{ backgroundColor: item.value }} aria-hidden="true" />
            <small>{item.label}</small>
          </button>
        ))}
      </div>
      <label className="preset-custom-input">
        <span>自定义颜色</span>
        <input value={value} placeholder="#C41E3A" onChange={event => onChange(event.target.value)} />
      </label>
    </div>
  )
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

