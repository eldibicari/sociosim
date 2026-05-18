"use client";

import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

// ─── Surface section card ─────────────────────────────────────────────────────
export function PersonaSurfaceSection({
  eyebrow,
  title,
  description,
  icon,
  action,
  children,
  accent = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <Box
      borderRadius="32px"
      borderWidth="1px"
      borderColor="rgba(148, 163, 184, 0.16)"
      backgroundColor="rgba(255,255,255,0.94)"
      boxShadow="0 20px 60px rgba(15, 23, 42, 0.06), 0 1px 0 rgba(255,255,255,0.8) inset"
      backdropFilter="blur(16px)"
      overflow="hidden"
      position="relative"
      transition="box-shadow 0.22s ease"
      _hover={{ boxShadow: "0 28px 72px rgba(15, 23, 42, 0.09), 0 1px 0 rgba(255,255,255,0.8) inset" }}
    >
      {accent ? (
        <Box
          position="absolute"
          insetX={0}
          top={0}
          height="3px"
          background="linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)"
        />
      ) : null}

      <VStack alignItems="stretch" gap={0}>
        <Box px={{ base: 5, md: 7 }} pt={{ base: 6, md: 7 }} pb={{ base: 4, md: 5 }}>
          <HStack justifyContent="space-between" alignItems="flex-start" gap={4}>
            <VStack alignItems="stretch" gap={2} flex="1">
              {eyebrow ? (
                <HStack gap={2} alignItems="center">
                  <Box width="18px" height="1.5px" background="linear-gradient(90deg, #6366f1, #8b5cf6)" borderRadius="full" />
                  <Text
                    fontSize="2xs"
                    textTransform="uppercase"
                    letterSpacing="0.22em"
                    color="blue.600"
                    fontWeight="700"
                  >
                    {eyebrow}
                  </Text>
                </HStack>
              ) : null}
              <HStack gap={3} alignItems="center">
                {icon ? (
                  <Box
                    width="38px"
                    height="38px"
                    borderRadius="14px"
                    background="linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(14,165,233,0.10) 100%)"
                    borderWidth="1px"
                    borderColor="rgba(99,102,241,0.14)"
                    color="blue.700"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {icon}
                  </Box>
                ) : null}
                <Heading
                  size="lg"
                  lineHeight="1.15"
                  letterSpacing="-0.025em"
                  color="gray.900"
                >
                  {title}
                </Heading>
              </HStack>
              {description ? (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  lineHeight="1.8"
                  maxWidth="4xl"
                  pt={1}
                >
                  {description}
                </Text>
              ) : null}
            </VStack>
            {action}
          </HStack>
        </Box>

        <Box
          mx={{ base: 5, md: 7 }}
          height="1px"
          background="linear-gradient(90deg, rgba(148,163,184,0.18) 0%, rgba(148,163,184,0.06) 100%)"
          mb={{ base: 4, md: 5 }}
        />

        <Box px={{ base: 5, md: 7 }} pb={{ base: 6, md: 7 }}>
          {children}
        </Box>
      </VStack>
    </Box>
  );
}

// ─── Metric tile ──────────────────────────────────────────────────────────────
export function PersonaMetricTile({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string | number;
  helper?: string;
  accent?: "blue" | "indigo" | "green" | "orange";
}) {
  const accentMap = {
    blue:   { from: "#3b82f6", to: "#6366f1" },
    indigo: { from: "#6366f1", to: "#8b5cf6" },
    green:  { from: "#10b981", to: "#06b6d4" },
    orange: { from: "#f59e0b", to: "#ef4444" },
  };
  const chosen = accentMap[accent ?? "indigo"];
  const isNumber = typeof value === "number";

  return (
    <Box
      borderRadius="24px"
      borderWidth="1px"
      borderColor="rgba(148, 163, 184, 0.16)"
      backgroundColor="rgba(248,250,252,0.95)"
      px={4}
      py={4}
      position="relative"
      overflow="hidden"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}
    >
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        width="3px"
        background={`linear-gradient(180deg, ${chosen.from}, ${chosen.to})`}
        borderLeftRadius="24px"
      />
      <VStack alignItems="stretch" gap={1} pl={1}>
        <Text
          fontSize="2xs"
          textTransform="uppercase"
          letterSpacing="0.18em"
          color="fg.muted"
          fontWeight="600"
        >
          {label}
        </Text>
        <Text
          fontSize={isNumber ? "2xl" : "md"}
          fontWeight="800"
          letterSpacing={isNumber ? "-0.04em" : "-0.01em"}
          lineHeight="1.1"
          style={
            isNumber
              ? {
                  background: `linear-gradient(135deg, ${chosen.from}, ${chosen.to})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }
              : undefined
          }
          color={isNumber ? undefined : "gray.800"}
        >
          {value}
        </Text>
        {helper ? (
          <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
            {helper}
          </Text>
        ) : null}
      </VStack>
    </Box>
  );
}

// ─── Numbered point ───────────────────────────────────────────────────────────
export function PersonaNumberedPoint({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <HStack alignItems="flex-start" gap={3}>
      <Box
        width="28px"
        height="28px"
        borderRadius="10px"
        background="linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)"
        borderWidth="1px"
        borderColor="rgba(99,102,241,0.16)"
        color="blue.700"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="xs"
        fontWeight="800"
        flexShrink={0}
        mt="2px"
      >
        {index}
      </Box>
      <Text fontSize="sm" color="fg.default" lineHeight="1.8">
        {children}
      </Text>
    </HStack>
  );
}
