'use client'

import { useState } from 'react'
import type { OrderListItem as OrderListItemType, OrderStatus } from '@/lib/types/supply'
import { getNextStatus, getPreviousStatus } from '@/lib/types/supply'
import { OrderListService } from '@/lib/services'
import {
  Box,
  Card,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Input,
  Field,
  Checkbox,
  Link,
} from '@chakra-ui/react'

interface OrderListItemWorkflowProps {
  item: OrderListItemType
  onStatusChange: () => void
  onRemove: (itemId: string) => void
  userId?: string
  isSelected?: boolean
  onSelect?: (itemId: string) => void
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; colorPalette: string; nextAction: string; prevAction: string }> = {
  PENDING: { 
    label: 'Need to Order', 
    colorPalette: 'orange',
    nextAction: 'Ordered',
    prevAction: ''
  },
  ORDERED: { 
    label: 'Ordered', 
    colorPalette: 'blue',
    nextAction: 'Shipping',
    prevAction: 'Back to Pending'
  },
  SHIPPING: { 
    label: 'Shipping', 
    colorPalette: 'purple',
    nextAction: 'Received',
    prevAction: 'Back to Ordered'
  },
  RECEIVED: { 
    label: 'Received', 
    colorPalette: 'green',
    nextAction: 'Add to Stock',
    prevAction: 'Back to Shipping'
  },
  STOCK_ADDED: { 
    label: 'Stock Added', 
    colorPalette: 'gray',
    nextAction: '',
    prevAction: 'Back to Received'
  },
}

export function OrderListItemWorkflow({ 
  item, 
  onStatusChange,
  onRemove,
  userId,
  isSelected = false,
  onSelect
}: OrderListItemWorkflowProps) {
  const [updating, setUpdating] = useState(false)
  const [showTrackingInput, setShowTrackingInput] = useState(false)
  const [showQuantityInput, setShowQuantityInput] = useState(false)
  const [showShippingTracking, setShowShippingTracking] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState(item.tracking_number || '')
  const [trackingUrl, setTrackingUrl] = useState(item.tracking_url || '')
  const [quantity, setQuantity] = useState<string>((item.quantity || 1).toString())

  // Determine status - prioritize explicit status field, fallback to ordered boolean
  const status: OrderStatus = (item.status as OrderStatus) || (item.ordered ? 'ORDERED' : 'PENDING')
  const config = STATUS_CONFIG[status]

  const handleNextAction = async () => {
    const nextStatus = getNextStatus(status)
    if (!nextStatus) return

    setUpdating(true)
    try {
      switch (nextStatus) {
        case 'ORDERED':
          // Show tracking input for ordered status
          setShowTrackingInput(true)
          setUpdating(false)
          return
        case 'SHIPPING':
          await OrderListService.updateStatus(item.id, 'SHIPPING', userId)
          break
        case 'RECEIVED':
          await OrderListService.updateStatus(item.id, 'RECEIVED', userId)
          break
        case 'STOCK_ADDED':
          // Show quantity input for stock addition
          setShowQuantityInput(true)
          setUpdating(false)
          return
        default:
          return
      }
      // Force a refresh after status change
      await onStatusChange()
    } catch (error) {
      console.error('Error updating status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePreviousAction = async () => {
    const prevStatus = getPreviousStatus(status)
    if (!prevStatus) return

    setUpdating(true)
    try {
      await OrderListService.updateStatus(item.id, prevStatus, userId)
      // Force a refresh after status change
      await onStatusChange()
    } catch (error) {
      console.error('Error reverting status:', error)
      alert(error instanceof Error ? error.message : 'Failed to revert status')
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkAsOrdered = async () => {
    setUpdating(true)
    try {
      await OrderListService.markAsOrdered(
        item.id, 
        userId, 
        trackingNumber || undefined,
        trackingUrl || undefined
      )
      setShowTrackingInput(false)
      setTrackingNumber('')
      setTrackingUrl('')
      await onStatusChange()
    } catch (error) {
      console.error('Error marking as ordered:', error)
      alert(error instanceof Error ? error.message : 'Failed to mark as ordered')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateTracking = async () => {
    setUpdating(true)
    try {
      await OrderListService.updateTracking(
        item.id,
        trackingNumber || undefined,
        trackingUrl || undefined
      )
      setShowShippingTracking(false)
      await onStatusChange()
    } catch (error) {
      console.error('Error updating tracking:', error)
      alert(error instanceof Error ? error.message : 'Failed to update tracking')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddToStock = async () => {
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    setUpdating(true)
    try {
      await OrderListService.addStockAndComplete(item.id, qty, userId)
      setShowQuantityInput(false)
      await onStatusChange()
    } catch (error) {
      console.error('Error adding stock:', error)
      alert(error instanceof Error ? error.message : 'Failed to add stock')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemove = () => {
    if (confirm('Remove this item from the order list?')) {
      onRemove(item.id)
    }
  }

  const skuName = item.sku?.sku_code || 
    (item.sku?.brand && item.sku?.model ? `${item.sku.brand} ${item.sku.model}` : null) ||
    `SKU ${item.sku_id}`
  const partTypeDisplay = item.part_type_display || item.part_type

  return (
    <Card.Root
      variant="outline"
      borderColor={isSelected ? 'blue.500' : 'border.subtle'}
      bg={isSelected ? 'blue.50' : 'bg'}
      p="6"
      transition="all 0.2s"
      _hover={{
        shadow: 'sm',
        borderColor: isSelected ? 'blue.500' : 'border.emphasized',
      }}
    >
      <HStack gap="6" align="flex-start">
        {/* Checkbox for PENDING items */}
        {(!item.status || item.status === 'PENDING') && onSelect && (
          <Box pt="1">
            <Checkbox.Root
              checked={isSelected}
              onCheckedChange={() => onSelect(item.id)}
              onClick={(e) => e.stopPropagation()}
              size="md"
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
            </Checkbox.Root>
          </Box>
        )}

        {/* Main Content */}
        <Box flex="1" minW="0">
          <HStack gap="4" mb="3" flexWrap="wrap" align="center">
            <Text fontWeight="semibold" fontSize="md" lineHeight="1.6" color="fg">
              {skuName}
            </Text>
            <HStack gap="2.5">
              <Badge variant="subtle" colorPalette="gray" size="sm" px="3" py="1">
                {partTypeDisplay}
              </Badge>
              <Badge variant="solid" colorPalette={config.colorPalette} size="sm" px="3" py="1">
                {config.label}
              </Badge>
            </HStack>
            {item.quantity && (
              <Text color="fg.muted" fontSize="sm" fontWeight="medium">
                Qty: {item.quantity}
              </Text>
            )}
          </HStack>

          {/* Timeline */}
          <Text fontSize="xs" color="fg.muted" mb={status === 'SHIPPING' ? 4 : 0} lineHeight="1.6" mt="1">
            Added {new Date(item.added_at).toLocaleDateString()}
            {item.ordered_at && ` • Ordered ${new Date(item.ordered_at).toLocaleDateString()}`}
            {item.shipping_at && ` • Shipped ${new Date(item.shipping_at).toLocaleDateString()}`}
            {item.received_at && ` • Received ${new Date(item.received_at).toLocaleDateString()}`}
            {item.stock_added_at && ` • Stock Added ${new Date(item.stock_added_at).toLocaleDateString()}`}
          </Text>

          {/* Shipping Tracking Info Card */}
          {status === 'SHIPPING' && (
            <Card.Root variant="subtle" colorPalette="purple" p="4" mt="3">
              <HStack justify="space-between" flexWrap="wrap" gap="4">
                <Box flex="1" minW="0">
                  {item.tracking_number ? (
                    <VStack align="flex-start" gap="2">
                      <Text fontSize="xs" color="fg.muted" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
                        Tracking Number
                      </Text>
                      <Text fontSize="sm" fontWeight="semibold" lineHeight="1.5" color="fg">
                        📦 {item.tracking_number}
                      </Text>
                      {item.tracking_url && (
                        <Link
                          href={item.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          fontSize="xs"
                          colorPalette="blue"
                          fontWeight="medium"
                          mt="0.5"
                        >
                          View Tracking →
                        </Link>
                      )}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
                      No tracking information added yet
                    </Text>
                  )}
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="purple"
                  onClick={() => {
                    setShowShippingTracking(true)
                    setTrackingNumber(item.tracking_number || '')
                    setTrackingUrl(item.tracking_url || '')
                  }}
                  px={4}
                >
                  {item.tracking_number ? 'Edit' : 'Add Tracking'}
                </Button>
              </HStack>
            </Card.Root>
          )}
        </Box>

        {/* Action Buttons */}
        <HStack gap="2" align="center" position="relative" flexWrap="wrap">
          {/* Previous Action Button */}
          {config.prevAction && status !== 'PENDING' && !showShippingTracking && status !== 'STOCK_ADDED' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePreviousAction}
              disabled={updating}
              px={4}
            >
              ← {config.prevAction}
            </Button>
          )}

          {/* Shipping Tracking Modal */}
          {showShippingTracking && status === 'SHIPPING' && (
            <Box position="absolute" top="100%" right="0" zIndex="10" mt="2">
              <Card.Root p="4" minW="320px" shadow="lg" borderWidth="1px">
                <VStack gap="3" align="stretch">
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" mb="1.5" textTransform="uppercase" letterSpacing="wide" color="fg.muted">
                      Tracking Number
                    </Field.Label>
                    <Input
                      size="sm"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g., 1Z999AA10123456784"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" mb="1.5" textTransform="uppercase" letterSpacing="wide" color="fg.muted">
                      Tracking URL (Optional)
                    </Field.Label>
                    <Input
                      size="sm"
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </Field.Root>
                  <HStack gap="2" justify="flex-end" mt="1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowShippingTracking(false)
                        setTrackingNumber(item.tracking_number || '')
                        setTrackingUrl(item.tracking_url || '')
                      }}
                      disabled={updating}
                      px={4}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="purple"
                      onClick={handleUpdateTracking}
                      disabled={updating}
                      loading={updating}
                      px={4}
                    >
                      Save
                    </Button>
                  </HStack>
                </VStack>
              </Card.Root>
            </Box>
          )}

          {/* Tracking Input Modal for ORDERED */}
          {showTrackingInput && (
            <Box position="absolute" top="100%" right="0" zIndex="10" mt="2">
              <Card.Root p="4" minW="320px" shadow="lg" borderWidth="1px">
                <VStack gap="3" align="stretch">
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" mb="1.5" textTransform="uppercase" letterSpacing="wide" color="fg.muted">
                      Tracking Number (Optional)
                    </Field.Label>
                    <Input
                      size="sm"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g., 1Z999AA10123456784"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" mb="1.5" textTransform="uppercase" letterSpacing="wide" color="fg.muted">
                      Tracking URL (Optional)
                    </Field.Label>
                    <Input
                      size="sm"
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </Field.Root>
                  <HStack gap="2" justify="flex-end" mt="1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowTrackingInput(false)
                        setTrackingNumber('')
                        setTrackingUrl('')
                      }}
                      disabled={updating}
                      px={4}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={handleMarkAsOrdered}
                      disabled={updating}
                      loading={updating}
                      px={4}
                    >
                      Save
                    </Button>
                  </HStack>
                </VStack>
              </Card.Root>
            </Box>
          )}

          {/* Quantity Input Modal for RECEIVED */}
          {showQuantityInput && (
            <Box position="absolute" top="100%" right="0" zIndex="10" mt="2">
              <Card.Root p="4" minW="280px" shadow="lg" borderWidth="1px">
                <VStack gap="3" align="stretch">
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" mb="1.5" textTransform="uppercase" letterSpacing="wide" color="fg.muted">
                      Quantity to Add
                    </Field.Label>
                    <Input
                      size="sm"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                    />
                  </Field.Root>
                  <HStack gap="2" justify="flex-end" mt="1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowQuantityInput(false)
                        setQuantity((item.quantity || 1).toString())
                      }}
                      disabled={updating}
                      px={4}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={handleAddToStock}
                      disabled={updating}
                      loading={updating}
                      px={4}
                    >
                      Add to Stock
                    </Button>
                  </HStack>
                </VStack>
              </Card.Root>
            </Box>
          )}

          {/* For completed items, only show Remove button */}
          {status === 'STOCK_ADDED' ? (
            <Button
              size="sm"
              variant="ghost"
              colorPalette="red"
              onClick={handleRemove}
              px={4}
            >
              Remove
            </Button>
          ) : (
            <>
              {/* Next Action Button */}
              {config.nextAction && !showTrackingInput && !showQuantityInput && !showShippingTracking && (
                <Button
                  size="sm"
                  colorPalette={config.colorPalette}
                  onClick={handleNextAction}
                  disabled={updating}
                  loading={updating}
                  px={4}
                >
                  {config.nextAction}
                </Button>
              )}

              {/* Remove Button */}
              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={handleRemove}
                px={4}
              >
                Remove
              </Button>
            </>
          )}
        </HStack>
      </HStack>
    </Card.Root>
  )
}
