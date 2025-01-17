'use client'

import { ReactNode, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Import the material for side effects only
import './shaders/GlobeMaterial'

interface Props {
  children: ReactNode
}

function GlobeMaterialProvider({ children }: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Material is registered on the client side
    setReady(true)
  }, [])

  if (!ready) return null

  return <>{children}</>
}

// Export as dynamic component with no SSR
export default dynamic(() => Promise.resolve(GlobeMaterialProvider), {
  ssr: false
}) 