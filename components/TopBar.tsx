'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TopBarProps {
  onSearch?: (query: string) => void
}

export function TopBar({ onSearch }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/order-list?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: isMobile ? '0' : '240px',
      right: 0,
      height: '64px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: isMobile ? '0 1rem 0 4rem' : '0 2rem',
      display: 'flex',
      alignItems: 'center',
      zIndex: 998,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      <form 
        onSubmit={handleSearch}
        style={{
          flex: 1,
          maxWidth: '600px',
        }}
      >
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isMobile ? "Search..." : "Search SKUs, items, or orders..."}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: isMobile ? '0.875rem' : '0.875rem',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0070f3'
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 112, 243, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db'
              e.target.style.boxShadow = 'none'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '0.75rem',
            fontSize: '1.125rem',
          }}>
            🔍
          </span>
        </div>
      </form>
    </header>
  )
}
