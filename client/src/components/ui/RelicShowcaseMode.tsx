import React, { useRef, useEffect } from 'react'
import { useAppStore } from '@/store'
import { X, Box } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export const RelicShowcaseMode: React.FC = () => {
  const { isRelicMode, setRelicMode, selectedPoiId, getArchiveData } = useAppStore()
  const mountRef = useRef<HTMLDivElement>(null)
  
  const archive = selectedPoiId ? getArchiveData(selectedPoiId) : null

  useEffect(() => {
    if (!isRelicMode || !mountRef.current) return

    // 1. Scene Setup
    const scene = new THREE.Scene()
    // 全息感背景
    scene.background = new THREE.Color(0x050510)
    scene.fog = new THREE.FogExp2(0x050510, 0.05)

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 2, 5)

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // 开启色调映射和阴影，增强真实感
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mountRef.current.appendChild(renderer.domElement)

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.0

    // 5. Lighting (Holographic / Dramatic lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight)

    const spotLight1 = new THREE.SpotLight(0x3b82f6, 50) // 科技蓝
    spotLight1.position.set(5, 5, 0)
    spotLight1.angle = Math.PI / 4
    spotLight1.penumbra = 0.5
    scene.add(spotLight1)

    const spotLight2 = new THREE.SpotLight(0xf59e0b, 50) // 岁月黄/金
    spotLight2.position.set(-5, 5, 0)
    spotLight2.angle = Math.PI / 4
    spotLight2.penumbra = 0.5
    scene.add(spotLight2)

    const bottomLight = new THREE.PointLight(0xef4444, 20) // 底部红光
    bottomLight.position.set(0, -2, 0)
    scene.add(bottomLight)

    // 6. Object Creation (程序化生成文物模拟，这里以“苏维埃印章”或“碑石”为例)
    // 实际项目中可以加载 GLTF 模型，这里为了快速展示核心逻辑使用基础几何体组合
    const relicGroup = new THREE.Group()

    // 底座
    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.6, 0.2, 32)
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.2
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = -0.5
    relicGroup.add(base)

    // 发光阵列 (全息底盘)
    const ringGeometry = new THREE.RingGeometry(1.2, 1.3, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xef4444, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -0.39
    relicGroup.add(ring)

    // 核心文物本体 (模拟一枚风化的革命印章/碑石)
    const relicGeometry = new THREE.BoxGeometry(1, 1.5, 1)
    
    // 生成一些噪点纹理模拟风化
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#443333'
      context.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 5000; i++) {
        context.fillStyle = Math.random() > 0.5 ? '#554444' : '#332222'
        context.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    
    const relicMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      bumpMap: texture,
      bumpScale: 0.05
    })
    const relic = new THREE.Mesh(relicGeometry, relicMaterial)
    relic.position.y = 0.45
    relicGroup.add(relic)

    // 添加一些悬浮的全息粒子
    const particleGeometry = new THREE.BufferGeometry()
    const particleCount = 100
    const posArray = new Float32Array(particleCount * 3)
    for(let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 3
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xfca5a5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    relicGroup.add(particles)

    scene.add(relicGroup)

    // 7. Animation Loop
    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      controls.update()
      
      // 粒子缓缓上升
      const positions = particles.geometry.attributes.position.array as Float32Array
      for(let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.005
        if(positions[i] > 2) {
          positions[i] = -1
        }
      }
      particles.geometry.attributes.position.needsUpdate = true

      // 底座光环呼吸
      ringMaterial.opacity = 0.5 + 0.5 * Math.sin(elapsedTime * 2)

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    // 8. Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      // 资源清理
      renderer.dispose()
      scene.clear()
    }
  }, [isRelicMode])

  if (!isRelicMode) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black pointer-events-auto animate-in fade-in duration-700">
      <div ref={mountRef} className="absolute inset-0 cursor-move" />
      
      {/* 退出按钮 */}
      <button 
        onClick={() => setRelicMode(false)}
        className="absolute top-8 right-8 z-10 p-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
      >
        <X size={24} />
      </button>

      {/* 底部全息数据面板 */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-6">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-widest">
                苏维埃文物全息扫描档案
              </h2>
              <p className="text-amber-500/50 font-mono text-sm uppercase tracking-[0.2em] mt-1">
                Holographic Relic Reconstruction
              </p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed relative z-10 text-sm md:text-base">
            当前展示文物源自 <span className="text-white font-bold">{archive?.title}</span>。
            通过三维激光扫描技术，我们在数字空间中1:1重建了历史遗迹的岁月痕迹。
            <br/><br/>
            <span className="text-slate-500 text-sm">提示：您可以拖拽鼠标全方位观察文物细节。</span>
          </p>
          
          <div className="mt-6 flex gap-4 border-t border-white/10 pt-4 relative z-10 font-mono text-xs text-slate-500">
            <span>扫描精度: 0.1mm</span>
            <span>材质分析: 花岗岩/黄铜</span>
            <span className="ml-auto text-amber-500/70">状态: 渲染中...</span>
          </div>
        </div>
      </div>
    </div>
  )
}