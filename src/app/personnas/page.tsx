"use client";

import {
  Box,
  Button,
  Container,
  Field,
  Grid,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { useAuthUser } from "@/hooks/useAuthUser";
import { isAdminLike } from "@/lib/agentPolicy";
import { type Agent } from "@/lib/agents";
import { AgentCard } from "./components/AgentCard";
import { groupAgentsByCreator } from "./groupAgents";

interface InterviewWithDetails {
  agent_id?: string;
  message_count?: number;
  agents?: {
    agent_name?: string;
  };
  messages?: Array<{
    content: string;
  }>;
}

const GRID_COLUMNS = { base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" };

type PersonnaFilter = "all" | "active" | "history" | "mine";

function matchesSearch(agent: Agent, search: string) {
  if (!search.trim()) return true;

  const haystack = [
    agent.agent_name,
    agent.description ?? "",
    agent.creator_name ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.trim().toLowerCase());
}

function AgentGrid({
  agents,
  isCreatingSession,
  togglingAgentId,
  interactedAgents,
  userAdmin,
  onSelectAgent,
  onToggleAgent,
  onNavigateHistory,
  onNavigatePrompt,
}: {
  agents: Agent[];
  isCreatingSession: boolean;
  togglingAgentId: string | null;
  interactedAgents: string[];
  userAdmin: boolean;
  onSelectAgent: (agentId: string) => void;
  onToggleAgent: (agent: Agent) => void;
  onNavigateHistory: (agentId: string) => void;
  onNavigatePrompt: (agentId: string) => void;
}) {
  if (agents.length === 0) return null;

  return (
    <Grid gridTemplateColumns={GRID_COLUMNS} gap={6}>
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          isCreatingSession={isCreatingSession}
          togglingAgentId={togglingAgentId}
          hasInteracted={interactedAgents.includes(agent.id)}
          userAdmin={userAdmin}
          onSelectAgent={onSelectAgent}
          onToggleAgent={onToggleAgent}
          onNavigateHistory={onNavigateHistory}
          onNavigatePrompt={onNavigatePrompt}
        />
      ))}
    </Grid>
  );
}

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <VStack alignItems="flex-start" gap={1}>
      <Heading size="md">{title}</Heading>
      {description ? (
        <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
          {description}
        </Text>
      ) : null}
    </VStack>
  );
}

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
    if (isAuthLoading) return;
    if (!user) {
      setIsLoading(false);
      router.push("/login");
      return;
    }

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
            console.error("Error fetching agents:", message);
            if (response.status === 401) {
              await refreshUser();
            }
            setError(message);
          } else {
            const data = await response.json();
            const uniqueAgents = new Map<string, Agent>();
            (data.agents || []).forEach((agent: Agent) => {
              uniqueAgents.set(agent.id, agent as Agent);
            });
            setAgents(Array.from(uniqueAgents.values()));
          }
        } else {
          console.error("Error fetching agents:", agentsResult.reason);
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
          } else {
            console.error("Error fetching interviews for history:", response.statusText);
            if (response.status === 401) {
              await refreshUser();
            }
          }
        } else {
          console.error("Error fetching interviews for history:", interviewsResult.reason);
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

      if (!user?.id) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          agent_id: agentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Impossible de créer une nouvelle session";
        setError(message);
        console.error("Error creating session:", message);
        return;
      }

      const data = await response.json();

      router.push(
        `/interview?interviewId=${data.interviewId}&sessionId=${data.sessionId}&adkSessionId=${data.adkSessionId}`
      );
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
        const message = data.error || "Impossible de mettre à jour le personna";
        console.error("Error updating agent status:", message);
        setError(message);
        return;
      }

      setAgents((prev) =>
        prev.map((item) => (item.id === agent.id ? { ...item, active: nextActive } : item))
      );
      toaster.create({
        type: "success",
        description: nextActive ? "L'agent est activé" : "L'agent est désactivé",
        duration: 6000,
        closable: true,
      });
    } catch (err) {
      console.error("Error updating agent status:", err);
      setError("Une erreur est survenue lors de la mise à jour du personna");
    } finally {
      setTogglingAgentId(null);
    }
  };

  const handleNavigateHistory = (agentId: string) => {
    router.push(`/interviews?agent=${encodeURIComponent(agentId)}`);
  };

  const handleNavigatePrompt = (agentId: string) => {
    router.push(`/personnas/${agentId}/edit`);
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (!matchesSearch(agent, deferredSearch)) {
        return false;
      }

      switch (activeFilter) {
        case "active":
          return agent.active;
        case "history":
          return interactedAgents.includes(agent.id);
        case "mine":
          return agent.created_by === user?.id;
        default:
          return true;
      }
    });
  }, [activeFilter, agents, deferredSearch, interactedAgents, user?.id]);

  const groups = useMemo(() => groupAgentsByCreator(filteredAgents), [filteredAgents]);
  const staffGroup = useMemo(() => groups.find((g) => g.isStaff), [groups]);
  const studentGroups = useMemo(() => groups.filter((g) => !g.isStaff), [groups]);
  const allStudentActive = useMemo(
    () => studentGroups.flatMap((g) => g.activeAgents),
    [studentGroups]
  );
  const allStudentInactive = useMemo(
    () => studentGroups.flatMap((g) => g.inactiveAgents),
    [studentGroups]
  );

  const staffPublicActive = useMemo(
    () => filteredAgents.filter((a) => isAdminLike(a.creator_role) && a.active && a.is_public),
    [filteredAgents]
  );
  const myAgents = useMemo(
    () => (user ? filteredAgents.filter((a) => a.created_by === user.id) : []),
    [filteredAgents, user]
  );
  const myActiveAgents = useMemo(() => myAgents.filter((a) => a.active), [myAgents]);
  const myInactiveAgents = useMemo(() => myAgents.filter((a) => !a.active), [myAgents]);
  const ownsAnyAgent = useMemo(
    () => Boolean(user && agents.some((agent) => agent.created_by === user.id)),
    [agents, user]
  );
  const visibleAgentsCount = filteredAgents.length;

  const filterOptions = useMemo(() => {
    const baseOptions: Array<{ key: PersonnaFilter; label: string }> = [
      { key: "all", label: "Tous" },
      { key: "active", label: "Actifs" },
      { key: "history", label: "Avec historique" },
    ];

    if (ownsAnyAgent) {
      baseOptions.push({ key: "mine", label: "Mes personnas" });
    }

    return baseOptions;
  }, [ownsAnyAgent]);

  const gridProps = {
    isCreatingSession,
    togglingAgentId,
    interactedAgents,
    userAdmin: user_admin,
    onSelectAgent: handleSelectAgent,
    onToggleAgent: handleToggleAgent,
    onNavigateHistory: handleNavigateHistory,
    onNavigatePrompt: handleNavigatePrompt,
  };

  if (isLoading) {
    return (
      <Container maxWidth="4xl" height="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement des personnas...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxWidth="7xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
      <VStack gap={8} alignItems="stretch">
        <HStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={4}>
          <VStack alignItems="flex-start" gap={3} maxWidth="4xl">
            <Text
              fontSize="sm"
              textTransform="uppercase"
              letterSpacing="0.18em"
              color="orange.500"
              fontWeight="semibold"
            >
              Espace personnas
            </Text>
            <Heading size="2xl" lineHeight="1.05">
              Choisir un persona, retrouver son historique et préparer un entretien utile
            </Heading>
            <Text color="fg.muted" fontSize="lg" lineHeight="1.7" maxWidth="3xl">
              Chaque persona doit devenir un vrai point d&apos;entrée de travail : on repère son
              profil, on retrouve les essais déjà menés avec lui, puis on relance un entretien
              dans un cadre pédagogique clair.
            </Text>
          </VStack>
          <Button
            variant="solid"
            colorPalette="blue"
            size="md"
            onClick={() => router.push("/personnas/new")}
            paddingInline={6}
            borderRadius="full"
          >
            Créer une nouvelle personna
          </Button>
        </HStack>

        <Box
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="3xl"
          backgroundColor="white"
          px={{ base: 4, md: 6 }}
          py={{ base: 4, md: 5 }}
          boxShadow="sm"
        >
          <VStack alignItems="stretch" gap={4}>
            <Field.Root>
              <Field.Label fontSize="sm" color="fg.muted">
                Rechercher un persona
              </Field.Label>
              <Box position="relative">
                <Box
                  position="absolute"
                  left={4}
                  top="50%"
                  transform="translateY(-50%)"
                  color="fg.subtle"
                  pointerEvents="none"
                >
                  <Search size={16} />
                </Box>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un personna (nom, description, auteur)"
                  paddingInlineStart={10}
                  size="lg"
                  borderRadius="xl"
                />
              </Box>
            </Field.Root>

            <Wrap gap={3}>
              {filterOptions.map((option) => (
                <WrapItem key={option.key}>
                  <Button
                    size="sm"
                    borderRadius="full"
                    variant={activeFilter === option.key ? "solid" : "subtle"}
                    colorPalette={activeFilter === option.key ? "blue" : "gray"}
                    onClick={() => setActiveFilter(option.key)}
                  >
                    {option.label}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>

            <Text color="fg.muted" fontSize="sm">
              {visibleAgentsCount} résultat{visibleAgentsCount > 1 ? "s" : ""} visible
              {visibleAgentsCount > 1 ? "s" : ""} sur {agents.length}
            </Text>
          </VStack>
        </Box>

        {error ? (
          <Box
            backgroundColor={{ base: "red.50", _dark: "red.900" }}
            borderRadius="md"
            padding={4}
            borderLeft="4px solid"
            borderLeftColor="red.500"
          >
            <Text color={{ base: "red.700", _dark: "red.200" }}>{error}</Text>
          </Box>
        ) : null}

        {agents.length === 0 && !error ? (
          <VStack
            gap={4}
            alignItems="center"
            paddingY={12}
            borderRadius="md"
            backgroundColor="bg.subtle"
          >
            <Text color="fg.muted" fontSize="lg">
              Aucun personna disponible
            </Text>
            <Text color="fg.subtle" fontSize="sm">
              Revenez plus tard pour démarrer une simulation.
            </Text>
          </VStack>
        ) : null}

        {agents.length > 0 && visibleAgentsCount === 0 && !error ? (
          <VStack
            gap={4}
            alignItems="center"
            paddingY={12}
            borderRadius="2xl"
            backgroundColor="bg.subtle"
          >
            <Text color="fg.muted" fontSize="lg">
              Aucun personna ne correspond à ta recherche
            </Text>
            <Text color="fg.subtle" fontSize="sm">
              Essaie un autre mot-clé ou change le filtre actif.
            </Text>
          </VStack>
        ) : null}

        {visibleAgentsCount > 0 && user_admin ? (
          <VStack gap={8} alignItems="stretch">
            {staffGroup ? (
              <VStack gap={4} alignItems="stretch">
                <SectionIntro
                  title={staffGroup.label}
                  description="Personnas institutionnels prêts à être utilisés dans le parcours pédagogique."
                />
                <AgentGrid agents={staffGroup.activeAgents} {...gridProps} />
                {staffGroup.inactiveAgents.length > 0 ? (
                  <AgentGrid agents={staffGroup.inactiveAgents} {...gridProps} />
                ) : null}
              </VStack>
            ) : null}

            {allStudentActive.length > 0 || allStudentInactive.length > 0 ? (
              <VStack gap={4} alignItems="stretch">
                <SectionIntro
                  title="Personnas des étudiants"
                  description="Suivre les personnas créés et utilisés par les étudiants, avec accès direct à l'historique lorsqu'un travail existe déjà."
                />
                <AgentGrid agents={allStudentActive} {...gridProps} />
                {allStudentInactive.length > 0 ? (
                  <AgentGrid agents={allStudentInactive} {...gridProps} />
                ) : null}
              </VStack>
            ) : null}
          </VStack>
        ) : null}

        {visibleAgentsCount > 0 && !user_admin ? (
          <VStack gap={8} alignItems="stretch">
            {staffPublicActive.length > 0 ? (
              <VStack gap={4} alignItems="stretch">
                <SectionIntro
                  title="Personnas publics"
                  description="Quelques profils prêts à l'emploi pour démarrer rapidement un entretien."
                />
                <AgentGrid agents={staffPublicActive} {...gridProps} />
              </VStack>
            ) : null}

            {myAgents.length > 0 ? (
              <VStack gap={4} alignItems="stretch">
                <SectionIntro
                  title="Mes personnages"
                  description="Tes propres personnas, leurs brouillons et ceux déjà réutilisés dans des entretiens."
                />
                <AgentGrid agents={myActiveAgents} {...gridProps} />
                {myInactiveAgents.length > 0 ? (
                  <AgentGrid agents={myInactiveAgents} {...gridProps} />
                ) : null}
              </VStack>
            ) : null}
          </VStack>
        ) : null}
      </VStack>
    </Container>
  );
}
