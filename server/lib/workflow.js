/**
 * 从 index.js 拆出的辅助函数
 */
const { cleanText } = require('./utils')

// 运行期注入的依赖（由 index.js 调用 init() 传入）
let CONTENT_READ_STORE
function init(deps) {
  CONTENT_READ_STORE = deps.CONTENT_READ_STORE
}

function getWorkflowStepById(workflowId, stepId) {
  const targetStepId = cleanText(stepId || '', 120)
  if (!targetStepId) return null
  return getWorkflowSteps(workflowId).find((step) => step.id === targetStepId) || null
}

function getWorkflowSteps(workflowId) {
  if (!workflowId) return []
  return CONTENT_READ_STORE.listWorkflowStepRows(workflowId).map((row) => ({
    id: row.id,
    workflowId: row.workflow_id,
    stepOrder: row.step_order,
    name: row.name,
    requiredPermission: row.required_permission,
    roleId: row.role_id,
    isFinal: Boolean(row.is_final),
  }))
}

module.exports = { init, getWorkflowStepById, getWorkflowSteps }
