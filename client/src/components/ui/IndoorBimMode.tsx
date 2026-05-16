import React, { useEffect, useRef } from 'react'
import { X, Cpu, Layers } from 'lucide-react'
import { useAppStore } from '@/store'
import * as THREE from 'three'

export const IndoorBimMode: React.FC = () => {
  const { setIndoorMode } = useAppStore()
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Initialize Three.js scene for BIM mock
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0f18')
    scene.fog = new THREE.FogExp2('#0a0f18', 0.05)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x3b82f6, 2, 50)
    pointLight.position.set(0, 5, 0)
    scene.add(pointLight)

    // Create wireframe floor plan (BIM Mock)
    const buildingGroup = new THREE.Group()

    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20, 10, 10)
    const floorMat = new THREE.MeshBasicMaterial({ 
      color: 0x1e3a8a, 
      wireframe: true,
      transparent: true,
      opacity: 0.3
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    buildingGroup.add(floor)

    // Pillars / Structure
    const pillarGeo = new THREE.BoxGeometry(0.5, 4, 0.5)
    const pillarMat = new THREE.MeshPhongMaterial({ 
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.8,
      wireframe: true
    })

    const positions = [
      [-5, 2, -5], [5, 2, -5], [-5, 2, 5], [5, 2, 5]
    ]

    positions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.set(pos[0], pos[1], pos[2])
      buildingGroup.add(pillar)
    })

    // Core Data Hub
    const coreGeo = new THREE.OctahedronGeometry(1.5, 0)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      wireframe: true
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    core.position.set(0, 3, 0)
    buildingGroup.add(core)

    scene.add(buildingGroup)

    camera.position.set(0, 8, 12)
    camera.lookAt(0, 0, 0)

    // Animation Loop
    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      buildingGroup.rotation.y = elapsedTime * 0.1
      core.rotation.x = elapsedTime * 0.5
      core.rotation.y = elapsedTime * 0.3
      
      core.position.y = 3 + Math.sin(elapsedTime * 2) * 0.5 // Floating effect

      renderer.render(scene, camera)
    }

    animate()

    // Handle Resize
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
    <div className="fixed inset-0 z-[200] bg-black animate-in fade-in zoom-in-95 duration-700 flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full backdrop-blur-md w-fit">
            <Cpu size={14} className="animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase">Indoor BIM Engine Active</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-widest drop-shadow-lg">
            苏区镇政府大楼 - 结构透视
          </h2>
          <p className="text-blue-300/70 font-mono text-sm">
            LEVEL 1 / CORE DATA HUB / REAL-TIME MONITORING
          </p>
        </div>

        <button 
          onClick={() => setIndoorMode(false)}
          className="pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-white border border-white/20 hover:border-red-500/50 transition-all backdrop-blur-md"
        >
          <X size={24} />
        </button>
      </div>

      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Footer Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10 pointer-events-none">
        <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4">
          <Layers className="text-blue-400" />
          <div className="flex flex-col">
            <span className="text-xs text-white/50">RENDER MODE</span>
            <span className="text-sm font-bold text-white">WIREFRAME</span>
          </div>
        </div>
      </div>
    </div>
  )
}