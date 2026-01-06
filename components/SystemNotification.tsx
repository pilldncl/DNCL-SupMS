'use client'

import { useState, useEffect } from 'react'

/**
 * System notification banner - Integrated into page design
 * Smoothly slides away when dismissed
 */
export function SystemNotification() {
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissing, setIsDismissing] = useState(false)

  // Check if user has dismissed this notification before
  useEffect(() => {
    const dismissed = localStorage.getItem('system-notification-dismissed')
    if (dismissed === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissing(true)
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false)
      localStorage.setItem('system-notification-dismissed', 'true')
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderRadius: '12px',
        border: '2px solid #fbbf24',
        boxShadow: '0 4px 6px rgba(251, 191, 36, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        transition: 'all 0.3s ease-out',
        transform: isDismissing ? 'translateX(100%)' : 'translateX(0)',
        opacity: isDismissing ? 0 : 1,
        maxWidth: '1400px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '1rem',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flex: 1,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.125rem',
          flexShrink: 0,
        }}>
          ⚠️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#92400e',
            marginBottom: '0.125rem',
          }}>
            System Update
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#78350f',
            lineHeight: '1.4',
          }}>
            We're fine-tuning the system. Thank you for your patience!
          </div>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          padding: '0.375rem 0.5rem',
          backgroundColor: 'rgba(146, 64, 14, 0.1)',
          border: '1px solid rgba(146, 64, 14, 0.2)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem',
          color: '#92400e',
          fontWeight: '600',
          lineHeight: 1,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(146, 64, 14, 0.2)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(146, 64, 14, 0.1)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

