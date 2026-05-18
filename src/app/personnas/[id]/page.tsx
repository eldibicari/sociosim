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
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, BookOpen, Clock3, FileText, History, MessageSquarePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  PersonaMetricTile,
  PersonaNumberedPoint,
  PersonaSurfaceSection,
} from "@/app/personnas/components/PersonaFicheUI";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Agent } from "@/lib/agents";
import type { InterviewGrid } from "@/lib/personaConfig";
import { parseInterviewGrid } from "@/lib/interviewGridParser";
import { withTimeout } from "@/lib/withTimeout";
import {
  type PersonaHistoryItem,
  type PersonaPromptOption,
  buildPromptSummaryPoints,
  getPersonaHistoryTitle,
  getPersonaInterviewGuide,
  getPersonaPostureTips,
  pickPrimaryPrompt,
} from "../personaFiche";

type PromptsPayload = {
  agent?: Pick<Agent, "id" | "agent_name" | "description" | "interview_guide">;
  prompts?: PersonaPromptOption[];
};

type InterviewsPayload = {
  interviews?: PersonaHistoryItem[];
};

function formatAgentName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatDate(value?: string) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PersonaFichePage() {
  const router = useRouter();
  const params = useParams();
  const agentId = typeof params.id === "string" ? params.id : "";
  const { user, isLoading: isAuthLoading, refreshUser } = useAuthUser();

  const [agent, setAgent] = useState<
    Pick<Agent, "id" | "agent_name" | "description" | "interview_guide"> | null
  >(null);
  const [prompts, setPrompts] = useState<PersonaPromptOption[]>([]);
  const [history, setHistory] = useState<PersonaHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const loadPersonaDetail = async () => {
      try {
        setError(null);
        const [promptsResponse, interviewsResponse] = await Promise.all([
          withTimeout("loadPersonaPrompts", fetch(`/api/agents/${agentId}/prompts`), 15000),
          withTimeout("loadPersonaInterviews", fetch("/api/user/interviews"), 15000),
        ]);

        if (promptsResponse.status === 401 || interviewsResponse.status === 401) {
          await refreshUser();
        }
        if (!promptsResponse.ok) {
          const payload = await promptsResponse.json().catch(() => null);
          throw new Error(payload?.error ?? "Impossible de charger la fiche persona.");
        }
        if (!interviewsResponse.ok) {
          const payload = await interviewsResponse.json().catch(() => null);
          throw new Error(payload?.error ?? "Impossible de charger l'historique du persona.");
        }

        const promptsPayload = (await promptsResponse.json().catch(() => null)) as PromptsPayload | null;
        const interviewsPayload = (await interviewsResponse.json().catch(() => null)) as InterviewsPayload | null;

        setAgent(promptsPayload?.agent ?? null);
        setPrompts(promptsPayload?.prompts ?? []);
        setHistory(
          (interviewsPayload?.interviews ?? [])
            .filter((interview) => interview.agent_id === agentId)
            .sort((a, b) => {
              const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
              const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
              return bDate - aDate;
            })
        );
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Une erreur est survenue.";
        console.error("Error loading persona fiche:", message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonaDetail();
  }, [agentId, isAuthLoading, refreshUser, router, user]);

  const primaryPrompt = useMemo(() => pickPrimaryPrompt(prompts), [prompts]);
  const promptText = primaryPrompt?.system_prompt ?? "";
  const storedGuide = agent?.interview_guide ?? "";
  const promptSummaryPoints = useMemo(() => buildPromptSummaryPoints(promptText), [promptText]);
  const parsedGrid = useMemo<InterviewGrid | null>(() => parseInterviewGrid(storedGuide), [storedGuide]);
  const guideSections = useMemo(
    () => (agent ? getPersonaInterviewGuide(agent as never, promptText) : []),
    [agent, promptText]
  );
  const postureTips = useMemo(
    () => (agent ? getPersonaPostureTips(agent as never, promptText) : []),
    [agent, promptText]
  );
  const interviewsWithMaterial = useMemo(
    () => history.filter((interview) => (interview.message_count ?? 0) > 0),
    [history]
  );

  const handleStartInterview = async () => {
    if (!user?.id || !agentId) {
      router.push("/login");
      return;
    }

    try {
      setIsCreatingSession(true);
      setError(null);
      const response = await withTimeout(
        "createPersonaSession",
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, agent_id: agentId }),
        }),
        15000
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Impossible de creer une nouvelle session.");
      }

      const data = await response.json();
      router.push(
        `/interview?interviewId=${data.interviewId}&sessionId=${data.sessionId}&adkSessionId=${data.adkSessionId}`
      );
    } catch (sessionError) {
      const message = sessionError instanceof Error ? sessionError.message : "Une erreur est survenue.";
      console.error("Error creating persona session:", message);
      setError(message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <Container maxWidth="5xl" py={16}>
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement de la fiche persona...</Text>
        </VStack>
      </Container>
    );
  }

  if (!agent) {
    return (
      <Container maxWidth="5xl" py={16}>
        <VStack gap={4} alignItems="flex-start">
          <Heading size="lg">Fiche persona introuvable</Heading>
          <Text color="fg.muted">{error ?? "Aucune donnée n'est disponible pour ce persona."}</Text>
          <Button variant="subtle" onClick={() => router.push("/personnas")}>
            Retour aux personnas
          </Button>
        </VStack>
      </Container>
    );
  }

  const title = formatAgentName(agent.agent_name);
  const gridThemeCount = parsedGrid?.themes.length ?? guideSections.length;
  const latestHistoryDate = history[0]?.updated_at ? formatDate(history[0].updated_at) : "Aucune activite";

  return (
    <Box minHeight="100vh" background="linear-gradient(180deg, #f8fafc 0%, #eef4ff 42%, #ffffff 100%)" position="relative" overflow="hidden">
      <Box position="absolute" top="-120px" left="-80px" width="340px" height="340px" borderRadius="full" background="rgba(99,102,241,0.12)" filter="blur(80px)" pointerEvents="none" />
      <Box position="absolute" top="180px" right="-120px" width="320px" height="320px" borderRadius="full" background="rgba(14,165,233,0.10)" filter="blur(90px)" pointerEvents="none" />

      <Container maxWidth="7xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }} position="relative">
        <VStack alignItems="stretch" gap={8}>
          <Button alignSelf="flex-start" variant="ghost" colorPalette="blue" onClick={() => router.push("/personnas")}>
            <ArrowLeft size={16} />
            Retour aux personas
          </Button>

          <Box borderRadius={{ base: "32px", md: "40px" }} borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" background="linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(241,245,249,0.96) 100%)" boxShadow="0 28px 90px rgba(15, 23, 42, 0.08)" backdropFilter="blur(18px)" overflow="hidden" position="relative">
            <Box position="absolute" insetX={0} top={0} height="4px" background="linear-gradient(90deg, #6366f1 0%, #8b5cf6 52%, #0ea5e9 100%)" />
            <Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1.45fr) minmax(320px, 0.8fr)" }} gap={8} px={{ base: 5, md: 8 }} py={{ base: 6, md: 8 }}>
              <VStack alignItems="stretch" gap={5}>
                <HStack gap={3} flexWrap="wrap">
                  <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={3} py={1}>Fiche persona</Badge>
                  <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={3} py={1}>Dossier de simulation</Badge>
                  <Badge colorPalette="green" variant="subtle" borderRadius="full" px={3} py={1}>{gridThemeCount} theme{gridThemeCount > 1 ? "s" : ""}</Badge>
                </HStack>
                <Heading size="2xl" lineHeight="0.98" letterSpacing="-0.04em" fontSize={{ base: "4xl", md: "5xl", xl: "6xl" }}>{title}</Heading>
                <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.85" maxWidth="3xl">
                  <Box as="span" whiteSpace="pre-line">
                    {agent.description?.replace(/\\n/g, "\n") || "Aucune description disponible pour ce persona."}
                  </Box>
                </Text>
                <Text fontSize="sm" color="fg.muted" lineHeight="1.75" maxWidth="3xl">
                  Cette fiche rassemble les repères utiles pour préparer un entretien, conduire les relances avec méthode et comprendre le type de matériau que ce persona peut produire.
                </Text>
              </VStack>

              <Box
                borderRadius="28px"
                borderWidth="1px"
                borderColor="rgba(99,102,241,0.16)"
                background="linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(239,246,255,0.95) 100%)"
                px={{ base: 4, md: 5 }}
                py={{ base: 5, md: 6 }}
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" insetX={0} top={0} height="2px" background="linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9)" />
                <VStack alignItems="stretch" gap={4}>
                  <HStack gap={2} alignItems="center">
                    <Box width="14px" height="1.5px" background="linear-gradient(90deg, #6366f1, #8b5cf6)" borderRadius="full" />
                    <Text fontSize="2xs" textTransform="uppercase" letterSpacing="0.22em" color="blue.600" fontWeight="700">
                      Actions
                    </Text>
                  </HStack>
                  <Button
                    colorPalette="blue"
                    onClick={handleStartInterview}
                    loading={isCreatingSession}
                    borderRadius="xl"
                    fontWeight="700"
                  >
                    <MessageSquarePlus size={16} />
                    Commencer un entretien
                  </Button>
                  <Button variant="subtle" onClick={() => router.push(`/personnas/${agent.id}/grille`)} borderRadius="xl">
                    <BookOpen size={16} />
                    Ouvrir la grille
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/personnas/${agent.id}/edit`)} borderRadius="xl">
                    <FileText size={16} />
                    Configurer la simulation
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/interviews?agent=${encodeURIComponent(agent.id)}`)} color="fg.muted">
                    <History size={14} />
                    Historique complet
                  </Button>
                </VStack>
              </Box>
            </Grid>
          </Box>

          {error ? (
            <Box backgroundColor={{ base: "red.50", _dark: "red.900" }} borderRadius="2xl" padding={4} borderLeft="4px solid" borderLeftColor="red.500">
              <Text color={{ base: "red.700", _dark: "red.200" }}>{error}</Text>
            </Box>
          ) : null}

          <Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1.45fr) minmax(320px, 0.8fr)" }} gap={8} alignItems="start">
            <VStack alignItems="stretch" gap={6}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
              <PersonaSurfaceSection eyebrow="Lecture initiale" title="Lecture sociologique rapide" description="Cette section aide à repérer les lignes de force du persona avant de démarrer un entretien : position sociale, rapport au sujet, tensions et détails à faire raconter." icon={<BookOpen size={18} />}>
                <VStack alignItems="stretch" gap={4}>
                  <Text fontSize="md" lineHeight="1.8" color="fg.default">
                    Cette fiche sert de point de départ pour comprendre comment aborder {title}, quel matériau il peut produire et quelles relances sont les plus utiles dans un entretien semi-directif.
                  </Text>
                  {promptSummaryPoints.length > 0 ? (
                    <VStack alignItems="stretch" gap={3}>
                      {promptSummaryPoints.map((highlight, index) => (
                        <PersonaNumberedPoint key={highlight} index={index + 1}>
                          {highlight}
                        </PersonaNumberedPoint>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="fg.muted">Aucun résumé n&apos;a encore pu être déduit du prompt publié.</Text>
                  )}
                </VStack>
              </PersonaSurfaceSection>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
              <PersonaSurfaceSection eyebrow="Méthode" title="Grille méthodologique de l&apos;entretien" description="La grille ne se confond pas avec le prompt. C&apos;est l&apos;outil visible qui structure la préparation, oriente les relances et garde la trace de ce qui doit être exploré." icon={<BookOpen size={18} />} action={<Button size="sm" variant="subtle" onClick={() => router.push(`/personnas/${agent.id}/grille`)}>Modifier la grille</Button>}>
                <VStack alignItems="stretch" gap={5}>
                  {parsedGrid && parsedGrid.themes.length > 0 ? (
                    <>
                      <Box borderRadius="24px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.16)" backgroundColor="rgba(248,250,252,0.9)" px={4} py={4}>
                        <VStack alignItems="stretch" gap={2}>
                          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color="fg.muted">Objectif de la grille</Text>
                          <Text fontWeight="700">{parsedGrid.title || "Grille d'entretien"}</Text>
                          <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
                            {parsedGrid.objective || "La grille sert à organiser les thèmes, les questions et les relances à garder en tête pendant l'échange."}
                          </Text>
                        </VStack>
                      </Box>
                      <VStack alignItems="stretch" gap={4}>
                        {parsedGrid.themes.map((theme, index) => (
                          <Box key={theme.id} borderRadius="26px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="rgba(255,255,255,0.95)" px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
                            <VStack alignItems="stretch" gap={4}>
                              <HStack alignItems="flex-start" gap={3}>
                                <Box width="32px" height="32px" borderRadius="full" background="linear-gradient(135deg, #dbeafe, #ede9fe)" color="blue.700" display="flex" alignItems="center" justifyContent="center" fontSize="sm" fontWeight="700" flexShrink={0}>
                                  {index + 1}
                                </Box>
                                <VStack alignItems="stretch" gap={1} flex="1">
                                  <Heading size="sm">{theme.title}</Heading>
                                  {theme.objective ? <Text fontSize="sm" color="fg.muted" lineHeight="1.75">{theme.objective}</Text> : null}
                                </VStack>
                              </HStack>
                              <VStack alignItems="stretch" gap={2} pl={{ base: 0, md: 11 }}>
                                {theme.questions.length > 0 ? theme.questions.map((q) => (
                                  <Text key={q.id} fontSize="sm" color="fg.default" lineHeight="1.75">— {q.label}</Text>
                                )) : <Text fontSize="sm" color="fg.muted" lineHeight="1.75">Thème renseigné sans questions explicites pour le moment.</Text>}
                              </VStack>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    </>
                  ) : (
                    <VStack alignItems="stretch" gap={4}>
                      <Text color="fg.muted" fontSize="sm" lineHeight="1.75">
                        Aucune grille n&apos;a encore été saisie pour ce persona. Cette version de secours est déduite du prompt pour aider l&apos;étudiant à préparer son entretien malgré tout.
                      </Text>
                      {guideSections.map((section, index) => (
                        <Box key={section.title} borderRadius="26px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="rgba(255,255,255,0.95)" px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
                          <VStack alignItems="stretch" gap={4}>
                            <HStack alignItems="flex-start" gap={3}>
                              <Box width="32px" height="32px" borderRadius="full" background="linear-gradient(135deg, #dbeafe, #ede9fe)" color="blue.700" display="flex" alignItems="center" justifyContent="center" fontSize="sm" fontWeight="700" flexShrink={0}>
                                {index + 1}
                              </Box>
                              <VStack alignItems="stretch" gap={1} flex="1">
                                <Heading size="sm">{section.title}</Heading>
                                <Text fontSize="sm" color="fg.muted" lineHeight="1.75">{section.objective}</Text>
                              </VStack>
                            </HStack>
                            <VStack alignItems="stretch" gap={2} pl={{ base: 0, md: 11 }}>
                              {section.sampleQuestions.map((question) => (
                                <Text key={question} fontSize="sm" lineHeight="1.75">— {question}</Text>
                              ))}
                            </VStack>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </PersonaSurfaceSection>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
              <PersonaSurfaceSection eyebrow="Simulation" title="Architecture de la simulation" description="Cette section distingue clairement ce qui relève du paramétrage, de la méthode d&apos;entretien et du moteur interne. L&apos;objectif est d&apos;aider l&apos;étudiant à savoir où agir selon le besoin." icon={<FileText size={18} />} action={<Button size="sm" variant="subtle" onClick={() => router.push(`/personnas/${agent.id}/edit`)}>Ouvrir la configuration</Button>}>
                <VStack alignItems="stretch" gap={4}>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(3, minmax(0, 1fr))" }} gap={4}>
                    <Box borderRadius="24px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="rgba(255,255,255,0.95)" px={4} py={4}>
                      <VStack alignItems="stretch" gap={2}>
                        <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color="blue.600" fontWeight="700">Paramétrage guidé</Text>
                        <Text fontWeight="700">Couche de construction</Text>
                        <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
                          Cette couche sert à décrire le rôle social, la posture, le niveau de difficulté et le style interactionnel du persona.
                        </Text>
                      </VStack>
                    </Box>
                    <Box borderRadius="24px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="rgba(255,255,255,0.95)" px={4} py={4}>
                      <VStack alignItems="stretch" gap={2}>
                        <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color="blue.600" fontWeight="700">Grille visible</Text>
                        <Text fontWeight="700">Couche méthodologique</Text>
                        <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
                          La grille organise les thèmes, les questions et les relances à garder sous les yeux pendant l&apos;entretien.
                        </Text>
                      </VStack>
                    </Box>
                    <Box borderRadius="24px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="rgba(255,255,255,0.95)" px={4} py={4}>
                      <VStack alignItems="stretch" gap={2}>
                        <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color="blue.600" fontWeight="700">Prompt avancé</Text>
                        <Text fontWeight="700">Moteur interne complet</Text>
                        <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
                          Le prompt système complet reste utile pour les personas historiques et pour les réglages fins qui dépassent les champs guidés.
                        </Text>
                      </VStack>
                    </Box>
                  </Grid>

                  {primaryPrompt ? (
                    <HStack gap={3} flexWrap="wrap">
                      <Badge colorPalette={primaryPrompt.published ? "green" : "orange"} variant="subtle" borderRadius="full" px={3}>{primaryPrompt.published ? "Prompt publié" : "Dernier brouillon"}</Badge>
                      <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={3}>Version {primaryPrompt.version}</Badge>
                      <Badge colorPalette="gray" variant="subtle" borderRadius="full" px={3}>{formatDate(primaryPrompt.last_edited)}</Badge>
                    </HStack>
                  ) : (
                    <Text color="fg.muted">Aucun prompt n&apos;est encore disponible pour ce persona.</Text>
                  )}
                </VStack>
              </PersonaSurfaceSection>
              </motion.div>
            </VStack>

            <VStack alignItems="stretch" gap={6} position={{ base: "static", xl: "sticky" }} top={{ base: "auto", xl: "calc(var(--app-header-height) + 24px)" }}>
              <PersonaSurfaceSection eyebrow="Repères" title="Tableau de bord du persona" description="Quelques indicateurs simples pour situer le niveau de travail déjà réalisé autour de ce persona." icon={<Clock3 size={18} />}>
                <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
                  <PersonaMetricTile label="Entretiens" value={history.length} helper="Sessions associées" accent="indigo" />
                  <PersonaMetricTile label="Exploitables" value={interviewsWithMaterial.length} helper="Avec matière réelle" accent="green" />
                  <PersonaMetricTile label="Thèmes" value={gridThemeCount} helper="Dans la grille" accent="blue" />
                  <PersonaMetricTile label="Activité" value={latestHistoryDate} helper="Dernier usage" />
                </Grid>
              </PersonaSurfaceSection>

              <PersonaSurfaceSection eyebrow="Posture d&apos;enquête" title="Conseils de conduite" description="Cette colonne sert à garder une posture d&apos;entretien cohérente, sans transformer l&apos;échange en questionnaire mécanique." icon={<BookOpen size={18} />}>
                <VStack alignItems="stretch" gap={3}>
                  {postureTips.map((tip, index) => (
                    <Box key={tip.title} borderRadius="24px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="rgba(248,250,252,0.9)" px={4} py={4}>
                      <VStack alignItems="stretch" gap={2}>
                        <HStack gap={3}>
                          <Box width="28px" height="28px" borderRadius="full" background="linear-gradient(135deg, #dbeafe, #ede9fe)" color="blue.700" display="flex" alignItems="center" justifyContent="center" fontSize="xs" fontWeight="700">
                            {index + 1}
                          </Box>
                          <Text fontWeight="700">{tip.title}</Text>
                        </HStack>
                        <Text fontSize="sm" color="fg.muted" lineHeight="1.75">{tip.body}</Text>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </PersonaSurfaceSection>

              <PersonaSurfaceSection eyebrow="Trajectoire" title="Historique récent" description="Ces entretiens donnent un aperçu des essais déjà menés avec ce persona et permettent de reprendre une analyse en continuité." icon={<History size={18} />} action={<Button size="sm" variant="plain" colorPalette="blue" onClick={() => router.push(`/interviews?agent=${encodeURIComponent(agent.id)}`)}>Voir tout</Button>}>
                <VStack alignItems="stretch" gap={3}>
                  {history.length > 0 ? history.slice(0, 5).map((interview: PersonaHistoryItem) => (
                    <Box key={interview.id} borderRadius="24px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="rgba(255,255,255,0.95)" px={4} py={4}>
                      <VStack alignItems="stretch" gap={3}>
                        <VStack alignItems="stretch" gap={1}>
                          <Text fontWeight="700" lineHeight="1.5">{getPersonaHistoryTitle(interview)}</Text>
                          <Text fontSize="sm" color="fg.muted">{formatDate(interview.updated_at)} · {interview.message_count ?? 0} message{(interview.message_count ?? 0) > 1 ? "s" : ""}</Text>
                        </VStack>
                        <HStack gap={2} flexWrap="wrap">
                          <Button size="xs" variant="subtle" onClick={() => router.push(`/interview/${interview.id}`)}>Voir l&apos;entretien</Button>
                          <Button size="xs" variant="outline" onClick={() => router.push(`/interview/${interview.id}/analysis`)}>Voir l&apos;analyse</Button>
                        </HStack>
                      </VStack>
                    </Box>
                  )) : <Text color="fg.muted">Aucun entretien n&apos;est encore rattaché à ce persona.</Text>}
                </VStack>
              </PersonaSurfaceSection>
            </VStack>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}
