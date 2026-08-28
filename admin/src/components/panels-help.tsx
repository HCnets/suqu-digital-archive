/**
 * 后台通用组件（从 panels.tsx 拆分）
 */
import type { HelpArticle, SubmissionChecklistItem } from '../types'

export function HelpDrawer({
  article,
  open,
  onClose,
}: {
  article: HelpArticle
  open: boolean
  onClose: () => void
}) {
  return (
    <aside className={`help-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="help-drawer-head">
        <div>
          <h2>{article.title}</h2>
          <p>{article.summary}</p>
        </div>
        <button type="button" className="secondary" onClick={onClose}>关闭</button>
      </div>
      <ol className="help-steps">
        {article.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {article.videoUrl && (
        <div className="help-tips">
          <strong>教程资源</strong>
          <p><a href={article.videoUrl} target="_blank" rel="noreferrer">打开教程链接</a></p>
        </div>
      )}
      <div className="help-tips">
        <strong>当前阶段提示</strong>
        <p>{article.tips || '复杂补充内容会逐步改造成可拖拽、可预览、可选择的编辑器。日常录入优先使用卡片、上传和选择器完成。'}</p>
      </div>
    </aside>
  )
}

export function SubmissionChecklistCard({
  title,
  items,
}: {
  title: string
  items: SubmissionChecklistItem[]
}) {
  return (
    <div className="review-checklist-card submission-checklist-card">
      <h4>{title}</h4>
      <ul className="review-checklist">
        {items.map(item => (
          <li key={item.label} className={item.done ? 'done' : 'warn'}>
            {item.done ? `已完成：${item.label}` : `待补充：${item.label}`}
          </li>
        ))}
      </ul>
    </div>
  )
}
