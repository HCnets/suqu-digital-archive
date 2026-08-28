/**
 * 后台通用组件（从 panels.tsx 拆分）
 */
import type { ContentModule, PublishPositions } from '../types'
import { PUBLISH_POSITION_LABELS } from '../constants'

export function ContentModuleDefaultsPanel({
  modules,
  savingModuleKey,
  onChange,
  onSave,
}: {
  modules: ContentModule[]
  savingModuleKey: string
  onChange: (moduleKey: string, key: keyof PublishPositions, value: boolean) => void
  onSave: (module: ContentModule) => void
}) {
  return (
    <div className="module-defaults-panel">
      <div className="module-defaults-head">
        <div>
          <strong>内容类型默认发布位置</strong>
          <p>新建内容未单独指定时，后台按这里的默认值进入对应发布位置。</p>
        </div>
      </div>
      <div className="module-defaults-table">
        <table>
          <thead>
            <tr>
              <th>内容类型</th>
              {PUBLISH_POSITION_LABELS.map(item => <th key={item.key}>{item.label}</th>)}
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(module => (
              <tr key={module.key}>
                <td>
                  <strong>{module.name}</strong>
                  <span>{module.key}</span>
                </td>
                {PUBLISH_POSITION_LABELS.map(item => (
                  <td key={item.key}>
                    <input
                      type="checkbox"
                      checked={module.defaultPublishPositions[item.key]}
                      onChange={event => onChange(module.key, item.key, event.target.checked)}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    className="secondary"
                    disabled={savingModuleKey === module.key}
                    onClick={() => onSave(module)}
                  >
                    {savingModuleKey === module.key ? '保存中...' : '保存默认'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
