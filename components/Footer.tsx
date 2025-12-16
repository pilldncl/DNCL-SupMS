'use client'

import { Box, HStack, VStack, Text, Link, Separator } from '@chakra-ui/react'
import { useMobile } from '@/lib/hooks/useMobile'

interface FooterProps {
  variant?: 'internal' | 'marketing'
}

/**
 * Footer component - supports both internal tool and marketing website
 * @param variant - 'internal' for app footer, 'marketing' for public website footer
 */
export function Footer({ variant = 'internal' }: FooterProps) {
  const isMobile = useMobile()

  const whatsappUrl = 'https://wa.me/your-number' // Replace with actual WhatsApp number
  const email = 'info@dncltechzone.com'
  
  // Format WhatsApp URL properly
  const formattedWhatsAppUrl = whatsappUrl.includes('your-number') 
    ? '#' 
    : whatsappUrl

  // Marketing Footer Variant
  if (variant === 'marketing') {
    return (
      <Box
        as="footer"
        mt={20}
        borderTopWidth="2px"
        borderColor="gray.200"
        bg="gray.900"
        color="gray.300"
        py={12}
        px={{ base: 4, md: 8 }}
      >
        <Box maxW="7xl" mx="auto">
          <HStack
            justify="space-between"
            align="flex-start"
            flexWrap="wrap"
            gap={{ base: 6, md: 8 }}
            mb={8}
          >
            {/* Left Section - Company Info */}
            <VStack align="flex-start" gap={4} flex={{ base: '1 1 100%', md: '0 1 auto' }}>
              <Text fontSize="xl" fontWeight="bold" color="white">
                DNCL-TECHZONE
              </Text>
              <Text fontSize="sm" color="gray.400" maxW="md">
                Enterprise-Grade Technology Solutions. Delivered with uncompromising quality, security, and compliance for B2B organizations worldwide.
              </Text>
              
              {/* Contact Info */}
              <VStack align="flex-start" gap={3} mt={2}>
                <Link
                  href={formattedWhatsAppUrl}
                  target={formattedWhatsAppUrl !== '#' ? "_blank" : undefined}
                  rel={formattedWhatsAppUrl !== '#' ? "noopener noreferrer" : undefined}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  color="gray.300"
                  _hover={{ color: 'white' }}
                  fontSize="sm"
                  cursor={formattedWhatsAppUrl === '#' ? 'default' : 'pointer'}
                >
                  <span>💬</span>
                  <VStack align="flex-start" gap={0}>
                    <Text>Chat on WhatsApp</Text>
                    <Text fontSize="xs" color="gray.500">Preferred Contact Method</Text>
                  </VStack>
                </Link>
                
                <Link
                  href={`mailto:${email}`}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  color="gray.300"
                  _hover={{ color: 'white' }}
                  fontSize="sm"
                >
                  <span>✉️</span>
                  <Text>{email}</Text>
                </Link>
                
                <HStack gap={2} color="gray.300" fontSize="sm">
                  <span>📍</span>
                  <Text>Global Operations</Text>
                </HStack>
              </VStack>
            </VStack>

            {/* Right Section - Navigation Columns */}
            <HStack
              gap={{ base: 6, md: 8 }}
              flexWrap="wrap"
              flex={{ base: '1 1 100%', md: '0 1 auto' }}
              justify={{ base: 'flex-start', md: 'flex-end' }}
            >
              {/* Company Column */}
              <VStack align="flex-start" gap={3}>
                <Text fontSize="sm" fontWeight="semibold" color="white" textTransform="uppercase" letterSpacing="wide">
                  Company
                </Text>
                <VStack align="flex-start" gap={2}>
                  <Link href="/about" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    About Us
                  </Link>
                  <Link href="/shop" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Shop Our Stores
                  </Link>
                  <Link href="/contact" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Contact
                  </Link>
                  <Link href="/careers" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Careers
                  </Link>
                </VStack>
              </VStack>

              {/* Solutions Column */}
              <VStack align="flex-start" gap={3}>
                <Text fontSize="sm" fontWeight="semibold" color="white" textTransform="uppercase" letterSpacing="wide">
                  Solutions
                </Text>
                <VStack align="flex-start" gap={2}>
                  <Link href="/solutions/wholesale" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Wholesale Devices
                  </Link>
                  <Link href="/solutions/enterprise" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Enterprise Deployment
                  </Link>
                  <Link href="/solutions/marketplace" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Marketplace Solutions
                  </Link>
                  <Link href="/solutions/recurring" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Recurring Programs
                  </Link>
                </VStack>
              </VStack>

              {/* Legal & Compliance Column */}
              <VStack align="flex-start" gap={3}>
                <Text fontSize="sm" fontWeight="semibold" color="white" textTransform="uppercase" letterSpacing="wide">
                  Legal & Compliance
                </Text>
                <VStack align="flex-start" gap={2}>
                  <Link href="/legal#privacy-policy" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Privacy Policy
                  </Link>
                  <Link href="/legal#terms-of-service" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Terms of Service
                  </Link>
                  <Link href="/legal#cookie-policy" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Cookie Policy
                  </Link>
                  <Link href="/legal#compliance" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Compliance
                  </Link>
                  <Link href="/legal#certifications" fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                    Certifications
                  </Link>
                </VStack>
              </VStack>
            </HStack>
          </HStack>

          {/* Bottom Section */}
          <HStack
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={4}
            pt={8}
            borderTopWidth="1px"
            borderColor="gray.800"
          >
            {/* Left - Feature Icons */}
            <HStack gap={{ base: 4, md: 6 }} flexWrap="wrap">
              <HStack gap={2} fontSize="xs" color="gray.400">
                <span>🛡️</span>
                <Text>Quality-Focused Operations</Text>
              </HStack>
              <HStack gap={2} fontSize="xs" color="gray.400">
                <span>🔒</span>
                <Text>Secure Data Handling</Text>
              </HStack>
              <HStack gap={2} fontSize="xs" color="gray.400">
                <span>📄</span>
                <Text>Enterprise-Grade Standards</Text>
              </HStack>
            </HStack>

            {/* Right - Copyright */}
            <Text fontSize="xs" color="gray.500">
              © {new Date().getFullYear()} DNCL-TECHZONE. All rights reserved.
            </Text>
          </HStack>
        </Box>
      </Box>
    )
  }

  // Internal Footer Variant (default)

  return (
    <Box
      as="footer"
      mt="auto"
      borderTopWidth="1px"
      borderColor="border.subtle"
      bg="bg"
      py={6}
      px={{ base: 4, md: 6 }}
      ml={{ base: 0, md: '240px' }}
    >
      <Box maxW="7xl" mx="auto">
        <VStack align="stretch" gap={4}>
          <HStack
            justify="space-between"
            align="flex-start"
            flexWrap="wrap"
            gap={4}
          >
            <VStack align="flex-start" gap={2}>
              <Text fontSize="sm" fontWeight="semibold" color="fg">
                DNCL Supply Management System
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Internal tool for managing inventory and orders
              </Text>
            </VStack>

            <HStack gap={6} flexWrap="wrap">
              <VStack align="flex-start" gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
                  Quick Links
                </Text>
                <VStack align="flex-start" gap={1}>
                  <Link href="/dashboard" fontSize="xs" color="fg.muted" _hover={{ color: 'fg' }}>
                    Dashboard
                  </Link>
                  <Link href="/order-list" fontSize="xs" color="fg.muted" _hover={{ color: 'fg' }}>
                    Order List
                  </Link>
                  <Link href="/stock" fontSize="xs" color="fg.muted" _hover={{ color: 'fg' }}>
                    Stock Inventory
                  </Link>
                </VStack>
              </VStack>

              <VStack align="flex-start" gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
                  Support
                </Text>
                <VStack align="flex-start" gap={1}>
                  <Text fontSize="xs" color="fg.muted">
                    Version 1.0.0
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    © {new Date().getFullYear()} DNCL Tech Zone
                  </Text>
                </VStack>
              </VStack>
            </HStack>
          </HStack>

          <Separator />

          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Text fontSize="xs" color="fg.muted">
              Built with Next.js & Supabase
            </Text>
            <Text fontSize="xs" color="fg.muted">
              All rights reserved
            </Text>
          </HStack>
        </VStack>
      </Box>
    </Box>
  )
}

