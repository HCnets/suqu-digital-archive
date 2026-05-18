import React from 'react'
import { useAppStore } from '@/store'

export const WeatherSystem: React.FC = () => {
  const { weather } = useAppStore()
  
  if (weather === 'clear') return null

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
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[1px] opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * -100}%`,
                height: `${Math.random() * 20 + 10}px`,
                background: `linear-gradient(to bottom, transparent, rgba(139, 105, 20, 0.6))`,
                animation: `rain ${Math.random() * 0.3 + 0.3}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      {weather === 'snow' && (
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * -20}%`,
                width: `${Math.random() * 6 + 3}px`,
                height: `${Math.random() * 6 + 3}px`,
                animation: `snow ${Math.random() * 3 + 4}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
