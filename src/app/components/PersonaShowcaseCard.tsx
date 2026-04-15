"use client";

import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { Mic, MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";

export type ShowcasePersona = {
  id: string;
  agent_name: string;
  greeting: string;
  sampleQuestion: string;
  sampleAnswer: string;
  role: string;
  posture: string;
  difficulty: "Accessible" | "Intermédiaire" | "Exigeante";
  color: string;
  accent: string;
  avatarBg: string;
};

const DIFFICULTY_PALETTE: Record<ShowcasePersona["difficulty"], string> = {
  Accessible: "green",
  Intermédiaire: "orange",
  Exigeante: "red",
};

type Props = {
  persona: ShowcasePersona;
  index: number;
};

export function PersonaShowcaseCard({ persona, index }: Props) {
  const router = useRouter();
  const initial = persona.agent_name.charAt(0).toUpperCase();

  return (
    <Box
      className="persona-showcase-card"
      style={{ animationDelay: `${index * 120}ms` }}
      flex="1"
      minWidth="0"
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="border.subtle"
      backgroundColor="white"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      transition="transform 0.22s ease, box-shadow 0.22s ease"
      _hover={{
        transform: "translateY(-6px)",
        boxShadow: `0 20px 40px -12px ${persona.color}33`,
      }}
      boxShadow="sm"
    >
      {/* Header coloré */}
      <Box
        px={6}
        pt={6}
        pb={4}
        background={`linear-gradient(135deg, ${persona.color}18 0%, ${persona.accent}10 100%)`}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <HStack gap={4} alignItems="flex-start">
          {/* Avatar animé */}
          <Box
            className="persona-avatar"
            minWidth="56px"
            height="56px"
            borderRadius="full"
            backgroundColor={persona.avatarBg}
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={`0 0 0 0 ${persona.color}44`}
            style={{ animation: "avatarPulse 3s ease-in-out infinite" }}
          >
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="white"
              userSelect="none"
            >
              {initial}
            </Text>
          </Box>

          <VStack alignItems="flex-start" gap={1} flex={1} minWidth={0}>
            <HStack gap={2} flexWrap="wrap">
              <Text fontSize="xl" fontWeight="bold" lineHeight="1.1">
                {persona.agent_name.charAt(0).toUpperCase() + persona.agent_name.slice(1)}
              </Text>
              <Badge
                colorPalette={DIFFICULTY_PALETTE[persona.difficulty]}
                variant="subtle"
                borderRadius="full"
                fontSize="xs"
                px={2}
              >
                {persona.difficulty}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
              {persona.role}
            </Text>
            <Badge
              variant="outline"
              borderRadius="full"
              fontSize="xs"
              px={2}
              borderColor={persona.color}
              color={persona.color}
            >
              {persona.posture}
            </Badge>
          </VStack>
        </HStack>

        {/* Parole de la persona */}
        <Box
          mt={4}
          pl={4}
          borderLeft="3px solid"
          borderColor={persona.color}
        >
          <Text
            fontSize="sm"
            fontStyle="italic"
            color="fg.default"
            lineHeight="1.7"
          >
            &ldquo;{persona.greeting}&rdquo;
          </Text>
        </Box>
      </Box>

      {/* Mini-échange */}
      <VStack alignItems="stretch" gap={3} px={6} py={4} flex={1}>
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
          Extrait d&apos;entretien
        </Text>

        {/* Question de l'enquêteur */}
        <Box
          backgroundColor="bg.subtle"
          borderRadius="xl"
          px={3}
          py={2}
          alignSelf="flex-start"
          maxWidth="85%"
        >
          <Text fontSize="xs" color="fg.muted" mb={1} fontWeight="medium">
            Vous
          </Text>
          <Text fontSize="sm" lineHeight="1.6">
            {persona.sampleQuestion}
          </Text>
        </Box>

        {/* Réponse du persona */}
        <Box
          backgroundColor={`${persona.color}0F`}
          borderRadius="xl"
          px={3}
          py={2}
          alignSelf="flex-end"
          maxWidth="90%"
          borderWidth="1px"
          borderColor={`${persona.color}22`}
        >
          <Text fontSize="xs" color={persona.color} mb={1} fontWeight="medium">
            {persona.agent_name.charAt(0).toUpperCase() + persona.agent_name.slice(1)}
          </Text>
          <Text fontSize="sm" lineHeight="1.6" color="fg.default">
            {persona.sampleAnswer}
          </Text>
        </Box>
      </VStack>

      {/* Actions */}
      <HStack gap={2} px={6} pb={5} pt={2}>
        <Button
          flex={1}
          colorPalette="blue"
          borderRadius="xl"
          size="sm"
          onClick={() => router.push(`/personnas/${persona.id}`)}
          variant="subtle"
        >
          Voir la fiche
        </Button>
        <Button
          flex={1}
          colorPalette="blue"
          borderRadius="xl"
          size="sm"
          onClick={() => router.push(`/personnas/${persona.id}`)}
        >
          <MessageSquarePlus size={13} />
          Commencer
        </Button>
        <Button
          size="sm"
          variant="ghost"
          borderRadius="xl"
          title="Voix (bientôt disponible)"
          disabled
          opacity={0.4}
        >
          <Mic size={14} />
        </Button>
      </HStack>
    </Box>
  );
}
