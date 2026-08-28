import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { asRecordArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

type DirectorScene = {
  id: string
  title: string
  narration: string
  poiId: string
  activeEvent: string
  openDetail: boolean
  waitBeforeMs: number
  waitAfterMs: number
}

export const DirectorModeController: React.FC = () => {
  const { 
    isDirectorMode, 
    setDirectorMode, 
    setSelectedPoiId, 
    setDetailModalOpen,
    setActiveEvent
  } = useAppStore()

  const sequenceRef = useRef<boolean>(false)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [noScriptNotice, setNoScriptNotice] = useState(false)

  useEffect(() => () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
  }, [])

  useEffect(() => {
    if (!isDirectorMode) {
      sequenceRef.current = false
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      setActiveEvent(null)
      return
    }
    
    sequenceRef.current = true

    const resetSceneState = () => {
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      setActiveEvent(null)
    }

    const runSequence = async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      const speak = (text: string) => {
        return new Promise<void>((resolve) => {
          if (!sequenceRef.current) { resolve(); return }
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = 'zh-CN'
            utterance.rate = 0.95
            utterance.onend = () => resolve()
            window.speechSynthesis.speak(utterance)
          } else {
            setTimeout(resolve, Math.min(text.length * 200, 120000))
          }
        })
      }

      try {
        const items = await fetchPublishedContents('director_script', 1)
        const script = items.map(contentToDirectorScript).find(Boolean)
        if (!sequenceRef.current || !script) {
          setDirectorMode(false)
          if (sequenceRef.current) {
            setNoScriptNotice(true)
            if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
            noticeTimerRef.current = setTimeout(() => setNoScriptNotice(false), 4000)
          }
          return
        }

        for (const scene of script.scenes) {
          if (!sequenceRef.current) return
          resetSceneState()
          if (scene.poiId) setSelectedPoiId(scene.poiId)
          if (scene.activeEvent) setActiveEvent(scene.activeEvent)
          if (scene.waitBeforeMs > 0) await wait(scene.waitBeforeMs)
          if (!sequenceRef.current) return
          if (scene.openDetail) setDetailModalOpen(true)
          await speak(scene.narration)
          if (!sequenceRef.current) return
          if (scene.openDetail) setDetailModalOpen(false)
          if (scene.waitAfterMs > 0) await wait(scene.waitAfterMs)
        }
      } finally {
        resetSceneState()
        if (sequenceRef.current) setDirectorMode(false)
      }
    }

    runSequence()

    return () => {
      sequenceRef.current = false
      resetSceneState()
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [isDirectorMode, setActiveEvent, setDetailModalOpen, setDirectorMode, setSelectedPoiId])

  if (!noScriptNotice) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[95] flex justify-center px-4">
      <div className="museum-card flex items-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-sm text-party-ink shadow-lg shadow-black/10 animate-in fade-in slide-in-from-top-2">
        <span className="text-party-red" aria-hidden>◈</span>
        后台暂未配置自动讲解脚本，请先在管理后台发布「自动讲解脚本」内容。
      </div>
    </div>
  )
}

function contentToDirectorScript(item: PublicContentItem): { scenes: DirectorScene[] } | null {
  const data = item.data || {}
  const scenes = asRecordArray(data.scenes || data.steps).map((entry, index) => {
    const narration = asText(entry.narration) || asText(entry.text) || asText(entry.speech)
    if (!narration) return null
    return {
      id: asText(entry.id) || `${item.id || item.title}-${index}`,
      title: asText(entry.title) || asText(entry.name),
      narration,
      poiId: asText(entry.poiId) || asText(entry.poi_id),
      activeEvent: asText(entry.activeEvent) || asText(entry.active_event),
      openDetail: Boolean(entry.openDetail || entry.open_detail),
      waitBeforeMs: asWaitMs(entry.waitBeforeMs ?? entry.wait_before_ms),
      waitAfterMs: asWaitMs(entry.waitAfterMs ?? entry.wait_after_ms),
    }
  }).filter(Boolean) as DirectorScene[]

  return scenes.length > 0 ? { scenes } : null
}

function asWaitMs(value: unknown) {
  const number = Number(value || 0)
  return Number.isFinite(number) && number > 0 ? Math.min(Math.trunc(number), 120000) : 0
}
