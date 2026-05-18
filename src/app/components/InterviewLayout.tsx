"use client";

import type { RefObject } from "react";
import type { BoxProps } from "@chakra-ui/react";
import {
  Badge,
  Box,
  Dialog,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Sparkles, X } from "lucide-react";
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
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const showSuggestions =
    showInput && messages.length === 0 && !isStreaming && draftMessage.trim().length === 0;
  const hasAnalysis = isAnalysisLoading || !!analysis || !!analysisError;

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
      {/* ── LEFT: InterviewSidebar permanent ─────────────── */}
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

      {/* ── CENTER: Chat column ───────────────────────────── */}
      <Box
        display="flex"
        flexDirection="column"
        flex={1}
        minHeight={0}
        backgroundColor="var(--color-bg)"
        overflow="hidden"
      >
        {/* Chat header */}
        <Box
          height="52px"
          borderBottom="1px solid var(--color-border)"
          backgroundColor="var(--color-surface)"
          display="flex"
          alignItems="center"
          px={4}
          gap={3}
          flexShrink={0}
        >
          <HStack flex={1} gap={2.5} justifyContent="center">
            {agentDisplayName ? (
              <>
                <Box
                  width="30px"
                  height="30px"
                  borderRadius="9px"
                  background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  boxShadow="0 2px 6px rgba(99,102,241,0.18)"
                >
                  <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1">
                    {agentDisplayName.charAt(0).toUpperCase()}
                  </Text>
                </Box>
                <VStack gap={0} align="flex-start">
                  <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)" lineHeight="1.2">
                    {agentDisplayName}
                  </Text>
                  <HStack gap={1.5}>
                    <Box
                      width="6px"
                      height="6px"
                      borderRadius="full"
                      background={isStreaming ? "#f59e0b" : "#10b981"}
                      flexShrink={0}
                    />
                    <Text fontSize="2xs" fontWeight="500" color="var(--color-text-muted)">
                      {isStreaming ? "En train de répondre…" : "Disponible"}
                    </Text>
                  </HStack>
                </VStack>
              </>
            ) : (
              <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">Entretien</Text>
            )}
          </HStack>

          {/* Analysis badge — opens modal */}
          {hasAnalysis && messages.length > 0 ? (
            <Box
              as="button"
              display="flex"
              alignItems="center"
              gap={1.5}
              px={2.5}
              py={1}
              borderRadius="full"
              background={
                analysis
                  ? analysis.material_quality === "exploitable"
                    ? "rgba(16,185,129,0.08)"
                    : analysis.material_quality === "partiel"
                      ? "rgba(245,158,11,0.08)"
                      : "rgba(239,68,68,0.08)"
                  : "rgba(148,163,184,0.1)"
              }
              borderWidth="1px"
              borderColor={
                analysis
                  ? analysis.material_quality === "exploitable"
                    ? "rgba(16,185,129,0.22)"
                    : analysis.material_quality === "partiel"
                      ? "rgba(245,158,11,0.22)"
                      : "rgba(239,68,68,0.22)"
                  : "rgba(148,163,184,0.2)"
              }
              cursor="pointer"
              onClick={() => setAnalysisOpen(true)}
              transition="all 0.15s ease"
              _hover={{ opacity: 0.8 }}
            >
              <Box
                width="6px"
                height="6px"
                borderRadius="full"
                background={
                  analysis
                    ? analysis.material_quality === "exploitable"
                      ? "#10b981"
                      : analysis.material_quality === "partiel"
                        ? "#f59e0b"
                        : "#ef4444"
                    : isAnalysisLoading
                      ? "#f59e0b"
                      : "#94a3b8"
                }
              />
              <Text fontSize="2xs" fontWeight="600" color="var(--color-text-muted)">
                {isAnalysisLoading ? "Analyse…" : analysis ? qualityLabel : "Analyse"}
              </Text>
            </Box>
          ) : null}
        </Box>

        {/* Messages area */}
        <Box
          display="flex"
          flexDirection="column"
          flex={1}
          minHeight={0}
          width="100%"
          maxWidth="820px"
          marginX="auto"
        >
          {error ? (
            <Box px={4} py={2} backgroundColor="red.50" borderBottom="1px solid" borderColor="red.200" flexShrink={0}>
              <Text fontSize="sm" color="red.600">{error}</Text>
            </Box>
          ) : null}

          <Box
            ref={messagesContainerRef}
            flex={1}
            minHeight={0}
            overflowY="auto"
            data-scroll-container
            backgroundColor="var(--color-bg)"
            paddingY={3}
            width="100%"
          >
            {messages.length === 0 ? (
              <VStack align="center" justify="center" height="100%" gap={6} px={4}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "24px",
                    width: "100%",
                    maxWidth: "560px",
                  }}
                >
                  <Box
                    width="60px"
                    height="60px"
                    borderRadius="20px"
                    background="linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))"
                    borderWidth="1px"
                    borderColor="rgba(99,102,241,0.15)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Sparkles size={24} color="#6366f1" />
                  </Box>

                  <VStack gap={1.5} alignItems="center">
                    <Badge
                      colorPalette="orange"
                      variant="subtle"
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="xs"
                      fontWeight="600"
                      letterSpacing="0.04em"
                    >
                      Entretien semi-directif
                    </Badge>
                    <Text
                      color="var(--color-text-primary)"
                      fontSize={emptyStateTextSize ?? "lg"}
                      fontWeight="700"
                      textAlign="center"
                      letterSpacing="-0.02em"
                      lineHeight="1.3"
                      maxWidth="380px"
                    >
                      {emptyStateText}
                    </Text>
                    <Text fontSize="sm" color="var(--color-text-muted)" textAlign="center" maxWidth="340px" lineHeight="1.6">
                      Commencez par une question ouverte. L&apos;enquêté répondra selon son profil.
                    </Text>
                  </VStack>

                  {showSuggestions ? (
                    <VStack gap={2} width="100%" maxWidth="500px">
                      <Text
                        fontSize="2xs"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        textTransform="uppercase"
                        color="var(--color-text-muted)"
                        mb={1}
                      >
                        Suggestions
                      </Text>
                      {DEFAULT_SUGGESTED_QUESTIONS.map((question, i) => (
                        <motion.div
                          key={question}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: 0.08 + i * 0.06 }}
                          style={{ width: "100%" }}
                        >
                          <Box
                            as="button"
                            width="100%"
                            textAlign="left"
                            px={4}
                            py="10px"
                            borderRadius="12px"
                            borderWidth="1px"
                            borderColor="var(--color-border)"
                            background="var(--color-surface)"
                            cursor="pointer"
                            transition="all 0.15s ease"
                            _hover={{
                              borderColor: "rgba(99,102,241,0.3)",
                              background: "rgba(99,102,241,0.03)",
                              transform: "translateY(-1px)",
                            }}
                            onClick={() => handleSuggestedQuestion(question)}
                          >
                            <Text fontSize="sm" color="var(--color-text-primary)" lineHeight="1.55">
                              {question}
                            </Text>
                          </Box>
                        </motion.div>
                      ))}
                    </VStack>
                  ) : null}
                </motion.div>
              </VStack>
            ) : (
              <Box display="flex" flexDirection="column">
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

          {showInput ? (
            <MessageInput
              onSendMessage={onSendMessage}
              isLoading={isStreaming}
              placeholder="Posez votre question…"
              containerProps={messageInputContainerProps}
              value={draftMessage}
              onValueChange={setDraftMessage}
            />
          ) : null}
        </Box>
      </Box>

      {/* ── ANALYSIS MODAL ───────────────────────────────── */}
      <Dialog.Root
        open={analysisOpen}
        onOpenChange={({ open }) => setAnalysisOpen(open)}
        size="lg"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="20px"
            overflow="hidden"
            maxWidth="680px"
            maxHeight="80vh"
            display="flex"
            flexDirection="column"
          >
            <Dialog.Header
              borderBottom="1px solid var(--color-border)"
              px={6}
              py={4}
              flexShrink={0}
            >
              <HStack justify="space-between" align="center" width="100%">
                <HStack gap={3}>
                  <Dialog.Title fontSize="md" fontWeight="700" color="var(--color-text-primary)">
                    Analyse du matériau
                  </Dialog.Title>
                  {analysis ? (
                    <Badge
                      colorPalette={qualityPalette}
                      variant="subtle"
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                      fontSize="2xs"
                      fontWeight="700"
                    >
                      {qualityLabel}
                    </Badge>
                  ) : isAnalysisLoading ? (
                    <Badge colorPalette="blue" variant="subtle" px={2.5} py={0.5} borderRadius="full" fontSize="2xs">
                      En cours…
                    </Badge>
                  ) : null}
                </HStack>
                <IconButton
                  aria-label="Fermer"
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  onClick={() => setAnalysisOpen(false)}
                  color="var(--color-text-muted)"
                >
                  <X size={16} />
                </IconButton>
              </HStack>
            </Dialog.Header>

            <Dialog.Body px={6} py={5} overflowY="auto" flex={1} minHeight={0}>
              {isAnalysisLoading ? (
                <Text color="var(--color-text-muted)" fontSize="sm">
                  Analyse du matériau en cours…
                </Text>
              ) : analysisError ? (
                <Text color="red.600" fontSize="sm">{analysisError}</Text>
              ) : analysis ? (
                <InterviewAnalysisContent analysis={analysis} analysisHref={analysisHref} />
              ) : null}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
