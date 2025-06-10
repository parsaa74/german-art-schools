export interface Track {
  name: string
  artist: string
  filename: string
  duration?: number
}

// Function to parse track information from filename
export const parseTrackInfo = (filename: string): { name: string; artist: string } => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i, '')
  
  // Handle different filename patterns
  // Pattern 1: "Track Number - Artist - Song Name.mp3"
  if (nameWithoutExt.includes(' - ') && nameWithoutExt.match(/^\d+/)) {
    const parts = nameWithoutExt.split(' - ')
    if (parts.length >= 3) {
      return {
        name: parts.slice(2).join(' - ').trim(),
        artist: parts[1].trim()
      }
    } else if (parts.length === 2) {
      return {
        name: parts[1].trim(),
        artist: 'Unknown Artist'
      }
    }
  }
  
  // Pattern 2: "Artist - Song Name.mp3"
  else if (nameWithoutExt.includes(' - ')) {
    const parts = nameWithoutExt.split(' - ')
    return {
      name: parts.slice(1).join(' - ').trim(),
      artist: parts[0].trim()
    }
  }
  
  // Pattern 3: "Track Number Song Name.mp3" (e.g., "03 Home Away From Home.mp3")
  else if (nameWithoutExt.match(/^\d+\s+/)) {
    return {
      name: nameWithoutExt.replace(/^\d+\s+/, '').trim(),
      artist: 'Unknown Artist'
    }
  }
  
  // Pattern 4: Special case for classical music with underscores
  else if (nameWithoutExt.includes('___')) {
    const parts = nameWithoutExt.split('___')
    if (parts.length >= 2) {
      return {
        name: parts[1].replace(/_/g, ' ').trim(),
        artist: parts[0].replace(/_/g, ' ').trim()
      }
    }
  }
  
  // Default: use filename as song name, clean up underscores
  return {
    name: nameWithoutExt.replace(/_/g, ' ').trim(),
    artist: 'Unknown Artist'
  }
}

// List of audio files to exclude (like narration files)
const EXCLUDED_FILES = [
  'intro.mp3', // narration file
  // Add more files to exclude here
]

// Get all available audio tracks from public/audio directory
// In a real app, this would be dynamic, but for build-time we'll use a predefined list
// that matches the actual files in public/audio
export const getAvailableTracks = (): Track[] => {
  // This would ideally be dynamic in a real server environment
  // For now, we maintain a list that should match the actual files
  const audioFiles = [
    'Olivier_Latry_La_nativité_du_Seigneur___3_Desseins_éternels.mp3',
    'ambient-pad.mp3'
    // Add more audio files here as you add them to public/audio
    // The scanner will automatically pick up files with supported extensions
  ]
  
  const filteredFiles = audioFiles
    .filter(filename => !EXCLUDED_FILES.includes(filename))
    .filter(filename => isAudioFile(filename))
  
  const tracks = filteredFiles.map(filename => ({
      filename,
      ...parseTrackInfo(filename)
    }))
  
  console.log('getAvailableTracks: Created', tracks.length, 'tracks:', tracks)
  return tracks
}

// Helper function to get track info by filename
export const getTrackByFilename = (filename: string): Track | null => {
  const tracks = getAvailableTracks()
  return tracks.find(track => track.filename === filename) || null
}

// Get next track in rotation
export const getNextTrack = (currentTrack: Track, tracks: Track[]): Track => {
  const currentIndex = tracks.findIndex(track => track.filename === currentTrack.filename)
  const nextIndex = (currentIndex + 1) % tracks.length
  return tracks[nextIndex]
}

// Get previous track in rotation
export const getPreviousTrack = (currentTrack: Track, tracks: Track[]): Track => {
  const currentIndex = tracks.findIndex(track => track.filename === currentTrack.filename)
  const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
  return tracks[prevIndex]
}

// Function to format time in MM:SS format
export const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00'
  
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Function to get file size in a readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Audio file extensions we support
export const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.webm']

// Common audio metadata
export interface AudioMetadata {
  title?: string
  artist?: string
  album?: string
  duration?: number
  genre?: string
}

// Check if file is a supported audio file
export const isAudioFile = (filename: string): boolean => {
  return SUPPORTED_AUDIO_EXTENSIONS.some(ext => 
    filename.toLowerCase().endsWith(ext)
  )
}

// Create a playlist from available tracks
export const createPlaylist = (tracks: Track[], shuffle: boolean = false): Track[] => {
  if (shuffle) {
    const shuffled = [...tracks]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  return [...tracks]
}