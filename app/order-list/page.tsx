'use client'

import { useState, useEffect } from 'react'
import { OrderListService } from '@/lib/services'
import type { OrderListItem } from '@/lib/types/supply'
import { OrderListItemWorkflow } from '@/components/OrderListItemWorkflow'
import { AddItemModal } from '@/components/AddItemModal'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useMobile } from '@/lib/hooks/useMobile'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Card,
  Badge,
  Separator,
  Alert,
  Spinner,
  Grid,
  GridItem,
  Checkbox,
  Tabs,
} from '@chakra-ui/react'

type TabValue = 'PENDING' | 'ORDERED' | 'SHIPPING' | 'RECEIVED' | 'COMPLETED'

/**
 * Main Order List page - Tabbed interface for order workflow
 */
export default function OrderListPage() {
  const isMobile = useMobile()
  const [items, setItems] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [weekCycleId, setWeekCycleId] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('PENDING')

  const loadOrderList = async () => {
    setLoading(true)
    setError(null)
    try {
      const [listItems, weekCycle] = await Promise.all([
        OrderListService.getCurrentOrderList(),
        OrderListService.getCurrentWeekCycle(),
      ])
      setItems(listItems)
      setWeekCycleId(weekCycle?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order list')
      console.error('Error loading order list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrderList()
  }, [])

  const handleStatusChange = async () => {
    await loadOrderList()
  }

  const handleRemove = async (itemId: string) => {
    try {
      await OrderListService.removeItem(itemId)
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    }
  }

  const handleAddItem = async (skuId: string | number, partType: string, quantity?: number) => {
    try {
      setError(null)
      await OrderListService.addItem(skuId, partType, quantity)
      await loadOrderList()
    } catch (err) {
      throw err
    }
  }

  const handleResetWeek = async () => {
    if (!confirm('Are you sure you want to reset this week\'s order list? This will delete all items in the current week. This cannot be undone.')) {
      return
    }

    setError(null)
    try {
      await OrderListService.resetCurrentWeek()
      await loadOrderList()
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset week'
      setError(errorMessage)
      console.error('Reset week error:', err)
    }
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleSelectAll = (itemIds: string[]) => {
    if (selectedItems.size === itemIds.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(itemIds))
    }
  }

  const handleBulkMarkAsOrdered = async () => {
    if (selectedItems.size === 0) return
    
    if (!confirm(`Set ${selectedItems.size} item(s) as ordered?`)) return

    setBulkUpdating(true)
    try {
      await Promise.all(
        Array.from(selectedItems).map(id => OrderListService.markAsOrdered(id))
      )
      setSelectedItems(new Set())
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update items')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleBulkRemove = async () => {
    if (selectedItems.size === 0) return
    
    if (!confirm(`Remove ${selectedItems.size} item(s) from the order list?`)) return

    setBulkUpdating(true)
    try {
      await Promise.all(
        Array.from(selectedItems).map(id => OrderListService.removeItem(id))
      )
      setSelectedItems(new Set())
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove items')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleMarkAllPendingAsOrdered = async () => {
    if (pendingItems.length === 0) return
    
    if (!confirm(`Set all ${pendingItems.length} pending item(s) as ordered?`)) return

    setBulkUpdating(true)
    try {
      await Promise.all(
        pendingItems.map(item => OrderListService.markAsOrdered(item.id))
      )
      await loadOrderList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update items')
    } finally {
      setBulkUpdating(false)
    }
  }

  // Group items by status - exclude completed items from active workflow
  const getItemStatus = (item: OrderListItem) => {
    return (item.status as any) || (item.ordered ? 'ORDERED' : 'PENDING')
  }

  const pendingItems = items.filter(item => getItemStatus(item) === 'PENDING')
  const orderedItems = items.filter(item => getItemStatus(item) === 'ORDERED')
  const shippingItems = items.filter(item => getItemStatus(item) === 'SHIPPING')
  const receivedItems = items.filter(item => getItemStatus(item) === 'RECEIVED')
  const completedItems = items.filter(item => getItemStatus(item) === 'STOCK_ADDED')

  // Active items (exclude completed from total)
  const activeItems = items.filter(item => getItemStatus(item) !== 'STOCK_ADDED')

  const tabConfig: Record<TabValue, { label: string; icon: string; items: OrderListItem[]; colorPalette: string }> = {
    PENDING: {
      label: 'Pending',
      icon: '⏳',
      items: pendingItems,
      colorPalette: 'orange',
    },
    ORDERED: {
      label: 'Ordered',
      icon: '📋',
      items: orderedItems,
      colorPalette: 'blue',
    },
    SHIPPING: {
      label: 'Shipping',
      icon: '🚚',
      items: shippingItems,
      colorPalette: 'purple',
    },
    RECEIVED: {
      label: 'Received',
      icon: '📦',
      items: receivedItems,
      colorPalette: 'green',
    },
    COMPLETED: {
      label: 'Completed',
      icon: '✅',
      items: completedItems,
      colorPalette: 'gray',
    },
  }

  const handleCardClick = (tab: TabValue) => {
    setActiveTab(tab)
  }

  return (
    <>
      <Sidebar />
      <TopBar />
      <Box
        ml={{ base: 0, md: '240px' }}
        mt="64px"
        minH="calc(100vh - 64px)"
        bg="bg.subtle"
        p={{ base: 4, md: 8 }}
      >
        <Container maxW="7xl" px={0}>
          {/* Page Header */}
          <VStack align="stretch" gap={6} mb={8}>
            <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
              <VStack align="flex-start" gap={1}>
                <Heading size="2xl" fontWeight="bold" color="fg">
                  Order Management
                </Heading>
                {weekCycleId && (
                  <Text color="fg.muted" fontSize="md">
                    Week Cycle: {weekCycleId}
                  </Text>
                )}
                <Text color="fg.muted" fontSize="sm" mt={1}>
                  Track and manage your order workflow from pending to stock
                </Text>
              </VStack>
              <HStack gap={2} flexWrap="wrap">
                <Button
                  colorPalette="blue"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  px={4}
                >
                  + Add Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadOrderList}
                  disabled={loading}
                  loading={loading}
                  px={4}
                >
                  Refresh
                </Button>
                <Button
                  colorPalette="red"
                  variant="outline"
                  size="sm"
                  onClick={handleResetWeek}
                  px={4}
                >
                  Reset Week
                </Button>
              </HStack>
            </HStack>

            {/* Error Alert */}
            {error && (
              <Alert.Root status="error" variant="subtle">
                <Alert.Indicator />
                <Alert.Title>{error}</Alert.Title>
                <Box ml="auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                  >
                    ×
                  </Button>
                </Box>
              </Alert.Root>
            )}

            {/* Summary Stats - Clickable Cards */}
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }} gap={5}>
              <GridItem>
                <Card.Root 
                  p={5} 
                  variant="outline" 
                  cursor="default"
                  _hover={{ shadow: 'sm' }}
                >
                  <VStack align="flex-start" gap={2}>
                    <Text fontSize="xs" color="fg.muted" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                      Total Active
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="fg">
                      {activeItems.length}
                    </Text>
                  </VStack>
                </Card.Root>
              </GridItem>
              {Object.entries(tabConfig).map(([key, config]) => (
                <GridItem key={key}>
                  <Card.Root 
                    p={5} 
                    variant="subtle" 
                    colorPalette={config.colorPalette as any}
                    cursor="pointer"
                    onClick={() => handleCardClick(key as TabValue)}
                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    borderWidth={activeTab === key ? '2px' : '1px'}
                    borderColor={activeTab === key ? `${config.colorPalette}.500` : 'border.subtle'}
                  >
                    <VStack align="flex-start" gap={2}>
                      <Text fontSize="xs" color="fg.muted" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                        {config.label}
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" colorPalette={config.colorPalette as any}>
                        {config.items.length}
                      </Text>
                    </VStack>
                  </Card.Root>
                </GridItem>
              ))}
            </Grid>
          </VStack>

          {loading ? (
            <VStack py={12} gap={4}>
              <Spinner size="xl" colorPalette="blue" />
              <Text color="fg.muted">Loading order list...</Text>
            </VStack>
          ) : (
            <VStack align="stretch" gap={8}>
              {/* Tabs Interface */}
              <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value as TabValue)}>
                <Box mb={6}>
                  <Tabs.List gap={2}>
                    {Object.entries(tabConfig).map(([key, config]) => (
                      <Tabs.Trigger key={key} value={key} px={5} py={3}>
                        {config.icon} {config.label}
                        {config.items.length > 0 && (
                          <Badge size="xs" variant="subtle" colorPalette={config.colorPalette as any} ml={2} px={1.5}>
                            {config.items.length}
                          </Badge>
                        )}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                </Box>

                {/* Tab Content */}
                {Object.entries(tabConfig).map(([key, config]) => (
                  <Tabs.Content key={key} value={key} pt={2}>
                    <VStack align="stretch" gap={5}>
                      {/* Bulk Actions for PENDING tab */}
                      {key === 'PENDING' && config.items.length > 0 && (
                        <Card.Root p={5} variant="outline">
                          <HStack justify="space-between" flexWrap="wrap" gap={4}>
                            <HStack gap={4} flexWrap="wrap">
                              <Checkbox.Root
                                checked={selectedItems.size > 0 && selectedItems.size === config.items.length}
                                onCheckedChange={() => handleSelectAll(config.items.map(i => i.id))}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label fontWeight="medium">
                                  {selectedItems.size > 0 
                                    ? `${selectedItems.size} item(s) selected`
                                    : 'Select items for bulk actions'
                                  }
                                </Checkbox.Label>
                              </Checkbox.Root>
                            </HStack>
                            <HStack gap={2} flexWrap="wrap">
                              {selectedItems.size > 0 && (
                                <>
                                  <Button
                                    size="sm"
                                    colorPalette="green"
                                    onClick={handleBulkMarkAsOrdered}
                                    disabled={bulkUpdating}
                                    loading={bulkUpdating}
                                    px={4}
                                  >
                                    Order Selected
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={handleBulkRemove}
                                    disabled={bulkUpdating}
                                    loading={bulkUpdating}
                                    px={4}
                                  >
                                    Remove Selected
                                  </Button>
                                </>
                              )}
                              {config.items.length > 0 && (
                                <Button
                                  size="sm"
                                  colorPalette="blue"
                                  onClick={handleMarkAllPendingAsOrdered}
                                  disabled={bulkUpdating}
                                  loading={bulkUpdating}
                                  px={4}
                                >
                                  Order All Pending
                                </Button>
                              )}
                            </HStack>
                          </HStack>
                        </Card.Root>
                      )}

                      {/* Items List */}
                      {config.items.length > 0 ? (
                        <VStack align="stretch" gap={4}>
                          {config.items.map((item) => (
                            <OrderListItemWorkflow
                              key={item.id}
                              item={item}
                              onStatusChange={handleStatusChange}
                              onRemove={handleRemove}
                              isSelected={selectedItems.has(item.id)}
                              onSelect={key === 'PENDING' ? handleSelectItem : undefined}
                            />
                          ))}
                        </VStack>
                      ) : (
                        <Card.Root p={10} variant="outline">
                          <VStack gap={3} textAlign="center">
                            <Text fontSize="3xl">{config.icon}</Text>
                            <Text color="fg.muted" fontSize="sm">
                              No items in {config.label.toLowerCase()} status
                            </Text>
                          </VStack>
                        </Card.Root>
                      )}
                    </VStack>
                  </Tabs.Content>
                ))}
              </Tabs.Root>

              {/* Empty State */}
              {items.length === 0 && (
                <Card.Root p={12} variant="outline">
                  <VStack gap={3} textAlign="center">
                    <Text fontSize="4xl">📋</Text>
                    <VStack gap={2}>
                      <Heading size="md" fontWeight="semibold" color="fg">
                        No items in the order list yet
                      </Heading>
                      <Text color="fg.muted" fontSize="sm">
                        Get started by adding your first item to track
                      </Text>
                    </VStack>
                    <Button
                      colorPalette="blue"
                      size="sm"
                      onClick={() => setShowAddModal(true)}
                      mt={2}
                      px={4}
                    >
                      + Add Your First Item
                    </Button>
                  </VStack>
                </Card.Root>
              )}
            </VStack>
          )}
        </Container>
      </Box>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setError(null)
        }}
        onAdd={handleAddItem}
      />
    </>
  )
}
