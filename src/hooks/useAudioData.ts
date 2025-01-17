import { useEffect, useState } from 'react'

interface AudioData {
  reactivity: number
  bands: {
    low: number
    mid: number
    high: number
  }
}

export function useAudioData() {
  const [audioData, setAudioData] = useState<AudioData>({
    reactivity: 0,
    bands: {
      low: 0,
      mid: 0,
      high: 0
    }
  })

  useEffect(() => {
    // Mock audio data for now - replace with actual audio analysis
    const interval = setInterval(() => {
      setAudioData({
        reactivity: Math.random() * 0.5,
        bands: {
          low: Math.random() * 0.5,
          mid: Math.random() * 0.5,
          high: Math.random() * 0.5
        }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return { audioData }
} 