'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/order-list', label: 'Order List', icon: '📋' },
    { href: '/stock', label: 'Stock', icon: '📦' },
    { href: '/skus', label: 'SKUs', icon: '🔍' },
    { href: '/transactions', label: 'Transactions', icon: '📝' },
    { href: '/daily-report', label: 'Daily Report', icon: '📅' },
  ]

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1001,
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          aria-label="Toggle menu"
        >
          <span style={{ fontSize: '1.5rem' }}>{isOpen ? '✕' : '☰'}</span>
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: isMobile ? (isOpen ? 0 : '-240px') : 0,
        top: 0,
        width: '240px',
        height: '100vh',
        backgroundColor: '#111827',
        borderRight: '1px solid #374151',
        padding: '1.5rem 0',
        overflowY: 'auto',
        zIndex: 1000,
        transition: 'left 0.3s ease',
      }}>
        {/* Logo/Title */}
        <div style={{
          padding: '0 1.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #374151',
          paddingBottom: '1.5rem',
        }}>
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            Supply Order
          </Link>
          <p style={{
            margin: '0.25rem 0 0 0',
            fontSize: '0.75rem',
            color: '#9ca3af',
          }}>
            Management System
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0 1rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname === '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: isActive ? 'white' : '#9ca3af',
                  backgroundColor: isActive ? '#1f2937' : 'transparent',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s',
                  marginBottom: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isMobile) {
                    e.currentTarget.style.backgroundColor = '#1f2937'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isMobile) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#9ca3af'
                  }
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
