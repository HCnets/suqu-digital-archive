/**
 * 从 index.js 拆出的辅助函数
 */
const { canUserAccessContentAsync, getWorkflowStepsAsync } = require('./async-ops')
const { sendError } = require('./server-helpers')
const { getWorkflowSteps } = require('./workflow')
const { cleanText } = require('./utils')

async function requireContentRegionAccessAsync(req, res, content) {
  if (await canUserAccessContentAsync(req.user, content)) return true
  sendError(res, 403, 'REGION_FORBIDDEN', '该内容不在你的地区权限范围内。')
  return false
}

function rowToWorkflow(row) {
  return {
    id: row.id,
    moduleKey: row.module_key,
    name: row.name,
    isDefault: Boolean(row.is_default),
    steps: getWorkflowSteps(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function rowToWorkflowAsync(row) {
  return {
    id: row.id,
    moduleKey: row.module_key,
    name: row.name,
    isDefault: Boolean(row.is_default),
    steps: await getWorkflowStepsAsync(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getNextWorkflowStep(workflowId, currentOrder) {
  return getWorkflowSteps(workflowId).find((step) => step.stepOrder > currentOrder) || null
}

async function getNextWorkflowStepAsync(workflowId, currentOrder) {
  return (await getWorkflowStepsAsync(workflowId)).find((step) => step.stepOrder > currentOrder) || null
}

async function getWorkflowStepByIdAsync(workflowId, stepId) {
  const targetStepId = cleanText(stepId || '', 120)
  if (!targetStepId) return null
  return (await getWorkflowStepsAsync(workflowId)).find((step) => step.id === targetStepId) || null
}

module.exports = { requireContentRegionAccessAsync, rowToWorkflow, rowToWorkflowAsync, getNextWorkflowStep, getNextWorkflowStepAsync, getWorkflowStepByIdAsync }
