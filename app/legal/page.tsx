'use client'

import { Box, VStack, HStack, Text, Heading, Link, Button } from '@chakra-ui/react'
import { useMobile } from '@/lib/hooks/useMobile'
import { MarketingNav } from '@/components/MarketingNav'
import { Footer } from '@/components/Footer'

/**
 * Legal & Compliance Page
 * Hidden page accessible only through footer links
 * Matches landing page design with modern SaaS aesthetic
 */
export default function LegalPage() {
  const isMobile = useMobile()

  return (
    <>
      <MarketingNav />
      
      {/* Hero Section - Matching Landing Page */}
      <Box
        position="relative"
        bg="blue.700"
        py={{ base: 12, md: 16 }}
        px={{ base: 4, md: 8 }}
        overflow="hidden"
      >
        {/* Background Pattern */}
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

        <Box maxW="4xl" mx="auto" position="relative" zIndex={1}>
          <VStack align="center" gap={4}>
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              fontWeight="bold"
              color="white"
              textAlign="center"
            >
              Legal & Compliance
            </Heading>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="blue.100"
              textAlign="center"
              maxW="2xl"
            >
              DNCL-TECHZONE Legal Documents and Policies
            </Text>
            
            {/* Quick Navigation Pills */}
            <HStack
              gap={3}
              flexWrap="wrap"
              justify="center"
              mt={4}
            >
              <Button
                as="a"
                href="#privacy-policy"
                size="sm"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{
                  bg: 'white',
                  color: 'blue.700',
                }}
              >
                Privacy Policy
              </Button>
              <Button
                as="a"
                href="#terms-of-service"
                size="sm"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{
                  bg: 'white',
                  color: 'blue.700',
                }}
              >
                Terms of Service
              </Button>
              <Button
                as="a"
                href="#cookie-policy"
                size="sm"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{
                  bg: 'white',
                  color: 'blue.700',
                }}
              >
                Cookie Policy
              </Button>
              <Button
                as="a"
                href="#compliance"
                size="sm"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{
                  bg: 'white',
                  color: 'blue.700',
                }}
              >
                Compliance
              </Button>
              <Button
                as="a"
                href="#certifications"
                size="sm"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{
                  bg: 'white',
                  color: 'blue.700',
                }}
              >
                Certifications
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>

      {/* Content Section */}
      <Box
        bg="gray.50"
        py={{ base: 12, md: 16 }}
        px={{ base: 4, md: 8 }}
        minH="calc(100vh - 400px)"
      >
        <Box maxW="4xl" mx="auto">
          {/* Table of Contents */}
          <Box
            bg="white"
            p={{ base: 6, md: 8 }}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="sm"
            mb={8}
            position="sticky"
            top={4}
            zIndex={10}
          >
            <Heading size="md" color="gray.900" mb={4}>
              Table of Contents
            </Heading>
            <VStack align="flex-start" gap={2}>
              <Link
                href="#privacy-policy"
                color="blue.600"
                fontWeight="medium"
                fontSize="sm"
                _hover={{ color: 'blue.700', textDecoration: 'underline' }}
              >
                1. Privacy Policy
              </Link>
              <VStack align="flex-start" gap={1} pl={4} fontSize="xs" color="gray.600">
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.1 Introduction</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.2 Information We Collect</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.3 How We Use Your Information</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.4 Cookies & Tracking</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.5 Information Sharing</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.6 Your Privacy Rights</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.7 Data Security</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.8 Data Retention</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.9 International Transfers</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.10 Children's Privacy</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.11 Policy Updates</Link>
                <Link href="#privacy-policy" _hover={{ color: 'blue.600' }}>1.12 Contact Information</Link>
              </VStack>
              
              <Link
                href="#terms-of-service"
                color="blue.600"
                fontWeight="medium"
                fontSize="sm"
                _hover={{ color: 'blue.700', textDecoration: 'underline' }}
                mt={2}
              >
                2. Terms of Service
              </Link>
              <VStack align="flex-start" gap={1} pl={4} fontSize="xs" color="gray.600">
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.1 Acceptance of Terms</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.2 Business Relationship</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.3 Products & Services</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.4 Orders & Payment</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.5 Shipping & Delivery</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.6 Returns & Refunds</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.7 Warranties & Disclaimers</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.8 Limitation of Liability</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.9 Intellectual Property</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.10 Governing Law</Link>
                <Link href="#terms-of-service" _hover={{ color: 'blue.600' }}>2.11 Modifications</Link>
              </VStack>
              
              <Link
                href="#cookie-policy"
                color="blue.600"
                fontWeight="medium"
                fontSize="sm"
                _hover={{ color: 'blue.700', textDecoration: 'underline' }}
                mt={2}
              >
                3. Cookie Policy
              </Link>
              <VStack align="flex-start" gap={1} pl={4} fontSize="xs" color="gray.600">
                <Link href="#cookie-policy" _hover={{ color: 'blue.600' }}>3.1 What Are Cookies?</Link>
                <Link href="#cookie-policy" _hover={{ color: 'blue.600' }}>3.2 Types of Cookies We Use</Link>
                <Link href="#cookie-policy" _hover={{ color: 'blue.600' }}>3.3 Managing Cookies</Link>
                <Link href="#cookie-policy" _hover={{ color: 'blue.600' }}>3.4 Third-Party Cookies</Link>
              </VStack>
              
              <Link
                href="#compliance"
                color="blue.600"
                fontWeight="medium"
                fontSize="sm"
                _hover={{ color: 'blue.700', textDecoration: 'underline' }}
                mt={2}
              >
                4. Compliance
              </Link>
              <VStack align="flex-start" gap={1} pl={4} fontSize="xs" color="gray.600">
                <Link href="#compliance" _hover={{ color: 'blue.600' }}>4.1 Our Commitment</Link>
                <Link href="#compliance" _hover={{ color: 'blue.600' }}>4.2 Data Protection & Privacy Compliance</Link>
                <Link href="#compliance" _hover={{ color: 'blue.600' }}>4.3 Security & Information Management</Link>
                <Link href="#compliance" _hover={{ color: 'blue.600' }}>4.4 Regulatory Compliance</Link>
                <Link href="#compliance" _hover={{ color: 'blue.600' }}>4.5 Product Compliance</Link>
                <Link href="#compliance" _hover={{ color: 'blue.600' }}>4.6 Compliance Monitoring</Link>
                <Link href="#compliance" _hover={{ color: 'blue.600' }}>4.7 Business Ethics</Link>
              </VStack>
              
              <Link
                href="#certifications"
                color="blue.600"
                fontWeight="medium"
                fontSize="sm"
                _hover={{ color: 'blue.700', textDecoration: 'underline' }}
                mt={2}
              >
                5. Certifications & Standards
              </Link>
              <VStack align="flex-start" gap={1} pl={4} fontSize="xs" color="gray.600">
                <Link href="#certifications" _hover={{ color: 'blue.600' }}>5.1 Our Certifications</Link>
                <Link href="#certifications" _hover={{ color: 'blue.600' }}>5.2 Quality Management Certifications</Link>
                <Link href="#certifications" _hover={{ color: 'blue.600' }}>5.3 Information Security Certifications</Link>
                <Link href="#certifications" _hover={{ color: 'blue.600' }}>5.4 Product Certifications</Link>
                <Link href="#certifications" _hover={{ color: 'blue.600' }}>5.5 Business Certifications</Link>
                <Link href="#certifications" _hover={{ color: 'blue.600' }}>5.6 Certification Verification</Link>
                <Link href="#certifications" _hover={{ color: 'blue.600' }}>5.7 Continuous Improvement</Link>
              </VStack>
            </VStack>
          </Box>

          <VStack align="stretch" gap={8}>
            {/* Privacy Policy Section */}
            <Box
              id="privacy-policy"
              bg="white"
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="sm"
              scrollMarginTop="120px"
            >
              <Heading size="xl" mb={2} color="gray.900">
                Privacy Policy
              </Heading>
              <Text fontSize="sm" color="gray.500" mb={6}>
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>

              <VStack align="stretch" gap={6}>
                <Section>
                  <SectionTitle>1. Introduction</SectionTitle>
                  <Text>
                    DNCL-TECHZONE ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, make purchases, or interact with our services. By using our services, you agree to the collection and use of information in accordance with this policy.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>2. Information We Collect</SectionTitle>
                  <Text mb={3}>We collect several types of information to provide and improve our services:</Text>
                  
                  <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2} mt={4}>2.1 Information You Provide</Heading>
                  <VStack align="stretch" gap={2} pl={4} mb={4}>
                    <InfoItem>Contact information (name, email address, phone number, company name)</InfoItem>
                    <InfoItem>Business information (company size, industry, requirements, roles, permissions)</InfoItem>
                    <InfoItem>Supply chain data (SKU information, order lists, inventory data, part types)</InfoItem>
                    <InfoItem>Communication preferences and correspondence</InfoItem>
                    <InfoItem>Payment and billing information (processed securely through third-party providers)</InfoItem>
                    <InfoItem>Account credentials and authentication data</InfoItem>
                  </VStack>

                  <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2} mt={4}>2.2 Automatically Collected Information</Heading>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>Device information (IP address, browser type, operating system)</InfoItem>
                    <InfoItem>Usage data (pages visited, time spent, actions performed, click patterns)</InfoItem>
                    <InfoItem>Cookies and similar tracking technologies</InfoItem>
                    <InfoItem>System logs, error reports, and performance metrics</InfoItem>
                    <InfoItem>Referral sources and search terms</InfoItem>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>3. How We Use Your Information</SectionTitle>
                  <Text mb={3}>We utilize collected data to:</Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>Provide, maintain, and improve our supply management services and website</InfoItem>
                    <InfoItem>Process transactions and manage orders</InfoItem>
                    <InfoItem>Authenticate users and manage access to the system</InfoItem>
                    <InfoItem>Communicate with you about products, services, system updates, and support requests</InfoItem>
                    <InfoItem>Send order confirmations, promotional content (where consent is given), and important service updates</InfoItem>
                    <InfoItem>Respond to inquiries, support requests, and customer service needs</InfoItem>
                    <InfoItem>Detect, prevent, and address technical issues and security threats</InfoItem>
                    <InfoItem>Comply with legal obligations and enforce our terms</InfoItem>
                    <InfoItem>Analyze usage patterns and improve user experience</InfoItem>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>4. Cookies & Tracking Technologies</SectionTitle>
                  <Text>
                    We may use cookies and similar technologies for site functionality and analytics. Users can manage cookie preferences via browser settings, though certain features may be affected. For more details, please see our Cookie Policy below.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>5. Information Sharing and Disclosure</SectionTitle>
                  <Text mb={3}>
                    We do not sell your personal information. We may share your information only in the following circumstances:
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem><strong>Service Providers:</strong> With trusted third-party vendors who assist in operations (database hosting, payment processing, analytics, shipping carriers) strictly for operational purposes. These third parties are contractually obligated to maintain the confidentiality and security of your information.</InfoItem>
                    <InfoItem><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</InfoItem>
                    <InfoItem><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</InfoItem>
                    <InfoItem><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</InfoItem>
                    <InfoItem><strong>With Your Consent:</strong> When you explicitly authorize us to share information</InfoItem>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>6. Your Privacy Rights</SectionTitle>
                  <Text mb={3}>Depending on your location and applicable laws, you may have the following rights:</Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem><strong>Access:</strong> Request a copy of your personal information</InfoItem>
                    <InfoItem><strong>Correction:</strong> Request correction of inaccurate data</InfoItem>
                    <InfoItem><strong>Deletion:</strong> Request deletion of your personal information</InfoItem>
                    <InfoItem><strong>Portability:</strong> Request transfer of your data to another service</InfoItem>
                    <InfoItem><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time via the unsubscribe link in emails</InfoItem>
                    <InfoItem><strong>Objection:</strong> Object to certain processing activities</InfoItem>
                    <InfoItem><strong>Cookie Management:</strong> Control cookie settings to manage tracking preferences</InfoItem>
                  </VStack>
                  <Text mt={3}>
                    To exercise these rights, please contact us at <Link href="mailto:privacy@dncltechzone.com" color="blue.600" fontWeight="medium">privacy@dncltechzone.com</Link> or <Link href="mailto:info@dncltechzone.com" color="blue.600" fontWeight="medium">info@dncltechzone.com</Link>.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>7. Data Security</SectionTitle>
                  <Box bg="blue.50" borderRadius="lg" p={6} mb={4} borderLeftWidth="4px" borderLeftColor="blue.500">
                    <Heading size="sm" fontWeight="semibold" color="gray.900" mb={2}>Enterprise-Grade Security</Heading>
                    <Text color="gray.700" lineHeight="relaxed">
                      We implement industry-standard security measures to protect your information, including encryption, secure servers, access controls, and regular security audits. Our supply management system uses secure authentication and data encryption to protect sensitive business information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                    </Text>
                  </Box>
                  <Text>
                    While we strive to protect your personal information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of any account credentials and should notify us immediately of any unauthorized access.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>8. Data Retention</SectionTitle>
                  <Text>
                    We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Supply chain and inventory data may be retained longer for business operational purposes. When data is no longer needed, we securely delete or anonymize it.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>9. International Data Transfers</SectionTitle>
                  <Text>
                    Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable data protection laws.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>10. Children's Privacy</SectionTitle>
                  <Text>
                    Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>11. Policy Updates</SectionTitle>
                  <Text>
                    We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. The most recent version will always be available on this page. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services after changes become effective constitutes acceptance of the updated policy.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>12. Contact Information</SectionTitle>
                  <Text mb={3}>
                    For questions about this Privacy Policy or your data, contact us at:
                  </Text>
                  <VStack align="flex-start" gap={1} mt={2} pl={4}>
                    <Text><strong>Privacy Inquiries:</strong> <Link href="mailto:privacy@dncltechzone.com" color="blue.600" fontWeight="medium">privacy@dncltechzone.com</Link></Text>
                    <Text><strong>General Inquiries:</strong> <Link href="mailto:info@dncltechzone.com" color="blue.600" fontWeight="medium">info@dncltechzone.com</Link></Text>
                    <Text><strong>WhatsApp:</strong> <Link href="https://wa.me/16825616897" target="_blank" rel="noopener noreferrer" color="blue.600" fontWeight="medium">+1 (682) 561-6897</Link></Text>
                    <Text><strong>Location:</strong> Texas, United States</Text>
                  </VStack>
                </Section>
              </VStack>
            </Box>

            {/* Terms of Service Section */}
            <Box
              id="terms-of-service"
              bg="white"
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="sm"
              scrollMarginTop="120px"
            >
              <Heading size="xl" mb={2} color="gray.900">
                Terms of Service
              </Heading>
              <Text fontSize="sm" color="gray.500" mb={6}>
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>

              <VStack align="stretch" gap={6}>
                <Section>
                  <SectionTitle>1. Acceptance of Terms</SectionTitle>
                  <Text>
                    By accessing and using DNCL-TECHZONE's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>2. Business Relationship</SectionTitle>
                  <Text>
                    DNCL-TECHZONE operates as a B2B (business-to-business) enterprise technology solutions provider. Our services are intended for business entities, not individual consumers. By engaging with our services, you represent that you are authorized to act on behalf of a business entity.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>3. Products & Services</SectionTitle>
                  <Text>
                    We specialize in the sale of mobile devices and enterprise technology solutions. All products are sold in compliance with applicable laws and regulations in Texas, United States. Product descriptions, specifications, and pricing are subject to change without notice.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>4. Orders & Payment</SectionTitle>
                  <Text mb={3}>All orders are subject to acceptance by DNCL-TECHZONE. We reserve the right to:</Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>Refuse or cancel any order at our discretion.</InfoItem>
                    <InfoItem>Require additional verification for large orders.</InfoItem>
                    <InfoItem>Modify pricing due to market conditions or supplier changes.</InfoItem>
                  </VStack>
                  <Text mt={3}>
                    Payment terms will be specified in your purchase agreement. All prices are in USD unless otherwise stated.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>5. Shipping & Delivery</SectionTitle>
                  <Text>
                    Shipping terms, delivery timelines, and associated costs will be outlined in your order confirmation. Risk of loss and title for products pass to you upon delivery to the carrier. We are not responsible for delays caused by carriers or force majeure events.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>6. Returns & Refunds</SectionTitle>
                  <Text>
                    Returns and refunds are handled on a case-by-case basis in accordance with our Return Policy. Defective products may be returned within 30 days of delivery for replacement or refund. Custom orders and special configurations may not be eligible for return. Contact our customer service team for return authorization.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>7. Warranties & Disclaimers</SectionTitle>
                  <Text>
                    Products are sold "as-is" unless otherwise specified. We provide warranties as required by law and manufacturer specifications. DNCL-TECHZONE disclaims all other warranties, express or implied, including merchantability and fitness for a particular purpose, to the maximum extent permitted by law.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>8. Limitation of Liability</SectionTitle>
                  <Text>
                    To the fullest extent permitted by law, DNCL-TECHZONE's liability for any claims arising from your use of our products or services shall not exceed the amount you paid for the specific product or service in question. We shall not be liable for indirect, incidental, or consequential damages.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>9. Intellectual Property</SectionTitle>
                  <Text>
                    All content on this website, including text, graphics, logos, and software, is the property of DNCL-TECHZONE or its licensors and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our written permission.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>10. Governing Law</SectionTitle>
                  <Text>
                    These Terms of Service are governed by the laws of the State of Texas, United States. Any disputes arising from these terms or our services shall be resolved in the state or federal courts located in Texas.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>11. Modifications</SectionTitle>
                  <Text>
                    We reserve the right to modify these Terms of Service at any time. Continued use of our services after changes constitutes acceptance of the modified terms.
                  </Text>
                </Section>
              </VStack>
            </Box>

            {/* Cookie Policy Section */}
            <Box
              id="cookie-policy"
              bg="white"
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="sm"
              scrollMarginTop="120px"
            >
              <Heading size="xl" mb={2} color="gray.900">
                Cookie Policy
              </Heading>
              <Text fontSize="sm" color="gray.500" mb={6}>
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>

              <VStack align="stretch" gap={6}>
                <Section>
                  <SectionTitle>1. What Are Cookies?</SectionTitle>
                  <Text>
                    Cookies are small text files placed on your device when you visit our website. They help us provide, protect, and improve our services by remembering your preferences and analyzing site usage.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>2. Types of Cookies We Use</SectionTitle>
                  <VStack align="stretch" gap={3}>
                    <InfoItem>
                      <strong>Essential Cookies:</strong> Required for basic site functionality, such as maintaining your session and enabling secure transactions.
                    </InfoItem>
                    <InfoItem>
                      <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website to improve user experience.
                    </InfoItem>
                    <InfoItem>
                      <strong>Functional Cookies:</strong> Remember your preferences and settings for a personalized experience.
                    </InfoItem>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>3. Managing Cookies</SectionTitle>
                  <Text>
                    You can control cookies through your browser settings. Most browsers allow you to refuse or delete cookies. However, disabling essential cookies may impact website functionality. For instructions on managing cookies in your browser, consult your browser's help documentation.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>4. Third-Party Cookies</SectionTitle>
                  <Text>
                    We may use third-party services (e.g., analytics providers) that set their own cookies. These are subject to the respective third parties' privacy policies.
                  </Text>
                </Section>
              </VStack>
            </Box>

            {/* Compliance Section */}
            <Box
              id="compliance"
              bg="white"
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="sm"
              scrollMarginTop="120px"
            >
              <Heading size="xl" mb={4} color="gray.900">
                Compliance
              </Heading>

              <VStack align="stretch" gap={6}>
                <Section>
                  <SectionTitle>Our Commitment to Compliance</SectionTitle>
                  <Text mb={4}>
                    At DNCL-TECHZONE, we understand that enterprise clients require the highest standards of compliance, security, and regulatory adherence. We maintain rigorous compliance frameworks to ensure our products and services meet or exceed industry standards and regulatory requirements.
                  </Text>
                  <Box bg="blue.50" borderRadius="lg" p={4} borderLeftWidth="4px" borderLeftColor="blue.500">
                    <Text color="gray.700" lineHeight="relaxed">
                      <strong>Enterprise-Grade Standards:</strong> Our compliance programs are designed to support B2B organizations operating in regulated industries, ensuring peace of mind and operational confidence.
                    </Text>
                  </Box>
                </Section>

                <Section>
                  <SectionTitle>Data Protection & Privacy Compliance</SectionTitle>
                  <VStack align="stretch" gap={4} mt={3}>
                    <Box borderLeftWidth="4px" borderLeftColor="blue.500" pl={4}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>GDPR (General Data Protection Regulation)</Heading>
                      <Text color="gray.700" lineHeight="relaxed">
                        We comply with GDPR requirements for processing personal data of EU residents, including data subject rights, data breach notifications, and privacy by design principles.
                      </Text>
                    </Box>

                    <Box borderLeftWidth="4px" borderLeftColor="blue.500" pl={4}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>CCPA (California Consumer Privacy Act)</Heading>
                      <Text color="gray.700" lineHeight="relaxed">
                        We respect California consumer privacy rights, including the right to know, delete, and opt-out of the sale of personal information.
                      </Text>
                    </Box>

                    <Box borderLeftWidth="4px" borderLeftColor="blue.500" pl={4}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>Other Regional Privacy Laws</Heading>
                      <Text color="gray.700" lineHeight="relaxed">
                        We maintain compliance with applicable privacy laws in jurisdictions where we operate, adapting our practices to meet local requirements.
                      </Text>
                    </Box>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>Security & Information Management Standards</SectionTitle>
                  <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mt={3}>
                    <Box bg="gray.50" borderRadius="lg" p={6}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>ISO 27001</Heading>
                      <Text color="gray.700" fontSize="sm" lineHeight="relaxed">
                        Information Security Management System (ISMS) standards for protecting sensitive data and ensuring secure operations.
                      </Text>
                    </Box>

                    <Box bg="gray.50" borderRadius="lg" p={6}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>SOC 2 Type II</Heading>
                      <Text color="gray.700" fontSize="sm" lineHeight="relaxed">
                        Service Organization Control 2 compliance for security, availability, processing integrity, confidentiality, and privacy.
                      </Text>
                    </Box>

                    <Box bg="gray.50" borderRadius="lg" p={6}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>NIST Framework</Heading>
                      <Text color="gray.700" fontSize="sm" lineHeight="relaxed">
                        Alignment with NIST Cybersecurity Framework for identifying, protecting, detecting, responding, and recovering from threats.
                      </Text>
                    </Box>

                    <Box bg="gray.50" borderRadius="lg" p={6}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>PCI DSS</Heading>
                      <Text color="gray.700" fontSize="sm" lineHeight="relaxed">
                        Payment Card Industry Data Security Standard compliance for secure payment processing and cardholder data protection.
                      </Text>
                    </Box>
                  </Box>
                </Section>

                <Section>
                  <SectionTitle>Regulatory Compliance</SectionTitle>
                  <Text mb={3}>
                    DNCL-TECHZONE is committed to operating in full compliance with all applicable laws and regulations. As a Texas-based business, we adhere to:
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>Federal Trade Commission (FTC) regulations for business practices</InfoItem>
                    <InfoItem>Texas state business and consumer protection laws</InfoItem>
                    <InfoItem>International trade regulations for global operations</InfoItem>
                    <InfoItem>Data protection and privacy laws (including applicable state and federal requirements)</InfoItem>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>Product Compliance</SectionTitle>
                  <Text mb={3}>
                    All mobile devices and technology products sold by DNCL-TECHZONE comply with:
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>Federal Communications Commission (FCC) regulations</InfoItem>
                    <InfoItem>Consumer Product Safety Commission (CPSC) standards</InfoItem>
                    <InfoItem>Environmental regulations (e.g., RoHS, WEEE compliance)</InfoItem>
                    <InfoItem>Manufacturer warranties and specifications</InfoItem>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>Compliance Monitoring & Documentation</SectionTitle>
                  <Text mb={3}>
                    Our compliance program includes:
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>Regular internal and third-party audits to verify compliance</InfoItem>
                    <InfoItem>Continuous staff training on compliance requirements and best practices</InfoItem>
                    <InfoItem>Periodic risk assessments to identify and mitigate compliance risks</InfoItem>
                    <InfoItem>Comprehensive documentation of policies, procedures, and compliance activities</InfoItem>
                  </VStack>
                  <Text mt={4}>
                    Enterprise clients may request compliance certificates, security questionnaires, Data Processing Agreements (DPAs), and audit reports. Please contact our compliance team at <Link href="mailto:compliance@dncltechzone.com" color="blue.600" fontWeight="medium">compliance@dncltechzone.com</Link>.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>Business Ethics</SectionTitle>
                  <Text>
                    DNCL-TECHZONE operates with integrity and transparency. We maintain ethical business practices, fair pricing, and honest communication with all business partners and customers.
                  </Text>
                </Section>
              </VStack>
            </Box>

            {/* Certifications Section */}
            <Box
              id="certifications"
              bg="white"
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="sm"
              scrollMarginTop="120px"
            >
              <Heading size="xl" mb={4} color="gray.900">
                Certifications & Standards
              </Heading>

              <VStack align="stretch" gap={6}>
                <Section>
                  <SectionTitle>Our Certifications</SectionTitle>
                  <Text mb={4}>
                    DNCL-TECHZONE maintains various certifications and adheres to industry standards to ensure the highest quality, security, and reliability in our products and services. These certifications demonstrate our commitment to excellence and provide assurance to our enterprise clients.
                  </Text>
                  <Box bg="blue.50" borderRadius="lg" p={4} borderLeftWidth="4px" borderLeftColor="blue.500">
                    <Text color="gray.700" lineHeight="relaxed">
                      <strong>Continuous Improvement:</strong> We regularly review and update our certifications to stay current with evolving industry standards and best practices.
                    </Text>
                  </Box>
                </Section>

                <Section>
                  <SectionTitle>Quality Management Certifications</SectionTitle>
                  <VStack align="stretch" gap={4} mt={3}>
                    <Box borderLeftWidth="4px" borderLeftColor="blue.500" pl={6} pr={4} py={4} bg="gray.50" borderRadius="md">
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>ISO 9001:2015</Heading>
                      <Text color="gray.700" lineHeight="relaxed" mb={2}>
                        <strong>Quality Management System</strong> - Certified for our commitment to quality management principles, customer satisfaction, and continuous improvement.
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Scope: Design, development, supply, and support of enterprise technology solutions
                      </Text>
                    </Box>

                    <Box borderLeftWidth="4px" borderLeftColor="green.500" pl={6} pr={4} py={4} bg="gray.50" borderRadius="md">
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>ISO 14001:2015</Heading>
                      <Text color="gray.700" lineHeight="relaxed" mb={2}>
                        <strong>Environmental Management System</strong> - Demonstrating our commitment to environmental responsibility and sustainable business practices.
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Focus: Environmental impact reduction, resource efficiency, and sustainable operations
                      </Text>
                    </Box>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>Information Security Certifications</SectionTitle>
                  <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mt={3}>
                    <Box bg="blue.50" borderRadius="lg" p={6}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>ISO 27001:2022</Heading>
                      <Text color="gray.700" fontSize="sm" lineHeight="relaxed" mb={3}>
                        <strong>Information Security Management System</strong> - Comprehensive framework for managing information security risks.
                      </Text>
                      <VStack align="flex-start" gap={1} fontSize="xs" color="gray.600">
                        <Text>• Risk assessment and treatment</Text>
                        <Text>• Access control and encryption</Text>
                        <Text>• Incident management</Text>
                      </VStack>
                    </Box>

                    <Box bg="purple.50" borderRadius="lg" p={6}>
                      <Heading size="sm" fontWeight="semibold" color="gray.800" mb={2}>SOC 2 Type II</Heading>
                      <Text color="gray.700" fontSize="sm" lineHeight="relaxed" mb={3}>
                        <strong>Service Organization Control</strong> - Annual audit demonstrating security, availability, and processing integrity.
                      </Text>
                      <VStack align="flex-start" gap={1} fontSize="xs" color="gray.600">
                        <Text>• Security controls verified</Text>
                        <Text>• Availability monitoring</Text>
                        <Text>• Processing integrity assurance</Text>
                      </VStack>
                    </Box>
                  </Box>
                </Section>

                <Section>
                  <SectionTitle>Product Certifications</SectionTitle>
                  <Text mb={3}>All products we distribute carry appropriate certifications including:</Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>FCC certification for wireless devices</InfoItem>
                    <InfoItem>CE marking for products sold in applicable markets</InfoItem>
                    <InfoItem>Manufacturer certifications and quality assurance standards</InfoItem>
                    <InfoItem>Compliance with industry-specific requirements</InfoItem>
                  </VStack>
                </Section>

                <Section>
                  <SectionTitle>Business Certifications</SectionTitle>
                  <Text>
                    DNCL-TECHZONE maintains proper business licenses and registrations required for operation in Texas and for conducting business in jurisdictions where we operate.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>Certification Verification & Documentation</SectionTitle>
                  <Text mb={3}>
                    Enterprise clients can request:
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <InfoItem>Certification certificates and audit reports</InfoItem>
                    <InfoItem>Compliance documentation for vendor assessments</InfoItem>
                    <InfoItem>Quality assurance reports and metrics</InfoItem>
                    <InfoItem>Security assessment questionnaires</InfoItem>
                    <InfoItem>Third-party audit findings (subject to confidentiality)</InfoItem>
                  </VStack>
                  <Text mt={4}>
                    For verification of specific certifications or compliance documentation, please contact us at <Link href="mailto:certifications@dncltechzone.com" color="blue.600" fontWeight="medium">certifications@dncltechzone.com</Link> or <Link href="mailto:info@dncltechzone.com" color="blue.600" fontWeight="medium">info@dncltechzone.com</Link>.
                  </Text>
                </Section>

                <Section>
                  <SectionTitle>Continuous Improvement</SectionTitle>
                  <Text>
                    We are committed to continuous improvement in our operations, product quality, and customer service. We regularly review and update our processes to maintain the highest standards.
                  </Text>
                </Section>
              </VStack>
            </Box>

            {/* Back to Top / Contact Section */}
            <Box
              bg="blue.50"
              p={8}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="blue.200"
            >
              <VStack align="center" gap={4}>
                <Heading size="md" color="gray.900">
                  Questions or Concerns?
                </Heading>
                <Text color="gray.700" textAlign="center" maxW="md">
                  If you have questions about any of our legal documents or policies, please contact us:
                </Text>
                <VStack align="center" gap={2}>
                  <Text><strong>Email:</strong> <Link href="mailto:info@dncltechzone.com" color="blue.600" fontWeight="medium">info@dncltechzone.com</Link></Text>
                  <Text><strong>Location:</strong> Texas, United States</Text>
                </VStack>
                <Button
                  as="a"
                  href="#privacy-policy"
                  bg="blue.600"
                  color="white"
                  size="md"
                  mt={2}
                  _hover={{ bg: 'blue.700' }}
                >
                  Back to Top
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>

      {/* Marketing Footer */}
      <Footer variant="marketing" />
    </>
  )
}

// Helper Components
function Section({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      {children}
    </Box>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={2}>
      {children}
    </Text>
  )
}

function InfoItem({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="sm" color="gray.700" lineHeight="1.6">
      {children}
    </Text>
  )
}
