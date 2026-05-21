"use client";

import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { BookOpen, History, MessageSquarePlus, Settings2, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { type Agent } from "@/lib/agents";
import { getPersonaVisual } from "@/lib/personaVisuals";
import { PersonaSilhouette } from "./PersonaSilhouette";

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
  const canEditPrompt = userAdmin || (!!currentUserId && agent.created_by === currentUserId);
  const visual = getPersonaVisual(agent.agent_name);
  const isReady = agent.active && agent.has_published_prompt !== false;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-60, 60], [6, -6]);
  const rotateY = useTransform(mouseX, [-60, 60], [-6, 6]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: "100%", perspective: 800 }}
    >
      <motion.div
        style={{ rotateX, rotateY, height: "100%", transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Box
          className="persona-card-shine"
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
          transition="box-shadow 0.2s ease"
          _hover={{ boxShadow: "var(--color-shadow-float)" }}
        >
          {/* Avatar section */}
          <Box
            position="relative"
            px={5}
            pt={6}
            pb={5}
            background={`linear-gradient(160deg, ${visual.bg} 0%, transparent 100%)`}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
          >
            {/* Status badge */}
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

            {/* Avatar */}
            <Box
              flexShrink={0}
              style={{ filter: `drop-shadow(0 8px 22px ${visual.accent}70)` }}
            >
              <PersonaSilhouette
                shapeIndex={visual.shapeIndex}
                color1={visual.color1}
                color2={visual.color2}
                uid={agent.id}
                size={68}
              />
            </Box>

            {/* Name */}
            <VStack gap={0.5} alignItems="center">
              <Text fontWeight="800" fontSize="lg" letterSpacing="-0.03em" lineHeight="1.2" color="var(--color-text-primary)" textAlign="center">
                {title}
              </Text>
              {agent.creator_name && !agent.is_public && (
                <Text fontSize="xs" color="fg.muted">{agent.creator_name}</Text>
              )}
            </VStack>
          </Box>

          {/* Description */}
          <Box px={5} pb={3} flex="1">
            <Text fontSize="sm" color="gray.600" lineHeight="1.75" lineClamp={3} whiteSpace="pre-line">
              {(agent.description || "Aucune description disponible.").replace(/\\n/g, "\n")}
            </Text>
          </Box>

          {/* Badges */}
          <Box px={5} pb={4}>
            <HStack gap={1.5} flexWrap="wrap">
              {agent.is_public && (
                <Badge colorPalette="teal" variant="subtle" borderRadius="full" px={2} fontSize="2xs">Public</Badge>
              )}
              {hasInteracted && (
                <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={2} fontSize="2xs">Déjà utilisé</Badge>
              )}
              {agent.has_published_prompt === false && (
                <Badge colorPalette="orange" variant="subtle" borderRadius="full" px={2} fontSize="2xs">Prompt à publier</Badge>
              )}
            </HStack>
          </Box>

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
                background={visual.gradient}
                color="white"
                _hover={{ opacity: 0.9 }}
              >
                <MessageSquarePlus size={14} />
                Commencer un entretien
              </Button>

              <HStack gap={1.5}>
                <Button variant="subtle" size="xs" borderRadius="lg" onClick={() => onNavigateFiche(agent.id)} flex="1">
                  <BookOpen size={12} />Fiche
                </Button>
                {hasInteracted && (
                  <Button variant="subtle" size="xs" borderRadius="lg" onClick={() => onNavigateHistory(agent.id)} flex="1">
                    <History size={12} />Historique
                  </Button>
                )}
                {canEditPrompt && (
                  <Button variant="subtle" size="xs" borderRadius="lg" onClick={() => onNavigatePrompt(agent.id)} flex="1">
                    <Settings2 size={12} />Prompt
                  </Button>
                )}
              </HStack>
              {userAdmin && (
                <Button
                  variant="subtle"
                  colorPalette={agent.active ? "red" : "green"}
                  size="xs"
                  borderRadius="lg"
                  width="100%"
                  onClick={() => onToggleAgent(agent)}
                  loading={togglingAgentId === agent.id}
                  disabled={togglingAgentId === agent.id}
                >
                  {agent.active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                  {agent.active ? "Désactiver" : "Activer"}
                </Button>
              )}
            </VStack>
          </Box>
        </Box>
      </motion.div>
    </motion.div>
  );
}
