import { useRef, useEffect } from 'react'

export type TrackName = 'pad' | 'drone' | 'pulse' | 'messiaen'

export function useAmbientMusic() {
  const ctxRef = useRef<AudioContext>()
  const masterGainRef = useRef<GainNode>()
  const oscillatorsRef = useRef<OscillatorNode[]>([])
  const lfoGainRef = useRef<GainNode>()
  const birdsIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    ctxRef.current = ctx

    // Master gain node
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0.0 // start silent
    masterGain.connect(ctx.destination)
    masterGainRef.current = masterGain

    // Create pad oscillators (simple triad chord)
    const freqs = [220, 277, 330]
    const oscs: OscillatorNode[] = []
    freqs.forEach((f) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      // connect directly to masterGain (no per-oscillator gain)
      osc.connect(masterGain)
      osc.start()
      oscs.push(osc)
    })
    oscillatorsRef.current = oscs

    // LFO for pulsing effect
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 1.0 // 1 Hz pulse
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.0 // no modulation by default
    lfo.connect(lfoGain).connect(masterGain.gain)
    lfo.start()
    lfoGainRef.current = lfoGain

    // Resume audio on first user interaction
    const resume = () => {
      if (ctx.state === 'suspended') {
        ctx.resume()
          .then(() => {
            // start default pad track
            masterGain.gain.setValueAtTime(0, ctx.currentTime)
            masterGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1)
          })
      }
      // cleanup resume listener
      window.removeEventListener('click', resume)
      window.removeEventListener('keydown', resume)
    }
    window.addEventListener('click', resume)
    window.addEventListener('keydown', resume)

    return () => {
      oscs.forEach((o) => o.stop())
      lfo.stop()
      if (birdsIntervalRef.current) {
        clearInterval(birdsIntervalRef.current)
        birdsIntervalRef.current = null
      }
      ctx.close()
    }
  }, [])

  function playTrack(track: TrackName) {
    const ctx = ctxRef.current
    const masterGain = masterGainRef.current
    const lfoGain = lfoGainRef.current
    if (!ctx || !masterGain || !lfoGain) return
    // resume if needed
    if (ctx.state === 'suspended') ctx.resume()

    // clear any Messiaen birds interval when changing track
    if (birdsIntervalRef.current) {
      clearInterval(birdsIntervalRef.current)
      birdsIntervalRef.current = null
    }

    switch (track) {
      case 'pad':
        // gentle pad
        masterGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1)
        lfoGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1)
        break
      case 'drone':
        // deeper drone with slight modulation
        masterGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1)
        lfoGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1)
        break
      case 'pulse':
        // pulsing effect
        masterGain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.05)
        lfoGain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.05)
        break
      case 'messiaen':
        // Messiaen Mode 3 birdsong simulation
        masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1)
        lfoGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1)
        // schedule random bird-like notes
        birdsIntervalRef.current = window.setInterval(() => {
          const osc = ctx.createOscillator()
          osc.type = 'triangle'
          const semitones = [0,2,3,4,6,7,8,10]
          const freqs = semitones.map(n => 220 * Math.pow(2, n/12))
          osc.frequency.value = freqs[Math.floor(Math.random() * freqs.length)]
          const gain = ctx.createGain()
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
          osc.connect(gain).connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.1)
        }, 700)
        break
    }
  }

  return { playTrack }
} 