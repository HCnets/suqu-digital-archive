/**
 * 后台通用组件（从 panels.tsx 拆分）
 */
import { ARCHIVE_DETAIL_BLOCK_OPTIONS } from '../constants'

export const createDefaultArchiveDetailBlocks = () => ARCHIVE_DETAIL_BLOCK_OPTIONS.map(block => ({ ...block }))

export function archiveDetailBlockTitle(type: string) {
  return ARCHIVE_DETAIL_BLOCK_OPTIONS.find(item => item.type === type)?.title || '自定义板块'
}
