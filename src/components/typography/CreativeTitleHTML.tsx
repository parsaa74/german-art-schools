import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface CreativeTitleHTMLProps {
  text: string
  introProgress: number
  fontSize?: number
  className?: string
}

export function CreativeTitleHTML({
  text,
  introProgress,
  fontSize = 2.0,
  className = ''
}: CreativeTitleHTMLProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Split text into characters for animation
  const characters = text.split('')

  // Character animation variants
  const charVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.5,
      filter: 'blur(10px)'
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        delay: i * 0.04 + 0.5,
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    })
  }

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        fontSize: `${fontSize}rem`,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.02em',
        WebkitFontSmoothing: 'antialiased'
      }}
    >
      {/* Glow effect container */}
      <div className="absolute inset-0 blur-[40px] opacity-50 bg-gradient-to-r from-blue-500/30 via-cyan-400/30 to-blue-500/30" />
      
      {/* Text container */}
      <div className="relative flex items-center justify-center">
        {characters.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            custom={i}
            variants={charVariants}
            initial="hidden"
            animate={introProgress > 0 ? "visible" : "hidden"}
            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-200 to-blue-400"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
} 