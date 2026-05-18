"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  HStack,
  IconButton,
  Link,
  NativeSelect,
  Pagination,
  ButtonGroup,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  MessageSquarePlus,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import NewInterviewButton from "@/app/components/NewInterviewButton";
import { useAuthUser } from "@/hooks/useAuthUser";

// ── Palette deterministe par persona ──────────────────────────────────────────
const PALETTE = [
  { from: "#6366f1", to: "#8b5cf6", bar: "#6366f1" },
  { from: "#0ea5e9", to: "#6366f1", bar: "#0ea5e9" },
  { from: "#8b5cf6", to: "#ec4899", bar: "#8b5cf6" },
  { from: "#10b981", to: "#0ea5e9", bar: "#10b981" },
  { from: "#f59e0b", to: "#ef4444", bar: "#f59e0b" },
  { from: "#ec4899", to: "#8b5cf6", bar: "#ec4899" },
];
function getPalette(name?: string) {
  const idx = (name ?? "A").charCodeAt(0) % PALETTE.length;
  return PALETTE[idx];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface InterviewWithDetails {
  id: string;
  agent_id?: string;
  status: string;
  updated_at: string;
  agents?: {
    agent_name?: string;
    active?: boolean;
  };
  starter_user_id?: string | null;
  starter_user_name?: string | null;
  interview_usage: Array<{
    total_input_tokens: number;
    total_output_tokens: number;
  }>;
  messages: Array<{
    content: string;
    role: string;
    created_at: string;
  }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAgentName = (name?: string): string => {
  if (!name) return "Agent";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const getFirstAssistantMessage = (
  messages: Array<{ content: string; role: string; created_at: string }>
) => {
  if (!messages?.length) return null;
  return messages.find((msg) => msg.role === "assistant") || null;
};

const getReplyCount = (
  messages: Array<{ content: string; role: string; created_at: string }>
) => messages.filter((m) => m.role === "assistant").length;

// ── Interview card ─────────────────────────────────────────────────────────────
function InterviewCard({
  interview,
  isOwner,
  userAdmin,
  userDisplayName,
  index,
  onContinue,
}: {
  interview: InterviewWithDetails;
  isOwner: boolean;
  userAdmin: boolean;
  userDisplayName: string;
  index: number;
  onContinue: (id: string) => void;
}) {
  const agentName = formatAgentName(interview.agents?.agent_name);
  const palette = getPalette(interview.agents?.agent_name);
  const initial = agentName.charAt(0).toUpperCase();
  const firstAssistant = getFirstAssistantMessage(interview.messages);
  const replyCount = getReplyCount(interview.messages);
  const preview = firstAssistant?.content
    ? firstAssistant.content.replace(/\s+/g, " ").trim().slice(0, 160)
    : "Aucun message disponible.";
  const actionLabel = userAdmin && !isOwner ? "Voir l'entretien" : "Continuer";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        borderRadius="20px"
        borderWidth="1px"
        borderColor="var(--color-border)"
        background="var(--color-surface)"
        boxShadow="var(--color-shadow-sm)"
        overflow="hidden"
        display="flex"
        transition="box-shadow 0.2s ease, transform 0.2s ease"
        _hover={{
          boxShadow: "0 12px 36px rgba(15,23,42,0.09)",
          transform: "translateY(-2px)",
        }}
      >
        {/* Left accent bar */}
        <Box
          width="4px"
          flexShrink={0}
          background={`linear-gradient(180deg, ${palette.from}, ${palette.to})`}
        />

        {/* Content */}
        <HStack flex="1" px={5} py={4} gap={4} alignItems="flex-start">
          {/* Persona avatar */}
          <Box
            width="44px"
            height="44px"
            borderRadius="14px"
            background={`linear-gradient(135deg, ${palette.from}, ${palette.to})`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            boxShadow={`0 4px 12px ${palette.from}30`}
          >
            <Text fontSize="lg" fontWeight="800" color="white" lineHeight="1">
              {initial}
            </Text>
          </Box>

          {/* Meta */}
          <VStack alignItems="flex-start" gap={1.5} flex="1" minWidth={0}>
            <HStack gap={2} flexWrap="wrap" alignItems="center">
              <Text fontWeight="800" fontSize="md" letterSpacing="-0.02em" color="gray.900">
                {agentName}
              </Text>
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={2}
                fontSize="2xs"
                fontWeight="700"
              >
                {replyCount} réponse{replyCount !== 1 ? "s" : ""}
              </Badge>
            </HStack>

            {/* Preview */}
            <Text
              fontSize="sm"
              color="gray.600"
              lineHeight="1.65"
              lineClamp={2}
            >
              {preview}
            </Text>

            {/* Footer meta */}
            <HStack gap={3} mt={0.5}>
              <HStack gap={1} color="fg.muted">
                <Calendar size={11} />
                <Text fontSize="xs">{formatDateShort(interview.updated_at)}</Text>
              </HStack>
              {userAdmin && interview.starter_user_name && (
                <HStack gap={1} color="fg.muted">
                  <Users size={11} />
                  <Text fontSize="xs">{interview.starter_user_name}</Text>
                </HStack>
              )}
            </HStack>
          </VStack>

          {/* Action */}
          <Button
            size="sm"
            borderRadius="xl"
            colorPalette="blue"
            variant="subtle"
            fontWeight="700"
            flexShrink={0}
            alignSelf="center"
            onClick={() => onContinue(interview.id)}
          >
            {actionLabel}
            <ArrowRight size={13} />
          </Button>
        </HStack>
      </Box>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading, user_admin } = useAuthUser();
  const userDisplayName = (() => {
    if (!user) return "Utilisateur";
    const metadata = user.user_metadata || {};
    const firstName = (metadata.firstName as string) || "";
    const lastName = (metadata.lastName as string) || "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    const metadataName = (metadata.name as string) || "";
    if (metadataName) return metadataName;
    return user.email?.split("@")[0] ?? "Utilisateur";
  })();

  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const hasAppliedAgentParam = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        const response = await fetch(`/api/user/interviews?userId=${user.id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message = data.error || "Impossible de charger vos entretiens";
          setError(message);
          setIsLoading(false);
          return;
        }
        const data = await response.json();
        const transformedInterviews =
          (data.interviews as InterviewWithDetails[] | undefined)?.filter(
            (interview) => interview.messages && interview.messages.length > 0
          ) || [];
        setInterviews(transformedInterviews);
      } catch (err) {
        console.error("Error in dashboard:", err);
        setError("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthLoading, user, router]);

  const handleNewInterview = async () => {
    if (selectedAgentId === "all") {
      router.push("/personnas");
      return;
    }
    try {
      setIsCreatingSession(true);
      if (!user?.id) { router.push("/login"); return; }
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, agent_id: selectedAgentId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Impossible de créer une nouvelle session");
        return;
      }
      const data = await response.json();
      router.push(`/interview?interviewId=${data.interviewId}&sessionId=${data.sessionId}&adkSessionId=${data.adkSessionId}`);
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Une erreur est survenue lors de la création de la session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const agentOptions = Array.from(
    interviews.reduce((map, interview) => {
      if (interview.agent_id) {
        map.set(interview.agent_id, {
          id: interview.agent_id,
          name: formatAgentName(interview.agents?.agent_name),
        });
      }
      return map;
    }, new Map<string, { id: string; name: string }>())
  ).map(([, option]) => option);

  const hasMultipleAgents = agentOptions.length > 1;

  const userOptions = useMemo(() => {
    if (!user_admin) return [];
    return Array.from(
      interviews.reduce((map, interview) => {
        if (interview.starter_user_id) {
          map.set(interview.starter_user_id, {
            id: interview.starter_user_id,
            name: interview.starter_user_name || "Utilisateur",
          });
        }
        return map;
      }, new Map<string, { id: string; name: string }>())
    ).map(([, option]) => option);
  }, [interviews, user_admin]);

  const filteredByAgent =
    selectedAgentId === "all"
      ? interviews
      : interviews.filter((i) => i.agent_id === selectedAgentId);
  const filteredInterviews =
    !user_admin || selectedUserId === "all"
      ? filteredByAgent
      : filteredByAgent.filter((i) => i.starter_user_id === selectedUserId);
  const totalPages = Math.max(1, Math.ceil(filteredInterviews.length / pageSize));
  const paginatedInterviews = filteredInterviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Stats for hero
  const uniquePersonas = new Set(interviews.map((i) => i.agent_id)).size;
  const lastActivity = interviews.length > 0
    ? formatDate(interviews.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at)
    : null;

  useEffect(() => {
    if (!hasMultipleAgents) { setSelectedAgentId("all"); return; }
    if (selectedAgentId !== "all" && !agentOptions.some((o) => o.id === selectedAgentId)) {
      setSelectedAgentId("all");
    }
  }, [agentOptions, hasMultipleAgents, selectedAgentId]);

  useEffect(() => {
    if (!user_admin) { setSelectedUserId("all"); return; }
    if (selectedUserId !== "all" && !userOptions.some((o) => o.id === selectedUserId)) {
      setSelectedUserId("all");
    }
  }, [selectedUserId, userOptions, user_admin]);

  useEffect(() => {
    const agentParam = searchParams.get("agent");
    if (!agentParam || hasAppliedAgentParam.current || agentOptions.length === 0) return;
    const match = agentOptions.find((o) => o.id === agentParam || o.name === agentParam);
    if (match) setSelectedAgentId(match.id);
    hasAppliedAgentParam.current = true;
  }, [agentOptions, searchParams]);

  useEffect(() => { setCurrentPage(1); }, [selectedAgentId, selectedUserId, pageSize]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <Container maxWidth="4xl" height="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement de vos entretiens...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxWidth="4xl" py={8} px={{ base: 4, md: 6 }}>
      <VStack gap={8} alignItems="stretch">

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            borderRadius="28px"
            overflow="hidden"
            position="relative"
            background="linear-gradient(135deg, rgba(239,246,255,0.9) 0%, rgba(237,233,254,0.7) 50%, rgba(239,246,255,0.9) 100%)"
            borderWidth="1px"
            borderColor="rgba(148,163,184,0.18)"
            boxShadow="0 12px 40px rgba(15,23,42,0.07)"
          >
            {/* 3px top accent */}
            <Box
              position="absolute"
              insetX={0}
              top={0}
              height="3px"
              background="linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9)"
            />

            {/* Decorative blobs */}
            <Box
              position="absolute"
              top="-40px"
              right="-40px"
              width="200px"
              height="200px"
              borderRadius="full"
              background="radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)"
              pointerEvents="none"
            />
            <Box
              position="absolute"
              bottom="-30px"
              left="30%"
              width="160px"
              height="160px"
              borderRadius="full"
              background="radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)"
              pointerEvents="none"
            />

            <Box px={{ base: 6, md: 8 }} pt={8} pb={6} position="relative">
              {/* Eyebrow */}
              <HStack gap={2} mb={3}>
                <Box height="1px" width="20px" background="rgba(99,102,241,0.4)" />
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  letterSpacing="0.14em"
                  textTransform="uppercase"
                  color="blue.600"
                >
                  {user_admin ? "Administration" : "Espace personnel"}
                </Text>
              </HStack>

              <HStack
                justifyContent="space-between"
                alignItems={{ base: "flex-start", md: "center" }}
                flexDirection={{ base: "column", md: "row" }}
                gap={4}
              >
                <VStack alignItems="flex-start" gap={1}>
                  <Text
                    className="display-heading"
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="400"
                    letterSpacing="-0.04em"
                    color="gray.900"
                    lineHeight="1.1"
                  >
                    {user_admin ? "Tous les entretiens" : "Mes entretiens"}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
                    {user_admin
                      ? "Vue d'ensemble des simulations de l'ensemble des utilisateurs"
                      : "Vos simulations d'entretien sociologique semi-directif"}
                  </Text>
                </VStack>

                <NewInterviewButton
                  onClick={handleNewInterview}
                  loading={isCreatingSession}
                  disabled={isCreatingSession}
                />
              </HStack>

              {/* Stats strip */}
              {interviews.length > 0 && (
                <HStack
                  gap={0}
                  mt={6}
                  borderRadius="16px"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor="rgba(148,163,184,0.16)"
                  background="rgba(255,255,255,0.7)"
                  backdropFilter="blur(8px)"
                >
                  {[
                    { label: "Entretiens", value: String(interviews.length), icon: MessageSquare },
                    { label: "Personas utilisées", value: String(uniquePersonas), icon: Users },
                    ...(lastActivity ? [{ label: "Dernière activité", value: lastActivity, icon: Calendar }] : []),
                  ].map((stat, i) => (
                    <Box
                      key={stat.label}
                      flex="1"
                      px={4}
                      py={3}
                      borderRight={i < 2 && lastActivity ? "1px solid rgba(148,163,184,0.16)" : undefined}
                    >
                      <Text
                        fontSize="2xs"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        textTransform="uppercase"
                        color="fg.muted"
                        mb={0.5}
                      >
                        {stat.label}
                      </Text>
                      <Text
                        fontWeight="900"
                        fontSize={stat.icon === Calendar ? "sm" : "xl"}
                        letterSpacing="-0.03em"
                        style={{
                          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {stat.value}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && (
          <Box
            borderRadius="16px"
            px={5}
            py={4}
            borderWidth="1px"
            borderColor="rgba(239,68,68,0.25)"
            background="rgba(254,242,242,0.9)"
            borderLeft="4px solid"
            borderLeftColor="red.400"
          >
            <Text color="red.700" fontWeight="600">{error}</Text>
          </Box>
        )}

        {/* ── Filters ───────────────────────────────────────────────────────── */}
        {(hasMultipleAgents || (user_admin && userOptions.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box
              borderRadius="20px"
              borderWidth="1px"
              borderColor="rgba(148,163,184,0.15)"
              background="rgba(255,255,255,0.85)"
              backdropFilter="blur(12px)"
              boxShadow="0 4px 16px rgba(15,23,42,0.04)"
              px={5}
              py={4}
            >
              <HStack gap={4} flexWrap="wrap" alignItems="center">
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="fg.muted" flexShrink={0}>
                  Filtrer
                </Text>

                {hasMultipleAgents && (
                  <NativeSelect.Root size="sm" maxWidth="200px">
                    <NativeSelect.Field
                      aria-label="Filtrer par persona"
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      borderRadius="xl"
                      borderColor="rgba(148,163,184,0.3)"
                      fontSize="sm"
                    >
                      <option value="all">Toutes les personas</option>
                      {agentOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                )}

                {user_admin && userOptions.length > 0 && (
                  <NativeSelect.Root size="sm" maxWidth="200px">
                    <NativeSelect.Field
                      aria-label="Filtrer par utilisateur"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      borderRadius="xl"
                      borderColor="rgba(148,163,184,0.3)"
                      fontSize="sm"
                    >
                      <option value="all">Tous les utilisateurs</option>
                      {userOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                )}

                {filteredInterviews.length !== interviews.length && (
                  <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={3}>
                    {filteredInterviews.length} résultat{filteredInterviews.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </HStack>
            </Box>
          </motion.div>
        )}

        {/* ── Empty state ────────────────────────────────────────────────────── */}
        {filteredInterviews.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Box
              borderRadius="24px"
              borderWidth="1px"
              borderColor="rgba(148,163,184,0.15)"
              background="rgba(248,250,252,0.9)"
              py={14}
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={4}
            >
              <Box
                width="64px"
                height="64px"
                borderRadius="20px"
                background="linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor="rgba(99,102,241,0.15)"
              >
                <MessageSquarePlus size={28} color="#6366f1" />
              </Box>
              <VStack gap={1.5}>
                <Text fontWeight="800" fontSize="lg" letterSpacing="-0.02em" color="gray.800">
                  {selectedAgentId === "all"
                    ? "Aucun entretien pour l'instant"
                    : "Aucun entretien pour ce persona"}
                </Text>
                <Text fontSize="sm" color="fg.muted" textAlign="center" maxWidth="sm">
                  {selectedAgentId === "all" ? (
                    <>
                      Rendez-vous sur{" "}
                      <Link as={NextLink} href="/personnas" color="blue.600" fontWeight="600">
                        Personas
                      </Link>{" "}
                      pour démarrer votre première simulation.
                    </>
                  ) : (
                    "Modifiez vos filtres pour voir d'autres entretiens."
                  )}
                </Text>
              </VStack>
            </Box>
          </motion.div>
        )}

        {/* ── Interview list ─────────────────────────────────────────────────── */}
        {filteredInterviews.length > 0 && (
          <VStack gap={3} alignItems="stretch">
            {/* Section header */}
            <HStack justifyContent="space-between" alignItems="center" px={1}>
              <HStack gap={2}>
                <Box height="1px" width="16px" background="rgba(99,102,241,0.4)" />
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  color="fg.muted"
                >
                  Entretiens
                </Text>
                <Badge
                  colorPalette="blue"
                  variant="subtle"
                  borderRadius="full"
                  px={2.5}
                  fontSize="2xs"
                  fontWeight="700"
                >
                  {filteredInterviews.length}
                </Badge>
              </HStack>
            </HStack>

            {paginatedInterviews.map((interview, i) => {
              const isOwner = Boolean(
                interview.starter_user_id && user?.id && interview.starter_user_id === user.id
              );
              return (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  isOwner={isOwner}
                  userAdmin={!!user_admin}
                  userDisplayName={userDisplayName}
                  index={i}
                  onContinue={(id) => router.push(`/interview/${id}`)}
                />
              );
            })}
          </VStack>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {filteredInterviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <HStack
              justify="space-between"
              align="center"
              flexWrap="wrap"
              gap={4}
              px={1}
            >
              <HStack align="center" gap={3}>
                <Text fontSize="xs" color="fg.muted" letterSpacing="0.04em">
                  Par page
                </Text>
                <NativeSelect.Root size="sm" maxWidth="80px">
                  <NativeSelect.Field
                    aria-label="Entretiens par page"
                    value={String(pageSize)}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    borderRadius="xl"
                    borderColor="rgba(148,163,184,0.3)"
                    fontSize="sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </HStack>

              <Pagination.Root
                count={filteredInterviews.length}
                pageSize={pageSize}
                page={currentPage}
                onPageChange={(details) => setCurrentPage(details.page)}
              >
                <ButtonGroup variant="subtle" size="sm" gap={1}>
                  <Pagination.PrevTrigger asChild>
                    <IconButton aria-label="Page précédente" borderRadius="xl" size="sm">
                      <LuChevronLeft />
                    </IconButton>
                  </Pagination.PrevTrigger>

                  <Pagination.Items
                    render={(page) => (
                      <IconButton
                        aria-label={`Page ${page.value}`}
                        variant={page.value === currentPage ? "solid" : "subtle"}
                        colorPalette={page.value === currentPage ? "blue" : undefined}
                        borderRadius="xl"
                        size="sm"
                        key={page.value}
                      >
                        {page.value}
                      </IconButton>
                    )}
                  />

                  <Pagination.NextTrigger asChild>
                    <IconButton aria-label="Page suivante" borderRadius="xl" size="sm">
                      <LuChevronRight />
                    </IconButton>
                  </Pagination.NextTrigger>
                </ButtonGroup>
              </Pagination.Root>
            </HStack>
          </motion.div>
        )}

      </VStack>
    </Container>
  );
}
