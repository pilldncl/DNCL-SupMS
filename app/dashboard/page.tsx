'use client'

import { useState, useEffect } from 'react'
import { OrderListService, StockService } from '@/lib/services'
import type { OrderListSummary, OrderListItem, WeekCycle, StockItem } from '@/lib/types/supply'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useMobile } from '@/lib/hooks/useMobile'

/**
 * Professional Dashboard - Simplified, Less Cluttered
 */
export default function DashboardPage() {
  const isMobile = useMobile()
  const [summary, setSummary] = useState<OrderListSummary | null>(null)
  const [weekCycle, setWeekCycle] = useState<WeekCycle | null>(null)
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryData, cycle, lowStock] = await Promise.all([
        OrderListService.getOrderListSummary(),
        OrderListService.getCurrentWeekCycle(),
        StockService.getLowStockItems().catch(() => []), // Don't fail dashboard if stock fails
      ])
      setSummary(summaryData)
      setWeekCycle(cycle)
      setLowStockItems(lowStock)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        marginLeft: '240px',
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
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Sidebar />
        <TopBar />
        <main style={{ 
          marginLeft: '240px', 
          marginTop: '64px',
          padding: '2rem',
        }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '8px',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        </main>
      </>
    )
  }

  if (!summary) {
    return null
  }

  const completionPercentage = summary.total_items > 0
    ? Math.round((summary.ordered_items / summary.total_items) * 100)
    : 0

  const weekStartDate = weekCycle?.start_date 
    ? new Date(weekCycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''
  const weekEndDate = weekCycle?.end_date
    ? new Date(weekCycle.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  return (
    <>
      <Sidebar />
      <TopBar />
      <main style={{ 
        marginLeft: isMobile ? '0' : '240px', 
        marginTop: '64px',
        padding: isMobile ? '1rem' : '2rem',
        backgroundColor: '#f9fafb',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            margin: '0 0 0.5rem 0',
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#111827',
          }}>
            Welcome back! 👋
          </h1>
          {weekCycle && (
            <p style={{ 
              margin: 0,
              color: '#6b7280', 
              fontSize: '0.95rem',
            }}>
              Week {weekCycle.id} • {weekStartDate} - {weekEndDate}
            </p>
          )}
        </div>

        {/* Key Metrics - Simplified */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '2rem' 
        }}>
          <MetricCard
            title="Total Items"
            value={summary.total_items}
            icon="📦"
            color="#6366f1"
            bgColor="#eef2ff"
          />

          <MetricCard
            title="Pending"
            value={summary.pending_items}
            icon="⏳"
            color="#f59e0b"
            bgColor="#fffbeb"
          />

          <MetricCard
            title="Completed"
            value={summary.ordered_items}
            icon="✅"
            color="#10b981"
            bgColor="#ecfdf5"
          />

          <MetricCard
            title="Progress"
            value={`${completionPercentage}%`}
            icon="📊"
            color="#0070f3"
            bgColor="#eff6ff"
          />
        </div>

        {/* Progress Bar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
              Weekly Progress
            </h2>
            <span style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              fontWeight: '500',
            }}>
              {summary.ordered_items} of {summary.total_items} completed
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              backgroundColor: '#10b981',
              borderRadius: '6px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem', 
            fontWeight: '600',
            color: '#111827',
          }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/order-list"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0051cc'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0070f3'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              <span>+</span>
              <span>Add Item to Order List</span>
            </Link>
            <Link
              href="/order-list"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#111827',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
            >
              <span>📋</span>
              <span>View Order List</span>
            </Link>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: string
  color: string
  bgColor: string
}

function MetricCard({ title, value, icon, color, bgColor }: MetricCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginTop: '0.25rem' }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  )
}
