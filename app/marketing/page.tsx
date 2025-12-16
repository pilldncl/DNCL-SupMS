'use client'

import { Box, VStack, Heading, Text } from '@chakra-ui/react'
import { MarketingNav } from '@/components/MarketingNav'
import { MarketingHero } from '@/components/MarketingHero'
import { Footer } from '@/components/Footer'

/**
 * Marketing Landing Page
 * Demo page to showcase the marketing footer and legal links
 */
export default function MarketingPage() {
  return (
    <>
      <MarketingNav />
      <MarketingHero />
      
      {/* Demo Content Section */}
      <Box
        as="main"
        bg="white"
        py={16}
        px={{ base: 4, md: 8 }}
      >
        <Box maxW="4xl" mx="auto">
          <VStack align="stretch" gap={8}>
            <Heading size="xl" color="gray.900" textAlign="center">
              Test the Footer Links
            </Heading>
            <Text color="gray.600" fontSize="lg" textAlign="center">
              Scroll down to see the footer. Click any link in the "Legal & Compliance" section to test the anchor navigation.
            </Text>
            
            <Box
              bg="blue.50"
              p={8}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="blue.200"
            >
              <VStack align="flex-start" gap={4}>
                <Heading size="md" color="gray.900">
                  Try These Footer Links:
                </Heading>
                <VStack align="flex-start" gap={2} pl={4}>
                  <Text fontSize="sm" color="gray.700">
                    • Privacy Policy → Should scroll to Privacy Policy section
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • Terms of Service → Should scroll to Terms of Service section
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • Cookie Policy → Should scroll to Cookie Policy section
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • Compliance → Should scroll to Compliance section
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • Certifications → Should scroll to Certifications section
                  </Text>
                </VStack>
              </VStack>
            </Box>

            {/* Spacer to push footer down */}
            <Box h={32} />
          </VStack>
        </Box>
      </Box>

      {/* Marketing Footer */}
      <Footer variant="marketing" />
    </>
  )
}


