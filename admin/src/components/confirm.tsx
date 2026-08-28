import { useCallback, useRef, useState } from 'react'

interface ConfirmState {
  message: string
  resolve: (value: boolean) => void
}

/**
 * 统一确认弹窗 hook，替代原生 window.confirm。
 *
 * 用法：
 *   const { confirm, confirmDialog } = useConfirm()
 *   const doDelete = async () => {
 *     if (!await confirm('确认删除该内容吗？')) return
 *     // ... 真正执行删除
 *   }
 *   return <>{confirmDialog}<div>...</div></>
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)
  const stateRef = useRef<ConfirmState | null>(null)

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const next: ConfirmState = { message, resolve }
      stateRef.current = next
      setState(next)
    })
  }, [])

  const close = useCallback((result: boolean) => {
    const current = stateRef.current
    stateRef.current = null
    setState(null)
    current?.resolve(result)
  }, [])

  const confirmDialog = state ? (
    <div className="modal-backdrop" role="presentation" onClick={() => close(false)}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="确认操作"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="media-picker-head">
          <h3>确认操作</h3>
        </div>
        <p className="confirm-message">{state.message}</p>
        <div className="confirm-actions">
          <button type="button" className="secondary" onClick={() => close(false)}>取消</button>
          <button type="button" className="btn-danger" onClick={() => close(true)}>确认</button>
        </div>
      </section>
    </div>
  ) : null

  return { confirm, confirmDialog }
}
