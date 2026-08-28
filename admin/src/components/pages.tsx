/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import {  useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { request } from './api'
import type {  AuthPayload } from '../types'
import {  DRAFT_AUTOSAVE_OPTIONS } from '../constants'
import { Input } from './fields'

export function ShellMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>{title}</h1>
        <p>{text}</p>
      </section>
    </div>
  )
}

export function SetupPage({ onDone }: { onDone: (payload: AuthPayload) => void }) {
  const [form, setForm] = useState({ username: 'admin', realName: '', email: '', phone: '', department: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('两次密码输入不一致')
      return
    }
    setSubmitting(true)
    try {
      const payload = await request<AuthPayload>('/setup/admin', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onDone(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : '初始化失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame title="创建超级管理员" subtitle="初始化只允许执行一次">
      <form onSubmit={submit} className="form-grid">
        <Input label="用户名" value={form.username} onChange={username => setForm({ ...form, username })} />
        <Input label="真实姓名" value={form.realName} onChange={realName => setForm({ ...form, realName })} />
        <Input label="邮箱" value={form.email} onChange={email => setForm({ ...form, email })} />
        <Input label="手机号" value={form.phone} onChange={phone => setForm({ ...form, phone })} />
        <Input label="部门" value={form.department} onChange={department => setForm({ ...form, department })} />
        <Input label="密码" type="password" value={form.password} onChange={password => setForm({ ...form, password })} />
        <Input label="确认密码" type="password" value={form.confirm} onChange={confirm => setForm({ ...form, confirm })} />
        {error && <div className="error">{error}</div>}
        <button disabled={submitting}>{submitting ? '创建中...' : '创建并进入后台'}</button>
      </form>
    </AuthFrame>
  )
}

export function LoginPage({ onDone, notice = '' }: { onDone: (payload: AuthPayload) => void; notice?: string }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = await request<AuthPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, rememberMe }),
      })
      onDone(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame title="后台登录" subtitle="红色文化数字档案 CMS">
      <form onSubmit={submit} className="form-grid">
        <Input label="用户名" value={username} onChange={setUsername} />
        <Input label="密码" type="password" value={password} onChange={setPassword} />
        <label className="check-row">
          <input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} />
          <span>记住我 7 天</span>
        </label>
        {notice && <div className="notice">{notice}</div>}
        {error && <div className="error">{error}</div>}
        <button disabled={submitting}>{submitting ? '登录中...' : '登录'}</button>
      </form>
    </AuthFrame>
  )
}

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">SZ</span>
          <div>
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </div>
        </div>
        {children}
      </section>
    </div>
  )
}

