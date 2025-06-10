'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@nextui-org/react'
import { 
  FaPlay, 
  FaPause, 
  FaStepForward, 
  FaStepBackward, 
  FaVolumeUp, 
  FaVolumeDown,
  FaVolumeMute,
  FaExpand,
  FaCompress
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvailableTracks, formatTime as utilFormatTime, type Track } from '@/utils/audioUtils'

const MusicPlayer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.3)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.3)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Get available tracks
  const tracks = getAvailableTracks()
  const currentTrack = tracks[currentTrackIndex] || { name: 'No Track', artist: 'No Artist', filename: '' }

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current || tracks.length === 0) return

    const audio = audioRef.current
    audio.volume = volume
    audio.src = `/audio/${currentTrack.filename}`
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0)
    }
    
    const handleEnded = () => {
      nextTrack()
    }
    
    const handleError = (e: Event) => {
      console.error('Audio loading error:', e)
      // Try next track if current fails to load
      if (tracks.length > 1) {
        nextTrack()
      }
    }
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [currentTrackIndex, volume, nextTrack, tracks.length, currentTrack.filename])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || tracks.length === 0) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Play error:', error)
        // If autoplay is blocked, we'll just update the UI state
        setIsPlaying(false)
      })
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, tracks.length])

  const nextTrack = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length
    setCurrentTrackIndex(nextIndex)
    setCurrentTime(0)
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play().catch(console.error)
      }, 100)
    }
  }, [currentTrackIndex, isPlaying])

  const previousTrack = useCallback(() => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1
    setCurrentTrackIndex(prevIndex)
    setCurrentTime(0)
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play().catch(console.error)
      }, 100)
    }
  }, [currentTrackIndex, isPlaying])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolume)
      setIsMuted(false)
    } else {
      setPreviousVolume(volume)
      setIsMuted(true)
    }
  }, [isMuted, volume, previousVolume])

  // Debug logging
  useEffect(() => {
    console.log('MusicPlayer: Component mounted!')
    console.log('MusicPlayer: Available tracks:', tracks)
    console.log('MusicPlayer: tracks.length:', tracks.length)
  }, [tracks])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  console.log('MusicPlayer: Rendering now with tracks.length:', tracks.length)

  return (
    <>
      <audio ref={audioRef} />
      
      {/* Always show a debug indicator first */}
      <div className="fixed top-4 left-4 z-50 bg-green-500 text-white p-2 rounded text-xs">
        Music Player Loaded! Tracks: {tracks.length}
      </div>
      
      <AnimatePresence>
        {/* Minimized Player */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-black/40 backdrop-blur-md rounded-full p-3 border border-white/10 shadow-lg"
            >
              <Button
                isIconOnly
                variant="light"
                onClick={togglePlay}
                className="text-white/90 hover:text-white text-xl"
                size="sm"
                disabled={tracks.length === 0}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </Button>
            </motion.div>
            
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500/80 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-500 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaExpand className="w-2 h-2" />
            </motion.button>
          </motion.div>
        )}

        {/* Expanded Player */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 w-80"
          >
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-white/60 text-xs uppercase tracking-wider">
                  Now Playing
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="text-white/60 hover:text-white/90"
                >
                  <FaCompress />
                </Button>
              </div>

              {/* Track Info */}
              <div className="mb-4">
                <div className="text-white font-medium text-lg mb-1 truncate">
                  {tracks.length > 0 ? currentTrack.name : 'No tracks available'}
                </div>
                <div className="text-white/60 text-sm truncate">
                  {tracks.length > 0 ? currentTrack.artist : 'Add audio files to /public/audio'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div 
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="w-full h-2 bg-white/10 rounded-full cursor-pointer group"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300 group-hover:from-blue-300 group-hover:to-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>{utilFormatTime(currentTime)}</span>
                  <span>{utilFormatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Button
                  isIconOnly
                  variant="light"
                  onClick={previousTrack}
                  className="text-white/70 hover:text-white text-lg"
                  size="sm"
                >
                  <FaStepBackward />
                </Button>
                
                <Button
                  isIconOnly
                  variant="solid"
                  onClick={togglePlay}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xl w-12 h-12"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </Button>
                
                <Button
                  isIconOnly
                  variant="light"
                  onClick={nextTrack}
                  className="text-white/70 hover:text-white text-lg"
                  size="sm"
                >
                  <FaStepForward />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-3">
                <Button
                  isIconOnly
                  variant="light"
                  onClick={toggleMute}
                  className="text-white/60 hover:text-white/90"
                  size="sm"
                >
                  {isMuted ? <FaVolumeMute /> : volume < 0.5 ? <FaVolumeDown /> : <FaVolumeUp />}
                </Button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value)
                      setVolume(newVolume)
                      if (newVolume > 0 && isMuted) {
                        setIsMuted(false)
                      }
                    }}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Track List Indicator - Only show if more than 1 track */}
              {tracks.length > 1 && (
                <div className="flex justify-center space-x-1 mt-4">
                  {tracks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTrackIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentTrackIndex 
                          ? 'bg-blue-500' 
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(59 130 246);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(59 130 246);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </>
  )
}

export default MusicPlayer