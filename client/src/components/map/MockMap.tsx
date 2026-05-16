import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Box, Sphere } from '@react-three/drei'
import { cn } from '@/lib/utils'

interface MockMapProps {
  className?: string
  onPoiClick?: (poiId: string) => void
}

export const MockMap: React.FC<MockMapProps> = ({ className, onPoiClick }) => {
  return (
    <div className={cn('w-full h-full bg-slate-900', className)}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Mock Terrain */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Mock POI 1: 苏区镇政府 */}
        <Box 
          position={[-2, 0.5, -2]} 
          args={[2, 2, 2]}
          onClick={(e) => {
            e.stopPropagation()
            onPoiClick?.('suqu-gov')
          }}
          onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
          onPointerOut={(e) => (document.body.style.cursor = 'auto')}
        >
          <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.2} />
        </Box>

        {/* Mock POI 2: 革命旧址 */}
        <Sphere
          position={[3, 1, 1]}
          args={[1, 32, 32]}
          onClick={(e) => {
            e.stopPropagation()
            onPoiClick?.('revolution-site')
          }}
          onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
          onPointerOut={(e) => (document.body.style.cursor = 'auto')}
        >
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.2} />
        </Sphere>

        <Environment preset="city" />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  )
}