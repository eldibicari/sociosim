"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { Check, RefreshCcw } from "lucide-react";
import { VoicePlayer } from "@/components/VoicePlayer";
import type {
  PersonaVoiceAttributes,
  RecommendResponseBody,
  VoiceCandidate,
} from "@/lib/voice/types";

export interface SelectedVoice {
  voiceId: string;
  name: string;
  description?: string;
  language?: string;
  gender?: string;
  age?: string;
  accent?: string;
  useCase?: string;
}

interface VoiceAuditionProps {
  /** Attributes used to recommend candidates. */
  attributes: PersonaVoiceAttributes;
  /** Text that each candidate will speak when ▶️ is pressed (and on selection). */
  auditionText: string;
  /** Currently selected voiceId — used to highlight the chosen card. */
  selectedVoiceId?: string;
  /** Called when the user clicks "Choisir cette voix". */
  onSelect: (voice: SelectedVoice) => void;
  /** Allow toggling between top-N and "see more". */
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 5;

export function VoiceAudition({
  attributes,
  auditionText,
  selectedVoiceId,
  onSelect,
  pageSize = DEFAULT_PAGE_SIZE,
}: VoiceAuditionProps) {
  const [candidates, setCandidates] = useState<VoiceCandidate[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalMatching, setTotalMatching] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(
    async (nextOffset: number, append: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/voice/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attributes,
            limit: pageSize,
            offset: nextOffset,
          }),
        });
        if (!response.ok) {
          const detail = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            detail?.error ?? `Échec du chargement (${response.status})`
          );
        }
        const data = (await response.json()) as RecommendResponseBody;
        setCandidates((prev) =>
          append ? [...prev, ...data.candidates] : data.candidates
        );
        setOffset(nextOffset);
        setHasMore(data.hasMore);
        setTotalMatching(data.totalMatching);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erreur inattendue";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [attributes, pageSize]
  );

  useEffect(() => {
    loadCandidates(0, false);
  }, [loadCandidates]);

  const handleShowMore = () => {
    loadCandidates(offset + pageSize, true);
  };

  if (error) {
    return (
      <VStack alignItems="stretch" gap={3} p={4} borderRadius="xl" backgroundColor="red.50" borderWidth="1px" borderColor="red.200">
        <Text fontSize="sm" color="red.700">Impossible de charger les voix : {error}</Text>
        <Button size="sm" variant="outline" onClick={() => loadCandidates(0, false)}>
          <RefreshCcw size={14} /> Réessayer
        </Button>
      </VStack>
    );
  }

  if (isLoading && candidates.length === 0) {
    return (
      <HStack gap={3} p={4} alignItems="center">
        <Spinner size="sm" />
        <Text fontSize="sm" color="var(--color-text-muted)">
          Recherche des voix correspondantes…
        </Text>
      </HStack>
    );
  }

  if (candidates.length === 0) {
    return (
      <Text fontSize="sm" color="var(--color-text-muted)" p={4}>
        Aucune voix candidate trouvée. Vérifiez la clé ElevenLabs côté serveur.
      </Text>
    );
  }

  return (
    <VStack alignItems="stretch" gap={3}>
      <HStack gap={2} alignItems="center" flexWrap="wrap">
        <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color="var(--color-text-muted)">
          {totalMatching > 0
            ? `${totalMatching} voix correspondent`
            : "Voix proposées"}
        </Text>
        <Text fontSize="xs" color="var(--color-text-muted)">
          (cliquez sur ▶️ pour écouter la voix dire la phrase de votre persona)
        </Text>
      </HStack>

      {candidates.map((c) => {
        const isSelected = selectedVoiceId === c.voiceId;
        return (
          <Box
            key={c.voiceId}
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={isSelected ? "var(--color-accent)" : "var(--color-border)"}
            backgroundColor={isSelected ? "var(--color-accent-soft)" : "var(--color-surface)"}
            transition="all 0.15s ease"
          >
            <VStack alignItems="stretch" gap={2.5}>
              <HStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <VStack alignItems="flex-start" gap={0.5}>
                  <HStack gap={2} alignItems="center">
                    <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">
                      {c.name}
                    </Text>
                    {isSelected ? (
                      <Badge colorPalette="purple" variant="solid" borderRadius="full" px={2} fontSize="2xs">
                        Sélectionnée
                      </Badge>
                    ) : null}
                  </HStack>
                  {c.description ? (
                    <Text fontSize="xs" color="var(--color-text-muted)" lineClamp={2}>
                      {c.description}
                    </Text>
                  ) : null}
                </VStack>
                <HStack gap={1.5} alignItems="center">
                  {c.previewUrl ? (
                    // Use the static preview URL from ElevenLabs CDN — instant
                    // playback, no TTS call required.
                    <VoicePlayer
                      mode="preview"
                      audioUrl={c.previewUrl}
                      size="sm"
                      variant="subtle"
                      ariaLabel={`Écouter la voix de ${c.name}`}
                    />
                  ) : (
                    // Fallback: generate on-demand if no preview URL available.
                    <VoicePlayer
                      mode="tts"
                      voiceId={c.voiceId}
                      text={auditionText}
                      size="sm"
                      variant="subtle"
                      ariaLabel={`Écouter la voix de ${c.name}`}
                    />
                  )}
                </HStack>
              </HStack>

              {c.matchReasons.length > 0 ? (
                <HStack gap={1.5} flexWrap="wrap">
                  {c.matchReasons.map((reason) => (
                    <Badge
                      key={reason}
                      colorPalette="purple"
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="2xs"
                    >
                      {reason}
                    </Badge>
                  ))}
                </HStack>
              ) : null}

              <Button
                size="sm"
                variant={isSelected ? "solid" : "outline"}
                borderRadius="lg"
                colorPalette="purple"
                onClick={() =>
                  onSelect({
                    voiceId: c.voiceId,
                    name: c.name,
                    description: c.description,
                    language: c.language,
                    gender: c.gender,
                    age: c.age,
                    accent: c.accent,
                    useCase: c.useCase,
                  })
                }
              >
                {isSelected ? (
                  <>
                    <Check size={14} /> Voix retenue
                  </>
                ) : (
                  "Choisir cette voix"
                )}
              </Button>
            </VStack>
          </Box>
        );
      })}

      {hasMore ? (
        <Button
          variant="ghost"
          size="sm"
          borderRadius="lg"
          alignSelf="center"
          onClick={handleShowMore}
          loading={isLoading}
        >
          <RefreshCcw size={14} /> Voir {pageSize} autres voix
        </Button>
      ) : null}
    </VStack>
  );
}
