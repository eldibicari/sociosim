"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, BookOpen, Edit2, Save, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { withTimeout } from "@/lib/withTimeout";
import { parseInterviewGrid } from "@/lib/interviewGridParser";
import type { InterviewGrid } from "@/lib/personaConfig";

type AgentGuidePayload = {
  agent?: {
    id: string;
    agent_name: string;
    interview_guide?: string | null;
  };
};

export default function PersonaGrillePage() {
  const router = useRouter();
  const params = useParams();
  const agentId = typeof params.id === "string" ? params.id : "";
  const { user, isLoading: isAuthLoading, refreshUser } = useAuthUser();

  const [agentName, setAgentName] = useState("");
  const [guideText, setGuideText] = useState("");
  const [draftText, setDraftText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!agentId) {
      setError("Persona introuvable.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const response = await withTimeout(
          "loadPersonaGuide",
          fetch(`/api/agents/${agentId}/prompts`),
          15000
        );
        if (response.status === 401) await refreshUser();
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Impossible de charger la grille.");
        }
        const data = (await response.json()) as AgentGuidePayload;
        setAgentName(data.agent?.agent_name ?? "");
        setGuideText(data.agent?.interview_guide ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [agentId, isAuthLoading, refreshUser, router, user]);

  const grid = useMemo<InterviewGrid | null>(
    () => parseInterviewGrid(guideText),
    [guideText]
  );

  const handleEdit = () => {
    setDraftText(guideText);
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraftText("");
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await withTimeout(
        "saveGuide",
        fetch(`/api/agents/${agentId}/guide`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interview_guide: draftText }),
        }),
        15000
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Impossible de sauvegarder.");
      }
      setGuideText(draftText);
      setIsEditing(false);
      setDraftText("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <Container maxWidth="4xl" py={16}>
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement de la grille...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="4xl" py={16}>
        <VStack gap={4} alignItems="flex-start">
          <Heading size="lg">Grille introuvable</Heading>
          <Text color="fg.muted">{error}</Text>
          <Button variant="subtle" onClick={() => router.push("/personnas")}>
            Retour aux personas
          </Button>
        </VStack>
      </Container>
    );
  }

  const title = agentName.charAt(0).toUpperCase() + agentName.slice(1);

  return (
    <Box minHeight="100vh" backgroundColor="bg.surface">
      <Container maxWidth="4xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
        <VStack alignItems="stretch" gap={8}>

          {/* Navigation */}
          <Stack gap={2}>
            <Button
              alignSelf="flex-start"
              variant="ghost"
              colorPalette="blue"
              onClick={() => router.push(`/personnas/${agentId}`)}
            >
              <ArrowLeft size={16} />
              Retour à la fiche
            </Button>
            <HStack gap={3} flexWrap="wrap" alignItems="center">
              <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={3} py={1}>
                Grille d&apos;entretien
              </Badge>
              <Heading size="xl">{title}</Heading>
            </HStack>
            <Text color="fg.muted" fontSize="sm" lineHeight="1.7">
              La grille structure les thèmes, questions et relances de l&apos;entretien.
              Elle est indépendante du prompt et sert de guide méthodologique avant, pendant et après l&apos;échange.
            </Text>
          </Stack>

          {/* Mode édition */}
          {isEditing ? (
            <Card.Root borderRadius="3xl" borderWidth="1px" borderColor="border.subtle" backgroundColor="white">
              <Card.Body px={{ base: 5, md: 6 }} py={{ base: 5, md: 6 }}>
                <VStack alignItems="stretch" gap={4}>
                  <HStack justifyContent="space-between">
                    <Heading size="md">Modifier la grille</Heading>
                    <HStack gap={2}>
                      <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X size={14} />
                        Annuler
                      </Button>
                      <Button
                        colorPalette="blue"
                        size="sm"
                        onClick={handleSave}
                        loading={isSaving}
                      >
                        <Save size={14} />
                        Sauvegarder
                      </Button>
                    </HStack>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
                    Format conseillé : un thème par bloc (ligne vide entre chaque), première ligne = titre du thème, puis tirets pour les questions.
                  </Text>
                  <Textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    minHeight="400px"
                    fontFamily="mono"
                    fontSize="sm"
                    lineHeight="1.7"
                    placeholder={`Rapport au quartier\n- Depuis combien de temps habitez-vous ici ?\n- Qu'est-ce qui a changé autour de vous ?\n\nRelations de voisinage\n- Connaissez-vous vos voisins ?`}
                  />
                  {saveError ? (
                    <Text color="red.500" fontSize="sm">{saveError}</Text>
                  ) : null}
                </VStack>
              </Card.Body>
            </Card.Root>
          ) : (
            <>
              {/* Actions */}
              <HStack gap={3}>
                <Button colorPalette="blue" variant="subtle" onClick={handleEdit}>
                  <Edit2 size={15} />
                  Modifier la grille
                </Button>
                <Button variant="outline" onClick={() => router.push(`/personnas/${agentId}/edit`)}>
                  Éditeur de prompt
                </Button>
              </HStack>

              {/* Grille structurée */}
              {grid && grid.themes.length > 0 ? (
                <VStack alignItems="stretch" gap={4}>
                  {grid.title && grid.title !== "Grille d'entretien" ? (
                    <Box>
                      <Text fontWeight="semibold" fontSize="lg">{grid.title}</Text>
                      {grid.objective ? (
                        <Text color="fg.muted" fontSize="sm" mt={1}>{grid.objective}</Text>
                      ) : null}
                    </Box>
                  ) : null}

                  {grid.themes.map((theme, i) => (
                    <Card.Root
                      key={theme.id}
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      backgroundColor="white"
                    >
                      <Card.Body px={{ base: 5, md: 6 }} py={5}>
                        <VStack alignItems="stretch" gap={3}>
                          <HStack gap={3}>
                            <Box
                              minWidth="28px"
                              height="28px"
                              borderRadius="full"
                              backgroundColor="blue.100"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" fontWeight="bold" color="blue.700">
                                {i + 1}
                              </Text>
                            </Box>
                            <Heading size="sm">{theme.title}</Heading>
                          </HStack>

                          {theme.objective ? (
                            <Text fontSize="sm" color="fg.muted" fontStyle="italic" lineHeight="1.7" pl="43px">
                              {theme.objective}
                            </Text>
                          ) : null}

                          {theme.questions.length > 0 ? (
                            <VStack alignItems="stretch" gap={2} pl="43px">
                              {theme.questions.map((q) => (
                                <HStack key={q.id} gap={2} alignItems="flex-start">
                                  <Text color="blue.400" mt="2px" flexShrink={0}>—</Text>
                                  <Text fontSize="sm" lineHeight="1.7">{q.label}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          ) : (
                            <Text fontSize="sm" color="fg.muted" pl="43px">
                              Aucune question renseignée pour ce thème.
                            </Text>
                          )}
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  ))}
                </VStack>
              ) : (
                <Card.Root borderRadius="3xl" borderWidth="1px" borderColor="border.subtle" backgroundColor="white">
                  <Card.Body px={{ base: 5, md: 6 }} py={8}>
                    <VStack gap={4} alignItems="center" textAlign="center">
                      <BookOpen size={32} color="var(--chakra-colors-fg-muted)" />
                      <Heading size="md" color="fg.muted">Aucune grille pour ce persona</Heading>
                      <Text color="fg.muted" fontSize="sm" maxWidth="sm" lineHeight="1.7">
                        Ajoutez une grille d&apos;entretien pour structurer les thèmes, questions et relances avant de commencer.
                      </Text>
                      <Button colorPalette="blue" onClick={handleEdit}>
                        <Edit2 size={15} />
                        Créer la grille
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
