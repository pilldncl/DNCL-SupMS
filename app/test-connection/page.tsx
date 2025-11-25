'use client'

import { useState } from 'react'
import { OrderListService, SKUService, PartTypesService } from '@/lib/services'

/**
 * Test page to verify all functionality is working
 */
export default function TestConnectionPage() {
  const [status, setStatus] = useState<Record<string, { success: boolean; message: string }>>({})
  const [loading, setLoading] = useState(false)

  const testAll = async () => {
    setLoading(true)
    const results: Record<string, { success: boolean; message: string }> = {}

    // Test 1: Fetch SKUs
    try {
      const skus = await SKUService.getAllSKUs('sku_master')
      results.skus = {
        success: true,
        message: `✅ Successfully fetched ${skus.length} SKUs`,
      }
    } catch (err) {
      results.skus = {
        success: false,
        message: `❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }
    }

    // Test 2: Fetch Part Types
    try {
      const partTypes = await PartTypesService.getActivePartTypes()
      results.partTypes = {
        success: true,
        message: `✅ Successfully fetched ${partTypes.length} part types`,
      }
    } catch (err) {
      results.partTypes = {
        success: false,
        message: `❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }
    }

    // Test 3: Get/Create Week Cycle
    try {
      const weekCycle = await OrderListService.getCurrentWeekCycle()
      results.weekCycle = {
        success: true,
        message: `✅ Week cycle: ${weekCycle?.id || 'Created'}`,
      }
    } catch (err) {
      results.weekCycle = {
        success: false,
        message: `❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }
    }

    // Test 4: Get Order List
    try {
      const items = await OrderListService.getCurrentOrderList()
      results.orderList = {
        success: true,
        message: `✅ Order list: ${items.length} items`,
      }
    } catch (err) {
      results.orderList = {
        success: false,
        message: `❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }
    }

    // Test 5: Test Add Item (using first SKU and first part type)
    try {
      const [skus, partTypes] = await Promise.all([
        SKUService.getAllSKUs('sku_master'),
        PartTypesService.getActivePartTypes(),
      ])
      
      if (skus.length > 0 && partTypes.length > 0) {
        const testItem = await OrderListService.addItem(
          skus[0].id,
          partTypes[0].name,
          1
        )
        results.addItem = {
          success: true,
          message: `✅ Successfully added test item (ID: ${testItem.id.substring(0, 8)}...)`,
        }
        
        // Clean up test item
        await OrderListService.removeItem(testItem.id)
      } else {
        results.addItem = {
          success: false,
          message: '❌ No SKUs or part types available',
        }
      }
    } catch (err) {
      results.addItem = {
        success: false,
        message: `❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }
    }

    // Test 6: Test Reset (should work even with no items)
    try {
      await OrderListService.resetCurrentWeek()
      results.resetWeek = {
        success: true,
        message: '✅ Reset week completed',
      }
    } catch (err) {
      results.resetWeek = {
        success: false,
        message: `❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }
    }

    setStatus(results)
    setLoading(false)
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Connection & Functionality Test</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Test all database operations to verify everything is working
      </p>

      <button
        onClick={testAll}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '2rem',
        }}
      >
        {loading ? 'Testing...' : 'Run All Tests'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(status).map(([key, result]) => (
          <div
            key={key}
            style={{
              padding: '1rem',
              backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result.success ? '#86efac' : '#fca5a5'}`,
              borderRadius: '4px',
            }}
          >
            <strong style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
            {result.message}
          </div>
        ))}
      </div>

      {Object.keys(status).length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Click "Run All Tests" to verify functionality
        </p>
      )}
    </main>
  )
}

