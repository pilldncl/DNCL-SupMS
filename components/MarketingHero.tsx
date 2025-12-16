'use client'

import { Box, HStack, VStack, Text, Button, Link } from '@chakra-ui/react'
import { useMobile } from '@/lib/hooks/useMobile'

/**
 * Marketing Hero Section component
 * Blue background with "help scale your technology operations" message
 * Includes CTA buttons for Enterprise Quote and WhatsApp
 */
export function MarketingHero() {
  const isMobile = useMobile()

  const whatsappUrl = 'https://wa.me/your-number' // Replace with actual WhatsApp number
  const email = 'info@dncltechzone.com'
  
  // Format WhatsApp URL properly
  const formattedWhatsAppUrl = whatsappUrl.includes('your-number') 
    ? '#' 
    : whatsappUrl

  const handleRequestQuote = () => {
    // TODO: Implement quote request functionality
    // Could link to a contact form or email
    window.location.href = `mailto:${email}?subject=Enterprise Quote Request`
  }

  const handleWhatsAppChat = () => {
    if (formattedWhatsAppUrl !== '#') {
      window.open(formattedWhatsAppUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Box
      position="relative"
      bg="blue.700"
      py={{ base: 12, md: 20 }}
      px={{ base: 4, md: 8 }}
      overflow="hidden"
    >
      {/* Background Pattern - Plus Signs */}
      {/* Background Pattern - Plus Signs */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.15}
        pointerEvents="none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 30px,
            rgba(255, 255, 255, 0.15) 30px,
            rgba(255, 255, 255, 0.15) 32px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 30px,
            rgba(255, 255, 255, 0.15) 30px,
            rgba(255, 255, 255, 0.15) 32px
          )`,
        }}
      />

      <Box maxW="7xl" mx="auto" position="relative" zIndex={1}>
        <VStack align="center" gap={8}>
          {/* Main Heading */}
          <Text
            fontSize={{ base: '2xl', md: '4xl' }}
            fontWeight="bold"
            color="white"
            textAlign="center"
            maxW="3xl"
          >
            help scale your technology operations.
          </Text>

          {/* CTA Buttons */}
          <HStack
            gap={4}
            flexWrap="wrap"
            justify="center"
          >
            <Button
              onClick={handleRequestQuote}
              size="lg"
              bg="white"
              color="blue.700"
              borderWidth="2px"
              borderColor="blue.700"
              _hover={{
                bg: 'blue.50',
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              fontWeight="semibold"
              px={8}
            >
              Request Enterprise Quote →
            </Button>
            
            <Button
              onClick={handleWhatsAppChat}
              size="lg"
              bg="green.500"
              color="white"
              _hover={{
                bg: 'green.600',
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              fontWeight="semibold"
              px={8}
              leftIcon={<span>💬</span>}
            >
              Chat on WhatsApp (Preferred)
            </Button>
          </HStack>

          {/* Contact Info */}
          <HStack
            gap={8}
            flexWrap="wrap"
            justify="center"
            mt={4}
          >
            <HStack gap={2} color="white">
              <span>✉️</span>
              <Link
                href={`mailto:${email}`}
                color="white"
                _hover={{ textDecoration: 'underline' }}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {email}
              </Link>
            </HStack>
            
            <HStack gap={2} color="white">
              <span>💬</span>
              <VStack align="flex-start" gap={0}>
                <Link
                  href={formattedWhatsAppUrl}
                  target={formattedWhatsAppUrl !== '#' ? "_blank" : undefined}
                  rel={formattedWhatsAppUrl !== '#' ? "noopener noreferrer" : undefined}
                  color="white"
                  _hover={{ textDecoration: 'underline' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  cursor={formattedWhatsAppUrl === '#' ? 'default' : 'pointer'}
                >
                  Chat on WhatsApp
                </Link>
                <Text fontSize="xs" color="blue.200">
                  Preferred Method
                </Text>
              </VStack>
            </HStack>
          </HStack>
        </VStack>
      </Box>
    </Box>
  )
}

