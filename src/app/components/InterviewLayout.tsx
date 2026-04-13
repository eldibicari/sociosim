"use client";

import type { RefObject } from "react";
import type { BoxProps } from "@chakra-ui/react";
import {
  Badge,
  Box,
  Button,
  Collapsible,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { InterviewAnalysisContent } from "@/app/components/InterviewAnalysisContent";
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
  const analysisHref = currentInterviewId ? `/interview/${currentInterviewId}/analysis` : null;

  const handleSuggestedQuestion = (question: string) => {
    setDraftMessage("");
    onSendMessage(question);
  };

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
                <Badge colorPalette="orange" variant="subtle" borderRadius="full" px={4} py={1.5}>
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
              <Box display="flex" flexDirection="column" gap={0}>
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
              </Box>
            )}
          </Box>

          {showAnalysisPanel ? (
            <Box marginX={4} marginBottom={3}>
              <Collapsible.Root open={isAnalysisOpen} onOpenChange={({ open }) => setIsAnalysisOpen(open)}>
                <Box display="flex" flexDirection="column" gap={3}>
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
                        <InterviewAnalysisContent analysis={analysis} analysisHref={analysisHref} />
                      ) : null}
                    </Box>
                  </Collapsible.Content>
                </Box>
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
