"use client";

import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { MessageSquarePlus, BookOpen } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { getPersonaVisual } from "@/lib/personaVisuals";
import { PersonaSilhouette } from "@/app/personnas/components/PersonaSilhouette";

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
  const title = persona.agent_name.charAt(0).toUpperCase() + persona.agent_name.slice(1);
  const ficheHref = persona.id.includes("-") ? `/personnas/${persona.id}` : "/personnas";
  const visual = getPersonaVisual(persona.agent_name);

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
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: "1", minWidth: 0, perspective: 800 }}
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
            {/* Difficulty badge */}
            <Box position="absolute" top={4} right={4}>
              <Badge
                colorPalette={DIFFICULTY_PALETTE[persona.difficulty]}
                variant="subtle"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="2xs"
                fontWeight="700"
              >
                {persona.difficulty}
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
                uid={persona.id}
                size={68}
              />
            </Box>

            {/* Name + role */}
            <VStack gap={0.5} alignItems="center">
              <Text fontWeight="800" fontSize="lg" letterSpacing="-0.03em" lineHeight="1.2" color="var(--color-text-primary)" textAlign="center">
                {title}
              </Text>
              <Text fontSize="xs" color="var(--color-text-muted)" textAlign="center">{persona.role}</Text>
            </VStack>
          </Box>

          {/* Greeting */}
          <Box px={5} pb={3} flex="1">
            <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.75" fontStyle="italic" lineClamp={3}>
              &ldquo;{persona.greeting}&rdquo;
            </Text>
          </Box>

          {/* Mini-échange */}
          <VStack alignItems="stretch" gap={2} px={5} pb={4}>
            <Text fontSize="2xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
              Extrait d&apos;entretien
            </Text>
            <Box
              backgroundColor="var(--color-surface-muted)"
              borderRadius="12px"
              px={3}
              py={2}
              alignSelf="flex-start"
              maxWidth="90%"
            >
              <Text fontSize="xs" lineHeight="1.6" color="var(--color-text-muted)">
                {persona.sampleQuestion}
              </Text>
            </Box>
            <Box
              background="var(--color-accent-soft)"
              borderRadius="12px"
              px={3}
              py={2}
              alignSelf="flex-end"
              maxWidth="90%"
              borderWidth="1px"
              borderColor="var(--color-accent-border)"
            >
              <Text fontSize="xs" lineHeight="1.6" color="var(--color-text-primary)">
                {persona.sampleAnswer}
              </Text>
            </Box>
          </VStack>

          {/* Badges */}
          <Box px={5} pb={4}>
            <HStack gap={1.5} flexWrap="wrap">
              <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={2} fontSize="2xs">
                {persona.posture}
              </Badge>
            </HStack>
          </Box>

          <Box mx={5} height="1px" background="var(--color-border)" />

          {/* Actions */}
          <Box px={5} py={4}>
            <VStack alignItems="stretch" gap={2}>
              <Button
                size="sm"
                borderRadius="xl"
                fontWeight="700"
                background="var(--color-accent)"
                color="white"
                _hover={{ background: "var(--color-accent-hover)" }}
                onClick={() => router.push(ficheHref)}
              >
                <MessageSquarePlus size={14} />
                Commencer un entretien
              </Button>
              <Button variant="subtle" size="xs" borderRadius="lg" onClick={() => router.push(ficheHref)}>
                <BookOpen size={12} />
                Voir la fiche
              </Button>
            </VStack>
          </Box>
        </Box>
      </motion.div>
    </motion.div>
  );
}
