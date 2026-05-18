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
import { ChevronDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
  "Pouvez-vous me parler de votre quotidien étudiant ?",
  "Comment utilisez-vous l'IA dans votre travail universitaire ?",
  "Pouvez-vous me raconter une situation récente où vous avez utilisé ChatGPT ?",
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
          {agentDisplayName && (
            <Box
              px={5}
              py={3}
              borderBottom="1px solid var(--color-border)"
              backgroundColor="var(--color-surface)"
              display="flex"
              alignItems="center"
              gap={3}
              flexShrink={0}
            >
              <Box
                width="36px"
                height="36px"
                borderRadius="12px"
                background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 8px rgba(99,102,241,0.25)"
                flexShrink={0}
              >
                <Text fontSize="sm" fontWeight="700" color="white" lineHeight="1">
                  {agentDisplayName.charAt(0).toUpperCase()}
                </Text>
              </Box>
              <Box flex={1} minWidth={0}>
                <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)" lineHeight="1.2">
                  {agentDisplayName}
                </Text>
                <HStack gap={1.5} mt="2px">
                  <Box
                    width="6px"
                    height="6px"
                    borderRadius="full"
                    background={isStreaming ? "#f59e0b" : "#10b981"}
                    flexShrink={0}
                  />
                  <Text fontSize="2xs" fontWeight="600" color="var(--color-text-muted)">
                    {isStreaming ? "En train de répondre..." : "Disponible"}
                  </Text>
                </HStack>
              </Box>
            </Box>
          )}

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
              <VStack align="center" justify="center" height="100%" gap={6} px={4}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", width: "100%", maxWidth: "600px" }}
                >
                  {/* Icon */}
                  <Box
                    width="64px"
                    height="64px"
                    borderRadius="22px"
                    background="linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))"
                    borderWidth="1px"
                    borderColor="rgba(99,102,241,0.18)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 8px 24px rgba(99,102,241,0.12)"
                  >
                    <Sparkles size={28} color="#6366f1" />
                  </Box>

                  {/* Eyebrow + heading */}
                  <VStack gap={2} alignItems="center">
                    <Badge colorPalette="orange" variant="subtle" borderRadius="full" px={4} py={1.5} fontSize="xs" fontWeight="700" letterSpacing="0.06em">
                      Entretien semi-directif
                    </Badge>
                    <Text
                      color="gray.800"
                      fontSize={emptyStateTextSize ?? "xl"}
                      fontWeight="800"
                      textAlign="center"
                      letterSpacing="-0.03em"
                      lineHeight="1.25"
                      maxWidth="400px"
                    >
                      {emptyStateText}
                    </Text>
                  </VStack>

                  {/* Suggested questions */}
                  {showSuggestions ? (
                    <VStack gap={2.5} width="100%" maxWidth="520px">
                      <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="fg.muted">
                        Suggestions pour commencer
                      </Text>
                      {DEFAULT_SUGGESTED_QUESTIONS.map((question, i) => (
                        <motion.div
                          key={question}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                          style={{ width: "100%" }}
                        >
                          <Box
                            as="button"
                            width="100%"
                            textAlign="left"
                            px={4}
                            py={3}
                            borderRadius="16px"
                            borderWidth="1px"
                            borderColor="rgba(99,102,241,0.15)"
                            background="rgba(255,255,255,0.9)"
                            boxShadow="0 2px 8px rgba(15,23,42,0.04)"
                            cursor="pointer"
                            transition="all 0.18s ease"
                            _hover={{
                              borderColor: "rgba(99,102,241,0.35)",
                              background: "rgba(239,246,255,0.9)",
                              boxShadow: "0 6px 20px rgba(99,102,241,0.1)",
                              transform: "translateY(-1px)",
                            }}
                            onClick={() => handleSuggestedQuestion(question)}
                          >
                            <HStack gap={3}>
                              <Box
                                width="24px"
                                height="24px"
                                borderRadius="8px"
                                background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                              >
                                <Text fontSize="2xs" fontWeight="800" color="white">{i + 1}</Text>
                              </Box>
                              <Text fontSize="sm" fontWeight="600" color="gray.700" lineHeight="1.5">
                                {question}
                              </Text>
                            </HStack>
                          </Box>
                        </motion.div>
                      ))}
                    </VStack>
                  ) : null}
                </motion.div>
              </VStack>
            ) : (
              <Box display="flex" flexDirection="column" gap={0}>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    text={msg.text}
                    isStreaming={msg.isStreaming}
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
                <Box display="flex" flexDirection="column" gap={2}>
                  <Collapsible.Trigger asChild>
                    <Box
                      as="button"
                      width="100%"
                      borderRadius="16px"
                      borderWidth="1px"
                      borderColor={isAnalysisOpen ? "rgba(99,102,241,0.22)" : "rgba(148,163,184,0.18)"}
                      background={isAnalysisOpen
                        ? "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(237,233,254,0.8))"
                        : "rgba(255,255,255,0.9)"}
                      px={4}
                      py={3}
                      cursor="pointer"
                      transition="all 0.2s ease"
                      boxShadow={isAnalysisOpen ? "0 4px 16px rgba(99,102,241,0.08)" : "0 2px 8px rgba(15,23,42,0.04)"}
                      _hover={{
                        borderColor: "rgba(99,102,241,0.25)",
                        background: "linear-gradient(135deg, rgba(239,246,255,0.9), rgba(237,233,254,0.7))",
                      }}
                    >
                      <HStack justify="space-between" align="center" width="100%">
                        <HStack gap={3} flexWrap="wrap">
                          <Text fontWeight="700" fontSize="sm" letterSpacing="-0.01em" color="gray.800">
                            Analyse du matériau
                          </Text>
                          {analysis ? (
                            <Badge colorPalette={qualityPalette} variant="subtle" px={2.5} py={0.5} borderRadius="full" fontSize="2xs" fontWeight="700">
                              {qualityLabel}
                            </Badge>
                          ) : isAnalysisLoading ? (
                            <Badge colorPalette="blue" variant="subtle" px={2.5} py={0.5} borderRadius="full" fontSize="2xs">
                              En cours...
                            </Badge>
                          ) : null}
                        </HStack>
                        <Box color="fg.muted" transition="transform 0.2s ease" style={{ transform: isAnalysisOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <ChevronDown size={15} />
                        </Box>
                      </HStack>
                    </Box>
                  </Collapsible.Trigger>

                  <Collapsible.Content>
                    <Box
                      padding={5}
                      maxHeight={{ base: "42vh", lg: "38vh" }}
                      overflowY="auto"
                      paddingRight={4}
                      borderRadius="16px"
                      borderWidth="1px"
                      borderColor="rgba(148,163,184,0.15)"
                      background="rgba(248,250,252,0.95)"
                      boxShadow="0 8px 24px rgba(15,23,42,0.05)"
                    >
                      {isAnalysisLoading ? (
                        <Text color="fg.muted" fontSize="sm">Analyse du matériau en cours...</Text>
                      ) : analysisError ? (
                        <Text color="red.600" fontSize="sm">{analysisError}</Text>
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

      <Box
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        width="260px"
        minWidth="260px"
        borderLeft="1px solid var(--color-border)"
        backgroundColor="var(--color-surface)"
        padding={4}
        gap={4}
        overflowY="auto"
      >
        {agentDisplayName ? (
          <VStack align="stretch" gap={4}>
            <Box
              width="56px"
              height="56px"
              borderRadius="16px"
              background="linear-gradient(135deg, #6366f1, #8b5cf6)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 4px 12px rgba(99,102,241,0.25)"
            >
              <Text fontSize="xl" fontWeight="700" color="white" lineHeight="1">
                {agentDisplayName.charAt(0).toUpperCase()}
              </Text>
            </Box>

            <VStack align="stretch" gap={1.5}>
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                width="fit-content"
                px={2.5}
                py={0.5}
                fontSize="2xs"
                fontWeight="700"
              >
                Persona active
              </Badge>
              <Text fontWeight="800" fontSize="md" color="var(--color-text-primary)" letterSpacing="-0.02em" lineHeight="1.3">
                {agentDisplayName}
              </Text>
              {agentDescription ? (
                <Text fontSize="xs" color="var(--color-text-muted)" lineHeight="1.65" mt={0.5}>
                  {agentDescription}
                </Text>
              ) : null}
            </VStack>

            <Box height="1px" backgroundColor="var(--color-border)" />

            <VStack align="stretch" gap={2}>
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)">
                Export
              </Text>
              <Button
                size="sm"
                variant="outline"
                borderRadius="10px"
                onClick={onExportPdf}
                loading={isExportingPdf}
                disabled={disableExport}
                fontWeight="600"
                fontSize="xs"
              >
                Exporter en PDF
              </Button>
              {onExportGoogleDocs ? (
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="10px"
                  onClick={onExportGoogleDocs}
                  loading={isExportingGoogleDocs}
                  disabled={disableExport}
                  fontWeight="600"
                  fontSize="xs"
                >
                  Google Docs
                </Button>
              ) : null}
            </VStack>
          </VStack>
        ) : null}
      </Box>
    </Box>
  );
}
