'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function NavBar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Define navigation links
  const navLinks = [
    { name: '3D View', path: '/' },
    { name: 'D3 Network', path: '/d3-visualization' }
  ]

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
            <Link href="/" className="flex-shrink-0">
              <span className="text-white font-bold text-xl">
                German Art Schools
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
