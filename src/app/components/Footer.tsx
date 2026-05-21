"use client";

import { Box, HStack, Image, Link, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";

export default function Footer() {
  return (
    <Box
      as="footer"
      position="relative"
      borderTopWidth="1px"
      borderTopColor="rgba(148,163,184,0.14)"
      mt={10}
      background="linear-gradient(180deg, rgba(248,250,252,0.6) 0%, rgba(255,255,255,0.98) 100%)"
      backdropFilter="blur(8px)"
    >
      {/* Top gradient line */}
      <Box
        position="absolute"
        insetX={0}
        top={0}
        height="1px"
        background="linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.25) 30%, rgba(139,92,246,0.25) 60%, transparent 100%)"
      />

      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }} py={6}>
        <VStack alignItems="stretch" gap={4}>
          {/* Main row: brand | tagline center | links right */}
          <HStack
            justifyContent="space-between"
            alignItems={{ base: "flex-start", md: "center" }}
            flexDirection={{ base: "column", md: "row" }}
            gap={5}
          >
            {/* Brand: University logo + Mimesis icon + wordmark */}
            <HStack gap={3} alignItems="center" flexShrink={0}>
              <Link
                href="https://www.univ-gustave-eiffel.fr/"
                target="_blank"
                rel="noopener noreferrer"
                _hover={{ opacity: 1 }}
                transition="opacity 0.15s"
              >
                <Image
                  src="/logos/Logo_Universite_Gustave_Eiffel_2020.svg"
                  alt="Université Gustave Eiffel — site officiel"
                  height="28px"
                  width="auto"
                  opacity={0.75}
                  _hover={{ opacity: 1 }}
                  transition="opacity 0.15s"
                />
              </Link>
              <Box
                height="24px"
                width="1px"
                background="rgba(148,163,184,0.3)"
              />
              <HStack gap={2} alignItems="center">
                <svg width="26" height="19" viewBox="0 0 30 22" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="ftr-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B7CF8" />
                      <stop offset="100%" stopColor="#6D5DF6" />
                    </linearGradient>
                    <linearGradient id="ftr-g2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6D5DF6" />
                      <stop offset="100%" stopColor="#5B4BE8" />
                    </linearGradient>
                  </defs>
                  <circle cx="8" cy="8" r="5.5" fill="url(#ftr-g1)" />
                  <path d="M 2 17 Q 8 13.5 14 17" stroke="url(#ftr-g1)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <circle cx="22" cy="8" r="5.5" fill="url(#ftr-g2)" opacity="0.82" />
                  <path d="M 16 17 Q 22 13.5 28 17" stroke="url(#ftr-g2)" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.82" />
                  <circle cx="15" cy="9" r="1.8" fill="#A78BFA" opacity="0.9" />
                </svg>
                <Text
                  className="mimesis-wordmark display-heading"
                  fontWeight="800"
                  fontSize="lg"
                  letterSpacing="-0.03em"
                >
                  Mimesis
                </Text>
              </HStack>
            </HStack>

            {/* Center tagline */}
            <HStack
              gap={2}
              alignItems="center"
              display={{ base: "none", md: "flex" }}
              flex="1"
              justifyContent="center"
            >
              <Box
                width="6px"
                height="6px"
                borderRadius="full"
                background="linear-gradient(135deg, #6366f1, #8b5cf6)"
              />
              <Text fontSize="xs" color="fg.muted" letterSpacing="0.04em" fontStyle="italic">
                Recherche en sociologie computationnelle
              </Text>
              <Box
                width="6px"
                height="6px"
                borderRadius="full"
                background="linear-gradient(135deg, #8b5cf6, #6366f1)"
              />
            </HStack>

            {/* Links */}
            <HStack gap={5} flexWrap="wrap" flexShrink={0}>
              <Link
                as={NextLink}
                href="/guide-entretien"
                fontSize="xs"
                color="fg.muted"
                fontWeight="500"
                _hover={{ color: "blue.600", textDecoration: "none" }}
                transition="color 0.15s"
              >
                Guide d&apos;entretien
              </Link>
              <Link
                as={NextLink}
                href="/contact"
                fontSize="xs"
                color="fg.muted"
                fontWeight="500"
                _hover={{ color: "blue.600", textDecoration: "none" }}
                transition="color 0.15s"
              >
                Contact
              </Link>
              <Link
                as={NextLink}
                href="/politique-de-confidentialite"
                fontSize="xs"
                color="fg.muted"
                fontWeight="500"
                _hover={{ color: "blue.600", textDecoration: "none" }}
                transition="color 0.15s"
              >
                Confidentialité
              </Link>
              <Link
                as={NextLink}
                href="/conditions-d-utilisation"
                fontSize="xs"
                color="fg.muted"
                fontWeight="500"
                _hover={{ color: "blue.600", textDecoration: "none" }}
                transition="color 0.15s"
              >
                CGU
              </Link>
            </HStack>
          </HStack>

          {/* Bottom row: copyright only */}
          <Box
            borderTopWidth="1px"
            borderTopColor="rgba(148,163,184,0.1)"
            pt={3}
            textAlign="center"
          >
            <Text fontSize="2xs" color="fg.muted" letterSpacing="0.04em">
              © 2026 Université Gustave Eiffel — Tous droits réservés
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
