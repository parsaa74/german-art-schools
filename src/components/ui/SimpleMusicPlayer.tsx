'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaMusic } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

// Simple track list - update this when you add more music files
const tracks = [
  {
    name: 'Desseins Éternels',
    artist: 'Olivier Latry',
    filename: 'olivier-latry-desseins-eternels.mp3'
  }
  // Add more tracks here as you add audio files to /public/audio/
]

const SimpleMusicPlayer: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentTrack = tracks[currentTrackIndex]

  // Load audio when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      // Use the correct base path for Vite
      const audioPath = `/german-art-schools/audio/${currentTrack.filename}`
      console.log('Loading audio:', audioPath)
      audioRef.current.src = audioPath
      audioRef.current.load()
    }
  }, [currentTrackIndex, currentTrack])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration)
      setDuration(audio.duration)
    }
    const handleEnded = () => nextTrack()
    const handleError = (e) => {
      console.error('Audio error:', e)
      console.error('Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      })
    }
    const handleCanPlay = () => {
      console.log('Audio can play')
    }
    const handleLoadStart = () => {
      console.log('Audio load started')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    console.log('Toggle play, current state:', isPlaying)
    console.log('Audio src:', audioRef.current.src)
    console.log('Audio readyState:', audioRef.current.readyState)
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Play error:', error)
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length
    setCurrentTrackIndex(nextIndex)
    setCurrentTime(0)
  }

  const previousTrack = () => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1
    setCurrentTrackIndex(prevIndex)
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <audio ref={audioRef} />
      
      <AnimatePresence>
        {/* Minimized Music Button */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 left-4 z-30"
          >
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="ui-organic flex items-center justify-center w-12 h-12 text-white hover:text-white transition-all duration-300 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Open Music Player"
            >
              <FaMusic size={16} className="group-hover:scale-110 transition-transform" />
              
              {/* Small playing indicator */}
              {isPlaying && (
                <motion.div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <div className="w-1 h-1 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Expanded Music Player */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 left-4 z-30 w-72"
          >
            <div className="ui-organic p-4 text-white">
              {/* Header with close button */}
              <div className="flex justify-between items-center mb-3">
                <div className="text-xs uppercase tracking-wider text-blue-300">Now Playing</div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/60 hover:text-white/90 transition-colors"
                  aria-label="Minimize Player"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Track Info */}
              <div className="mb-3">
                <div className="font-medium text-sm truncate text-white">
                  {currentTrack?.name || 'No Track'}
                </div>
                <div className="text-white/60 text-xs truncate">
                  {currentTrack?.artist || 'No Artist'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full h-1 bg-white/10 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={previousTrack}
                  className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                  disabled={tracks.length <= 1}
                  aria-label="Previous Track"
                >
                  <FaStepBackward size={12} />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
                </button>
                
                <button
                  onClick={nextTrack}
                  className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                  disabled={tracks.length <= 1}
                  aria-label="Next Track"
                >
                  <FaStepForward size={12} />
                </button>
              </div>

              {/* Track Indicator */}
              {tracks.length > 1 && (
                <div className="flex justify-center space-x-1.5 mt-3">
                  {tracks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTrackIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentTrackIndex 
                          ? 'bg-blue-400 shadow-lg shadow-blue-400/50' 
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Play track ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SimpleMusicPlayer