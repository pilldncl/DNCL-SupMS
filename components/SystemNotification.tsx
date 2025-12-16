'use client'

import { useState, useEffect } from 'react'
import { Alert, Box, HStack, Text, Button } from '@chakra-ui/react'

/**
 * System notification banner for app-wide messages
 */
export function SystemNotification() {
  const [isVisible, setIsVisible] = useState(true)

  // Check if user has dismissed this notification before
  useEffect(() => {
    const dismissed = localStorage.getItem('system-notification-dismissed')
    if (dismissed === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('system-notification-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <Box
      position="sticky"
      top="64px"
      left={0}
      right={0}
      zIndex={997}
      px={{ base: 4, md: 6 }}
      py={3}
      bg="bg"
      borderBottomWidth="1px"
      borderColor="border.subtle"
    >
      <Alert.Root status="info" variant="subtle" borderRadius="md">
        <Alert.Indicator />
        <Alert.Title flex="1">
          <Text fontSize="sm" fontWeight="medium" color="fg">
            ⚠️ We're still fine-tuning the system. We apologize for any inconvenience you may experience. Thank you for your patience!
          </Text>
        </Alert.Title>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          ml={4}
          px={2}
        >
          ×
        </Button>
      </Alert.Root>
    </Box>
  )
}

