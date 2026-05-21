"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { InterviewAnalysisContent } from "@/app/components/InterviewAnalysisContent";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useInterviewAnalysis } from "@/hooks/useInterviewAnalysis";
import { useInterviewSummary } from "@/hooks/useInterviewSummary";
import { formatAgentName, formatInterviewDate } from "@/lib/interviewFormat";

function getQualityLabel(materialQuality: "insuffisant" | "partiel" | "exploitable") {
  if (materialQuality === "exploitable") return "Exploitable";
  if (materialQuality === "partiel") return "Partiel";
  return "Insuffisant";
}

function getQualityPalette(materialQuality: "insuffisant" | "partiel" | "exploitable") {
  if (materialQuality === "exploitable") return "green";
  if (materialQuality === "partiel") return "orange";
  return "red";
}

export default function InterviewAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: interviewId } = use(params);
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { interviewSummary, summaryError } = useInterviewSummary({ interviewId });
  const { analysis, analysisError, isAnalysisLoading } = useInterviewAnalysis({
    interviewId,
    enabled: true,
  });

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user?.id) {
      router.push("/login");
    }
  }, [isAuthLoading, router, user?.id]);

  if (isAuthLoading) {
    return (
      <Container maxWidth="3xl" py={16}>
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text>Verification d&apos;authentification...</Text>
        </VStack>
      </Container>
    );
  }

  if (summaryError) {
    return (
      <Container maxWidth="4xl" py={16}>
        <VStack gap={4} align="stretch">
          <Heading as="h1" size="lg">
            Analyse complete
          </Heading>
          <Text color="red.600">{summaryError}</Text>
        </VStack>
      </Container>
    );
  }

  const personaName = interviewSummary ? formatAgentName(interviewSummary.agentName) : "Entretien";
  const dateDisplay = interviewSummary ? formatInterviewDate(interviewSummary.startedAt) : null;
  const qualityLabel = analysis ? getQualityLabel(analysis.material_quality) : null;
  const qualityPalette = analysis ? getQualityPalette(analysis.material_quality) : null;

  const handleExportAnalysisPdf = async () => {
    if (!interviewId || !interviewSummary || !user) return;
    setIsExportingPdf(true);
    try {
      window.open(
        `/api/interviews/analysis/export?interviewId=${interviewId}`,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Box minHeight="100vh" backgroundColor="bg.surface">
      <Container maxWidth="6xl" py={{ base: 6, md: 10 }}>
        <Stack gap={6}>
          <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <Stack gap={3}>
              <Button
                alignSelf="start"
                variant="ghost"
                colorPalette="blue"
                onClick={() => router.push(`/interview/${interviewId}`)}
              >
                <ArrowLeft size={16} />
                Retour au chat
              </Button>

              <Stack gap={2}>
                <HStack gap={3} flexWrap="wrap">
                  <Badge colorPalette="blue" variant="subtle" px={3} py={1} borderRadius="full">
                    Analyse pedagogique
                  </Badge>
                  {qualityLabel && qualityPalette ? (
                    <Badge colorPalette={qualityPalette} variant="solid" px={3} py={1} borderRadius="full">
                      {qualityLabel}
                    </Badge>
                  ) : null}
                </HStack>
                <Heading as="h1" size="2xl">
                  Analyse complete de l&apos;entretien
                </Heading>
                <Text color="fg.muted" maxWidth="3xl">
                  Cette page rassemble le retour pedagogique complet sur la conduite de l&apos;entretien,
                  la qualite du materiau recueilli, les themes abordes et les pistes d&apos;amelioration.
                </Text>
              </Stack>
            </Stack>

            <Stack
              gap={3}
              minWidth={{ base: "100%", md: "280px" }}
              padding={4}
              borderRadius="2xl"
              backgroundColor="bg.subtle"
              borderWidth="1px"
              borderColor="border.muted"
              boxShadow="0 12px 30px rgba(15, 23, 42, 0.05)"
            >
              <Text fontWeight="700">{personaName}</Text>
              <Text fontSize="sm" color="fg.muted">
                {interviewSummary?.userName ? `Entretien de ${interviewSummary.userName}` : "Entretien en cours"}
              </Text>
              {dateDisplay ? (
                <Text fontSize="sm" color="fg.muted">{dateDisplay}</Text>
              ) : null}
              <Button
                variant="outline"
                justifyContent="start"
                onClick={handleExportAnalysisPdf}
                loading={isExportingPdf}
                disabled={!interviewSummary || !analysis || !user}
              >
                <FileText size={16} />
                Exporter l&apos;analyse en PDF
              </Button>
            </Stack>
          </HStack>

          {isAnalysisLoading ? (
            <Box
              padding={8}
              borderRadius="2xl"
              backgroundColor="bg.subtle"
              borderWidth="1px"
              borderColor="border.muted"
            >
              <VStack gap={4}>
                <Spinner size="lg" color="blue.500" />
                <Text color="fg.muted">Preparation de l&apos;analyse complete...</Text>
              </VStack>
            </Box>
          ) : analysisError ? (
            <Box
              padding={6}
              borderRadius="2xl"
              backgroundColor={{ base: "red.50", _dark: "bg.subtle" }}
              borderWidth="1px"
              borderColor={{ base: "red.100", _dark: "border.muted" }}
            >
              <Text color="red.600">{analysisError}</Text>
            </Box>
          ) : analysis ? (
            <Box
              padding={{ base: 5, md: 7 }}
              borderRadius="3xl"
              backgroundColor="bg.subtle"
              borderWidth="1px"
              borderColor="border.muted"
              boxShadow="0 18px 40px rgba(15, 23, 42, 0.05)"
            >
              <InterviewAnalysisContent analysis={analysis} mode="page" />
            </Box>
          ) : (
            <Box
              padding={6}
              borderRadius="2xl"
              backgroundColor="bg.subtle"
              borderWidth="1px"
              borderColor="border.muted"
            >
              <Text color="fg.muted">Aucune analyse n&apos;est encore disponible pour cet entretien.</Text>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
