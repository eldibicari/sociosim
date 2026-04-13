"use client";

import type { RefObject } from "react";
import type { BoxProps } from "@chakra-ui/react";
import {
  Badge,
  Box,
  Button,
  Collapsible,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { InterviewSidebar } from "@/app/components/InterviewSidebar";
import { AssistantSkeleton } from "@/components/AssistantSkeleton";
import { ChatMessage } from "@/components/ChatMessage";
import { MessageInput } from "@/components/MessageInput";
import type { InterviewAnalysis } from "@/lib/schemas";
import type { UIMessage } from "@/types/ui";

type InterviewStats = {
  answeredQuestions: number;
  inputTokens: number;
  outputTokens: number;
};

type InterviewLayoutProps = {
  agentDisplayName?: string;
  agentId?: string | null;
  userId?: string | null;
  agentDescription?: string | null;
  userName?: string;
  dateDisplay?: string;
  error?: string | null;
  stats: InterviewStats;
  historyUserId?: string | null;
  currentInterviewId?: string | null;
  onExportPdf: () => void;
  onExportGoogleDocs?: () => void;
  isExportingPdf?: boolean;
  isExportingGoogleDocs?: boolean;
  disableExport?: boolean;
  messages: UIMessage[];
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  showAssistantSkeleton: boolean;
  emptyStateText: string;
  emptyStateTextSize?: string;
  showInput?: boolean;
  messageInputContainerProps?: BoxProps;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  agentNameForMessages?: string;
  analysis?: InterviewAnalysis | null;
  analysisError?: string | null;
  isAnalysisLoading?: boolean;
};

const DEFAULT_SUGGESTED_QUESTIONS = [
  "Pouvez-vous me parler de votre quotidien etudiant ?",
  "Comment utilisez-vous l'IA dans votre travail universitaire ?",
  "Pouvez-vous me raconter une situation recente ou vous avez utilise ChatGPT ?",
];

export function InterviewLayout({
  agentDisplayName,
  agentId,
  userId,
  agentDescription,
  userName,
  dateDisplay,
  error,
  stats,
  historyUserId,
  currentInterviewId,
  onExportPdf,
  onExportGoogleDocs,
  isExportingPdf,
  isExportingGoogleDocs,
  disableExport,
  messages,
  onSendMessage,
  isStreaming,
  showAssistantSkeleton,
  emptyStateText,
  emptyStateTextSize,
  showInput = true,
  messageInputContainerProps,
  agentNameForMessages,
  messagesContainerRef,
  analysis,
  analysisError,
  isAnalysisLoading = false,
}: InterviewLayoutProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const showSuggestions =
    showInput && messages.length === 0 && !isStreaming && draftMessage.trim().length === 0;

  const handleSuggestedQuestion = (question: string) => {
    setDraftMessage("");
    onSendMessage(question);
  };

  const showAnalysisPanel = messages.length > 0 && (isAnalysisLoading || !!analysis || !!analysisError);
  const qualityLabel =
    analysis?.material_quality === "exploitable"
      ? "Exploitable"
      : analysis?.material_quality === "partiel"
        ? "Partiel"
        : "Insuffisant";
  const qualityPalette =
    analysis?.material_quality === "exploitable"
      ? "green"
      : analysis?.material_quality === "partiel"
        ? "orange"
        : "red";
  const scorePalette =
    analysis?.material_quality === "exploitable"
      ? "green"
      : analysis?.material_quality === "partiel"
        ? "orange"
        : "blue";

  return (
    <Box
      flex={1}
      height="100%"
      display="flex"
      flexDirection={{ base: "column", lg: "row" }}
      backgroundColor="bg.surface"
      overflow="hidden"
    >
      <InterviewSidebar
        agentDisplayName={agentDisplayName}
        agentId={agentId ?? null}
        userId={userId ?? null}
        agentDescription={agentDescription ?? null}
        userName={userName}
        dateDisplay={dateDisplay}
        error={error}
        stats={stats}
        historyUserId={historyUserId ?? null}
        currentInterviewId={currentInterviewId ?? null}
        onExportPdf={onExportPdf}
        onExportGoogleDocs={onExportGoogleDocs}
        isExportingPdf={isExportingPdf}
        isExportingGoogleDocs={isExportingGoogleDocs}
        disableExport={disableExport}
      />

      <Box
        display="flex"
        flexDirection="column"
        flex={1}
        minHeight={0}
        backgroundColor="bg.surface"
        overflow="hidden"
      >
        <Box
          display="flex"
          flexDirection="column"
          flex={1}
          minHeight={0}
          width="100%"
          maxWidth={{ base: "100%", lg: "4xl" }}
          marginX="auto"
        >
          <Box
            ref={messagesContainerRef}
            flex={1}
            minHeight={0}
            overflowY="auto"
            data-scroll-container
            backgroundColor="bg.surface"
            paddingX={4}
            paddingY={4}
            width="100%"
          >
            {messages.length === 0 ? (
              <VStack align="center" justify="center" height="100%" gap={5}>
                <Badge
                  colorPalette="orange"
                  variant="subtle"
                  borderRadius="full"
                  px={4}
                  py={1.5}
                >
                  Entretien semi-directif
                </Badge>
                <Text
                  color="fg.default"
                  fontSize={emptyStateTextSize}
                  fontWeight="700"
                  textAlign="center"
                  maxWidth="2xl"
                >
                  {emptyStateText}
                </Text>
                {showSuggestions ? (
                  <HStack gap={3} flexWrap="wrap" justify="center" maxWidth="4xl">
                    {DEFAULT_SUGGESTED_QUESTIONS.map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        borderRadius="full"
                        backgroundColor="bg.surface"
                        color="blue.900"
                        borderColor="border.muted"
                        boxShadow="0 8px 20px rgba(15, 23, 42, 0.05)"
                        onClick={() => handleSuggestedQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </HStack>
                ) : null}
              </VStack>
            ) : (
              <Stack gap={0}>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    text={msg.text}
                    userName={userName}
                    agentName={agentNameForMessages}
                    timestamp={msg.timestamp}
                  />
                ))}
                {showAssistantSkeleton ? <AssistantSkeleton /> : null}
              </Stack>
            )}
          </Box>

          {showAnalysisPanel ? (
            <Box marginX={4} marginBottom={3}>
              <Collapsible.Root open={isAnalysisOpen} onOpenChange={({ open }) => setIsAnalysisOpen(open)}>
                <Stack gap={3}>
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="outline"
                      justifyContent="space-between"
                      width="100%"
                      borderRadius="xl"
                      paddingX={4}
                      paddingY={3}
                      height="auto"
                      backgroundColor="bg.subtle"
                      boxShadow="0 8px 20px rgba(15, 23, 42, 0.04)"
                    >
                      <HStack justify="space-between" align="center" width="100%">
                        <HStack gap={3} flexWrap="wrap">
                          <Text fontWeight="600">Retour sur l&apos;entretien</Text>
                          {analysis ? (
                            <Badge colorPalette={qualityPalette} variant="subtle" px={3} py={1} borderRadius="full">
                              {qualityLabel}
                            </Badge>
                          ) : null}
                        </HStack>
                        {isAnalysisOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </HStack>
                    </Button>
                  </Collapsible.Trigger>

                  <Collapsible.Content>
                    <Box
                      padding={5}
                      maxHeight={{ base: "42vh", lg: "38vh" }}
                      overflowY="auto"
                      paddingRight={4}
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="border.muted"
                      backgroundColor="bg.subtle"
                      boxShadow="0 12px 28px rgba(15, 23, 42, 0.05)"
                    >
                      {isAnalysisLoading ? (
                        <Text color="fg.muted">Analyse du materiau en cours...</Text>
                      ) : analysisError ? (
                        <Text color="red.600">{analysisError}</Text>
                      ) : analysis ? (
                        <Stack gap={4}>
                          <Stack gap={2}>
                            <HStack gap={3} flexWrap="wrap">
                              <Badge colorPalette={qualityPalette} variant="solid" px={3} py={1} borderRadius="full">
                                {qualityLabel}
                              </Badge>
                              <Badge colorPalette={scorePalette} variant="subtle" px={3} py={1} borderRadius="full">
                                Score {analysis.score_breakdown.total_score}/{analysis.score_breakdown.max_score}
                              </Badge>
                            </HStack>
                            <Text fontWeight="700" fontSize="lg">
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
                              <Box
                                flex="1"
                                minWidth={{ base: "calc(50% - 0.5rem)", md: "150px" }}
                                padding={3}
                                borderRadius="xl"
                                backgroundColor="bg.surface"
                                borderWidth="1px"
                                borderColor="border.muted"
                              >
                                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em">
                                  Messages etudiant
                                </Text>
                                <Text fontSize="lg" fontWeight="700">
                                  {analysis.metrics.student_messages}
                                </Text>
                              </Box>
                              <Box
                                flex="1"
                                minWidth={{ base: "calc(50% - 0.5rem)", md: "150px" }}
                                padding={3}
                                borderRadius="xl"
                                backgroundColor="bg.surface"
                                borderWidth="1px"
                                borderColor="border.muted"
                              >
                                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em">
                                  Mots produits
                                </Text>
                                <Text fontSize="lg" fontWeight="700">
                                  {analysis.metrics.student_words}
                                </Text>
                              </Box>
                              <Box
                                flex="1"
                                minWidth={{ base: "calc(50% - 0.5rem)", md: "150px" }}
                                padding={3}
                                borderRadius="xl"
                                backgroundColor="bg.surface"
                                borderWidth="1px"
                                borderColor="border.muted"
                              >
                                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em">
                                  Reponses longues
                                </Text>
                                <Text fontSize="lg" fontWeight="700">
                                  {analysis.metrics.long_answers}
                                </Text>
                              </Box>
                              <Box
                                flex="1"
                                minWidth={{ base: "calc(50% - 0.5rem)", md: "150px" }}
                                padding={3}
                                borderRadius="xl"
                                backgroundColor="bg.surface"
                                borderWidth="1px"
                                borderColor="border.muted"
                              >
                                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em">
                                  Exemples concrets
                                </Text>
                                <Text fontSize="lg" fontWeight="700">
                                  {analysis.metrics.concrete_examples}
                                </Text>
                              </Box>
                              <Box
                                flex="1"
                                minWidth={{ base: "calc(50% - 0.5rem)", md: "150px" }}
                                padding={3}
                                borderRadius="xl"
                                backgroundColor="bg.surface"
                                borderWidth="1px"
                                borderColor="border.muted"
                              >
                                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em">
                                  Questions ouvertes
                                </Text>
                                <Text fontSize="lg" fontWeight="700">
                                  {analysis.metrics.open_question_ratio_percent}%
                                </Text>
                              </Box>
                              <Box
                                flex="1"
                                minWidth={{ base: "calc(50% - 0.5rem)", md: "150px" }}
                                padding={3}
                                borderRadius="xl"
                                backgroundColor="bg.surface"
                                borderWidth="1px"
                                borderColor="border.muted"
                              >
                                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.08em">
                                  Tokens totaux
                                </Text>
                                <Text fontSize="lg" fontWeight="700">
                                  {analysis.metrics.total_tokens}
                                </Text>
                              </Box>
                            </HStack>
                          </Stack>

                          <Stack gap={3} direction={{ base: "column", md: "row" }} align="stretch">
                            <Box
                              flex={1}
                              minWidth={0}
                              padding={4}
                              borderRadius="xl"
                              backgroundColor="bg.surface"
                              borderWidth="1px"
                              borderColor="border.muted"
                            >
                              <Stack gap={2}>
                                <Text fontWeight="600">Ce qui est deja bien</Text>
                                {analysis.strengths.map((item) => (
                                  <Text key={item} fontSize="sm" color="fg.muted">
                                    • {item}
                                  </Text>
                                ))}
                              </Stack>
                            </Box>
                            <Box
                              flex={1}
                              minWidth={0}
                              padding={4}
                              borderRadius="xl"
                              backgroundColor="bg.surface"
                              borderWidth="1px"
                              borderColor="border.muted"
                            >
                              <Stack gap={2}>
                                <Text fontWeight="600">Ce qui manque encore</Text>
                                {analysis.limits.map((item) => (
                                  <Text key={item} fontSize="sm" color="fg.muted">
                                    • {item}
                                  </Text>
                                ))}
                              </Stack>
                            </Box>
                            <Box
                              flex={1}
                              minWidth={0}
                              padding={4}
                              borderRadius="xl"
                              backgroundColor="bg.surface"
                              borderWidth="1px"
                              borderColor="border.muted"
                            >
                              <Stack gap={2}>
                                <Text fontWeight="600">Comment ameliorer</Text>
                                {analysis.next_steps.map((item) => (
                                  <Text key={item} fontSize="sm" color="fg.muted">
                                    • {item}
                                  </Text>
                                ))}
                              </Stack>
                            </Box>
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
                        </Stack>
                      ) : null}
                    </Box>
                  </Collapsible.Content>
                </Stack>
              </Collapsible.Root>
            </Box>
          ) : null}

          {showInput ? (
            <MessageInput
              onSendMessage={onSendMessage}
              isLoading={isStreaming}
              placeholder="Posez votre question..."
              containerProps={messageInputContainerProps}
              value={draftMessage}
              onValueChange={setDraftMessage}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
