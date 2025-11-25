'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Home page - Redirects to dashboard (treats as post-login)
 */
export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Auto-redirect to dashboard after login
    router.push('/dashboard')
  }, [router])

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#0070f3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Redirecting to dashboard...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
