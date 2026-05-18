"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Heading,
  HStack,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, BookOpen, Edit2, Eye, FileText, Save, X } from "lucide-react";
import { motion } from "framer-motion";
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

// ─── Theme card ───────────────────────────────────────────────────────────────
function ThemeCard({ theme, index }: { theme: InterviewGrid["themes"][number]; index: number }) {
  const accentColors = [
    { from: "#6366f1", to: "#8b5cf6" },
    { from: "#0ea5e9", to: "#6366f1" },
    { from: "#8b5cf6", to: "#ec4899" },
    { from: "#10b981", to: "#0ea5e9" },
    { from: "#f59e0b", to: "#ef4444" },
  ];
  const accent = accentColors[index % accentColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        borderRadius="28px"
        borderWidth="1px"
        borderColor="rgba(148,163,184,0.16)"
        background="rgba(255,255,255,0.94)"
        boxShadow="0 8px 32px rgba(15,23,42,0.05)"
        overflow="hidden"
        position="relative"
        transition="box-shadow 0.2s ease, transform 0.2s ease"
        _hover={{ boxShadow: "0 16px 48px rgba(15,23,42,0.08)", transform: "translateY(-2px)" }}
      >
        {/* Left accent bar */}
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          width="4px"
          background={`linear-gradient(180deg, ${accent.from}, ${accent.to})`}
        />

        <VStack alignItems="stretch" gap={0} pl={1}>
          {/* Theme header */}
          <HStack
            px={{ base: 5, md: 6 }}
            pt={{ base: 5, md: 6 }}
            pb={3}
            gap={4}
            alignItems="flex-start"
          >
            <Box
              width="36px"
              height="36px"
              borderRadius="12px"
              background={`linear-gradient(135deg, ${accent.from}20, ${accent.to}15)`}
              borderWidth="1px"
              borderColor={`${accent.from}30`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text
                fontSize="sm"
                fontWeight="800"
                style={{
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {index + 1}
              </Text>
            </Box>
            <VStack alignItems="stretch" gap={1} flex="1">
              <Heading size="md" letterSpacing="-0.02em">{theme.title}</Heading>
              {theme.objective && (
                <Text fontSize="sm" color="fg.muted" lineHeight="1.75" fontStyle="italic">
                  {theme.objective}
                </Text>
              )}
            </VStack>
            <Badge
              variant="subtle"
              borderRadius="full"
              px={2.5}
              py={0.5}
              fontSize="xs"
              color="fg.muted"
            >
              {theme.questions.length} question{theme.questions.length !== 1 ? "s" : ""}
            </Badge>
          </HStack>

          {/* Divider */}
          {theme.questions.length > 0 && (
            <Box
              mx={{ base: 5, md: 6 }}
              height="1px"
              background="linear-gradient(90deg, rgba(148,163,184,0.2) 0%, rgba(148,163,184,0.05) 100%)"
              mb={3}
            />
          )}

          {/* Questions */}
          {theme.questions.length > 0 && (
            <VStack alignItems="stretch" gap={0} px={{ base: 5, md: 6 }} pb={{ base: 5, md: 6 }}>
              {theme.questions.map((q, qi) => (
                <HStack
                  key={q.id}
                  gap={3}
                  py={2.5}
                  borderBottomWidth={qi < theme.questions.length - 1 ? "1px" : "0"}
                  borderBottomColor="rgba(148,163,184,0.1)"
                  alignItems="flex-start"
                >
                  <Box
                    width="20px"
                    height="20px"
                    borderRadius="6px"
                    background={`${accent.from}12`}
                    borderWidth="1px"
                    borderColor={`${accent.from}20`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    mt="1px"
                  >
                    <Text fontSize="2xs" fontWeight="700" color={accent.from}>
                      {qi + 1}
                    </Text>
                  </Box>
                  <Text fontSize="sm" lineHeight="1.8" color="gray.800">
                    {q.label}
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}

          {theme.questions.length === 0 && (
            <Text fontSize="sm" color="fg.muted" px={{ base: 5, md: 6 }} pb={5}>
              Aucune question renseignée pour ce thème.
            </Text>
          )}
        </VStack>
      </Box>
    </motion.div>
  );
}

// ─── Editor panel ─────────────────────────────────────────────────────────────
function EditorPanel({
  draftText,
  onChange,
  grid,
  onSave,
  onCancel,
  isSaving,
  saveError,
}: {
  draftText: string;
  onChange: (v: string) => void;
  grid: InterviewGrid | null;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  saveError: string | null;
}) {
  return (
    <Box
      borderRadius="32px"
      borderWidth="1px"
      borderColor="rgba(99,102,241,0.2)"
      background="linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(239,246,255,0.95) 100%)"
      boxShadow="0 24px 72px rgba(15,23,42,0.08)"
      overflow="hidden"
    >
      {/* Header */}
      <Box
        px={{ base: 5, md: 7 }}
        py={{ base: 4, md: 5 }}
        borderBottomWidth="1px"
        borderBottomColor="rgba(148,163,184,0.14)"
        background="linear-gradient(135deg, rgba(239,246,255,0.6) 0%, rgba(237,233,254,0.4) 100%)"
        position="relative"
      >
        <Box position="absolute" insetX={0} top={0} height="3px" background="linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9)" />
        <HStack justifyContent="space-between" alignItems="center">
          <VStack alignItems="flex-start" gap={1}>
            <HStack gap={2}>
              <Box width="14px" height="1.5px" background="linear-gradient(90deg, #6366f1, #8b5cf6)" borderRadius="full" />
              <Text fontSize="2xs" textTransform="uppercase" letterSpacing="0.22em" color="blue.600" fontWeight="700">
                Éditeur de grille
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
              Format : un thème par bloc, tirets pour les questions, ligne vide entre chaque thème.
            </Text>
          </VStack>
          <HStack gap={2}>
            <Button variant="ghost" size="sm" onClick={onCancel} borderRadius="xl" color="fg.muted">
              <X size={14} />
              Annuler
            </Button>
            <Button colorPalette="blue" size="sm" onClick={onSave} loading={isSaving} borderRadius="xl" fontWeight="700">
              <Save size={14} />
              Sauvegarder
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Split editor */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={0}>
        {/* Left: raw editor */}
        <Box borderRightWidth={{ base: 0, lg: "1px" }} borderRightColor="rgba(148,163,184,0.14)">
          <Box px={{ base: 5, md: 6 }} py={3} borderBottomWidth="1px" borderBottomColor="rgba(148,163,184,0.1)">
            <HStack gap={2}>
              <FileText size={13} />
              <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.1em">
                Texte brut
              </Text>
            </HStack>
          </Box>
          <Box px={{ base: 5, md: 6 }} py={5}>
            <Textarea
              value={draftText}
              onChange={(e) => onChange(e.target.value)}
              minHeight="480px"
              fontFamily="mono"
              fontSize="sm"
              lineHeight="1.8"
              borderWidth="1px"
              borderColor="rgba(148,163,184,0.2)"
              borderRadius="xl"
              background="rgba(255,255,255,0.9)"
              resize="vertical"
              placeholder={`Rapport au terrain\n- Depuis combien de temps êtes-vous impliqué ?\n- Qu'est-ce qui a changé selon vous ?\n\nRelations sociales\n- Comment décririez-vous votre réseau ?\n- Avez-vous eu des tensions récemment ?`}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 3px rgba(99,102,241,0.1)" }}
            />
            {saveError && (
              <Text color="red.500" fontSize="sm" mt={2}>{saveError}</Text>
            )}
          </Box>
        </Box>

        {/* Right: live preview */}
        <Box>
          <Box px={{ base: 5, md: 6 }} py={3} borderBottomWidth="1px" borderBottomColor="rgba(148,163,184,0.1)">
            <HStack gap={2}>
              <Eye size={13} />
              <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.1em">
                Prévisualisation
              </Text>
            </HStack>
          </Box>
          <Box px={{ base: 5, md: 6 }} py={5}>
            {grid && grid.themes.length > 0 ? (
              <VStack alignItems="stretch" gap={3}>
                {grid.themes.map((theme, i) => (
                  <Box
                    key={theme.id}
                    borderRadius="16px"
                    borderWidth="1px"
                    borderColor="rgba(148,163,184,0.16)"
                    background="rgba(255,255,255,0.9)"
                    px={4}
                    py={4}
                  >
                    <HStack gap={2.5} mb={theme.questions.length > 0 ? 2 : 0}>
                      <Box
                        width="22px"
                        height="22px"
                        borderRadius="7px"
                        background="linear-gradient(135deg, #dbeafe, #ede9fe)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Text fontSize="2xs" fontWeight="800" color="blue.700">{i + 1}</Text>
                      </Box>
                      <Text fontWeight="700" fontSize="sm">{theme.title}</Text>
                    </HStack>
                    {theme.objective && (
                      <Text fontSize="xs" color="fg.muted" fontStyle="italic" mb={2} pl={8}>{theme.objective}</Text>
                    )}
                    {theme.questions.length > 0 && (
                      <VStack alignItems="stretch" gap={1} pl={8}>
                        {theme.questions.map((q) => (
                          <Text key={q.id} fontSize="xs" lineHeight="1.7" color="gray.700">
                            — {q.label}
                          </Text>
                        ))}
                      </VStack>
                    )}
                  </Box>
                ))}
              </VStack>
            ) : (
              <Box
                borderRadius="16px"
                borderWidth="1px"
                borderColor="rgba(148,163,184,0.14)"
                background="rgba(248,250,252,0.8)"
                px={4}
                py={8}
                textAlign="center"
              >
                <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
                  Commence à saisir du texte pour voir la prévisualisation apparaître ici.
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Grid>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
    if (!user) { router.push("/login"); return; }
    if (!agentId) { setError("Persona introuvable."); setIsLoading(false); return; }

    const load = async () => {
      try {
        const response = await withTimeout("loadPersonaGuide", fetch(`/api/agents/${agentId}/prompts`), 15000);
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

  const grid = useMemo<InterviewGrid | null>(() => parseInterviewGrid(guideText), [guideText]);
  const draftGrid = useMemo<InterviewGrid | null>(() => parseInterviewGrid(draftText), [draftText]);

  const handleEdit = () => { setDraftText(guideText); setIsEditing(true); setSaveError(null); };
  const handleCancel = () => { setIsEditing(false); setDraftText(""); setSaveError(null); };

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
      <Container maxWidth="5xl" py={16}>
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement de la grille...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="5xl" py={16}>
        <VStack gap={4} alignItems="flex-start">
          <Heading size="lg">Grille introuvable</Heading>
          <Text color="fg.muted">{error}</Text>
          <Button variant="subtle" onClick={() => router.push("/personnas")}>Retour aux personas</Button>
        </VStack>
      </Container>
    );
  }

  const title = agentName.charAt(0).toUpperCase() + agentName.slice(1);

  return (
    <Box
      minHeight="100vh"
      background="linear-gradient(180deg, #f8fafc 0%, #eef4ff 40%, #ffffff 100%)"
      position="relative"
      overflow="hidden"
    >
      {/* Background blobs */}
      <Box position="absolute" top="-100px" left="-60px" width="300px" height="300px" borderRadius="full" background="rgba(99,102,241,0.08)" filter="blur(70px)" pointerEvents="none" />
      <Box position="absolute" top="300px" right="-80px" width="260px" height="260px" borderRadius="full" background="rgba(14,165,233,0.08)" filter="blur(80px)" pointerEvents="none" />

      <Container maxWidth="5xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }} position="relative">
        <VStack alignItems="stretch" gap={8}>

          {/* Navigation */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Button alignSelf="flex-start" variant="ghost" colorPalette="blue" onClick={() => router.push(`/personnas/${agentId}`)} size="sm">
              <ArrowLeft size={15} />
              Retour à la fiche
            </Button>
          </motion.div>

          {/* Hero header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
            <Box
              borderRadius={{ base: "28px", md: "36px" }}
              borderWidth="1px"
              borderColor="rgba(148,163,184,0.16)"
              background="linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.95) 100%)"
              boxShadow="0 20px 60px rgba(15,23,42,0.07)"
              backdropFilter="blur(16px)"
              overflow="hidden"
              position="relative"
            >
              <Box position="absolute" insetX={0} top={0} height="3px" background="linear-gradient(90deg, #6366f1 0%, #8b5cf6 52%, #0ea5e9 100%)" />
              <HStack
                px={{ base: 5, md: 8 }}
                py={{ base: 5, md: 7 }}
                justifyContent="space-between"
                alignItems={{ base: "flex-start", md: "center" }}
                flexDirection={{ base: "column", md: "row" }}
                gap={4}
              >
                <VStack alignItems="flex-start" gap={2}>
                  <HStack gap={3} flexWrap="wrap">
                    <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={3} py={1}>Grille d&apos;entretien</Badge>
                    {grid && grid.themes.length > 0 && (
                      <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={3} py={1}>
                        {grid.themes.length} thème{grid.themes.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </HStack>
                  <Heading size="xl" letterSpacing="-0.03em">{title}</Heading>
                  <Text color="fg.muted" fontSize="sm" lineHeight="1.75" maxWidth="2xl">
                    La grille structure les thèmes, questions et relances de l&apos;entretien.
                    Elle est indépendante du prompt et sert de guide méthodologique avant, pendant et après l&apos;échange.
                  </Text>
                </VStack>
                {!isEditing && (
                  <HStack gap={3} flexShrink={0}>
                    <Button colorPalette="blue" onClick={handleEdit} borderRadius="xl" fontWeight="700">
                      <Edit2 size={15} />
                      {grid && grid.themes.length > 0 ? "Modifier la grille" : "Créer la grille"}
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/personnas/${agentId}/edit`)} borderRadius="xl">
                      Éditeur de prompt
                    </Button>
                  </HStack>
                )}
              </HStack>
            </Box>
          </motion.div>

          {/* Edit mode */}
          {isEditing && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <EditorPanel
                draftText={draftText}
                onChange={setDraftText}
                grid={draftGrid}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
                saveError={saveError}
              />
            </motion.div>
          )}

          {/* View mode */}
          {!isEditing && (
            <>
              {grid && grid.themes.length > 0 ? (
                <VStack alignItems="stretch" gap={4}>
                  {/* Grid objective banner */}
                  {(grid.title && grid.title !== "Grille d'entretien") || grid.objective ? (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                      <Box
                        borderRadius="24px"
                        borderWidth="1px"
                        borderColor="rgba(99,102,241,0.16)"
                        background="linear-gradient(135deg, rgba(239,246,255,0.8), rgba(237,233,254,0.5))"
                        px={{ base: 5, md: 7 }}
                        py={4}
                      >
                        <VStack alignItems="flex-start" gap={1.5}>
                          <HStack gap={2}>
                            <BookOpen size={14} color="#6366f1" />
                            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" color="blue.600" fontWeight="700">
                              Objectif de la grille
                            </Text>
                          </HStack>
                          {grid.title && grid.title !== "Grille d'entretien" && (
                            <Text fontWeight="700" fontSize="md" letterSpacing="-0.01em">{grid.title}</Text>
                          )}
                          {grid.objective && (
                            <Text fontSize="sm" color="fg.muted" lineHeight="1.75">{grid.objective}</Text>
                          )}
                        </VStack>
                      </Box>
                    </motion.div>
                  ) : null}

                  {/* Theme cards */}
                  {grid.themes.map((theme, i) => (
                    <ThemeCard key={theme.id} theme={theme} index={i} />
                  ))}
                </VStack>
              ) : (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                  <Box
                    borderRadius="32px"
                    borderWidth="1px"
                    borderColor="rgba(148,163,184,0.14)"
                    background="rgba(255,255,255,0.92)"
                    boxShadow="0 8px 32px rgba(15,23,42,0.05)"
                    px={{ base: 5, md: 8 }}
                    py={14}
                    textAlign="center"
                  >
                    <VStack gap={5} alignItems="center" maxWidth="400px" mx="auto">
                      <Box
                        width="64px"
                        height="64px"
                        borderRadius="20px"
                        background="linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))"
                        borderWidth="1px"
                        borderColor="rgba(99,102,241,0.16)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <BookOpen size={28} color="#6366f1" />
                      </Box>
                      <VStack gap={2}>
                        <Heading size="md" letterSpacing="-0.02em">Aucune grille pour ce persona</Heading>
                        <Text color="fg.muted" fontSize="sm" lineHeight="1.8">
                          Ajoutez une grille d&apos;entretien pour structurer les thèmes, les questions et les relances avant de commencer.
                        </Text>
                      </VStack>
                      <Button colorPalette="blue" onClick={handleEdit} borderRadius="xl" fontWeight="700">
                        <Edit2 size={15} />
                        Créer la grille
                      </Button>
                    </VStack>
                  </Box>
                </motion.div>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
