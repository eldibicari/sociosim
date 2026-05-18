"use client";

import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import type { InterviewAnalysis } from "@/lib/schemas";

type InterviewAnalysisContentProps = {
  analysis: InterviewAnalysis;
  mode?: "panel" | "page";
  analysisHref?: string | null;
};

function getQualityLabel(materialQuality: InterviewAnalysis["material_quality"]) {
  if (materialQuality === "exploitable") return "Exploitable";
  if (materialQuality === "partiel") return "Partiel";
  return "Insuffisant";
}

function getQualityPalette(materialQuality: InterviewAnalysis["material_quality"]) {
  if (materialQuality === "exploitable") return "green";
  if (materialQuality === "partiel") return "orange";
  return "red";
}

function getScorePalette(materialQuality: InterviewAnalysis["material_quality"]) {
  if (materialQuality === "exploitable") return "green";
  if (materialQuality === "partiel") return "orange";
  return "blue";
}

export function InterviewAnalysisContent({
  analysis,
  mode = "panel",
  analysisHref,
}: InterviewAnalysisContentProps) {
  const qualityLabel = getQualityLabel(analysis.material_quality);
  const qualityPalette = getQualityPalette(analysis.material_quality);
  const scorePalette = getScorePalette(analysis.material_quality);

  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <HStack gap={3} flexWrap="wrap" justify="space-between" align="start">
          <HStack gap={3} flexWrap="wrap">
            <Badge colorPalette={qualityPalette} variant="solid" px={3} py={1} borderRadius="full">
              {qualityLabel}
            </Badge>
            <Badge colorPalette={scorePalette} variant="subtle" px={3} py={1} borderRadius="full">
              Score {analysis.score_breakdown.total_score}/{analysis.score_breakdown.max_score}
            </Badge>
          </HStack>
          {mode === "panel" && analysisHref ? (
            <Button size="sm" variant="ghost" colorPalette="blue" asChild>
              <a href={analysisHref}>
                Voir l&apos;analyse complete
                <ArrowRight size={14} />
              </a>
            </Button>
          ) : null}
        </HStack>
        <Text fontWeight="700" fontSize={mode === "page" ? "xl" : "lg"}>
          {analysis.feedback_title}
        </Text>
        <Text color="fg.default" fontWeight="500">
          {analysis.summary_line}
        </Text>
        <Text color="fg.muted">{analysis.feedback_text}</Text>
      </Stack>

      <Stack gap={2}>
        <Text fontWeight="600">Indicateurs cles</Text>
        <HStack gap={3} flexWrap="wrap" align="stretch">
          {[
            ["Messages etudiant", analysis.metrics.student_messages],
            ["Mots produits", analysis.metrics.student_words],
            ["Reponses longues", analysis.metrics.long_answers],
            ["Exemples concrets", analysis.metrics.concrete_examples],
            ["Questions ouvertes", `${analysis.metrics.open_question_ratio_percent}%`],
            ["Tokens totaux", analysis.metrics.total_tokens],
          ].map(([label, value]) => (
            <Box
              key={label}
              flex="1"
              minWidth={{ base: "calc(50% - 0.5rem)", md: "150px" }}
              padding={3}
              borderRadius="xl"
              backgroundColor="bg.surface"
              borderWidth="1px"
              borderColor="border.muted"
            >
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em">
                {label}
              </Text>
              <Text fontSize="lg" fontWeight="700">
                {value}
              </Text>
            </Box>
          ))}
        </HStack>
      </Stack>

      <Stack gap={3} direction={{ base: "column", md: "row" }} align="stretch">
        {(
          [
            ["Ce qui est deja bien", analysis.strengths],
            ["Ce qui manque encore", analysis.limits],
            ["Comment ameliorer", analysis.next_steps],
          ] as [string, string[]][]
        ).map(([title, items]) => (
          <Box
            key={title}
            flex={1}
            minWidth={0}
            padding={4}
            borderRadius="xl"
            backgroundColor="bg.surface"
            borderWidth="1px"
            borderColor="border.muted"
          >
            <Stack gap={2}>
              <Text fontWeight="600">{title}</Text>
              {(items as string[]).map((item) => (
                <Text key={item} fontSize="sm" color="fg.muted">
                  - {item}
                </Text>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      <Box
        padding={4}
        borderRadius="xl"
        backgroundColor={{ base: "blue.50", _dark: "bg.surface" }}
        borderWidth="1px"
        borderColor={{ base: "blue.100", _dark: "border.muted" }}
      >
        <Stack gap={2}>
          <Text fontWeight="600">Prochain geste utile</Text>
          <Text color="fg.muted">{analysis.coaching_tip}</Text>
        </Stack>
      </Box>

      {analysis.interview_conduct ? (
        <Box padding={4} borderRadius="xl" backgroundColor="bg.surface" borderWidth="1px" borderColor="border.muted">
          <Stack gap={3}>
            <Text fontWeight="600">Lecture de la conduite d&apos;entretien</Text>
            <HStack gap={3} flexWrap="wrap">
              <Badge variant="subtle" colorPalette="blue" borderRadius="full" px={3} py={1}>
                Questions : {analysis.interview_conduct.question_style}
              </Badge>
              <Badge variant="subtle" colorPalette="purple" borderRadius="full" px={3} py={1}>
                Relances : {analysis.interview_conduct.follow_up_quality}
              </Badge>
              {analysis.interview_conduct.noise_detected ? (
                <Badge variant="subtle" colorPalette="red" borderRadius="full" px={3} py={1}>
                  Bruit detecte
                </Badge>
              ) : null}
            </HStack>
            <Text color="fg.muted">{analysis.interview_conduct.teacher_comment}</Text>
            <HStack gap={4} flexWrap="wrap">
              <Text fontSize="sm" color="fg.muted">
                Messages faibles : {analysis.interview_conduct.weak_message_signals}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Repetitions : {analysis.interview_conduct.repeated_question_signals}
              </Text>
            </HStack>
          </Stack>
        </Box>
      ) : null}

      {analysis.material_reading ? (
        <Box padding={4} borderRadius="xl" backgroundColor="bg.surface" borderWidth="1px" borderColor="border.muted">
          <Stack gap={3}>
            <Text fontWeight="600">Lecture du materiau obtenu</Text>
            <HStack gap={3} flexWrap="wrap">
              <Badge variant="subtle" colorPalette="green" borderRadius="full" px={3} py={1}>
                Densite : {analysis.material_reading.density}
              </Badge>
              <Badge variant="subtle" colorPalette="orange" borderRadius="full" px={3} py={1}>
                Concret : {analysis.material_reading.concrete_level}
              </Badge>
            </HStack>
            <Text color="fg.muted">{analysis.material_reading.teacher_comment}</Text>
            {analysis.material_reading.contrasts_detected.length > 0 ? (
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="600">
                  Tensions ou contrastes reperes
                </Text>
                {analysis.material_reading.contrasts_detected.map((item) => (
                  <Text key={item} fontSize="sm" color="fg.muted">
                    - {item}
                  </Text>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </Box>
      ) : null}

      {analysis.alerts && analysis.alerts.length > 0 ? (
        <Box
          padding={4}
          borderRadius="xl"
          backgroundColor={{ base: "red.50", _dark: "bg.surface" }}
          borderWidth="1px"
          borderColor={{ base: "red.100", _dark: "border.muted" }}
        >
          <Stack gap={2}>
            <Text fontWeight="600">Alertes pedagogiques</Text>
            {analysis.alerts.map((alert) => (
              <HStack key={`${alert.type}-${alert.message}`} align="start" gap={3}>
                <Badge
                  colorPalette={alert.severity === "blocking" ? "red" : alert.severity === "warning" ? "orange" : "blue"}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  mt={0.5}
                >
                  {alert.severity === "blocking" ? "Bloquant" : alert.severity === "warning" ? "Attention" : "Info"}
                </Badge>
                <Text color="fg.muted" flex="1">
                  {alert.message}
                </Text>
              </HStack>
            ))}
          </Stack>
        </Box>
      ) : null}

      {analysis.theme_coverage ? (
        <Box padding={4} borderRadius="xl" backgroundColor="bg.surface" borderWidth="1px" borderColor="border.muted">
          <Stack gap={3}>
            <Text fontWeight="600">Couverture des themes</Text>
            <Stack gap={3} direction={{ base: "column", md: "row" }} align="stretch">
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="600" mb={2}>Couverts</Text>
                {analysis.theme_coverage.themes_covered.length > 0 ? (
                  analysis.theme_coverage.themes_covered.map((item) => (
                    <Text key={item} fontSize="sm" color="fg.muted">- {item}</Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="fg.muted">Aucun theme encore vraiment couvert.</Text>
                )}
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="600" mb={2}>Partiels</Text>
                {analysis.theme_coverage.themes_partial.length > 0 ? (
                  analysis.theme_coverage.themes_partial.map((item) => (
                    <Text key={item} fontSize="sm" color="fg.muted">- {item}</Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="fg.muted">Aucun theme seulement partiel.</Text>
                )}
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="600" mb={2}>A explorer</Text>
                {analysis.theme_coverage.themes_missing.length > 0 ? (
                  analysis.theme_coverage.themes_missing.map((item) => (
                    <Text key={item} fontSize="sm" color="fg.muted">- {item}</Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="fg.muted">Rien de majeur ne manque.</Text>
                )}
              </Box>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      {analysis.examples ? (
        <Box padding={4} borderRadius="xl" backgroundColor="bg.surface" borderWidth="1px" borderColor="border.muted">
          <Stack gap={3}>
            <Text fontWeight="600">Exemples tires de l&apos;entretien</Text>
            <Stack gap={3} direction={{ base: "column", md: "row" }} align="stretch">
              <Box flex={1} minWidth={0}>
                <Text fontSize="sm" fontWeight="600" mb={2}>Questions utiles</Text>
                {analysis.examples.good_questions.length > 0 ? (
                  analysis.examples.good_questions.map((item) => (
                    <Text key={item} fontSize="sm" color="fg.muted">- {item}</Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="fg.muted">Pas encore d&apos;exemple fort de question ouverte.</Text>
                )}
              </Box>
              <Box flex={1} minWidth={0}>
                <Text fontSize="sm" fontWeight="600" mb={2}>Questions faibles</Text>
                {analysis.examples.weak_questions.length > 0 ? (
                  analysis.examples.weak_questions.map((item) => (
                    <Text key={item} fontSize="sm" color="fg.muted">- {item}</Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="fg.muted">Pas de question faible reperee.</Text>
                )}
              </Box>
            </Stack>
            <Stack gap={3} direction={{ base: "column", md: "row" }} align="stretch">
              <Box flex={1} minWidth={0}>
                <Text fontSize="sm" fontWeight="600" mb={2}>Verbatims forts</Text>
                {analysis.examples.strong_verbatims.length > 0 ? (
                  analysis.examples.strong_verbatims.map((item) => (
                    <Text key={item} fontSize="sm" color="fg.muted">- {item}</Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="fg.muted">Pas encore de verbatim vraiment fort.</Text>
                )}
              </Box>
              <Box flex={1} minWidth={0}>
                <Text fontSize="sm" fontWeight="600" mb={2}>Materiau encore faible</Text>
                {analysis.examples.weak_material_examples.length > 0 ? (
                  analysis.examples.weak_material_examples.map((item) => (
                    <Text key={item} fontSize="sm" color="fg.muted">- {item}</Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="fg.muted">Rien de faible de ce type n&apos;a ete repere.</Text>
                )}
              </Box>
            </Stack>
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}
