'use client'

import { Box, HStack, VStack, Text, Button, Link } from '@chakra-ui/react'
import { useMobile } from '@/lib/hooks/useMobile'
import { useState } from 'react'

/**
 * Marketing Navigation Header component
 * Top navigation bar with logo, menu items, and CTA button
 */
export function MarketingNav() {
  const isMobile = useMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleRequestQuote = () => {
    // Link to contact or quote request
    window.location.href = 'mailto:info@dncltechzone.com?subject=Enterprise Quote Request'
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/shop', label: 'Shop' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={1000}
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
        <HStack
          justify="space-between"
          align="center"
          h={{ base: '60px', md: '70px' }}
        >
          {/* Logo */}
          <Link
            href="/"
            _hover={{ textDecoration: 'none' }}
          >
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="bold"
              color="gray.900"
              letterSpacing="tight"
            >
              DNCL - TECHZONE
            </Text>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <HStack gap={8} flex={1} justify="center">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  _hover={{
                    color: 'blue.600',
                    textDecoration: 'none',
                  }}
                  transition="color 0.2s"
                >
                  {item.label}
                </Link>
              ))}
            </HStack>
          )}

          {/* CTA Button */}
          <HStack gap={4}>
            {!isMobile && (
              <Button
                onClick={handleRequestQuote}
                colorPalette="blue"
                size="md"
                fontWeight="semibold"
                px={6}
              >
                Request Quote
              </Button>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="ghost"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                p={2}
              >
                <Box
                  as="span"
                  display="block"
                  w={5}
                  h={0.5}
                  bg="gray.700"
                  transition="all 0.3s"
                  _before={{
                    content: '""',
                    display: 'block',
                    w: 5,
                    h: 0.5,
                    bg: 'gray.700',
                    mt: -1.5,
                    transition: 'all 0.3s',
                    transform: isMenuOpen ? 'rotate(45deg) translateY(4px)' : 'none',
                  }}
                  _after={{
                    content: '""',
                    display: 'block',
                    w: 5,
                    h: 0.5,
                    bg: 'gray.700',
                    mt: 1,
                    transition: 'all 0.3s',
                    transform: isMenuOpen ? 'rotate(-45deg) translateY(-4px)' : 'none',
                  }}
                />
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Mobile Menu */}
        {isMobile && isMenuOpen && (
          <Box
            pb={4}
            borderTopWidth="1px"
            borderColor="gray.200"
            mt={2}
          >
            <VStack align="stretch" gap={2} pt={4}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  py={2}
                  px={4}
                  borderRadius="md"
                  _hover={{
                    bg: 'gray.50',
                    color: 'blue.600',
                    textDecoration: 'none',
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                onClick={() => {
                  handleRequestQuote()
                  setIsMenuOpen(false)
                }}
                colorPalette="blue"
                size="md"
                fontWeight="semibold"
                mt={2}
                mx={4}
              >
                Request Quote
              </Button>
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  )
}


