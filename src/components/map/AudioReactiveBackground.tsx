import { SwarmBackground } from './SwarmBackground'
import { AudioSystem } from '../audio/AudioSystem'

interface AudioReactiveBackgroundProps {
  audioSystem: AudioSystem
}

export function AudioReactiveBackground({ audioSystem }: AudioReactiveBackgroundProps) {
  return <SwarmBackground audioSystem={audioSystem} />
} 