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

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#FEFAF6')

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 2, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    mountRef.current.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.2

    const ambientLight = new THREE.AmbientLight(0xfff8f0, 0.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2)
    keyLight.position.set(5, 5, 5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xeeddcc, 0.6)
    fillLight.position.set(-3, 2, -2)
    scene.add(fillLight)

    const accentLight = new THREE.PointLight(0xC41E3A, 1.0, 10)
    accentLight.position.set(0, -1, 2)
    scene.add(accentLight)

    const relicGroup = new THREE.Group()

    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.6, 0.2, 32)
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3D322B,
      roughness: 0.7,
      metalness: 0.1
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = -0.5
    relicGroup.add(base)

    const ringGeometry = new THREE.RingGeometry(1.2, 1.3, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xC41E3A, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -0.39
    relicGroup.add(ring)

    const relicGeometry = new THREE.BoxGeometry(1, 1.5, 1)
    
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#A08070'
      context.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 5000; i++) {
        context.fillStyle = Math.random() > 0.5 ? '#8B7355' : '#6B5340'
        context.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    
    const relicMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.05,
      bumpMap: texture,
      bumpScale: 0.05
    })
    const relic = new THREE.Mesh(relicGeometry, relicMaterial)
    relic.position.y = 0.45
    relicGroup.add(relic)

    const particleGeometry = new THREE.BufferGeometry()
    const particleCount = 100
    const posArray = new Float32Array(particleCount * 3)
    for(let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 3
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xC41E3A,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    relicGroup.add(particles)

    scene.add(relicGroup)

    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()
      controls.update()
      
      const positions = particles.geometry.attributes.position.array as Float32Array
      for(let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.005
        if(positions[i] > 2) {
          positions[i] = -1
        }
      }
      particles.geometry.attributes.position.needsUpdate = true

      ringMaterial.opacity = 0.3 + 0.3 * Math.sin(elapsedTime * 2)
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      window.speechSynthesis?.cancel()
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      scene.clear()
    }
  }, [isRelicMode])

  if (!isRelicMode) return null

  return (
    <div className="fixed inset-0 z-[60] pointer-events-auto animate-in fade-in duration-700" style={{ backgroundColor: '#FEFAF6' }}>
      <div ref={mountRef} className="absolute inset-0 cursor-move" />
      
      <button 
        onClick={() => setRelicMode(false)}
        className="absolute top-8 right-8 z-10 p-3 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
        aria-label="退出文物全息展台"
      >
        <X size={22} />
      </button>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-6 pointer-events-none">
        <div className="museum-card p-8 rounded-3xl relative overflow-hidden">
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8EC] text-[#C41E3A] flex items-center justify-center border border-[#C41E3A]/20">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-wide font-serif">
                苏区革命文物 · 全息扫描档案
              </h2>
              <p className="text-[#5C5C5C] text-sm mt-1">
                三维激光扫描 · 数字空间中 1:1 重建历史痕迹
              </p>
            </div>
          </div>

          <p className="text-[#5C5C5C] leading-relaxed relative z-10 text-sm md:text-base font-serif">
            当前展示文物源自 <span className="text-[#C41E3A] font-bold">{archive?.title}</span>。
            通过三维扫描技术，在数字空间中 1:1 重建了历史遗迹的岁月痕迹。
            您可以拖拽鼠标全方位观察文物细节。
          </p>
          
          <div className="mt-6 flex gap-4 border-t border-[#E8DFD5] pt-4 relative z-10 font-mono text-xs text-[#5C5C5C]">
            <span>扫描精度: 0.1mm</span>
            <span>材质分析: 花岗岩 / 黄铜</span>
            <span className="ml-auto text-[#C41E3A] font-medium">状态: 实时渲染中</span>
          </div>
        </div>
      </div>
    </div>
  )
}
