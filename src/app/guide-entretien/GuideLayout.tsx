"use client";

import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { BookOpen, ChevronRight, Clock, FileDown, Hash, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import type { TocItem } from "@/lib/markdown";

// ── Reading progress bar ────────────────────────────────────────────────────
function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box
      position="fixed"
      top="var(--app-header-height, 56px)"
      left={0}
      right={0}
      height="2px"
      zIndex={99}
      background="rgba(226,232,240,0.4)"
    >
      <Box
        height="100%"
        background="linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9)"
        style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
      />
    </Box>
  );
}

// ── Table of contents ────────────────────────────────────────────────────────
function TableOfContents({
  items,
  activeId,
}: {
  items: TocItem[];
  activeId: string | null;
}) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <Box
      as="nav"
      position="sticky"
      top="calc(var(--app-header-height, 56px) + 24px)"
      width="240px"
      flexShrink={0}
      display={{ base: "none", xl: "block" }}
      alignSelf="flex-start"
      maxHeight="calc(100vh - 120px)"
      overflowY="auto"
      pr={2}
    >
      {/* TOC header */}
      <HStack gap={2} mb={3}>
        <Box height="1px" width="14px" background="rgba(99,102,241,0.4)" />
        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color="fg.muted">
          Sommaire
        </Text>
      </HStack>

      <VStack alignItems="stretch" gap={0.5}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <Box
              key={item.id}
              as="button"
              textAlign="left"
              pl={item.depth === 3 ? 5 : 2}
              pr={2}
              py={1.5}
              borderRadius="lg"
              borderLeft="2px solid"
              borderLeftColor={isActive ? "#6366f1" : "transparent"}
              background={isActive ? "rgba(99,102,241,0.06)" : "transparent"}
              cursor="pointer"
              transition="all 0.15s ease"
              onClick={() => handleClick(item.id)}
              _hover={{
                background: "rgba(99,102,241,0.05)",
                borderLeftColor: isActive ? "#6366f1" : "rgba(99,102,241,0.3)",
              }}
            >
              <Text
                fontSize={item.depth === 3 ? "xs" : "xs"}
                fontWeight={isActive ? "700" : "500"}
                color={isActive ? "blue.700" : "fg.muted"}
                lineHeight="1.45"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.depth === 3 && (
                  <Box as="span" color="fg.subtle" mr={1} fontSize="2xs">↳</Box>
                )}
                {item.text}
              </Text>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

// ── Main layout component ─────────────────────────────────────────────────────
interface GuideLayoutProps {
  html: string;
  tocItems: TocItem[];
  wordCount: number;
}

export function GuideLayout({ html, tocItems, wordCount }: GuideLayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const readingMinutes = Math.ceil(wordCount / 200);
  const phaseCount = tocItems.filter(
    (t) => t.depth === 2 && t.text.toUpperCase().includes("PHASE")
  ).length;

  // IntersectionObserver to track active heading
  useEffect(() => {
    const headingIds = tocItems.map((t) => t.id);
    const observers: IntersectionObserver[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    headingIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    observers.push(observer);
    return () => observers.forEach((o) => o.disconnect());
  }, [tocItems]);

  const handlePrint = () => window.print();

  return (
    <>
      <ProgressBar />

      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6, lg: 8 }} py={8}>
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            mb={10}
            borderRadius="28px"
            overflow="hidden"
            position="relative"
            background="linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(237,233,254,0.75) 60%, rgba(239,246,255,0.95) 100%)"
            borderWidth="1px"
            borderColor="rgba(99,102,241,0.15)"
            boxShadow="0 12px 40px rgba(99,102,241,0.07)"
          >
            {/* 3px top accent */}
            <Box
              position="absolute"
              insetX={0}
              top={0}
              height="3px"
              background="linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9)"
            />

            {/* Decorative blob */}
            <Box
              position="absolute"
              top="-50px"
              right="-30px"
              width="220px"
              height="220px"
              borderRadius="full"
              background="radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)"
              pointerEvents="none"
            />

            <Box px={{ base: 6, md: 8 }} pt={8} pb={6} position="relative">
              {/* Eyebrow */}
              <HStack gap={2} mb={4}>
                <Box height="1px" width="20px" background="rgba(99,102,241,0.4)" />
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="blue.600">
                  Méthodologie
                </Text>
              </HStack>

              <HStack
                alignItems={{ base: "flex-start", md: "center" }}
                justifyContent="space-between"
                flexDirection={{ base: "column", md: "row" }}
                gap={5}
              >
                <VStack alignItems="flex-start" gap={2}>
                  <HStack gap={3} alignItems="center">
                    <Box
                      width="44px"
                      height="44px"
                      borderRadius="14px"
                      background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 6px 16px rgba(99,102,241,0.25)"
                      flexShrink={0}
                    >
                      <BookOpen size={20} color="white" />
                    </Box>
                    <VStack alignItems="flex-start" gap={0}>
                      <Text
                        fontSize={{ base: "2xl", md: "3xl" }}
                        fontWeight="900"
                        letterSpacing="-0.04em"
                        lineHeight="1.1"
                        color="gray.900"
                      >
                        Guide d&apos;entretien
                      </Text>
                      <Text fontSize="sm" color="fg.muted" letterSpacing="0.02em">
                        Simulation sociologique semi-directive
                      </Text>
                    </VStack>
                  </HStack>

                  <Text fontSize="sm" color="gray.600" lineHeight="1.75" maxW="520px">
                    Ce guide accompagne la conduite des entretiens semi-directifs avec les personas.
                    Il détaille les phases, les relances et les points de vigilance méthodologique.
                  </Text>
                </VStack>

                {/* Actions */}
                <VStack gap={2} flexShrink={0} alignItems={{ base: "flex-start", md: "flex-end" }}>
                  <Button
                    asChild
                    size="sm"
                    colorPalette="blue"
                    borderRadius="xl"
                    fontWeight="700"
                    px={5}
                  >
                    <NextLink href="/personnas">
                      Choisir un persona
                      <ChevronRight size={14} />
                    </NextLink>
                  </Button>
                  <Button
                    size="sm"
                    variant="subtle"
                    borderRadius="xl"
                    fontWeight="600"
                    onClick={handlePrint}
                  >
                    <Printer size={13} />
                    Imprimer le guide
                  </Button>
                </VStack>
              </HStack>

              {/* Stats strip */}
              <HStack
                gap={0}
                mt={6}
                borderRadius="16px"
                overflow="hidden"
                borderWidth="1px"
                borderColor="rgba(148,163,184,0.16)"
                background="rgba(255,255,255,0.7)"
                backdropFilter="blur(8px)"
                display="inline-flex"
              >
                {[
                  { label: "Temps de lecture", value: `~${readingMinutes} min`, icon: Clock },
                  { label: "Phases", value: String(phaseCount || tocItems.filter(t => t.depth === 2).length), icon: Hash },
                  { label: "Sections", value: String(tocItems.filter(t => t.depth === 3).length), icon: FileDown },
                ].map((stat, i) => (
                  <HStack
                    key={stat.label}
                    gap={2}
                    px={4}
                    py={2.5}
                    borderRight={i < 2 ? "1px solid rgba(148,163,184,0.16)" : undefined}
                  >
                    <Box color="blue.500" opacity={0.7}>
                      <stat.icon size={13} />
                    </Box>
                    <Box>
                      <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="fg.muted">
                        {stat.label}
                      </Text>
                      <Text
                        fontWeight="900"
                        fontSize="sm"
                        letterSpacing="-0.02em"
                        style={{
                          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {stat.value}
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </HStack>
            </Box>
          </Box>
        </motion.div>

        {/* ── Body: TOC + Content ─────────────────────────────────────────── */}
        <HStack alignItems="flex-start" gap={10}>
          {/* TOC sidebar */}
          <TableOfContents items={tocItems} activeId={activeId} />

          {/* Main content */}
          <motion.div
            ref={contentRef as React.RefObject<HTMLDivElement>}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, minWidth: 0 }}
          >
            <Box
              className="guide-content"
              css={{
                /* Headings */
                "& h1": {
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                  marginBottom: "0.75rem",
                  marginTop: "0.25rem",
                  color: "var(--chakra-colors-gray-900)",
                },
                "& h2": {
                  fontSize: "1.15rem",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                  marginTop: "2.5rem",
                  marginBottom: "0.75rem",
                  paddingBottom: "0.5rem",
                  paddingTop: "0.25rem",
                  borderBottom: "1px solid rgba(148,163,184,0.2)",
                  color: "var(--chakra-colors-gray-900)",
                  scrollMarginTop: "88px",
                },
                "& h3": {
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  letterSpacing: "-0.01em",
                  marginTop: "1.75rem",
                  marginBottom: "0.5rem",
                  color: "var(--chakra-colors-gray-800)",
                  scrollMarginTop: "88px",
                },
                /* Body text */
                "& p": {
                  marginBottom: "0.85rem",
                  lineHeight: "1.8",
                  color: "var(--chakra-colors-gray-700)",
                  fontSize: "0.9375rem",
                },
                "& ul, & ol": {
                  paddingLeft: "1.4rem",
                  marginBottom: "1rem",
                },
                "& li": {
                  marginBottom: "0.45rem",
                  lineHeight: "1.7",
                  fontSize: "0.9375rem",
                  color: "var(--chakra-colors-gray-700)",
                },
                /* Blockquotes = interview prompts */
                "& blockquote": {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.04) 100%)",
                  borderLeft: "3px solid #6366f1",
                  borderRadius: "0 16px 16px 0",
                  paddingTop: "0.9rem",
                  paddingBottom: "0.9rem",
                  paddingLeft: "1.25rem",
                  paddingRight: "1.1rem",
                  marginTop: "1rem",
                  marginBottom: "1.25rem",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
                },
                "& blockquote p": {
                  marginBottom: "0.3rem",
                  fontStyle: "italic",
                  color: "var(--chakra-colors-gray-700)",
                  fontSize: "0.9rem",
                },
                /* Tables */
                "& table": {
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "1rem",
                  marginBottom: "1.5rem",
                  fontSize: "0.875rem",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
                  borderWidth: "1px",
                  borderColor: "rgba(148,163,184,0.18)",
                },
                "& th": {
                  background: "linear-gradient(135deg, rgba(239,246,255,0.9), rgba(237,233,254,0.6))",
                  padding: "0.6rem 0.85rem",
                  textAlign: "left",
                  verticalAlign: "top",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                  letterSpacing: "0.02em",
                  color: "var(--chakra-colors-gray-800)",
                  borderBottom: "1px solid rgba(148,163,184,0.2)",
                },
                "& td": {
                  padding: "0.55rem 0.85rem",
                  textAlign: "left",
                  verticalAlign: "top",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                  color: "var(--chakra-colors-gray-700)",
                },
                "& tr:last-child td": {
                  borderBottom: "none",
                },
                "& tr:nth-of-type(even) td": {
                  background: "rgba(248,250,252,0.6)",
                },
                /* HR */
                "& hr": {
                  borderColor: "rgba(148,163,184,0.2)",
                  marginTop: "2.25rem",
                  marginBottom: "2.25rem",
                },
                /* Inline */
                "& strong": { fontWeight: "700", color: "var(--chakra-colors-gray-800)" },
                "& em": { fontStyle: "italic" },
                "& code": {
                  background: "rgba(99,102,241,0.07)",
                  borderRadius: "6px",
                  padding: "0.1em 0.4em",
                  fontSize: "0.84em",
                  fontFamily: "monospace",
                  color: "#4f46e5",
                },
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* CTA bas de page */}
            <Box
              mt={14}
              pt={8}
              borderTop="1px solid"
              borderColor="rgba(148,163,184,0.18)"
            >
              <Box
                borderRadius="24px"
                background="linear-gradient(135deg, rgba(239,246,255,0.9), rgba(237,233,254,0.7))"
                borderWidth="1px"
                borderColor="rgba(99,102,241,0.15)"
                px={8}
                py={7}
                textAlign="center"
              >
                <Box
                  position="relative"
                  display="inline-block"
                  mb={4}
                >
                  <Box
                    width="52px"
                    height="52px"
                    borderRadius="16px"
                    background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mx="auto"
                    boxShadow="0 8px 24px rgba(99,102,241,0.3)"
                  >
                    <BookOpen size={22} color="white" />
                  </Box>
                </Box>
                <Text fontWeight="800" fontSize="lg" letterSpacing="-0.02em" color="gray.900" mb={1}>
                  Guide lu ? Passez à la pratique.
                </Text>
                <Text fontSize="sm" color="fg.muted" mb={5}>
                  Sélectionnez un persona et commencez votre première simulation d&apos;entretien.
                </Text>
                <Button
                  asChild
                  size="md"
                  colorPalette="blue"
                  borderRadius="xl"
                  fontWeight="700"
                  px={8}
                >
                  <NextLink href="/personnas">
                    Choisir un persona
                    <ChevronRight size={14} />
                  </NextLink>
                </Button>
              </Box>
            </Box>
          </motion.div>
        </HStack>
      </Box>

      {/* Print styles */}
      <style>{`
        @media print {
          header, nav, [data-toc], .progress-bar { display: none !important; }
          .guide-content { max-width: 100% !important; }
        }
      `}</style>
    </>
  );
}
