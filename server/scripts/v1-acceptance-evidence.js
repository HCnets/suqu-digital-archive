const fs = require('fs')
const path = require('path')
const { getDatabaseConfig } = require('../db/config')
const { inspectMysqlTarget } = require('../db/mysql-observer')
const { withMysqlConnection } = require('../db/mysql-primary-ops')

const TABLES_TO_COUNT = [
  'admin_users',
  'roles',
  'permissions',
  'regions',
  'media_assets',
  'contents',
  'content_versions',
  'content_sources',
  'review_tasks',
  'review_records',
  'audit_logs',
  'ai_providers',
]

main().catch((error) => {
  console.error(`V1 acceptance evidence failed: ${error.message}`)
  process.exit(1)
})

async function main() {
  const config = getDatabaseConfig(process.env)
  const repoRoot = path.resolve(__dirname, '..', '..')
  const dataDir = config.sqlite.dataDir
  const evidenceDir = path.join(dataDir, 'acceptance')
  const checkedAt = new Date()
  const stamp = checkedAt.toISOString().replace(/[:.]/g, '-')

  fs.mkdirSync(evidenceDir, { recursive: true })

  const baseUrl = normalizeBaseUrl(process.env.PUBLIC_API_BASE_URL || 'http://localhost:3001')
  const health = await fetchJson(`${baseUrl}/api/health`)
  const mysqlTarget = await inspectMysqlTarget(config)
  const tableCounts = await collectTableCounts(config)
  const buildArtifacts = collectBuildArtifacts(repoRoot)
  const documents = collectDocumentChecks(repoRoot)
  const manualAcceptance = collectManualAcceptance(evidenceDir)

  const checks = buildChecks({ health, mysqlTarget, buildArtifacts, documents })
  const evidence = {
    checkedAt: checkedAt.toISOString(),
    baseUrl,
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    checks,
    health,
    mysql: {
      target: mysqlTarget,
      tableCounts,
    },
    buildArtifacts,
    documents,
    manualAcceptance,
    nextManualAcceptance: buildNextManualAcceptance(manualAcceptance),
  }

  const jsonPath = path.join(evidenceDir, `v1-acceptance-evidence-${stamp}.json`)
  const mdPath = path.join(evidenceDir, `v1-acceptance-evidence-${stamp}.md`)
  fs.writeFileSync(jsonPath, JSON.stringify(evidence, null, 2), 'utf8')
  fs.writeFileSync(mdPath, renderMarkdown(evidence), 'utf8')

  const failed = checks.filter(item => !item.ok)
  console.log(JSON.stringify({
    ok: failed.length === 0,
    checkedAt: evidence.checkedAt,
    jsonPath,
    mdPath,
    failedChecks: failed.map(item => item.key),
  }, null, 2))

  if (failed.length) process.exit(1)
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`)
  return response.json()
}

async function collectTableCounts(config) {
  return withMysqlConnection(config, async (_ops, connection) => {
    const [tableRows] = await connection.query('SHOW TABLES')
    const tableNames = new Set(tableRows.map(row => String(Object.values(row)[0] || '')))
    const counts = {}
    for (const tableName of TABLES_TO_COUNT) {
      if (!tableNames.has(tableName)) {
        counts[tableName] = null
        continue
      }
      const [rows] = await connection.query(`SELECT count(*) AS count FROM ${quoteIdentifier(tableName)}`)
      counts[tableName] = Number(rows[0]?.count || 0)
    }
    return counts
  })
}

function collectBuildArtifacts(repoRoot) {
  return {
    admin: describeFile(path.join(repoRoot, 'admin', 'dist', 'index.html')),
    client: describeFile(path.join(repoRoot, 'client', 'dist-server', 'index.html')),
  }
}

function collectDocumentChecks(repoRoot) {
  return {
    productionDeployment: describeFile(path.join(repoRoot, 'docs', 'PRODUCTION_DEPLOYMENT.md')),
    v1AcceptanceChecklist: describeFile(path.join(repoRoot, 'docs', 'V1_ACCEPTANCE_CHECKLIST.md')),
    v1Plan: describeFile(path.join(repoRoot, 'docs', 'V1_MYSQL_ACCESSIBLE_ADMIN_PLAN.md')),
  }
}

function collectManualAcceptance(evidenceDir) {
  const fallback = {
    hasRecord: false,
    conclusion: 'pending',
    conclusionLabel: acceptanceConclusionLabel('pending'),
    environment: '',
    owner: '',
    governmentRepresentative: '',
    narratorRepresentative: '',
    technicalOperator: '',
    testedAt: '',
    mobileResult: '',
    publicDomainResult: '',
    realMaterialResult: '',
    blockers: '',
    followUps: '',
    notes: '',
    updatedAt: null,
    updatedBy: '',
  }
  const filePath = path.join(evidenceDir, 'v1-manual-record.json')
  if (!fs.existsSync(filePath)) return fallback
  try {
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const conclusion = normalizeAcceptanceConclusion(payload.conclusion)
    return {
      ...fallback,
      hasRecord: true,
      conclusion,
      conclusionLabel: acceptanceConclusionLabel(conclusion),
      environment: cleanText(payload.environment),
      owner: cleanText(payload.owner),
      governmentRepresentative: cleanText(payload.governmentRepresentative),
      narratorRepresentative: cleanText(payload.narratorRepresentative),
      technicalOperator: cleanText(payload.technicalOperator),
      testedAt: cleanText(payload.testedAt),
      mobileResult: cleanText(payload.mobileResult),
      publicDomainResult: cleanText(payload.publicDomainResult),
      realMaterialResult: cleanText(payload.realMaterialResult),
      blockers: cleanText(payload.blockers),
      followUps: cleanText(payload.followUps),
      notes: cleanText(payload.notes),
      updatedAt: Number(payload.updatedAt || 0) || null,
      updatedBy: cleanText(payload.updatedBy),
    }
  } catch {
    return {
      ...fallback,
      hasRecord: true,
      notes: '人工验收登记文件存在，但当前无法读取，请在后台重新保存登记。',
    }
  }
}

function describeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      path: filePath,
      exists: false,
      sizeBytes: 0,
      updatedAt: null,
    }
  }
  const stat = fs.statSync(filePath)
  return {
    path: filePath,
    exists: true,
    sizeBytes: stat.size,
    updatedAt: stat.mtime.toISOString(),
  }
}

function buildChecks({ health, mysqlTarget, buildArtifacts, documents }) {
  return [
    { key: 'health_ok', label: '健康检查正常', ok: health?.ok === true },
    { key: 'health_store_mysql', label: '运行存储为 MySQL', ok: health?.store === 'mysql' },
    { key: 'health_configured_mysql', label: '配置存储为 MySQL', ok: health?.configuredStore === 'mysql' },
    { key: 'health_runtime_mysql', label: '数据库运行客户端为 MySQL', ok: health?.database?.runtimeClient === 'mysql' },
    { key: 'health_runtime_aligned', label: '数据库运行态已对齐', ok: health?.database?.runtimeAligned === true },
    { key: 'mysql_reachable', label: 'MySQL 可连接', ok: mysqlTarget.reachable === true },
    { key: 'mysql_schema_ready', label: 'MySQL 表结构已就绪', ok: mysqlTarget.schemaReady === true },
    { key: 'mysql_core_tables', label: 'MySQL 核心表存在', ok: mysqlTarget.coreTablesPresent === true },
    { key: 'admin_build_artifact', label: '管理端构建产物存在', ok: buildArtifacts.admin.exists === true },
    { key: 'client_build_artifact', label: '展示端构建产物存在', ok: buildArtifacts.client.exists === true },
    { key: 'acceptance_checklist_doc', label: 'V1 验收清单存在', ok: documents.v1AcceptanceChecklist.exists === true },
    { key: 'production_deployment_doc', label: '生产部署说明存在', ok: documents.productionDeployment.exists === true },
  ]
}

function buildNextManualAcceptance(manualAcceptance) {
  if (manualAcceptance.conclusion === 'passed') {
    return [
      '人工验收结论已登记为通过，正式部署前请保留本次 JSON 和 Markdown 证据文件。',
      '上线后继续关注备份、审核待办、手机端后台和真实素材公开效果。',
    ]
  }
  if (manualAcceptance.conclusion === 'conditional') {
    return [
      '人工验收结论为有条件通过，请按登记的后续事项跟进责任人和完成时间。',
      '正式部署前确认阻塞问题为空，且轻微事项不会影响政府工作人员日常使用。',
    ]
  }
  if (manualAcceptance.conclusion === 'failed') {
    return [
      '人工验收结论为不通过，请先修复登记的阻塞问题，再重新执行机器验收和人工验收。',
      '重新验收后再次生成证据文件，避免沿用旧结论。',
    ]
  }
  return [
    '在正式域名下填写 docs/V1_ACCEPTANCE_CHECKLIST.md',
    '使用真实素材完成档案点位、口述历史、红歌资料、讲解路线、手机端后台验收',
    '在后台 运维管理 -> V1.0 上线验收登记 中保存最终结论',
  ]
}

function renderMarkdown(evidence) {
  const checkRows = evidence.checks
    .map(item => `| ${item.label} | ${item.ok ? '通过' : '未通过'} | ${item.key} |`)
    .join('\n')
  const countRows = Object.entries(evidence.mysql.tableCounts)
    .map(([tableName, count]) => `| ${tableName} | ${count === null ? '缺失' : count} |`)
    .join('\n')
  const manual = evidence.manualAcceptance
  const manualUpdatedAt = manual.updatedAt ? new Date(manual.updatedAt).toISOString() : '未保存'

  return `# V1.0 验收证据

- 采集时间：${evidence.checkedAt}
- 接口地址：${evidence.baseUrl}
- MySQL 目标：${evidence.mysqlTarget}

## 自动检查

| 项目 | 结果 | 标识 |
| --- | --- | --- |
${checkRows}

## 关键表数量

| 表 | 数量 |
| --- | --- |
${countRows}

## 人工验收登记

| 项目 | 内容 |
| --- | --- |
| 当前结论 | ${manual.conclusionLabel} |
| 验收环境 | ${manual.environment || '未填写'} |
| 验收日期 | ${manual.testedAt || '未填写'} |
| 负责人 | ${manual.owner || '未填写'} |
| 工作人员代表 | ${manual.governmentRepresentative || '未填写'} |
| 讲解员代表 | ${manual.narratorRepresentative || '未填写'} |
| 技术运维人员 | ${manual.technicalOperator || '未填写'} |
| 正式域名验收 | ${manual.publicDomainResult || '未填写'} |
| 手机端验收 | ${manual.mobileResult || '未填写'} |
| 真实素材验收 | ${manual.realMaterialResult || '未填写'} |
| 阻塞问题 | ${manual.blockers || '未填写'} |
| 后续事项 | ${manual.followUps || '未填写'} |
| 最近保存 | ${manualUpdatedAt}${manual.updatedBy ? `，保存人：${manual.updatedBy}` : ''} |

## 下一步人工确认

${evidence.nextManualAcceptance.map(item => `- ${item}`).join('\n')}
`
}

function normalizeAcceptanceConclusion(value) {
  const allowed = new Set(['pending', 'passed', 'conditional', 'failed'])
  const normalized = String(value || '').trim()
  return allowed.has(normalized) ? normalized : 'pending'
}

function acceptanceConclusionLabel(value) {
  return {
    pending: '待验收',
    passed: '通过',
    conditional: '有条件通过',
    failed: '不通过',
  }[normalizeAcceptanceConclusion(value)]
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``
}
