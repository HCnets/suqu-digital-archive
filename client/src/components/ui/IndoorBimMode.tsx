import React, { useEffect, useRef } from 'react'
import { X, Layers } from 'lucide-react'
import { useAppStore } from '@/store'
import * as THREE from 'three'

export const IndoorBimMode: React.FC = () => {
  const { setIndoorMode } = useAppStore()
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#FEFAF6')

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.0)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xC41E3A, 1.5, 50)
    pointLight.position.set(0, 5, 0)
    scene.add(pointLight)

    const buildingGroup = new THREE.Group()

    const floorGeo = new THREE.PlaneGeometry(20, 20, 10, 10)
    const floorMat = new THREE.MeshBasicMaterial({ 
      color: 0xD4C5B2, 
      wireframe: false,
      transparent: true,
      opacity: 0.5
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    buildingGroup.add(floor)

    const pillarGeo = new THREE.BoxGeometry(0.5, 4, 0.5)
    const pillarMat = new THREE.MeshPhongMaterial({ 
      color: 0xE8DFD5,
      transparent: true,
      opacity: 0.9
    })

    const positions: [number, number, number][] = [
      [-5, 2, -5], [5, 2, -5], [-5, 2, 5], [5, 2, 5]
    ]

    positions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.set(pos[0], pos[1], pos[2])
      buildingGroup.add(pillar)
    })

    const coreGeo = new THREE.OctahedronGeometry(1.5, 0)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xC41E3A,
      emissive: 0x8B1A2B,
      roughness: 0.3,
      metalness: 0.1
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    core.position.set(0, 3, 0)
    buildingGroup.add(core)

    scene.add(buildingGroup)

    camera.position.set(0, 8, 12)
    camera.lookAt(0, 0, 0)

    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()
      buildingGroup.rotation.y = elapsedTime * 0.08
      core.rotation.x = elapsedTime * 0.4
      core.rotation.y = elapsedTime * 0.25
      core.position.y = 3 + Math.sin(elapsedTime * 2) * 0.5
      renderer.render(scene, camera)
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
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[200] animate-in fade-in zoom-in-95 duration-700 flex flex-col" style={{ backgroundColor: '#FEFAF6' }}>
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#C41E3A] border border-[#C41E3A]/30 bg-[#FDE8EC] px-3 py-1 rounded-full w-fit">
            <Layers size={14} />
            <span className="text-xs font-bold tracking-wider">室内 BIM 结构透视模式</span>
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] tracking-wide font-serif">
            苏区镇政府大楼 — 建筑结构三维浏览
          </h2>
          <p className="text-[#5C5C5C] text-sm">
            请在 3D 空间中观察建筑的墙体承重、柱网布局与核心数据节点
          </p>
        </div>

        <button 
          onClick={() => setIndoorMode(false)}
          className="pointer-events-auto p-3 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all"
          aria-label="退出室内BIM模式"
        >
          <X size={22} />
        </button>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10 pointer-events-none">
        <div className="museum-card px-6 py-3 rounded-2xl flex items-center gap-4">
          <Layers className="text-[#C41E3A]" size={18} />
          <div className="flex flex-col">
            <span className="text-xs text-[#5C5C5C]">渲染模式</span>
            <span className="text-sm font-bold text-[#1A1A1A]">三维透视线框</span>
          </div>
        </div>
      </div>
    </div>
  )
}
