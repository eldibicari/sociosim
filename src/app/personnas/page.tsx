"use client";

import {
  Box,
  Button,
  Container,
  Grid,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Plus, Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { useAuthUser } from "@/hooks/useAuthUser";
import { isAdminLike } from "@/lib/agentPolicy";
import { type Agent } from "@/lib/agents";
import { AgentCard } from "./components/AgentCard";
import { groupAgentsByCreator } from "./groupAgents";
import { MimesisAppSidebar } from "@/app/components/MimesisAppSidebar";

interface InterviewWithDetails {
  agent_id?: string;
  message_count?: number;
  agents?: { agent_name?: string };
  messages?: Array<{ content: string }>;
}

const GRID_COLUMNS = { base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" };
type PersonnaFilter = "all" | "active" | "history" | "mine";

function matchesSearch(agent: Agent, search: string) {
  if (!search.trim()) return true;
  const haystack = [agent.agent_name, agent.description ?? "", agent.creator_name ?? ""]
    .join(" ").toLowerCase();
  return haystack.includes(search.trim().toLowerCase());
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, description, count }: {
  eyebrow: string;
  title: string;
  description?: string;
  count?: number;
}) {
  return (
    <HStack justifyContent="space-between" alignItems="flex-end" gap={4}>
      <VStack alignItems="flex-start" gap={1.5}>
        <HStack gap={2} alignItems="center">
          <Box width="16px" height="1.5px" background="linear-gradient(90deg, #6366f1, #8b5cf6)" borderRadius="full" />
          <Text fontSize="2xs" textTransform="uppercase" letterSpacing="0.22em" color="blue.600" fontWeight="700">
            {eyebrow}
          </Text>
        </HStack>
        <Heading size="md" letterSpacing="-0.02em">{title}</Heading>
        {description && (
          <Text color="fg.muted" fontSize="sm" lineHeight="1.7" maxWidth="2xl">{description}</Text>
        )}
      </VStack>
      {count !== undefined && (
        <Box
          px={3}
          py={1}
          borderRadius="full"
          borderWidth="1px"
          borderColor="rgba(99,102,241,0.18)"
          background="rgba(99,102,241,0.06)"
          flexShrink={0}
        >
          <Text fontSize="xs" fontWeight="700" color="blue.700">
            {count} persona{count !== 1 ? "s" : ""}
          </Text>
        </Box>
      )}
    </HStack>
  );
}

// ─── Agent grid ───────────────────────────────────────────────────────────────
function AgentGrid({
  agents,
  isCreatingSession,
  togglingAgentId,
  interactedAgents,
  userAdmin,
  currentUserId,
  onSelectAgent,
  onToggleAgent,
  onNavigateHistory,
  onNavigateFiche,
  onNavigatePrompt,
  indexOffset = 0,
}: {
  agents: Agent[];
  isCreatingSession: boolean;
  togglingAgentId: string | null;
  interactedAgents: string[];
  userAdmin: boolean;
  currentUserId?: string | null;
  onSelectAgent: (agentId: string) => void;
  onToggleAgent: (agent: Agent) => void;
  onNavigateHistory: (agentId: string) => void;
  onNavigateFiche: (agentId: string) => void;
  onNavigatePrompt: (agentId: string) => void;
  indexOffset?: number;
}) {
  if (agents.length === 0) return null;
  return (
    <Grid gridTemplateColumns={GRID_COLUMNS} gap={5}>
      {agents.map((agent, i) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          index={indexOffset + i}
          isCreatingSession={isCreatingSession}
          togglingAgentId={togglingAgentId}
          hasInteracted={interactedAgents.includes(agent.id)}
          userAdmin={userAdmin}
          currentUserId={currentUserId}
          onSelectAgent={onSelectAgent}
          onToggleAgent={onToggleAgent}
          onNavigateHistory={onNavigateHistory}
          onNavigateFiche={onNavigateFiche}
          onNavigatePrompt={onNavigatePrompt}
        />
      ))}
    </Grid>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PersonnasPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, user_admin, refreshUser } = useAuthUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PersonnaFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactedAgents, setInteractedAgents] = useState<string[]>([]);
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    document.body.classList.add("hide-footer");
    return () => { document.body.classList.remove("hide-footer"); };
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { setIsLoading(false); router.push("/login"); return; }

    const loadData = async () => {
      try {
        const [agentsResult, interviewsResult] = await Promise.allSettled([
          fetch("/api/agents?template=false"),
          fetch("/api/user/interviews"),
        ]);

        if (agentsResult.status === "fulfilled") {
          const response = agentsResult.value;
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const message = data.error || "Impossible de charger les agents";
            if (response.status === 401) await refreshUser();
            setError(message);
          } else {
            const data = await response.json();
            const uniqueAgents = new Map<string, Agent>();
            (data.agents || []).forEach((agent: Agent) => uniqueAgents.set(agent.id, agent));
            setAgents(Array.from(uniqueAgents.values()));
          }
        } else {
          setError("Impossible de charger les agents");
        }

        if (interviewsResult.status === "fulfilled") {
          const response = interviewsResult.value;
          if (response.ok) {
            const data = await response.json();
            const agentIds = new Set<string>();
            (data.interviews || []).forEach((interview: InterviewWithDetails) => {
              if (interview.message_count && interview.message_count > 0 && interview.agent_id) {
                agentIds.add(interview.agent_id);
              }
            });
            setInteractedAgents(Array.from(agentIds));
          } else if (interviewsResult.value.status === 401) {
            await refreshUser();
          }
        }
      } catch (err) {
        console.error("Error fetching personnas data:", err);
        setError("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthLoading, refreshUser, router, user]);

  const handleSelectAgent = async (agentId: string) => {
    try {
      setIsCreatingSession(true);
      if (!user?.id) { router.push("/login"); return; }
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, agent_id: agentId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Impossible de créer une nouvelle session");
        return;
      }
      const data = await response.json();
      router.push(`/interview?interviewId=${data.interviewId}&sessionId=${data.sessionId}&adkSessionId=${data.adkSessionId}`);
    } catch (err) {
      console.error("Error selecting agent:", err);
      setError("Une erreur est survenue lors de la création de la session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleToggleAgent = async (agent: Agent) => {
    setTogglingAgentId(agent.id);
    setError(null);
    try {
      const nextActive = !agent.active;
      const response = await fetch(`/api/agents/${agent.id}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Impossible de mettre à jour le persona");
        return;
      }
      setAgents((prev) => prev.map((item) => item.id === agent.id ? { ...item, active: nextActive } : item));
      toaster.create({
        type: "success",
        description: nextActive ? "L'agent est activé" : "L'agent est désactivé",
        duration: 4000,
        closable: true,
      });
    } catch (err) {
      console.error("Error updating agent status:", err);
      setError("Une erreur est survenue");
    } finally {
      setTogglingAgentId(null);
    }
  };

  const handleNavigateHistory = (agentId: string) => router.push(`/interviews?agent=${encodeURIComponent(agentId)}`);
  const handleNavigateFiche = (agentId: string) => router.push(`/personnas/${encodeURIComponent(agentId)}`);
  const handleNavigatePrompt = (agentId: string) => router.push(`/personnas/${agentId}/edit`);

  const filteredAgents = useMemo(() => agents.filter((agent) => {
    if (!matchesSearch(agent, deferredSearch)) return false;
    switch (activeFilter) {
      case "active": return agent.active;
      case "history": return interactedAgents.includes(agent.id);
      case "mine": return agent.created_by === user?.id;
      default: return true;
    }
  }), [activeFilter, agents, deferredSearch, interactedAgents, user?.id]);

  const groups = useMemo(() => groupAgentsByCreator(filteredAgents), [filteredAgents]);
  const staffGroup = useMemo(() => groups.find((g) => g.isStaff), [groups]);
  const studentGroups = useMemo(() => groups.filter((g) => !g.isStaff), [groups]);
  const allStudentActive = useMemo(() => studentGroups.flatMap((g) => g.activeAgents), [studentGroups]);
  const allStudentInactive = useMemo(() => studentGroups.flatMap((g) => g.inactiveAgents), [studentGroups]);

  const staffPublicActive = useMemo(() => filteredAgents.filter((a) => isAdminLike(a.creator_role) && a.active && a.is_public), [filteredAgents]);
  const myAgents = useMemo(() => (user ? filteredAgents.filter((a) => a.created_by === user.id) : []), [filteredAgents, user]);
  const myActiveAgents = useMemo(() => myAgents.filter((a) => a.active), [myAgents]);
  const myInactiveAgents = useMemo(() => myAgents.filter((a) => !a.active), [myAgents]);
  const ownsAnyAgent = useMemo(() => Boolean(user && agents.some((a) => a.created_by === user.id)), [agents, user]);
  const activeCount = useMemo(() => agents.filter((a) => a.active).length, [agents]);
  const interactedCount = interactedAgents.length;

  const FILTER_OPTIONS: Array<{ key: PersonnaFilter; label: string }> = [
    { key: "all", label: "Tous" },
    { key: "active", label: "Actifs" },
    { key: "history", label: "Avec historique" },
    ...(ownsAnyAgent ? [{ key: "mine" as PersonnaFilter, label: "Mes personas" }] : []),
  ];

  const gridProps = {
    isCreatingSession,
    togglingAgentId,
    interactedAgents,
    userAdmin: user_admin,
    currentUserId: user?.id ?? null,
    onSelectAgent: handleSelectAgent,
    onToggleAgent: handleToggleAgent,
    onNavigateHistory: handleNavigateHistory,
    onNavigateFiche: handleNavigateFiche,
    onNavigatePrompt: handleNavigatePrompt,
  };

  if (isLoading) {
    return (
      <Box minHeight="100vh" background="linear-gradient(180deg, #f8fafc 0%, #eef4ff 40%, #ffffff 100%)" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement des personas...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      minHeight="100vh"
      background="linear-gradient(180deg, #f8fafc 0%, #eef4ff 35%, #ffffff 100%)"
      position="relative"
      overflow="hidden"
    >
      <MimesisAppSidebar />
      {/* Background blobs */}
      <Box position="absolute" top="-80px" right="-60px" width="360px" height="360px" borderRadius="full" background="rgba(99,102,241,0.07)" filter="blur(80px)" pointerEvents="none" />
      <Box position="absolute" top="400px" left="-80px" width="280px" height="280px" borderRadius="full" background="rgba(14,165,233,0.07)" filter="blur(90px)" pointerEvents="none" />

      <Container maxWidth="7xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }} position="relative" paddingLeft={{ base: 4, lg: "236px" }}>
        <VStack gap={10} alignItems="stretch">

          {/* ── Hero header ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Box
              borderRadius={{ base: "28px", md: "36px" }}
              borderWidth="1px"
              borderColor="rgba(148,163,184,0.16)"
              background="linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.96) 100%)"
              boxShadow="0 20px 60px rgba(15,23,42,0.07)"
              backdropFilter="blur(16px)"
              overflow="hidden"
              position="relative"
            >
              <Box position="absolute" insetX={0} top={0} height="3px" background="linear-gradient(90deg, #6366f1 0%, #8b5cf6 52%, #0ea5e9 100%)" />
              <HStack
                px={{ base: 5, md: 8 }}
                py={{ base: 6, md: 8 }}
                justifyContent="space-between"
                alignItems={{ base: "flex-start", md: "center" }}
                flexDirection={{ base: "column", lg: "row" }}
                gap={6}
              >
                <VStack alignItems="flex-start" gap={3} maxWidth="3xl">
                  <HStack gap={2} alignItems="center">
                    <Box width="16px" height="1.5px" background="linear-gradient(90deg, #6366f1, #8b5cf6)" borderRadius="full" />
                    <Text fontSize="2xs" textTransform="uppercase" letterSpacing="0.22em" color="blue.600" fontWeight="700">
                      Espace personas
                    </Text>
                  </HStack>
                  <Heading
                    size="2xl"
                    className="display-heading"
                    letterSpacing="-0.04em"
                    lineHeight="1.05"
                    fontSize={{ base: "3xl", md: "4xl" }}
                  >
                    Choisir un persona, préparer un entretien rigoureux
                  </Heading>
                  <Text color="fg.muted" fontSize="md" lineHeight="1.8" maxWidth="2xl">
                    Chaque persona est un profil sociologique simulé. Consultez sa fiche, explorez sa grille d&apos;entretien, puis démarrez une simulation pour produire du matériau d&apos;analyse.
                  </Text>
                </VStack>

                {/* Stats + CTA */}
                <VStack alignItems={{ base: "flex-start", lg: "flex-end" }} gap={4} flexShrink={0}>
                  <HStack gap={4}>
                    <VStack alignItems="center" gap={0}>
                      <Text
                        fontSize="2xl"
                        fontWeight="800"
                        letterSpacing="-0.04em"
                        style={{
                          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {agents.length}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted" fontWeight="600" letterSpacing="0.06em">personas</Text>
                    </VStack>
                    <Box width="1px" height="32px" background="rgba(148,163,184,0.25)" />
                    <VStack alignItems="center" gap={0}>
                      <Text
                        fontSize="2xl"
                        fontWeight="800"
                        letterSpacing="-0.04em"
                        style={{
                          background: "linear-gradient(135deg, #10b981, #0ea5e9)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {activeCount}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted" fontWeight="600" letterSpacing="0.06em">actifs</Text>
                    </VStack>
                    <Box width="1px" height="32px" background="rgba(148,163,184,0.25)" />
                    <VStack alignItems="center" gap={0}>
                      <Text
                        fontSize="2xl"
                        fontWeight="800"
                        letterSpacing="-0.04em"
                        style={{
                          background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {interactedCount}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted" fontWeight="600" letterSpacing="0.06em">utilisés</Text>
                    </VStack>
                  </HStack>
                  <Button
                    colorPalette="blue"
                    borderRadius="xl"
                    fontWeight="700"
                    onClick={() => router.push("/personnas/new")}
                    px={5}
                  >
                    <Plus size={16} />
                    Créer un persona
                  </Button>
                </VStack>
              </HStack>
            </Box>
          </motion.div>

          {/* ── Search + filters ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Box
              borderRadius="28px"
              borderWidth="1px"
              borderColor="rgba(148,163,184,0.16)"
              background="rgba(255,255,255,0.9)"
              backdropFilter="blur(12px)"
              boxShadow="0 4px 24px rgba(15,23,42,0.05)"
              px={{ base: 4, md: 6 }}
              py={{ base: 4, md: 5 }}
            >
              <VStack alignItems="stretch" gap={4}>
                {/* Search input */}
                <Box position="relative">
                  <Box
                    position="absolute"
                    left={4}
                    top="50%"
                    transform="translateY(-50%)"
                    color="fg.muted"
                    pointerEvents="none"
                    zIndex={1}
                  >
                    <Search size={15} />
                  </Box>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, description ou auteur…"
                    paddingInlineStart={10}
                    borderRadius="xl"
                    borderColor="rgba(148,163,184,0.2)"
                    background="rgba(248,250,252,0.8)"
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 3px rgba(99,102,241,0.1)", background: "white" }}
                    _placeholder={{ color: "fg.muted" }}
                  />
                </Box>

                {/* Filters + count */}
                <HStack justifyContent="space-between" alignItems="center" gap={4} flexWrap="wrap">
                  <HStack gap={2} flexWrap="wrap">
                    {FILTER_OPTIONS.map((opt) => (
                      <Button
                        key={opt.key}
                        size="sm"
                        borderRadius="full"
                        variant={activeFilter === opt.key ? "solid" : "ghost"}
                        colorPalette={activeFilter === opt.key ? "blue" : "gray"}
                        onClick={() => setActiveFilter(opt.key)}
                        fontWeight={activeFilter === opt.key ? "700" : "500"}
                        px={4}
                        borderWidth={activeFilter === opt.key ? "0" : "1px"}
                        borderColor="rgba(148,163,184,0.2)"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </HStack>
                  <HStack gap={1.5} alignItems="center">
                    <Users size={12} color="var(--chakra-colors-fg-muted)" />
                    <Text fontSize="xs" color="fg.muted" fontWeight="500">
                      {filteredAgents.length} / {agents.length}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Box>
          </motion.div>

          {/* ── Error ── */}
          {error && (
            <Box
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="rgba(239,68,68,0.2)"
              background="rgba(254,242,242,0.9)"
              px={5}
              py={4}
              borderLeft="4px solid"
              borderLeftColor="red.400"
            >
              <Text color="red.700" fontSize="sm">{error}</Text>
            </Box>
          )}

          {/* ── Empty states ── */}
          {agents.length === 0 && !error && (
            <Box
              borderRadius="32px"
              borderWidth="1px"
              borderColor="rgba(148,163,184,0.14)"
              background="rgba(255,255,255,0.9)"
              px={8}
              py={16}
              textAlign="center"
            >
              <VStack gap={4} alignItems="center" maxWidth="360px" mx="auto">
                <Box width="56px" height="56px" borderRadius="18px" background="linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))" borderWidth="1px" borderColor="rgba(99,102,241,0.14)" display="flex" alignItems="center" justifyContent="center">
                  <Users size={24} color="#6366f1" />
                </Box>
                <VStack gap={1}>
                  <Heading size="md">Aucun persona disponible</Heading>
                  <Text color="fg.muted" fontSize="sm" lineHeight="1.75">
                    Créez votre premier persona pour commencer les simulations d&apos;entretien.
                  </Text>
                </VStack>
                <Button colorPalette="blue" borderRadius="xl" fontWeight="700" onClick={() => router.push("/personnas/new")}>
                  <Plus size={15} />
                  Créer un persona
                </Button>
              </VStack>
            </Box>
          )}

          {agents.length > 0 && filteredAgents.length === 0 && !error && (
            <Box borderRadius="2xl" background="rgba(248,250,252,0.9)" px={6} py={10} textAlign="center">
              <Text color="fg.muted">Aucun persona ne correspond à cette recherche.</Text>
            </Box>
          )}

          {/* ── Content: admin view ── */}
          {filteredAgents.length > 0 && user_admin && (
            <VStack gap={10} alignItems="stretch">
              {staffGroup && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                  <VStack gap={5} alignItems="stretch">
                    <SectionHeader
                      eyebrow="Personas institutionnels"
                      title={staffGroup.label}
                      description="Profils prêts à être utilisés dans le parcours pédagogique."
                      count={staffGroup.activeAgents.length + staffGroup.inactiveAgents.length}
                    />
                    <AgentGrid agents={[...staffGroup.activeAgents, ...staffGroup.inactiveAgents]} {...gridProps} />
                  </VStack>
                </motion.div>
              )}
              {(allStudentActive.length > 0 || allStudentInactive.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                  <VStack gap={5} alignItems="stretch">
                    <SectionHeader
                      eyebrow="Personas étudiants"
                      title="Créations des étudiants"
                      description="Personas créés par les étudiants, avec accès direct à leur historique d'entretiens."
                      count={allStudentActive.length + allStudentInactive.length}
                    />
                    <AgentGrid agents={[...allStudentActive, ...allStudentInactive]} {...gridProps} indexOffset={staffGroup?.activeAgents.length ?? 0} />
                  </VStack>
                </motion.div>
              )}
            </VStack>
          )}

          {/* ── Content: student view ── */}
          {filteredAgents.length > 0 && !user_admin && (
            <VStack gap={10} alignItems="stretch">
              {staffPublicActive.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                  <VStack gap={5} alignItems="stretch">
                    <SectionHeader
                      eyebrow="Personas publics"
                      title="Profils institutionnels"
                      description="Profils prêts à l'emploi pour démarrer rapidement une simulation d'entretien."
                      count={staffPublicActive.length}
                    />
                    <AgentGrid agents={staffPublicActive} {...gridProps} />
                  </VStack>
                </motion.div>
              )}
              {myAgents.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                  <VStack gap={5} alignItems="stretch">
                    <SectionHeader
                      eyebrow="Mes créations"
                      title="Mes personas"
                      description="Tes propres profils, leurs brouillons et ceux déjà réutilisés dans des entretiens."
                      count={myAgents.length}
                    />
                    <AgentGrid agents={[...myActiveAgents, ...myInactiveAgents]} {...gridProps} indexOffset={staffPublicActive.length} />
                  </VStack>
                </motion.div>
              )}
            </VStack>
          )}

        </VStack>
      </Container>
    </Box>
  );
}
