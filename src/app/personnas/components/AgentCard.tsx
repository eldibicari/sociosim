"use client";

import {
  Badge,
  Button,
  Text,
  VStack,
  HStack,
  Card,
  Box,
} from "@chakra-ui/react";
import { type Agent } from "@/lib/agents";

interface AgentCardProps {
  agent: Agent;
  isCreatingSession: boolean;
  togglingAgentId: string | null;
  hasInteracted: boolean;
  userAdmin: boolean;
  onSelectAgent: (agentId: string) => void;
  onToggleAgent: (agent: Agent) => void;
  onNavigateHistory: (agentId: string) => void;
  onNavigateFiche: (agentId: string) => void;
  onNavigatePrompt: (agentId: string) => void;
}

export function AgentCard({
  agent,
  isCreatingSession,
  togglingAgentId,
  hasInteracted,
  userAdmin,
  onSelectAgent,
  onToggleAgent,
  onNavigateHistory,
  onNavigateFiche,
  onNavigatePrompt,
}: AgentCardProps) {
  const title =
    agent.agent_name.charAt(0).toUpperCase() + agent.agent_name.slice(1);

  return (
    <Card.Root
      backgroundColor={agent.active ? "white" : "bg.muted"}
      borderWidth="1px"
      borderColor={agent.active ? "border.subtle" : "border.muted"}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow={agent.active ? "sm" : "none"}
    >
      <Card.Body
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        gap={4}
        py={5}
        px={5}
      >
        <VStack gap={3} alignItems="flex-start">
          <VStack gap={2} alignItems="flex-start" width="100%">
            <HStack width="100%" justifyContent="space-between" alignItems="flex-start" gap={3}>
              <VStack gap={1} alignItems="flex-start">
                <Text
                  fontWeight="semibold"
                  fontSize="2xl"
                  lineHeight="1"
                  color={agent.active ? "blue.800" : "fg.subtle"}
                >
                  {title}
                </Text>
                {agent.creator_name && (
                  <Text fontSize="sm" color="fg.subtle">
                    {agent.creator_name}
                  </Text>
                )}
              </VStack>
              <Badge
                colorPalette={agent.active ? "green" : "gray"}
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
              >
                {agent.active ? "Pret pour entretien" : "Inactif"}
              </Badge>
            </HStack>

            <Text
              fontSize="lg"
              color="fg.default"
              textAlign="left"
              lineHeight="1.45"
              whiteSpace="pre-line"
              minHeight="5.5rem"
            >
              {(agent.description || "").replace(/\\n/g, "\n")}
            </Text>
          </VStack>

          <HStack gap={2} flexWrap="wrap">
            {agent.active ? (
              <Badge colorPalette="green" variant="subtle" borderRadius="full" px={3}>
                Actif
              </Badge>
            ) : (
              <Badge colorPalette="gray" variant="subtle" borderRadius="full" px={3}>
                Inactif
              </Badge>
            )}
            <Badge
              colorPalette={agent.has_published_prompt === false ? "orange" : "blue"}
              variant="subtle"
              borderRadius="full"
              px={3}
            >
              {agent.has_published_prompt === false ? "Prompt a publier" : "Prompt publie"}
            </Badge>
            {hasInteracted && (
              <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={3}>
                Deja utilise
              </Badge>
            )}
            {agent.is_public && (
              <Badge colorPalette="teal" variant="subtle" borderRadius="full" px={3}>
                Public
              </Badge>
            )}
          </HStack>
        </VStack>

        <Box borderTopWidth="1px" borderTopColor="border.subtle" />

        <VStack gap={3} alignItems="stretch">
          <Button
            onClick={() => onSelectAgent(agent.id)}
            colorPalette="blue"
            variant="solid"
            size="sm"
            disabled={isCreatingSession || !agent.active || agent.has_published_prompt === false}
            loading={isCreatingSession}
          >
            Commencer un entretien
          </Button>

          <HStack gap={2} flexWrap="wrap" justifyContent="flex-start">
            <Button
              variant="subtle"
              size="xs"
              paddingInline={3}
              onClick={() => onNavigateFiche(agent.id)}
            >
              Voir la fiche
            </Button>
            {hasInteracted && (
              <Button
                onClick={() => onNavigateHistory(agent.id)}
                variant="subtle"
                size="xs"
                paddingInline={3}
              >
                Historique
              </Button>
            )}
            <Button
              variant="subtle"
              size="xs"
              paddingInline={3}
              onClick={() => onNavigatePrompt(agent.id)}
            >
              Modifier prompt
            </Button>
            {userAdmin && (
              <Button
                variant={agent.active ? "outline" : "subtle"}
                colorPalette={agent.active ? "red" : "green"}
                size="xs"
                paddingInline={3}
                onClick={() => onToggleAgent(agent)}
                loading={togglingAgentId === agent.id}
                disabled={togglingAgentId === agent.id}
              >
                {agent.active ? "Desactiver" : "Activer"}
              </Button>
            )}
          </HStack>

          {agent.active && agent.has_published_prompt === false && (
            <Text fontSize="xs" color="fg.muted">
              Ce personna ne peut pas encore etre utilise tant que son prompt n&apos;est pas publie.
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
