'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Globe2 } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Define navigation links
  const navLinks = [
    { name: '3D View', path: '/' },
    { name: 'D3 Network', path: '/d3-visualization' }
  ]

  // Don't render desktop nav on mobile
  if (isMobile) return null

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        isScrolled ? 'bg-black/50 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <Globe2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">
                German Art Schools
              </span>
              <span className="text-white font-bold text-lg sm:hidden">
                GAS
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.path
              
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-blue-300' 
                      : 'text-gray-300 hover:text-white hover:bg-black/20'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                      layoutId="navbar-indicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
