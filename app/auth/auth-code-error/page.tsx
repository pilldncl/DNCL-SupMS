'use client'

import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#111827',
        }}>
          Authentication Error
        </h1>
        <p style={{
          margin: '0 0 1.5rem 0',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}>
          There was a problem authenticating your account. The link may have expired or already been used.
        </p>
        <Link
          href="/auth/sign-in"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}



