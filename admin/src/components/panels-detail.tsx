/**
 * 后台通用组件（从 panels.tsx 拆分）
 */
import type { Api, ManagedContent, Region, ReviewSignals } from '../types'
import { contentStatusLabel, formatStructuredData, formatTime, reviewStatusLabel, sensitiveLabel } from '../utils'
import { DRAFT_AUTOSAVE_OPTIONS } from '../constants'
import { DataTable } from './fields'
import { ArchiveContentEditPanel } from './panels-archive'
import { DRAFT_AUTOSAVE_STORAGE_KEY, readStoredEnum } from './panels-autosave'
import { OralHistoryContentEditPanel } from './panels-oral'

export function ContentDetailPanel({
  api,
  content,
  regions,
  archiveOptions,
  canUploadMedia,
  canEditContent,
  onClose,
  onUpdated,
  onRestore,
  onPurge,
}: {
  api: Api
  content: ManagedContent
  regions: Region[]
  archiveOptions: ManagedContent[]
  canUploadMedia: boolean
  canEditContent: boolean
  onClose: () => void
  onUpdated: (content: ManagedContent) => Promise<void> | void
  onRestore?: () => void
  onPurge?: () => void
}) {
  const versions = content.versions || []
  const sources = content.sources || []
  const reviewTasks = content.reviewTasks || []
  const currentVersion = content.currentVersion
  const publishedVersion = content.publishedVersion
  const versionDiff = content.versionDiff
  const reviewSignals = content.reviewSignals

  return (
    <div className="detail-panel">
      <div className="detail-head">
        <div>
          <h3>{content.title}</h3>
          <p>{content.moduleName} | {contentStatusLabel(content.status)} | {sensitiveLabel(content.sensitiveLevel)}</p>
        </div>
        <div className="actions-cell">
          {onRestore && <button className="secondary" onClick={onRestore}>恢复</button>}
          {onPurge && <button className="secondary" onClick={onPurge}>永久删除</button>}
          <button className="secondary" onClick={onClose}>关闭</button>
        </div>
      </div>

      <ReviewSignalsPanel signals={reviewSignals} />

      <div className="detail-grid">
        <section>
          <h4>当前版本</h4>
          {currentVersion ? (
            <>
              <dl className="detail-list">
                <dt>所属地区</dt><dd>{content.regionName || content.regionId || '-'}</dd>
                <dt>版本号</dt><dd>v{currentVersion.versionNumber}</dd>
                <dt>标题</dt><dd>{currentVersion.title}</dd>
                <dt>摘要</dt><dd>{currentVersion.summary || '-'}</dd>
                <dt>创建时间</dt><dd>{currentVersion.createdAt ? formatTime(currentVersion.createdAt) : '-'}</dd>
              </dl>
              <pre className="detail-pre">{currentVersion.body || '暂无正文'}</pre>
              <h4>补充信息</h4>
              <pre className="detail-pre">{formatStructuredData(currentVersion.data)}</pre>
            </>
          ) : <p className="muted-line">暂无当前版本</p>}
        </section>

        <section>
          <h4>发布版本</h4>
          {publishedVersion ? (
            <>
              <dl className="detail-list">
                <dt>版本号</dt><dd>v{publishedVersion.versionNumber}</dd>
                <dt>标题</dt><dd>{publishedVersion.title}</dd>
                <dt>发布时间</dt><dd>{content.publishedAt ? formatTime(content.publishedAt) : '-'}</dd>
              </dl>
            </>
          ) : <p className="muted-line">尚未发布</p>}
          <div className="review-checklist-card">
            <h4>审稿清单</h4>
            <ul className="review-checklist">
              <li className={sources.length ? 'done' : 'warn'}>
                {sources.length ? `已附 ${sources.length} 条来源依据` : '缺少来源依据，建议先补齐后再审核'}
              </li>
              <li className={versionDiff?.baseVersionNumber ? 'done' : 'info'}>
                {versionDiff?.baseVersionNumber ? '已生成版本差异，可逐项对照修改内容' : '当前暂无可比版本差异'}
              </li>
              <li className={reviewSignals?.items?.length ? 'warn' : 'done'}>
                {reviewSignals?.items?.length ? `存在 ${reviewSignals.items.length} 条风险信号，请逐项确认` : '当前未发现额外风险信号'}
              </li>
              <li className={reviewTasks.length ? 'done' : 'info'}>
                {reviewTasks.length ? `已有 ${reviewTasks.length} 条审核记录，可回看处理历史` : '当前暂无历史审核记录'}
              </li>
              <li className={content.status === 'pending_review' ? 'warn' : 'done'}>
                {content.status === 'pending_review' ? '当前内容正在待审流转中，处理后会进入下一节点或发布' : '当前内容不在待审核状态'}
              </li>
            </ul>
          </div>
        </section>
      </div>

      <section className="detail-section">
        <h4>版本差异</h4>
        {versionDiff?.baseVersionNumber ? (
          <div className="version-diff-box">
            <p className="muted-line">
              对比基准：{versionDiff.baseType === 'published' ? '已发布版本' : '上一版本'} v{versionDiff.baseVersionNumber}
              {' '}→ 当前版本 v{versionDiff.compareVersionNumber || '-'}
            </p>
            {versionDiff.hasChanges ? (
              <div className="version-diff-list">
                {versionDiff.fields.map(field => (
                  <article className="version-diff-item" key={field.key}>
                    <h5>{field.label}</h5>
                    <div className="version-diff-columns">
                      <pre>{field.before || '空'}</pre>
                      <pre>{field.after || '空'}</pre>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="muted-line">当前版本与对比版本没有差异。</p>}
          </div>
        ) : <p className="muted-line">暂无可对比版本；首次创建内容会在后续版本中显示差异。</p>}
      </section>

      {canEditContent && content.moduleKey === 'archive' && currentVersion && content.status !== 'deleted' && (
        <ArchiveContentEditPanel
          api={api}
          content={content}
          version={currentVersion}
          regions={regions}
          canUploadMedia={canUploadMedia}
          draftAutoSaveFrequency={readStoredEnum(DRAFT_AUTOSAVE_STORAGE_KEY, DRAFT_AUTOSAVE_OPTIONS.map(item => item.value), '15s')}
          onUpdated={onUpdated}
        />
      )}

      {canEditContent && content.moduleKey === 'oral_history' && currentVersion && content.status !== 'deleted' && (
        <OralHistoryContentEditPanel
          api={api}
          content={content}
          version={currentVersion}
          regions={regions}
          archiveOptions={archiveOptions}
          canUploadMedia={canUploadMedia}
          draftAutoSaveFrequency={readStoredEnum(DRAFT_AUTOSAVE_STORAGE_KEY, DRAFT_AUTOSAVE_OPTIONS.map(item => item.value), '15s')}
          onUpdated={onUpdated}
        />
      )}

      <section className="detail-section">
        <h4>来源证据</h4>
        {sources.length ? (
          <div className="source-list">
            {sources.map(source => (
              <article key={source.id} className="source-item">
                <strong>{source.sourceTitle || '未命名来源'}</strong>
                <span>{source.sourceType || '未分类'} · 可信度 {source.trustLevel || '-'}</span>
                <p>{[
                  source.archiveRef && `档案编号：${source.archiveRef}`,
                  source.pageRef && `页码：${source.pageRef}`,
                  source.collector && `采集人：${source.collector}`,
                  source.collectedAt && `采集时间：${source.collectedAt}`,
                ].filter(Boolean).join('；') || '暂无来源细节'}</p>
                {source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">打开来源链接</a>}
                {source.notes && <p>{source.notes}</p>}
              </article>
            ))}
          </div>
        ) : <p className="muted-line">暂无来源证据</p>}
      </section>

      <section className="detail-section">
        <h4>版本记录</h4>
        <DataTable
          columns={['版本', '标题', '创建人', '创建时间']}
          rows={versions.map(version => [
            `v${version.versionNumber}`,
            version.title,
            version.createdBy || '-',
            version.createdAt ? formatTime(version.createdAt) : '-',
          ])}
        />
      </section>

      <section className="detail-section">
        <h4>审核记录</h4>
        <DataTable
          columns={['节点', '角色', '状态', '审核人', '意见', '创建时间', '处理时间']}
          rows={reviewTasks.map(task => [
            task.stepName || '-',
            task.assigneeRoleName || '-',
            reviewStatusLabel(task.status),
            task.reviewerUsername || '-',
            task.comment || '-',
            formatTime(task.createdAt),
            task.reviewedAt ? formatTime(task.reviewedAt) : '-',
          ])}
        />
      </section>
    </div>
  )
}

export function ReviewSignalsPanel({ signals }: { signals?: ReviewSignals }) {
  const items = signals?.items || []
  if (!signals || (!items.length && signals.sensitiveLevel === 'normal' && !signals.aiUsed)) {
    return (
      <section className="review-signals-panel calm">
        <div>
          <h4>审核风险信号</h4>
          <p>当前内容未标记 AI 待审、敏感片段或额外风险标签。</p>
        </div>
      </section>
    )
  }
  return (
    <section className={`review-signals-panel level-${signals.highestLevel || 'none'}`}>
      <div className="review-signals-head">
        <div>
          <h4>审核风险信号</h4>
          <p>{signals.sensitiveLabel} · {signals.aiUsed ? '包含 AI 标记' : '无 AI 标记'} · {signals.riskTypes.length} 个风险标签</p>
        </div>
        {signals.sensitiveSegmentsCount > 0 && <span className="status-pill danger">敏感片段 {signals.sensitiveSegmentsCount}</span>}
      </div>
      <div className="review-signal-tags">
        {items.map((item, index) => (
          <span className={`review-signal-tag level-${item.level}`} key={`${item.type}-${index}`} title={item.detail || item.label}>
            {item.label}
          </span>
        ))}
      </div>
      {signals.aiFields.length > 0 && (
        <p className="muted-line">AI 标记范围：{signals.aiFields.join('、')}</p>
      )}
    </section>
  )
}

export function CompactReviewSignals({ signals }: { signals?: ReviewSignals }) {
  const items = signals?.items || []
  if (!signals || !items.length) return <span className="muted-line">无额外信号</span>
  return (
    <div className="compact-review-signals">
      {items.slice(0, 3).map((item, index) => (
        <span className={`review-signal-tag compact level-${item.level}`} key={`${item.type}-${index}`} title={item.detail || item.label}>
          {item.label}
        </span>
      ))}
      {items.length > 3 && <span className="muted-line">+{items.length - 3}</span>}
    </div>
  )
}
