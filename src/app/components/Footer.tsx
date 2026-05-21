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
          {/* Main row */}
          <HStack
            justifyContent="space-between"
            alignItems={{ base: "flex-start", md: "center" }}
            flexDirection={{ base: "column", md: "row" }}
            gap={5}
          >
            {/* Brand + institution */}
            <HStack gap={4} alignItems="center">
              <Image
                src="/logos/Logo_Universite_Gustave_Eiffel_2020.svg"
                alt="Université Gustave Eiffel"
                height="28px"
                width="auto"
                opacity={0.75}
              />
              <Box
                height="24px"
                width="1px"
                background="rgba(148,163,184,0.3)"
              />
              <VStack alignItems="flex-start" gap={0}>
                <Text
                  className="mimesis-wordmark"
                  fontWeight="800"
                  fontSize="sm"
                  letterSpacing="-0.03em"
                >
                  Mimesis
                </Text>
                <Text fontSize="2xs" color="fg.muted" letterSpacing="0.06em">
                  Simulation d&apos;entretien sociologique
                </Text>
              </VStack>
            </HStack>

            {/* Links */}
            <HStack gap={5} flexWrap="wrap">
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

          {/* Bottom row */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            borderTopWidth="1px"
            borderTopColor="rgba(148,163,184,0.1)"
            pt={3}
          >
            <Text fontSize="2xs" color="fg.muted" letterSpacing="0.04em">
              © 2026 Université Gustave Eiffel — Tous droits réservés
            </Text>
            <HStack gap={1.5} alignItems="center">
              <Box
                width="6px"
                height="6px"
                borderRadius="full"
                background="linear-gradient(135deg, #6366f1, #8b5cf6)"
              />
              <Text fontSize="2xs" color="fg.muted">
                Recherche en sociologie computationnelle
              </Text>
            </HStack>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
