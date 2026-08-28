import {  useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import {  AiCenterPage } from './components/aicenter'
import {  ContentsPage } from './components/content'
import {  RegionsPage, ReviewsPage } from './components/pages3'
import { CreateCenterPage, TributesPage, UsersPage, RolesPage, AuditPage, OperationsPage } from './components/pages2'
import {  loadDistrictBoundaries } from './components/location'
import { MediaPage } from './components/mediapage'
import {  Dashboard } from './components/dash'
import { ShellMessage, SetupPage, LoginPage } from './components/pages'
import { API_BASE, CSRF_HEADER, SAFE_HTTP_METHODS, localizeApiError } from './components/api'
import {  HelpDrawer, readStoredEnum } from './components/panels'
import {  ChoiceChipField } from './components/fields'
import {  MENU_GROUP_LABELS, MENU_ITEMS, HELP_ARTICLE_DEFAULTS, SHELL_THEME_OPTIONS, SHELL_DENSITY_OPTIONS, SHELL_FONT_SCALE_OPTIONS } from './constants'
import type {  AdminUser, HelpArticle, CreateIntentKey, AuthPayload, ShellTheme, ShellDensity, ShellFontScale, MenuGroupKey, MenuItem } from './types'










































































export function App() {
  const [booting, setBooting] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [user, setUser] = useState<AdminUser | null>(null)
  const [active, setActive] = useState('dashboard')
  const [error, setError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [theme, setTheme] = useState<ShellTheme>(() => readStoredEnum<ShellTheme>('suqu-admin-theme', ['civic', 'heritage'], 'civic'))
  const [density, setDensity] = useState<ShellDensity>(() => readStoredEnum<ShellDensity>('suqu-admin-density', ['standard', 'comfortable', 'compact'], 'standard'))
  const [fontScale, setFontScale] = useState<ShellFontScale>(() => readStoredEnum<ShellFontScale>('suqu-admin-font-scale', ['standard', 'large', 'xlarge'], 'standard'))
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpArticles, setHelpArticles] = useState<Record<string, HelpArticle>>(HELP_ARTICLE_DEFAULTS)
  const [quickSearch, setQuickSearch] = useState('')
  const [contentEntryIntent, setContentEntryIntent] = useState<CreateIntentKey | ''>('')

  const api = useCallback(async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers)
    const method = (options.method || 'GET').toUpperCase()
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    if (!SAFE_HTTP_METHODS.has(method) && csrfToken) headers.set(CSRF_HEADER, csrfToken)
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      if (response.status === 401) {
        setCsrfToken('')
        setUser(null)
        setAuthNotice('登录状态已过期，请重新登录。')
      }
      throw new Error(localizeApiError(payload, response.status))
    }
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }, [csrfToken])

  const refreshMe = useCallback(async () => {
    const payload = await api<AuthPayload>('/auth/me')
    setCsrfToken(payload.csrfToken || '')
    setUser(payload.user)
  }, [api])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const setup = await fetch(`${API_BASE}/setup/status`, { credentials: 'include' }).then(r => r.json())
        if (cancelled) return
        setNeedsSetup(Boolean(setup.needsSetup))
        if (!setup.needsSetup) {
          try {
            await refreshMe()
          } catch {
            setUser(null)
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '服务连接失败')
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    boot()
    return () => { cancelled = true }
  }, [refreshMe])

  useEffect(() => {
    if (!user) return
    api<HelpArticle[]>('/admin/help-articles')
      .then((rows) => {
        setHelpArticles(buildHelpArticleMap(rows))
      })
      .catch(() => {
        setHelpArticles(HELP_ARTICLE_DEFAULTS)
      })
  }, [api, user])

  const permissions = user?.permissions || []
  const visibleMenu = MENU_ITEMS.filter(item => hasMenuAccess(item, permissions))
  const groupedMenu = (Object.keys(MENU_GROUP_LABELS) as MenuGroupKey[]).map((groupKey) => ({
    key: groupKey,
    label: MENU_GROUP_LABELS[groupKey],
    items: visibleMenu.filter(item => item.group === groupKey),
  })).filter(group => group.items.length > 0)
  const activeMenu = MENU_ITEMS.find(item => item.key === active) || MENU_ITEMS[0]
  const deferredQuickSearch = useDeferredValue(quickSearch.trim())
  const quickSearchResults = useMemo(() => {
    if (!deferredQuickSearch) return []
    const normalized = deferredQuickSearch.toLowerCase()
    const menuResults = visibleMenu
      .filter(item => `${item.label} ${item.description}`.toLowerCase().includes(normalized))
      .map(item => ({ id: `menu-${item.key}`, type: 'menu' as const, title: item.label, detail: item.description, target: item.key }))
    const helpResults = Object.entries(helpArticles)
      .filter(([key, article]) => visibleMenu.some(item => item.key === key) && `${article.title} ${article.summary} ${article.steps.join(' ')}`.toLowerCase().includes(normalized))
      .map(([key, article]) => ({ id: `help-${key}`, type: 'help' as const, title: article.title, detail: article.summary, target: key }))
    return [...menuResults, ...helpResults].slice(0, 8)
  }, [deferredQuickSearch, visibleMenu])

  useEffect(() => {
    localStorage.setItem('suqu-admin-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('suqu-admin-density', density)
  }, [density])

  useEffect(() => {
    localStorage.setItem('suqu-admin-font-scale', fontScale)
  }, [fontScale])

  const handleAuthed = (payload: AuthPayload) => {
    setCsrfToken(payload.csrfToken || '')
    setUser(payload.user)
    setAuthNotice('')
    setNeedsSetup(false)
    setActive('dashboard')
  }

  const logout = async () => {
    try {
      await api<void>('/auth/logout', { method: 'POST' })
    } catch {
      // Local logout should still proceed if the session already expired.
    }
    setCsrfToken('')
    setUser(null)
  }

  const expireSession = (message: string) => {
    setCsrfToken('')
    setUser(null)
    setAuthNotice(message)
  }

  if (booting) return <ShellMessage title="正在连接后台" text="请稍候..." />
  if (error) return <ShellMessage title="后台暂不可用" text={error} />
  if (needsSetup) return <SetupPage onDone={handleAuthed} />
  if (!user) return <LoginPage onDone={handleAuthed} notice={authNotice} />

  return (
    <div className={`app-shell theme-${theme} density-${density} font-${fontScale}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">SZ</span>
          <div>
            <strong>数字档案后台</strong>
            <small>admin.szht.online</small>
          </div>
        </div>
        <p className="sidebar-summary">为政府工作人员、讲解员和审核人员准备的可视化后台。</p>
        {groupedMenu.map(group => (
          <section className="nav-group" key={group.key}>
            <p className="nav-group-label">{group.label}</p>
            <nav>
              {group.items.map(item => (
                <button key={item.key} className={active === item.key ? 'active' : ''} onClick={() => setActive(item.key)}>
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </button>
              ))}
            </nav>
          </section>
        ))}
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{activeMenu?.label || '工作台'}</h1>
            <p>{user.realName} · {user.roleName}</p>
          </div>
          <div className="topbar-tools">
            <div className="global-search">
              <input
                aria-label="全局搜索"
                placeholder="搜索页面、帮助和常用入口"
                value={quickSearch}
                onChange={(event) => setQuickSearch(event.target.value)}
              />
              {quickSearchResults.length > 0 && (
                <div className="search-results">
                  {quickSearchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="search-result"
                      onClick={() => {
                        setActive(item.target)
                        setQuickSearch('')
                        setHelpOpen(item.type === 'help')
                      }}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="display-switchers">
              <ChoiceChipField
                label="主题"
                value={theme}
                options={SHELL_THEME_OPTIONS}
                onChange={nextTheme => setTheme(nextTheme as ShellTheme)}
              />
              <ChoiceChipField
                label="排版"
                value={density}
                options={SHELL_DENSITY_OPTIONS}
                onChange={nextDensity => setDensity(nextDensity as ShellDensity)}
              />
              <ChoiceChipField
                label="字号"
                value={fontScale}
                options={SHELL_FONT_SCALE_OPTIONS}
                onChange={nextScale => setFontScale(nextScale as ShellFontScale)}
              />
            </div>
            <button className="secondary" onClick={() => setHelpOpen(current => !current)}>{helpOpen ? '关闭帮助' : '帮助中心'}</button>
            <button className="secondary" onClick={logout}>退出登录</button>
          </div>
        </header>
        {active === 'dashboard' && <Dashboard api={api} user={user} onJump={setActive} />}
        {active === 'create-center' && (
          <CreateCenterPage
            user={user}
            onStartContent={(intent) => {
              setContentEntryIntent(intent)
              setActive('contents')
            }}
            onJump={setActive}
          />
        )}
        {active === 'contents' && (
          <ContentsPage
            api={api}
            currentUser={user}
            entryIntent={contentEntryIntent}
            onConsumeEntryIntent={() => setContentEntryIntent('')}
            onBackToCreateCenter={() => setActive('create-center')}
          />
        )}
        {active === 'reviews' && <ReviewsPage api={api} currentUser={user} />}
        {active === 'media' && <MediaPage api={api} currentUser={user} />}
        {active === 'ai' && <AiCenterPage api={api} />}
        {active === 'regions' && <RegionsPage api={api} />}
        {active === 'tributes' && <TributesPage api={api} />}
        {active === 'users' && <UsersPage api={api} currentUser={user} />}
        {active === 'roles' && <RolesPage api={api} />}
        {active === 'audit' && <AuditPage api={api} />}
        {active === 'ops' && <OperationsPage api={api} currentUser={user} onSessionInvalidated={expireSession} />}
      </main>
      <HelpDrawer article={helpArticles[active] || HELP_ARTICLE_DEFAULTS[active] || HELP_ARTICLE_DEFAULTS.dashboard} open={helpOpen} onClose={() => setHelpOpen(false)} />
      <div className="mobile-nav" role="navigation" aria-label="移动端主导航">
        {visibleMenu.filter(item => item.mobile !== false).map(item => (
          <button key={item.key} className={active === item.key ? 'active' : ''} onClick={() => setActive(item.key)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
























































































































function hasMenuAccess(item: MenuItem, permissions: string[]) {
  if (!item.permission) return true
  return Array.isArray(item.permission)
    ? item.permission.some(permission => permissions.includes(permission))
    : permissions.includes(item.permission)
}












function buildHelpArticleMap(items: HelpArticle[]) {
  const map: Record<string, HelpArticle> = { ...HELP_ARTICLE_DEFAULTS }
  for (const item of items || []) {
    if (!item?.pageKey) continue
    map[item.pageKey] = {
      ...map[item.pageKey],
      ...item,
      steps: Array.isArray(item.steps) && item.steps.length ? item.steps : map[item.pageKey]?.steps || [],
    }
  }
  return map
}




























