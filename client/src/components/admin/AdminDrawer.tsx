import React, { useState, useEffect } from 'react'
import { useAppStore, ArchiveData } from '@/store'
import { X, MapPin, Save } from 'lucide-react'

export const AdminDrawer: React.FC = () => {
  const { isAdminOpen, setAdminOpen, draftCoords, addArchive } = useAppStore()
  
  const [formData, setFormData] = useState<Partial<ArchiveData>>({
    type: 'government',
    year: 2026
  })

  // 当在地图上拾取到坐标时，自动更新表单
  useEffect(() => {
    if (draftCoords) {
      setFormData(prev => ({
        ...prev,
        longitude: Number(draftCoords[0].toFixed(6)),
        latitude: Number(draftCoords[1].toFixed(6))
      }))
    }
  }, [draftCoords])

  if (!isAdminOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.longitude || !formData.latitude) {
      alert('请填写标题并拾取坐标！')
      return
    }

    const newArchive: ArchiveData = {
      id: `poi-${Date.now()}`,
      title: formData.title || '未命名档案',
      description: formData.description || '无简述',
      content: formData.content || '',
      longitude: formData.longitude,
      latitude: formData.latitude,
      type: (formData.type as any) || 'government',
      year: formData.year || new Date().getFullYear(),
    }

    addArchive(newArchive)
    alert('✅ 档案录入成功！地图已实时更新。')
    setFormData({ type: 'government', year: 2026 }) // reset
  }

  return (
    <div className="fixed top-0 right-0 h-full w-[400px] z-50 flex flex-col pointer-events-auto animate-in slide-in-from-right duration-500 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="h-full w-full bg-slate-900/90 backdrop-blur-2xl border-l border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full animate-pulse" />
              数据录入中心
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {draftCoords ? '已拾取坐标，请完善信息' : '请直接在左侧地图上点击拾取坐标'}
            </p>
          </div>
          <button 
            onClick={() => setAdminOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/60 font-medium">档案名称 (必填)</label>
              <input 
                type="text" 
                value={formData.title || ''}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="例如：苏区大桥"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-white/60 font-medium">经度 (点击地图获取)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.000001"
                    value={formData.longitude || ''}
                    readOnly
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-2.5 text-blue-400 text-sm font-mono"
                    placeholder="Longitude"
                  />
                  <MapPin size={14} className="absolute left-3 top-3 text-white/30" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-white/60 font-medium">纬度 (点击地图获取)</label>
                <input 
                  type="number" step="0.000001"
                  value={formData.latitude || ''}
                  readOnly
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-blue-400 text-sm font-mono"
                  placeholder="Latitude"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-white/60 font-medium">分类</label>
                <select 
                  value={formData.type || 'government'}
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="government">政府设施 (蓝色)</option>
                  <option value="revolution">革命遗址 (红色)</option>
                  <option value="culture">文化设施 (橙色)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-white/60 font-medium">发生年份</label>
                <input 
                  type="number" 
                  value={formData.year || ''}
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/60 font-medium">短述 (显示在弹窗)</label>
              <textarea 
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={2}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/60 font-medium">详细深度档案内容 (富文本)</label>
              <textarea 
                value={formData.content || ''}
                onChange={e => setFormData({...formData, content: e.target.value})}
                rows={5}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <button 
              type="submit"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
            >
              <Save size={18} />
              保存并写入数字档案
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}