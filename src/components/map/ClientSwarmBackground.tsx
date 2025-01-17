import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { AudioSystem } from '../audio/AudioSystem'

interface ClientSwarmBackgroundProps {
  audioSystem: AudioSystem
  position?: [number, number, number]
  scale?: number
}

// Create a client-side only version of SwarmBackground
const SwarmBackgroundComponent = dynamic(
  () => import('./SwarmBackground').then(mod => mod.SwarmBackground),
  { 
    ssr: false,
    loading: () => null
  }
)

export function SwarmBackgroundWrapper(props: ClientSwarmBackgroundProps) {
  return (
    <Suspense fallback={null}>
      <SwarmBackgroundComponent {...props} />
    </Suspense>
  )
}

export default SwarmBackgroundWrapper 