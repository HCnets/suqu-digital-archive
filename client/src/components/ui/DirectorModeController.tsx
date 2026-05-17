import React, { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'

export const DirectorModeController: React.FC = () => {
  const { 
    isDirectorMode, 
    setDirectorMode, 
    setSelectedPoiId, 
    setDetailModalOpen,
    setActiveEvent,
    setShowHistoricalRoute
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
      await speak("欢迎来到广东省苏区镇数字化档案展厅。现在进入自动讲解模式。苏区镇是全国唯一以苏区命名的乡镇，让我们一同回顾这片红色热土的百年征程。")
      if (!sequenceRef.current) return

      // 第一幕：红屋
      setSelectedPoiId('suqu-red-house')
      await wait(4000)
      if (!sequenceRef.current) return
      setDetailModalOpen(true)
      await speak("1927年12月，在澎湃同志的直接指导下，紫金县工农兵代表大会在苏区镇林氏宗祠召开，宣告紫金县苏维埃政府成立。因会场张贴红联、悬挂红旗，群众亲切地称之为红屋。这是广东省最早成立的县级苏维埃政权之一，标志着紫金劳苦大众第一次真正把政权掌握在自己手中。")
      if (!sequenceRef.current) return
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      await wait(1500)

      // 第二幕：血田
      if (!sequenceRef.current) return
      setActiveEvent('血战炮子村')
      setSelectedPoiId('blood-field')
      await wait(4000)
      if (!sequenceRef.current) return
      setDetailModalOpen(true)
      await speak("1928年春，国民党反动派对海陆惠紫苏区发动残酷围剿。450多名红军指战员、苏维埃干部和革命群众在炮子村的一块水田中被集体杀害。烈士的鲜血染红了整片稻田，经久不褪，当地群众悲痛地将这块水田称为血田。英雄虽已远去，但他们的精神永远镌刻在苏区大地上。")
      if (!sequenceRef.current) return
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      setActiveEvent(null)
      await wait(1500)

      // 第三幕：炮子村阻击战
      if (!sequenceRef.current) return
      setSelectedPoiId('paozi-village-defense')
      await wait(4000)
      if (!sequenceRef.current) return
      setDetailModalOpen(true)
      await speak("1928年3月，红二师、红四师与苏区赤卫队共约六百人，在炮子村外围山头构筑防线，与数倍于己的敌军展开了三天三夜的殊死阻击。年仅16岁的红军小战士钟火妹在运送弹药途中中弹牺牲，牺牲时双手仍紧紧抱着弹药箱。六百勇士以弱抗强，掩护了苏维埃政府和群众安全转移。")
      if (!sequenceRef.current) return
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      await wait(1500)

      // 第四幕：行军路线与红军亭
      if (!sequenceRef.current) return
      setShowHistoricalRoute(true)
      setSelectedPoiId('red-army-pavilion')
      await wait(4000)
      if (!sequenceRef.current) return
      await speak("看，这是南昌起义和广州起义余部的转战路线。1927年，南昌起义军余部在董朗、颜昌颐率领下，广州起义军余部在叶镛、徐向前率领下，先后进入海陆丰地区，两支英雄部队最终在红军亭胜利会师。红军亭见证了革命火种在偏远山区星火燎原的伟大历史转折。")
      if (!sequenceRef.current) return
      setShowHistoricalRoute(false)
      setSelectedPoiId(null)
      await wait(1500)

      // 第五幕：红色交通站
      if (!sequenceRef.current) return
      setSelectedPoiId('suqu-red-transport-station')
      await wait(4000)
      if (!sequenceRef.current) return
      setDetailModalOpen(true)
      await speak("苏区红色交通站是连接东江苏区与中央苏区的秘密交通线节点，承担着传递情报、护送干部、运送物资的绝密任务。交通员李月梅在执行任务途中被捕，敌人严刑拷打，她至死没有吐露半个字。隐蔽战线的英雄们用生命和忠诚织就了革命的无形大网。")
      if (!sequenceRef.current) return
      setDetailModalOpen(false)
      setSelectedPoiId(null)
      await wait(1500)

      // 第六幕：纪念碑
      if (!sequenceRef.current) return
      setSelectedPoiId('suqu-monument')
      await wait(4000)
      if (!sequenceRef.current) return
      await speak("苏区革命烈士纪念碑矗立在炮子山上。仅1928年一年间，苏区就有1500多名革命群众和红军指战员献出了宝贵生命。1958年，经国务院批准，炮子乡正式命名为苏区乡，成为全国唯一以苏区命名的乡镇。这个独一无二的地名，本身就是一座永恒的丰碑。")
      if (!sequenceRef.current) return
      setSelectedPoiId(null)
      await wait(1500)

      // 结束
      if (!sequenceRef.current) return
      await speak("江山就是人民，人民就是江山。自动讲解演示完毕，感谢您的观看。欢迎随时手动探索每一个红色点位，深入了解苏区镇的革命历史。")
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
