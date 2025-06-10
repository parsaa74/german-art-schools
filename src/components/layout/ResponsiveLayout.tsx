'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/stores/schoolStore'
import InfoPanel from '@/components/map/InfoPanel'
import MobileInfoPanel from '@/components/map/MobileInfoPanel'
import MobileNavigation from '@/components/navigation/MobileNavigation'
import { SearchModal } from '@/components/ui/SearchModal'
import { SearchButton } from '@/components/ui/SearchButton'
import CollapsibleControlPanel from '@/components/ui/CollapsibleControlPanel'
import ViewModeToggle from '@/components/map/ViewModeToggle'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  showControls?: boolean
}

export default function ResponsiveLayout({ 
  children, 
  showControls = true 
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { selectedUniversity, setSelectedUniversity } = useSchoolStore()

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchOpen = () => setIsSearchOpen(true)
  const handleSearchClose = () => setIsSearchOpen(false)
  
  const handleSettingsToggle = () => setIsSettingsOpen(!isSettingsOpen)
  
  const handleInfoPanelClose = () => setSelectedUniversity(null)

  function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Main Content */}
      <div className={cn(
        "absolute inset-0",
        isMobile ? "pb-20" : ""
      )}>
        {children}
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          onSearchOpen={handleSearchOpen}
          onSettingsOpen={handleSettingsToggle}
        />
      )}

      {/* Desktop Controls */}
      {!isMobile && showControls && (
        <>
          {/* Search Button */}
          <div className="fixed top-4 left-4 z-30 pointer-events-auto">
            <SearchButton onClick={handleSearchOpen} />
          </div>

          {/* Settings Panel */}
          <CollapsibleControlPanel
            position="top-right"
            panelTitle="Visualization Settings"
            triggerIcon={<SettingsIcon />}
          >
            <div className="space-y-3">
              <div className="text-xs text-gray-400 mb-2">
                Customize your visualization experience
              </div>
              
              {/* Placeholder for settings controls */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-blue-300 mb-2">View Mode</div>
                <div className="text-xs text-gray-400">
                  Use the view toggle to switch between 3D and 2D modes
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-blue-300 mb-2">Interactions</div>
                <div className="text-xs text-gray-400">
                  • Click markers to view details<br/>
                  • Drag to rotate the view<br/>
                  • Scroll to zoom in/out
                </div>
              </div>
            </div>
          </CollapsibleControlPanel>

          {/* View Mode Toggle */}
          <ViewModeToggle />
        </>
      )}

      {/* Mobile View Toggle - repositioned for mobile */}
      {isMobile && showControls && (
        <div className="fixed bottom-24 left-4 z-30 pointer-events-auto">
          <ViewModeToggle />
        </div>
      )}

      {/* Info Panels */}
      {selectedUniversity && (
        <>
          {/* Desktop Info Panel */}
          {!isMobile && (
            <InfoPanel
              school={selectedUniversity}
              isOpen={!!selectedUniversity}
              onClose={handleInfoPanelClose}
            />
          )}

          {/* Mobile Info Panel */}
          {isMobile && (
            <MobileInfoPanel
              school={selectedUniversity}
              isOpen={!!selectedUniversity}
              onClose={handleInfoPanelClose}
            />
          )}
        </>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleSearchClose}
      />
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}