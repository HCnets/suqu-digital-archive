import React from 'react'
import { useAppStore } from '@/store'

export const WeatherSystem: React.FC = () => {
  const { weather } = useAppStore()
  
  if (weather === 'clear') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden mix-blend-screen opacity-50">
      {weather === 'rain' && (
        <div 
          className="absolute inset-0 bg-[url('https://assets.codepen.io/13471/rain.png')] animate-[rain_0.3s_linear_infinite]"
          style={{ backgroundSize: '100px' }}
        />
      )}
      {weather === 'snow' && (
        <div 
          className="absolute inset-0 bg-[url('https://assets.codepen.io/13471/snow.png')] animate-[snow_3s_linear_infinite]"
          style={{ backgroundSize: '400px' }}
        />
      )}
      <style>{`
        @keyframes rain {
          0% { background-position: 0 0; }
          100% { background-position: 20px 1000px; }
        }
        @keyframes snow {
          0% { background-position: 0 0; }
          100% { background-position: 100px 1000px; }
        }
      `}</style>
    </div>
  )
}