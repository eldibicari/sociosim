"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, BookOpen, Clock3, FileText, History, MessageSquarePlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Agent } from "@/lib/agents";
import { withTimeout } from "@/lib/withTimeout";
import {
  type PersonaGuideSection,
  parseStoredInterviewGuide,
  type PersonaHistoryItem,
  type PersonaPromptOption,
  buildPromptSummaryPoints,
  getPersonaHistoryTitle,
  getPersonaInterviewGuide,
  getPersonaPostureTips,
  getPersonaPromptPreview,
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

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card.Root
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="border.subtle"
      backgroundColor="white"
      boxShadow="sm"
    >
      <Card.Body px={{ base: 5, md: 6 }} py={{ base: 5, md: 6 }}>
        <VStack alignItems="stretch" gap={4}>
          <HStack gap={3}>
            {icon ? (
              <Box color="blue.600" display="flex" alignItems="center">
                {icon}
              </Box>
            ) : null}
            <Heading size="md">{title}</Heading>
          </HStack>
          {children}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export default function PersonaFichePage() {
  const router = useRouter();
  const params = useParams();
  const agentId = typeof params.id === "string" ? params.id : "";
  const { user, isLoading: isAuthLoading, refreshUser } = useAuthUser();

  const [agent, setAgent] = useState<
    Pick<Agent, "id" | "agent_name" | "description" | "interview_guide"> | null
  >(
    null
  );
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
      setError("Personna introuvable.");
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

        const promptsPayload = (await promptsResponse.json().catch(() => null)) as
          | PromptsPayload
          | null;
        const interviewsPayload = (await interviewsResponse.json().catch(() => null)) as
          | InterviewsPayload
          | null;

        setAgent(promptsPayload?.agent ?? null);
        setPrompts(promptsPayload?.prompts ?? []);

        const filteredHistory = (interviewsPayload?.interviews ?? [])
          .filter((interview) => interview.agent_id === agentId)
          .sort((a, b) => {
            const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return bDate - aDate;
          });

        setHistory(filteredHistory);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Une erreur est survenue.";
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
  const storedGuideBlocks = useMemo(() => parseStoredInterviewGuide(storedGuide), [storedGuide]);
  const guideSections = useMemo<PersonaGuideSection[]>(
    () => (agent ? getPersonaInterviewGuide(agent, promptText) : []),
    [agent, promptText]
  );
  const postureTips = useMemo(
    () => (agent ? getPersonaPostureTips(agent, promptText) : []),
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
          body: JSON.stringify({
            userId: user.id,
            agent_id: agentId,
          }),
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
      const message =
        sessionError instanceof Error ? sessionError.message : "Une erreur est survenue.";
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
          <Text color="fg.muted">
            {error ?? "Aucune donnée n'est disponible pour ce persona."}
          </Text>
          <Button variant="subtle" onClick={() => router.push("/personnas")}>
            Retour aux personnas
          </Button>
        </VStack>
      </Container>
    );
  }

  const title = formatAgentName(agent.agent_name);
  const promptPreview = getPersonaPromptPreview(promptText);

  return (
    <Box minHeight="100vh" backgroundColor="bg.surface">
      <Container maxWidth="7xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
        <VStack alignItems="stretch" gap={8}>
          <Stack gap={4}>
            <Button
              alignSelf="flex-start"
              variant="ghost"
              colorPalette="blue"
              onClick={() => router.push("/personnas")}
            >
              <ArrowLeft size={16} />
              Retour aux personnas
            </Button>

            <HStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={4}>
              <VStack alignItems="flex-start" gap={3} maxWidth="4xl">
                <HStack gap={3} flexWrap="wrap">
                  <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={3} py={1}>
                    Fiche persona
                  </Badge>
                  <Badge colorPalette="green" variant="subtle" borderRadius="full" px={3} py={1}>
                    {interviewsWithMaterial.length} entretien
                    {interviewsWithMaterial.length > 1 ? "s" : ""} utile
                    {interviewsWithMaterial.length > 1 ? "s" : ""}
                  </Badge>
                </HStack>

                <Heading size="2xl" lineHeight="1.05">
                  {title}
                </Heading>
                <Text color="fg.muted" fontSize="lg" lineHeight="1.7" maxWidth="3xl">
                  <Box as="span" whiteSpace="pre-line">
                  {agent.description?.replace(/\\n/g, "\n") ||
                    "Aucune description disponible pour ce persona."}
                  </Box>
                </Text>
              </VStack>

              <Stack gap={3} minWidth={{ base: "100%", md: "320px" }}>
                <Button
                  colorPalette="blue"
                  onClick={handleStartInterview}
                  loading={isCreatingSession}
                >
                  <MessageSquarePlus size={16} />
                  Commencer un entretien
                </Button>
                <Button
                  variant="subtle"
                  onClick={() =>
                    router.push(`/interviews?agent=${encodeURIComponent(agent.id)}`)
                  }
                >
                  <History size={16} />
                  Voir l&apos;historique
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/personnas/${agent.id}/edit`)}
                >
                  <FileText size={16} />
                  Modifier le prompt
                </Button>
              </Stack>
            </HStack>
          </Stack>

          {error ? (
            <Box
              backgroundColor={{ base: "red.50", _dark: "red.900" }}
              borderRadius="2xl"
              padding={4}
              borderLeft="4px solid"
              borderLeftColor="red.500"
            >
              <Text color={{ base: "red.700", _dark: "red.200" }}>{error}</Text>
            </Box>
          ) : null}

          <Grid
            gridTemplateColumns={{
              base: "1fr",
              xl: "minmax(0, 1.7fr) minmax(320px, 1fr)",
            }}
            gap={6}
          >
            <VStack alignItems="stretch" gap={6}>
              <SectionCard title="Résumé du persona" icon={<BookOpen size={18} />}>
                <VStack alignItems="stretch" gap={3}>
                  <Text lineHeight="1.7" color="fg.default">
                    Cette fiche sert de point d&apos;entrée pour comprendre comment
                    aborder {title}, quel type de matériau il peut produire et quelles
                    relances sont les plus utiles.
                  </Text>
                  {promptSummaryPoints.length > 0 ? (
                    <VStack alignItems="stretch" gap={2}>
                      <Text fontWeight="semibold">Points à garder en tête</Text>
                      <Box
                        maxHeight="260px"
                        overflowY="auto"
                        paddingRight={2}
                        borderRadius="xl"
                      >
                        <VStack alignItems="stretch" gap={2}>
                          {promptSummaryPoints.map((highlight) => (
                            <Text key={highlight} fontSize="sm" color="fg.muted" lineHeight="1.65">
                              - {highlight}
                            </Text>
                          ))}
                        </VStack>
                      </Box>
                    </VStack>
                  ) : null}
                </VStack>
              </SectionCard>

              <SectionCard
                title="Grille d'entretien conseillée"
                icon={<BookOpen size={18} />}
              >
                <VStack alignItems="stretch" gap={5}>
                  {storedGuideBlocks.length > 0 ? (
                    <>
                      <Text color="fg.muted" fontSize="sm" lineHeight="1.7">
                        Cette grille est rattachée à ce persona et peut être modifiée dans l&apos;espace d&apos;édition. L&apos;étudiant s&apos;en sert avant et pendant l&apos;entretien pour personnaliser sa conduite.
                      </Text>
                      {storedGuideBlocks.map((section) => (
                        <Box
                          key={section.title}
                          borderWidth="1px"
                          borderColor="border.subtle"
                          borderRadius="2xl"
                          p={4}
                        >
                          <VStack alignItems="stretch" gap={3}>
                            <Heading size="sm">{section.title}</Heading>
                            <VStack alignItems="stretch" gap={2}>
                              {section.lines.length > 0 ? (
                                section.lines.map((line) => (
                                  <Text key={line} fontSize="sm" color="fg.muted" lineHeight="1.7">
                                    - {line}
                                  </Text>
                                ))
                              ) : (
                                <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
                                  Thème renseigné sans sous-questions pour l&apos;instant.
                                </Text>
                              )}
                            </VStack>
                          </VStack>
                        </Box>
                      ))}
                    </>
                  ) : (
                    <>
                      <Text color="fg.muted" fontSize="sm" lineHeight="1.7">
                        Aucune grille n&apos;a encore été saisie pour ce persona. Cette version de secours est dérivée du prompt pour aider l&apos;étudiant à démarrer.
                      </Text>
                      {guideSections.map((section) => (
                        <Box
                          key={section.title}
                          borderWidth="1px"
                          borderColor="border.subtle"
                          borderRadius="2xl"
                          p={4}
                        >
                          <VStack alignItems="stretch" gap={3}>
                            <Heading size="sm">{section.title}</Heading>
                            <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
                              {section.objective}
                            </Text>
                            <VStack alignItems="stretch" gap={2}>
                              {section.sampleQuestions.map((question) => (
                                <Text key={question} fontSize="sm">
                                  - {question}
                                </Text>
                              ))}
                            </VStack>
                          </VStack>
                        </Box>
                      ))}
                    </>
                  )}
                  <Button
                    alignSelf="flex-start"
                    variant="subtle"
                    onClick={() => router.push(`/personnas/${agent.id}/edit`)}
                  >
                    Modifier la grille
                  </Button>
                </VStack>
              </SectionCard>

              <SectionCard title="Prompt associé" icon={<FileText size={18} />}>
                <VStack alignItems="stretch" gap={4}>
                  {primaryPrompt ? (
                    <>
                      <HStack gap={3} flexWrap="wrap">
                        <Badge
                          colorPalette={primaryPrompt.published ? "green" : "orange"}
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                        >
                          {primaryPrompt.published ? "Prompt publié" : "Dernier brouillon"}
                        </Badge>
                        <Badge
                          colorPalette="blue"
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                        >
                          Version {primaryPrompt.version}
                        </Badge>
                        <Badge
                          colorPalette="gray"
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                        >
                          {formatDate(primaryPrompt.last_edited)}
                        </Badge>
                      </HStack>
                      <Text color="fg.muted" lineHeight="1.7">
                        {promptPreview}
                      </Text>
                    </>
                  ) : (
                    <Text color="fg.muted">
                    Aucun prompt n&apos;est encore disponible pour ce persona.
                    </Text>
                  )}
                  <Button
                    alignSelf="flex-start"
                    variant="subtle"
                    onClick={() => router.push(`/personnas/${agent.id}/edit`)}
                  >
                    Ouvrir l&apos;éditeur de prompt
                  </Button>
                </VStack>
              </SectionCard>
            </VStack>

            <VStack alignItems="stretch" gap={6}>
              <SectionCard title="Repere rapide" icon={<Clock3 size={18} />}>
                <VStack alignItems="stretch" gap={3}>
                  <Text fontSize="sm" color="fg.muted">
                    Entretiens liés à ce persona
                  </Text>
                  <Heading size="lg">{history.length}</Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {interviewsWithMaterial.length} entretien
                    {interviewsWithMaterial.length > 1 ? "s" : ""} avec un minimum de
                    matière exploitable
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {history[0]?.updated_at
                      ? `Dernière activité : ${formatDate(history[0].updated_at)}`
                      : "Aucun historique pour le moment"}
                  </Text>
                </VStack>
              </SectionCard>

              <SectionCard title="Conseils de posture">
                <VStack alignItems="stretch" gap={4}>
                  {postureTips.map((tip) => (
                    <Box
                      key={tip.title}
                      borderWidth="1px"
                      borderColor="border.subtle"
                      borderRadius="2xl"
                      p={4}
                    >
                      <VStack alignItems="stretch" gap={2}>
                        <Text fontWeight="semibold">{tip.title}</Text>
                        <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
                          {tip.body}
                        </Text>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </SectionCard>

              <SectionCard title="Historique du persona" icon={<History size={18} />}>
                <VStack alignItems="stretch" gap={4}>
                  {history.length > 0 ? (
                    history.slice(0, 5).map((interview) => (
                      <Box
                        key={interview.id}
                        borderWidth="1px"
                        borderColor="border.subtle"
                        borderRadius="2xl"
                        p={4}
                      >
                        <VStack alignItems="stretch" gap={3}>
                          <VStack alignItems="stretch" gap={1}>
                            <Text fontWeight="semibold">
                              {getPersonaHistoryTitle(interview)}
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                              {formatDate(interview.updated_at)} -{" "}
                              {interview.message_count ?? 0} message
                              {(interview.message_count ?? 0) > 1 ? "s" : ""}
                            </Text>
                          </VStack>
                          <HStack gap={2} flexWrap="wrap">
                            <Button
                              size="xs"
                              variant="subtle"
                              onClick={() => router.push(`/interview/${interview.id}`)}
                            >
                              Voir l&apos;entretien
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                router.push(`/interview/${interview.id}/analysis`)
                              }
                            >
                              Voir l&apos;analyse
                            </Button>
                          </HStack>
                        </VStack>
                      </Box>
                    ))
                  ) : (
                    <Text color="fg.muted">
                      Aucun entretien n&apos;est encore rattaché à ce persona.
                    </Text>
                  )}
                  <Button
                    alignSelf="flex-start"
                    variant="plain"
                    colorPalette="blue"
                    onClick={() =>
                      router.push(`/interviews?agent=${encodeURIComponent(agent.id)}`)
                    }
                  >
                    Voir l&apos;historique complet
                  </Button>
                </VStack>
              </SectionCard>
            </VStack>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}
