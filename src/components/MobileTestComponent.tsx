'use client'

import { useState } from 'react'

export default function MobileTestComponent() {
  const [message, setMessage] = useState('')

  const testMobileFeatures = () => {
    const isMobile = window.innerWidth < 768
    const hasTouch = 'ontouchstart' in window
    
    setMessage(`
      Screen width: ${window.innerWidth}px
      Is Mobile: ${isMobile}
      Has Touch: ${hasTouch}
      User Agent: ${navigator.userAgent.includes('Mobile')}
    `)
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white p-4 rounded-lg">
      <button 
        onClick={testMobileFeatures}
        className="bg-blue-500 px-4 py-2 rounded text-white mb-2"
      >
        Test Mobile Features
      </button>
      {message && (
        <pre className="text-xs whitespace-pre-wrap">
          {message}
        </pre>
      )}
    </div>
  )
}