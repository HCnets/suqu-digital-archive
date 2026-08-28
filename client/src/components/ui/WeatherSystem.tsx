import React, { useMemo } from 'react'
import { useAppStore } from '@/store'

const seeded = (seed: number) => {
  const value = Math.sin(seed * 9301 + 49297) * 233280
  return value - Math.floor(value)
}

export const WeatherSystem: React.FC = () => {
  const { weather } = useAppStore()
  const rainDrops = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    left: `${seeded(i + 1) * 100}%`,
    top: `${seeded(i + 81) * -100}%`,
    height: `${seeded(i + 161) * 20 + 10}px`,
    duration: `${seeded(i + 241) * 0.3 + 0.3}s`,
    delay: `${seeded(i + 321) * 2}s`
  })), [])

  const snowFlakes = useMemo(() => Array.from({ length: 50 }, (_, i) => {
    const size = seeded(i + 501) * 6 + 3
    return {
      left: `${seeded(i + 401) * 100}%`,
      top: `${seeded(i + 451) * -20}%`,
      width: `${size}px`,
      height: `${size}px`,
      duration: `${seeded(i + 551) * 3 + 4}s`,
      delay: `${seeded(i + 601) * 5}s`
    }
  }), [])

  if (weather === 'clear') return null

  const narrative = weather === 'rain'
    ? '细雨无声，追忆苏区峥嵘岁月——1927 年至 1930 年间，革命先辈在此浴血奋战，用生命守护信仰、开创红色政权。'
    : '山河肃穆，缅怀长眠于此的革命英烈——昔日浴血之地，今日红色血脉代代相传、精神永续。'

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden">
      <style>{`
        @keyframes rain {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes snow {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
      `}</style>
      {weather === 'rain' && (
        <div className="absolute inset-0">
          {rainDrops.map((drop, i) => (
            <div
              key={i}
              className="absolute w-[1px] opacity-40"
              style={{
                left: drop.left,
                top: drop.top,
                height: drop.height,
                background: `linear-gradient(to bottom, transparent, rgba(139, 105, 20, 0.6))`,
                animation: `rain ${drop.duration} linear infinite`,
                animationDelay: drop.delay
              }}
            />
          ))}
        </div>
      )}
      {weather === 'snow' && (
        <div className="absolute inset-0">
          {snowFlakes.map((flake, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/60"
              style={{
                left: flake.left,
                top: flake.top,
                width: flake.width,
                height: flake.height,
                animation: `snow ${flake.duration} linear infinite`,
                animationDelay: flake.delay
              }}
            />
          ))}
        </div>
      )}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-[min(88vw,520px)] px-6 py-4 text-center rounded-2xl bg-white/85 backdrop-blur-sm border border-[#E8DFD5] shadow-sm">
        <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif">{narrative}</p>
      </div>
    </div>
  )
}
