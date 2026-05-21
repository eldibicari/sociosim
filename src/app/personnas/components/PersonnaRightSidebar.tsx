"use client";

import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

type PersonnaRightSidebarProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
};

export default function PersonnaRightSidebar({
  title = "Validation du prompt",
  subtitle,
  children,
}: PersonnaRightSidebarProps) {
  return (
    <Box
      width={{ base: "full", lg: "var(--personna-right-sidebar-width)" }}
      minWidth={{ base: "full", lg: "var(--personna-right-sidebar-width)" }}
      borderTop={{ base: "1px solid", lg: "none" }}
      borderLeft={{ base: "none", lg: "1px solid" }}
      borderLeftColor={{ base: "transparent", lg: "var(--color-border)" }}
      backgroundColor="var(--color-bg)"
      padding={{ base: 4, lg: 5 }}
      position={{ base: "relative", lg: "fixed" }}
      top={{ base: 0, lg: "var(--app-header-height)" }}
      right={0}
      height={{ base: "auto", lg: "calc(100vh - var(--app-header-height))" }}
      overflowY={{ base: "visible", lg: "auto" }}
      alignSelf={{ base: "stretch", lg: "flex-start" }}
      zIndex={10}
    >
      <VStack align="stretch" gap={4}>
        {title ? (
          <VStack align="stretch" gap={1}>
            <Heading size="md">{title}</Heading>
            {subtitle ? (
              <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
                {subtitle}
              </Text>
            ) : null}
          </VStack>
        ) : null}
        {children}
      </VStack>
    </Box>
  );
}
