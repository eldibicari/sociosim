"use client";

import type { RefObject } from "react";
import type { BoxProps } from "@chakra-ui/react";
import {
  Badge,
  Box,
  Button,
  Collapsible,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  BookOpen,
  ChevronDown,
  Info,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewAnalysisContent } from "@/app/components/InterviewAnalysisContent";
import { InterviewGridPanel } from "@/app/components/InterviewGridPanel";
import { AssistantSkeleton } from "@/components/AssistantSkeleton";
import { ChatMessage } from "@/components/ChatMessage";
import { MessageInput } from "@/components/MessageInput";
import { authService } from "@/lib/authService";
import { useAuthUser } from "@/hooks/useAuthUser";
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

const NAV_ITEMS = [
  { label: "Découvrir", href: "/personnas", icon: Users },
  { label: "Mes entretiens", href: "/interviews", icon: MessageSquare },
  { label: "Guide", href: "/guide-entretien", icon: BookOpen },
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
  historyUserId: _historyUserId,
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
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const router = useRouter();
  const { user, user_admin } = useAuthUser();

  const showSuggestions =
    showInput && messages.length === 0 && !isStreaming && draftMessage.trim().length === 0;
  const showAnalysisPanel =
    messages.length > 0 && (isAnalysisLoading || !!analysis || !!analysisError);

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

  async function handleLogout() {
    await authService.signOutLocal();
    router.push("/login");
  }

  const navItems = user_admin
    ? [...NAV_ITEMS, { label: "Gestion utilisateurs", href: "/manage-users", icon: Settings }]
    : NAV_ITEMS;

  const displayUserName =
    user?.user_metadata?.firstName ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Utilisateur";

  return (
    <Box
      height="100%"
      flex={1}
      minHeight={0}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      backgroundColor="var(--color-bg)"
    >

      {/* ── HEADER ─────────────────────────────────────── */}
      <Box
        height="52px"
        borderBottom="1px solid var(--color-border)"
        backgroundColor="var(--color-surface)"
        display="flex"
        alignItems="center"
        px={4}
        gap={3}
        flexShrink={0}
        boxShadow="0 1px 0 rgba(26,26,46,0.04)"
      >
        <IconButton
          aria-label="Ouvrir le menu"
          size="sm"
          variant="ghost"
          borderRadius="full"
          onClick={() => setLeftOpen(true)}
          color="var(--color-text-muted)"
          _hover={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
        >
          <Menu size={18} />
        </IconButton>

        <HStack flex={1} gap={3} justifyContent="center">
          {agentDisplayName ? (
            <>
              <Box
                width="32px"
                height="32px"
                borderRadius="10px"
                background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                boxShadow="0 2px 6px rgba(99,102,241,0.2)"
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
                    {isStreaming ? "En train de répondre..." : "Disponible"}
                  </Text>
                </HStack>
              </VStack>
            </>
          ) : (
            <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">Entretien</Text>
          )}
        </HStack>

        <IconButton
          aria-label="Informations persona"
          size="sm"
          variant="ghost"
          borderRadius="full"
          onClick={() => setRightOpen(true)}
          color="var(--color-text-muted)"
          _hover={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
        >
          <Info size={18} />
        </IconButton>
      </Box>

      {/* ── CHAT AREA ──────────────────────────────────── */}
      <Box flex={1} minHeight={0} overflow="hidden" display="flex" flexDirection="column">
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
            <Box px={4} py={3} backgroundColor="red.50" borderBottom="1px solid" borderColor="red.200">
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "24px",
                    width: "100%",
                    maxWidth: "600px",
                  }}
                >
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

                  <VStack gap={2} alignItems="center">
                    <Badge
                      colorPalette="orange"
                      variant="subtle"
                      borderRadius="full"
                      px={4}
                      py={1.5}
                      fontSize="xs"
                      fontWeight="700"
                      letterSpacing="0.06em"
                    >
                      Entretien semi-directif
                    </Badge>
                    <Text
                      color="var(--color-text-primary)"
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

                  {showSuggestions ? (
                    <VStack gap={2.5} width="100%" maxWidth="520px">
                      <Text
                        fontSize="2xs"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        textTransform="uppercase"
                        color="var(--color-text-muted)"
                      >
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
                              <Text
                                fontSize="sm"
                                fontWeight="600"
                                color="var(--color-text-primary)"
                                lineHeight="1.5"
                              >
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
                      boxShadow={isAnalysisOpen
                        ? "0 4px 16px rgba(99,102,241,0.08)"
                        : "0 2px 8px rgba(15,23,42,0.04)"}
                      _hover={{
                        borderColor: "rgba(99,102,241,0.25)",
                        background: "linear-gradient(135deg, rgba(239,246,255,0.9), rgba(237,233,254,0.7))",
                      }}
                    >
                      <HStack justify="space-between" align="center" width="100%">
                        <HStack gap={3} flexWrap="wrap">
                          <Text
                            fontWeight="700"
                            fontSize="sm"
                            letterSpacing="-0.01em"
                            color="var(--color-text-primary)"
                          >
                            Analyse du matériau
                          </Text>
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
                            <Badge
                              colorPalette="blue"
                              variant="subtle"
                              px={2.5}
                              py={0.5}
                              borderRadius="full"
                              fontSize="2xs"
                            >
                              En cours...
                            </Badge>
                          ) : null}
                        </HStack>
                        <Box
                          color="var(--color-text-muted)"
                          transition="transform 0.2s ease"
                          style={{ transform: isAnalysisOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                        >
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
                        <Text color="var(--color-text-muted)" fontSize="sm">
                          Analyse du matériau en cours...
                        </Text>
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

      {/* ── LEFT DRAWER ────────────────────────────────── */}
      <Box
        position="fixed"
        inset={0}
        backgroundColor="rgba(0,0,0,0.35)"
        zIndex={100}
        opacity={leftOpen ? 1 : 0}
        pointerEvents={leftOpen ? "auto" : "none"}
        transition="opacity 0.2s ease"
        onClick={() => setLeftOpen(false)}
      />
      <Box
        position="fixed"
        left={0}
        top={0}
        bottom={0}
        width="280px"
        backgroundColor="var(--color-surface)"
        borderRight="1px solid var(--color-border)"
        zIndex={105}
        display="flex"
        flexDirection="column"
        padding="1.25rem 0.75rem"
        style={{
          transform: leftOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <HStack justify="space-between" align="center" px={2} mb={5}>
          <Text
            className="mimesis-wordmark"
            fontSize="lg"
            fontWeight="800"
            letterSpacing="-0.03em"
            cursor="pointer"
            onClick={() => router.push("/")}
          >
            Mimesis
          </Text>
          <IconButton
            aria-label="Fermer le menu"
            size="sm"
            variant="ghost"
            borderRadius="full"
            onClick={() => setLeftOpen(false)}
            color="var(--color-text-muted)"
          >
            <X size={16} />
          </IconButton>
        </HStack>

        <Box px={1} mb={4}>
          <Button
            width="100%"
            size="sm"
            background="var(--color-accent)"
            color="white"
            borderRadius="10px"
            fontWeight="600"
            fontSize="sm"
            gap={2}
            _hover={{ background: "var(--color-accent-hover)" }}
            onClick={() => { setLeftOpen(false); router.push("/personnas"); }}
          >
            <Plus size={15} />
            Nouvel entretien
          </Button>
        </Box>

        <VStack gap={1} align="stretch" flex={1}>
          {navItems.map(({ label, href, icon: Icon }) => (
            <HStack
              key={href}
              gap={3}
              px={3}
              py="0.55rem"
              borderRadius="10px"
              cursor="pointer"
              color="var(--color-text-muted)"
              fontSize="sm"
              transition="background 0.15s, color 0.15s"
              _hover={{
                background: "var(--color-surface-muted)",
                color: "var(--color-text-primary)",
              }}
              onClick={() => { setLeftOpen(false); router.push(href); }}
            >
              <Icon size={16} />
              <Text>{label}</Text>
            </HStack>
          ))}
        </VStack>

        {user ? (
          <VStack gap={1} align="stretch" pt={3} borderTop="1px solid var(--color-border)">
            <HStack
              gap={3}
              px={3}
              py="0.55rem"
              borderRadius="10px"
              cursor="pointer"
              fontSize="sm"
              color="var(--color-text-muted)"
              _hover={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
              onClick={() => { setLeftOpen(false); router.push("/profile"); }}
            >
              <Box
                width="24px"
                height="24px"
                borderRadius="50%"
                background="var(--color-accent-muted)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Text fontSize="xs" fontWeight="700" color="var(--color-accent)">
                  {displayUserName[0].toUpperCase()}
                </Text>
              </Box>
              <Text
                fontWeight="500"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {displayUserName}
              </Text>
            </HStack>

            <HStack
              gap={3}
              px={3}
              py="0.5rem"
              borderRadius="10px"
              cursor="pointer"
              fontSize="sm"
              color="var(--color-text-muted)"
              _hover={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <Text>Déconnexion</Text>
            </HStack>
          </VStack>
        ) : null}
      </Box>

      {/* ── RIGHT DRAWER ───────────────────────────────── */}
      <Box
        position="fixed"
        inset={0}
        backgroundColor="rgba(0,0,0,0.35)"
        zIndex={100}
        opacity={rightOpen ? 1 : 0}
        pointerEvents={rightOpen ? "auto" : "none"}
        transition="opacity 0.2s ease"
        onClick={() => setRightOpen(false)}
      />
      <Box
        position="fixed"
        right={0}
        top={0}
        bottom={0}
        width="300px"
        backgroundColor="var(--color-surface)"
        borderLeft="1px solid var(--color-border)"
        zIndex={105}
        display="flex"
        flexDirection="column"
        padding={5}
        gap={5}
        overflowY="auto"
        style={{
          transform: rightOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <HStack justify="space-between" align="center">
          <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">Persona</Text>
          <IconButton
            aria-label="Fermer"
            size="sm"
            variant="ghost"
            borderRadius="full"
            onClick={() => setRightOpen(false)}
            color="var(--color-text-muted)"
          >
            <X size={16} />
          </IconButton>
        </HStack>

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
              <Text
                fontWeight="800"
                fontSize="md"
                color="var(--color-text-primary)"
                letterSpacing="-0.02em"
                lineHeight="1.3"
              >
                {agentDisplayName}
              </Text>
              {agentDescription ? (
                <Text
                  fontSize="xs"
                  color="var(--color-text-muted)"
                  lineHeight="1.65"
                  mt={0.5}
                  whiteSpace="pre-wrap"
                >
                  {agentDescription.replace(/\\n/g, "\n")}
                </Text>
              ) : null}
            </VStack>

            {(userName || dateDisplay) ? (
              <HStack gap={3} flexWrap="wrap">
                {userName ? (
                  <Box flex="1">
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="var(--color-text-muted)"
                    >
                      Enquêteur
                    </Text>
                    <Text fontSize="xs" fontWeight="600" color="var(--color-text-primary)" mt={0.5}>
                      {userName}
                    </Text>
                  </Box>
                ) : null}
                {dateDisplay ? (
                  <Box flex="1">
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="var(--color-text-muted)"
                    >
                      Date
                    </Text>
                    <Text fontSize="xs" fontWeight="600" color="var(--color-text-primary)" mt={0.5}>
                      {dateDisplay}
                    </Text>
                  </Box>
                ) : null}
              </HStack>
            ) : null}

            <Box height="1px" backgroundColor="var(--color-border)" />

            <InterviewGridPanel agentId={agentId ?? null} />

            <Box height="1px" backgroundColor="var(--color-border)" />

            <VStack align="stretch" gap={2}>
              <Text
                fontSize="2xs"
                fontWeight="700"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="var(--color-text-muted)"
              >
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

            {stats.answeredQuestions > 0 || stats.inputTokens > 0 ? (
              <>
                <Box height="1px" backgroundColor="var(--color-border)" />
                <HStack gap={3}>
                  <Box
                    flex="1"
                    px={3}
                    py={2}
                    borderRadius="12px"
                    background="rgba(99,102,241,0.05)"
                    borderWidth="1px"
                    borderColor="rgba(99,102,241,0.1)"
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="var(--color-text-muted)"
                    >
                      Réponses
                    </Text>
                    <Text
                      fontWeight="900"
                      fontSize="xl"
                      letterSpacing="-0.03em"
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {stats.answeredQuestions}
                    </Text>
                  </Box>
                  <Box
                    flex="1"
                    px={3}
                    py={2}
                    borderRadius="12px"
                    background="rgba(16,185,129,0.05)"
                    borderWidth="1px"
                    borderColor="rgba(16,185,129,0.1)"
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="var(--color-text-muted)"
                    >
                      Tokens
                    </Text>
                    <Text fontSize="xs" fontWeight="700" color="var(--color-text-primary)" mt={0.5}>
                      {stats.inputTokens + stats.outputTokens > 0
                        ? `${stats.inputTokens + stats.outputTokens}`
                        : "—"}
                    </Text>
                  </Box>
                </HStack>
              </>
            ) : null}
          </VStack>
        ) : null}
      </Box>

    </Box>
  );
}
