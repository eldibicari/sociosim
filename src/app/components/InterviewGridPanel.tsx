"use client";

import {
  Box,
  Button,
  Dialog,
  Heading,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { BookOpen, X } from "lucide-react";
import { useState } from "react";
import { parseInterviewGrid } from "@/lib/interviewGridParser";
import type { InterviewGrid } from "@/lib/personaConfig";

type Props = {
  agentId: string | null;
};

export function InterviewGridPanel({ agentId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [grid, setGrid] = useState<InterviewGrid | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setIsOpen(true);
    if (grid !== null || !agentId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/agents/${agentId}/prompts`);
      if (!response.ok) throw new Error("Impossible de charger la grille.");
      const data = await response.json();
      const guideText: string = data?.agent?.interview_guide ?? "";
      setGrid(parseInterviewGrid(guideText));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="subtle"
        colorPalette="blue"
        onClick={handleOpen}
        width="100%"
      >
        <BookOpen size={14} />
        Grille d&apos;entretien
      </Button>

      <Dialog.Root
        open={isOpen}
        onOpenChange={({ open }) => setIsOpen(open)}
        placement="end"
        size="md"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" maxHeight="90vh" overflowY="auto">
              <Dialog.Header borderBottomWidth="1px" borderColor="border.subtle" pb={4}>
                <HStack justifyContent="space-between" width="100%">
                  <HStack gap={2}>
                    <BookOpen size={16} />
                    <Dialog.Title fontSize="md" fontWeight="semibold">
                      Grille d&apos;entretien
                    </Dialog.Title>
                  </HStack>
                  <Dialog.CloseTrigger asChild>
                    <Button variant="ghost" size="xs" onClick={() => setIsOpen(false)}>
                      <X size={14} />
                    </Button>
                  </Dialog.CloseTrigger>
                </HStack>
              </Dialog.Header>

              <Dialog.Body py={5}>
                {isLoading ? (
                  <VStack gap={3} py={8}>
                    <Spinner size="md" color="blue.500" />
                    <Text fontSize="sm" color="fg.muted">Chargement...</Text>
                  </VStack>
                ) : error ? (
                  <Text color="red.500" fontSize="sm">{error}</Text>
                ) : !grid || grid.themes.length === 0 ? (
                  <VStack gap={3} py={8} textAlign="center">
                    <BookOpen size={28} color="var(--chakra-colors-fg-muted)" />
                    <Text fontSize="sm" color="fg.muted">
                      Aucune grille définie pour ce persona.
                    </Text>
                  </VStack>
                ) : (
                  <VStack alignItems="stretch" gap={4}>
                    {grid.themes.map((theme, i) => (
                      <Box
                        key={theme.id}
                        borderWidth="1px"
                        borderColor="border.subtle"
                        borderRadius="xl"
                        p={4}
                        backgroundColor="bg.subtle"
                      >
                        <VStack alignItems="stretch" gap={3}>
                          <HStack gap={2}>
                            <Box
                              minWidth="22px"
                              height="22px"
                              borderRadius="full"
                              backgroundColor="blue.100"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                            >
                              <Text fontSize="xs" fontWeight="bold" color="blue.700">
                                {i + 1}
                              </Text>
                            </Box>
                            <Heading size="xs" fontWeight="semibold">
                              {theme.title}
                            </Heading>
                          </HStack>

                          {theme.objective ? (
                            <Text fontSize="xs" color="fg.muted" fontStyle="italic" lineHeight="1.7" pl="30px">
                              {theme.objective}
                            </Text>
                          ) : null}

                          {theme.questions.length > 0 ? (
                            <VStack alignItems="stretch" gap={2} pl="30px">
                              {theme.questions.map((q) => (
                                <HStack key={q.id} gap={2} alignItems="flex-start">
                                  <Text color="blue.400" fontSize="xs" mt="3px" flexShrink={0}>—</Text>
                                  <Text fontSize="sm" lineHeight="1.65">{q.label}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          ) : null}
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
