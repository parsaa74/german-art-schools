'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Search, Settings, Home, BarChart3, Globe2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSchoolStore } from '@/stores/schoolStore'

interface MobileNavigationProps {
  onSearchOpen?: () => void
  onSettingsOpen?: () => void
}

export default function MobileNavigation({ 
  onSearchOpen, 
  onSettingsOpen 
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { selectedUniversity } = useSchoolStore()

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Don't render on desktop
  if (!isMobile) return null

  const menuItems = [
    {
      name: '3D View',
      path: '/',
      icon: <Globe2 className="h-5 w-5" />,
      description: 'Interactive 3D visualization'
    },
    {
      name: 'Network Graph',
      path: '/d3-visualization',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'D3.js network analysis'
    }
  ]

  const actionItems = [
    {
      name: 'Search',
      action: () => {
        onSearchOpen?.()
        setIsOpen(false)
      },
      icon: <Search className="h-5 w-5" />,
      description: 'Find schools and programs'
    },
    {
      name: 'Settings',
      action: () => {
        onSettingsOpen?.()
        setIsOpen(false)
      },
      icon: <Settings className="h-5 w-5" />,
      description: 'Visualization controls'
    }
  ]

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="mobile-nav">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo/Title */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Globe2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm truncate">
              German Art Schools
            </span>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <motion.button
              onClick={() => onSearchOpen?.()}
              className="mobile-button p-2 text-gray-400 hover:text-white transition-colors"
              whileTap={{ scale: 0.95 }}
              aria-label="Search schools"
            >
              <Search className="h-5 w-5" />
            </motion.button>

            {/* Menu Toggle */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="mobile-button p-2 text-gray-400 hover:text-white transition-colors"
              whileTap={{ scale: 0.95 }}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? 'x' : 'menu'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Selected School Indicator */}
        {selectedUniversity && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-2"
          >
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-300 font-medium truncate">
                  {selectedUniversity.name}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="mobile-drawer mobile-scrollbar-hide overflow-y-auto"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
              </div>

              <div className="px-6 pb-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Navigation
                  </h2>
                  <p className="text-xs text-gray-400">
                    Explore German art schools
                  </p>
                </div>

                {/* Navigation Items */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </h3>
                  {menuItems.map((item) => {
                    const isActive = pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className={`${
                          isActive ? 'text-blue-400' : 'text-gray-500'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Action Items */}
                <div className="space-y-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </h3>
                  {actionItems.map((item) => (
                    <motion.button
                      key={item.name}
                      onClick={item.action}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-gray-500">{item.icon}</div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <div className="text-center text-xs text-gray-500">
                    <p>Interactive visualization of</p>
                    <p className="text-blue-400 font-medium">German Art Schools</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}