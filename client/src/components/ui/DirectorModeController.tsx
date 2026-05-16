import React, { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'

export const DirectorModeController: React.FC = () => {
  const { 
    isDirectorMode, 
    setDirectorMode, 
    setSelectedPoiId, 
    setDetailModalOpen,
    setActiveEvent,
    setShowHistoricalRoute,
    getAllArchives
  } = useAppStore()

  const sequenceRef = useRef<boolean>(false)

  useEffect(() => {
    if (!isDirectorMode) {
      sequenceRef.current = false
      return
    }
    
    sequenceRef.current = true

    const runSequence = async () => {
      const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
      const speak = (text: string) => {
        return new Promise<void>((resolve) => {
          if (!sequenceRef.current) { resolve(); return; }
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel() // clear queue
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = 'zh-CN'
            utterance.rate = 0.95
            utterance.onend = () => resolve()
            window.speechSynthesis.speak(utterance)
          } else {
            setTimeout(resolve, text.length * 200) // fallback
          }
        })
      }

      if (!sequenceRef.current) return

      // 开场白
      await speak("欢迎视察数字苏区党建沙盘。现在进入自动汇报模式。")
      if (!sequenceRef.current) return

      // 第一幕：红屋
      setSelectedPoiId('suqu-red-house')
      await wait(3000) // 等待镜头飞过去
      if (!sequenceRef.current) return
      setDetailModalOpen(true)
      await speak("这是紫金县苏维埃政府旧址，因会场贴满红联红旗，被称为红屋。这里是海陆惠紫革命根据地的红色心脏。")
      if (!sequenceRef.current) return
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      await wait(1000)

      // 第二幕：血田
      if (!sequenceRef.current) return
      setActiveEvent('血战炮子村') // 触发暗红滤镜
      setSelectedPoiId('blood-field')
      await wait(3000)
      if (!sequenceRef.current) return
      setDetailModalOpen(true)
      await speak("1928年春，反动派残酷围剿。400多名红军与群众在此惨遭杀害，鲜血染红了这片水田，史称血田。")
      if (!sequenceRef.current) return
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      setActiveEvent(null)
      await wait(1000)

      // 第三幕：行军路线与红军亭
      if (!sequenceRef.current) return
      setShowHistoricalRoute(true)
      setSelectedPoiId('red-army-pavilion')
      await wait(3000)
      if (!sequenceRef.current) return
      await speak("看，这是当年南昌起义和广州起义余部的转战路线。他们最终在红军亭会师，点燃了东江星火。")
      if (!sequenceRef.current) return
      setShowHistoricalRoute(false)
      setSelectedPoiId(null)
      await wait(1000)

      // 结束
      if (!sequenceRef.current) return
      await speak("自动汇报演示完毕，感谢您的观看。")
      setDirectorMode(false)
    }

    runSequence()

    return () => {
      sequenceRef.current = false
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [isDirectorMode])

  return null
}
