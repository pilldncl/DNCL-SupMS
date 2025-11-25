'use client'

import { ReactNode, useEffect, useState } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
}

/**
 * Wrapper component that adjusts main content area for mobile/desktop
 */
export function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <main style={{ 
      marginLeft: isMobile ? '0' : '240px', 
      marginTop: '64px',
      padding: isMobile ? '1rem' : '2rem',
      backgroundColor: '#f9fafb',
      minHeight: 'calc(100vh - 64px)',
    }}>
      {children}
    </main>
  )
}

