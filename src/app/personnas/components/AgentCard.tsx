"use client";

import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { BookOpen, History, MessageSquarePlus, Settings2, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";
import { type Agent } from "@/lib/agents";

interface AgentCardProps {
  agent: Agent;
  isCreatingSession: boolean;
  togglingAgentId: string | null;
  hasInteracted: boolean;
  userAdmin: boolean;
  currentUserId?: string | null;
  onSelectAgent: (agentId: string) => void;
  onToggleAgent: (agent: Agent) => void;
  onNavigateHistory: (agentId: string) => void;
  onNavigateFiche: (agentId: string) => void;
  onNavigatePrompt: (agentId: string) => void;
  index?: number;
}

const PALETTE = [
  { from: "#6366f1", to: "#8b5cf6", bg: "rgba(99,102,241,0.10)", text: "#6366f1" },
  { from: "#0ea5e9", to: "#6366f1", bg: "rgba(14,165,233,0.10)", text: "#0ea5e9" },
  { from: "#8b5cf6", to: "#ec4899", bg: "rgba(139,92,246,0.10)", text: "#8b5cf6" },
  { from: "#10b981", to: "#0ea5e9", bg: "rgba(16,185,129,0.10)", text: "#10b981" },
  { from: "#f59e0b", to: "#ef4444", bg: "rgba(245,158,11,0.10)", text: "#f59e0b" },
  { from: "#ec4899", to: "#8b5cf6", bg: "rgba(236,72,153,0.10)", text: "#ec4899" },
];

function getPalette(name: string) {
  return PALETTE[name.charCodeAt(0) % PALETTE.length];
}

export function AgentCard({
  agent,
  isCreatingSession,
  togglingAgentId,
  hasInteracted,
  userAdmin,
  currentUserId,
  onSelectAgent,
  onToggleAgent,
  onNavigateHistory,
  onNavigateFiche,
  onNavigatePrompt,
  index = 0,
}: AgentCardProps) {
  const title = agent.agent_name.charAt(0).toUpperCase() + agent.agent_name.slice(1);
  const initial = title.charAt(0).toUpperCase();
  const canEditPrompt = userAdmin || (!!currentUserId && agent.created_by === currentUserId);
  const palette = getPalette(agent.agent_name);
  const isReady = agent.active && agent.has_published_prompt !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: "100%" }}
    >
      <Box
        className="persona-card-tilt persona-card-shine"
        borderRadius="24px"
        borderWidth="1px"
        borderColor="var(--color-border)"
        background="var(--color-surface)"
        boxShadow="var(--color-shadow-card)"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        height="100%"
        position="relative"
        opacity={agent.active ? 1 : 0.6}
      >
        {/* Avatar section */}
        <Box
          position="relative"
          px={5}
          pt={6}
          pb={5}
          background={`linear-gradient(160deg, ${palette.bg} 0%, transparent 100%)`}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={3}
        >
          {/* Status badge top-right */}
          <Box position="absolute" top={4} right={4}>
            <Badge
              colorPalette={isReady ? "green" : agent.active ? "orange" : "gray"}
              variant="subtle"
              borderRadius="full"
              px={2}
              py={0.5}
              fontSize="2xs"
              fontWeight="700"
            >
              {isReady ? "Prêt" : agent.active ? "En cours" : "Inactif"}
            </Badge>
          </Box>

          {/* Big avatar */}
          <Box
            width="72px"
            height="72px"
            borderRadius="24px"
            background={`linear-gradient(135deg, ${palette.from}, ${palette.to})`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={`0 8px 24px ${palette.from}40`}
            flexShrink={0}
          >
            <Text fontSize="3xl" fontWeight="800" color="white" lineHeight="1">
              {initial}
            </Text>
          </Box>

          {/* Name */}
          <VStack gap={0.5} alignItems="center">
            <Text
              fontWeight="800"
              fontSize="lg"
              letterSpacing="-0.03em"
              lineHeight="1.2"
              color="gray.900"
              textAlign="center"
            >
              {title}
            </Text>
            {agent.creator_name && (
              <Text fontSize="xs" color="fg.muted">
                {agent.creator_name}
              </Text>
            )}
          </VStack>
        </Box>

        {/* Description */}
        <Box px={5} pb={3} flex="1">
          <Text
            fontSize="sm"
            color="gray.600"
            lineHeight="1.75"
            lineClamp={3}
            whiteSpace="pre-line"
          >
            {(agent.description || "Aucune description disponible.").replace(/\\n/g, "\n")}
          </Text>
        </Box>

        {/* Meta badges */}
        <Box px={5} pb={4}>
          <HStack gap={1.5} flexWrap="wrap">
            {agent.is_public && (
              <Badge colorPalette="teal" variant="subtle" borderRadius="full" px={2} fontSize="2xs">
                Public
              </Badge>
            )}
            {hasInteracted && (
              <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={2} fontSize="2xs">
                Déjà utilisé
              </Badge>
            )}
            {agent.has_published_prompt === false && (
              <Badge colorPalette="orange" variant="subtle" borderRadius="full" px={2} fontSize="2xs">
                Prompt à publier
              </Badge>
            )}
          </HStack>
        </Box>

        {/* Divider */}
        <Box mx={5} height="1px" background="var(--color-border)" />

        {/* Actions */}
        <Box px={5} py={4}>
          <VStack alignItems="stretch" gap={2}>
            <Button
              onClick={() => onSelectAgent(agent.id)}
              size="sm"
              borderRadius="xl"
              fontWeight="700"
              disabled={isCreatingSession || !isReady}
              loading={isCreatingSession}
              background={`linear-gradient(135deg, ${palette.from}, ${palette.to})`}
              color="white"
              _hover={{ opacity: 0.9 }}
            >
              <MessageSquarePlus size={14} />
              Commencer un entretien
            </Button>

            <HStack gap={1.5} flexWrap="wrap">
              <Button variant="subtle" size="xs" borderRadius="lg" onClick={() => onNavigateFiche(agent.id)} flex="1">
                <BookOpen size={12} />
                Fiche
              </Button>
              {hasInteracted && (
                <Button variant="subtle" size="xs" borderRadius="lg" onClick={() => onNavigateHistory(agent.id)} flex="1">
                  <History size={12} />
                  Historique
                </Button>
              )}
              {canEditPrompt && (
                <Button variant="subtle" size="xs" borderRadius="lg" onClick={() => onNavigatePrompt(agent.id)} flex="1">
                  <Settings2 size={12} />
                  Prompt
                </Button>
              )}
              {userAdmin && (
                <Button
                  variant="subtle"
                  colorPalette={agent.active ? "red" : "green"}
                  size="xs"
                  borderRadius="lg"
                  onClick={() => onToggleAgent(agent)}
                  loading={togglingAgentId === agent.id}
                  disabled={togglingAgentId === agent.id}
                >
                  {agent.active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                  {agent.active ? "Désactiver" : "Activer"}
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>
      </Box>
    </motion.div>
  );
}
