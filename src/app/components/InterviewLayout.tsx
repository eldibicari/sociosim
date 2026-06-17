"use client";

import type { RefObject } from "react";
import type { BoxProps } from "@chakra-ui/react";
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowRight, BookOpen, FileDown, Menu as MenuIcon, Sparkles, User, Volume2, VolumeX, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { InterviewAnalysisContent } from "@/app/components/InterviewAnalysisContent";
import { InterviewGridPanel } from "@/app/components/InterviewGridPanel";
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

type RightTab = "profil" | "grille" | "analyse" | "export";

type InterviewLayoutProps = {
  agentDisplayName?: string;
  agentId?: string | null;
  userId?: string | null;
  agentDescription?: string | null;
  agentHasVoice?: boolean;
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

const AUTOPLAY_STORAGE_KEY = "mimesis.voice.autoplay";

export function InterviewLayout({
  agentDisplayName,
  agentId,
  userId,
  agentDescription,
  agentHasVoice = false,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("profil");

  const [autoplayVoice, setAutoplayVoice] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(AUTOPLAY_STORAGE_KEY);
    if (stored === "1") setAutoplayVoice(true);
  }, []);
  const toggleAutoplay = () => {
    setAutoplayVoice((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTOPLAY_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  // Identify the latest non-streaming assistant message — only that one
  // receives autoplay=true when the toggle is on.
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && !m.isStreaming) return i;
    }
    return -1;
  })();

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

  const openRight = (tab: RightTab) => {
    setRightTab(tab);
    setRightOpen(true);
  };

  const handleSuggestedQuestion = (question: string) => {
    setDraftMessage("");
    onSendMessage(question);
  };

  return (
    <Box
      flex={1}
      height="100%"
      display="flex"
      flexDirection="column"
      backgroundColor="var(--color-bg)"
      overflow="hidden"
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <Box
        height="52px"
        borderBottom="1px solid var(--color-border)"
        backgroundColor="var(--color-surface)"
        display="flex"
        alignItems="center"
        px={2}
        gap={1}
        flexShrink={0}
        zIndex={10}
        position="relative"
      >
        {/* Left: hamburger → left drawer */}
        <IconButton
          aria-label="Ouvrir le menu"
          size="sm"
          variant="ghost"
          borderRadius="lg"
          color="var(--color-text-muted)"
          _hover={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}
          onClick={() => setSidebarOpen(s => !s)}
        >
          <MenuIcon size={18} />
        </IconButton>

        {/* Center: persona identity */}
        <HStack flex={1} gap={2.5} justifyContent="center">
          {agentDisplayName ? (
            <>
              <Box
                width="28px"
                height="28px"
                borderRadius="8px"
                background="linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                boxShadow="0 2px 6px rgba(109,93,246,0.18)"
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

        {/* Right: action icons */}
        <HStack gap={0.5}>
          {/* Autoplay voice toggle (only if persona has a voice) */}
          {agentHasVoice ? (
            <IconButton
              aria-label={
                autoplayVoice
                  ? "Désactiver la lecture automatique"
                  : "Activer la lecture automatique"
              }
              title={
                autoplayVoice
                  ? "Lecture auto activée"
                  : "Lecture auto désactivée"
              }
              size="sm"
              variant="ghost"
              borderRadius="lg"
              color={autoplayVoice ? "var(--color-accent)" : "var(--color-text-muted)"}
              _hover={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}
              onClick={toggleAutoplay}
            >
              {autoplayVoice ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </IconButton>
          ) : null}

          {/* Grille */}
          <IconButton
            aria-label="Grille d'entretien"
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color="var(--color-text-muted)"
            _hover={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}
            onClick={() => openRight("grille")}
          >
            <BookOpen size={16} />
          </IconButton>

          {/* Analyse badge */}
          {hasAnalysis && messages.length > 0 ? (
            <Box
              as="button"
              display="flex"
              alignItems="center"
              gap={1.5}
              px={2}
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
              onClick={() => openRight("analyse")}
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

          {/* Export */}
          {!disableExport ? (
            <IconButton
              aria-label="Export"
              size="sm"
              variant="ghost"
              borderRadius="lg"
              color="var(--color-text-muted)"
              _hover={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}
              onClick={() => openRight("export")}
            >
              <FileDown size={16} />
            </IconButton>
          ) : null}

          {/* Profil persona */}
          {agentDisplayName ? (
            <IconButton
              aria-label="Profil du persona"
              size="sm"
              variant="ghost"
              borderRadius="lg"
              color="var(--color-text-muted)"
              _hover={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}
              onClick={() => openRight("profil")}
            >
              <User size={16} />
            </IconButton>
          ) : null}
        </HStack>
      </Box>

      {/* ── CHAT AREA ─────────────────────────────────── */}
      <Box
        display="flex"
        flexDirection="column"
        flex={1}
        minHeight={0}
        backgroundColor="var(--color-bg)"
        overflow="hidden"
      >
        {error ? (
          <Box px={4} py={2} backgroundColor="red.50" borderBottom="1px solid" borderColor="red.200" flexShrink={0}>
            <Text fontSize="sm" color="red.600">{error}</Text>
          </Box>
        ) : null}

        <Box
          display="flex"
          flexDirection="column"
          flex={1}
          minHeight={0}
          width="100%"
          maxWidth="820px"
          marginX="auto"
        >
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
                    background="var(--color-accent-soft)"
                    borderWidth="1px"
                    borderColor="var(--color-accent-border)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Sparkles size={24} color="var(--color-accent)" />
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
                              borderColor: "var(--color-accent-border)",
                              background: "var(--color-accent-muted)",
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
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    text={msg.text}
                    isStreaming={msg.isStreaming}
                    userName={userName}
                    agentName={agentNameForMessages}
                    timestamp={msg.timestamp}
                    agentId={agentId ?? null}
                    voiceEnabled={agentHasVoice}
                    autoplayVoice={autoplayVoice && index === lastAssistantIndex}
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

      {/* ── LEFT DRAWER (InterviewSidebar) ─────────────── */}
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
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(s => !s)}
      />

      {/* ── RIGHT DRAWER ───────────────────────────────── */}
      {rightOpen ? (
        <Box
          position="fixed"
          inset={0}
          backgroundColor="rgba(15,23,42,0.12)"
          zIndex={20}
          onClick={() => setRightOpen(false)}
        />
      ) : null}

      <Box
        position="fixed"
        top={0}
        right={0}
        width="min(88vw, 380px)"
        height="100dvh"
        backgroundColor="var(--color-surface)"
        borderLeft="1px solid var(--color-border)"
        zIndex={25}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        boxShadow="var(--color-shadow-float)"
        style={{
          transform: rightOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Right drawer header */}
        <Box
          height="52px"
          borderBottom="1px solid var(--color-border)"
          display="flex"
          alignItems="center"
          px={4}
          gap={2}
          flexShrink={0}
        >
          <HStack gap={1} flex={1}>
            {(["profil", "grille", "analyse", "export"] as RightTab[]).map((tab) => (
              <Box
                key={tab}
                as="button"
                px={2.5}
                py={1}
                borderRadius="lg"
                fontSize="xs"
                fontWeight="600"
                cursor="pointer"
                transition="all 0.15s ease"
                background={rightTab === tab ? "var(--color-accent-muted)" : "transparent"}
                color={rightTab === tab ? "var(--color-accent)" : "var(--color-text-muted)"}
                _hover={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}
                onClick={() => setRightTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Box>
            ))}
          </HStack>
          <IconButton
            aria-label="Fermer"
            size="sm"
            variant="ghost"
            borderRadius="full"
            color="var(--color-text-muted)"
            onClick={() => setRightOpen(false)}
          >
            <X size={16} />
          </IconButton>
        </Box>

        {/* Right drawer content */}
        <Box flex={1} overflowY="auto" className="soft-scrollbar">

          {/* PROFIL */}
          {rightTab === "profil" ? (
            <VStack alignItems="stretch" gap={0} p={5}>
              {agentDisplayName ? (
                <>
                  <Box
                    width="56px"
                    height="56px"
                    borderRadius="16px"
                    background="linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb={3}
                    boxShadow="0 4px 16px rgba(109,93,246,0.22)"
                  >
                    <Text fontSize="xl" fontWeight="800" color="white" lineHeight="1">
                      {agentDisplayName.charAt(0).toUpperCase()}
                    </Text>
                  </Box>
                  <Text fontWeight="800" fontSize="lg" color="var(--color-text-primary)" letterSpacing="-0.02em" mb={0.5}>
                    {agentDisplayName}
                  </Text>
                  {dateDisplay ? (
                    <Text fontSize="xs" color="var(--color-text-muted)" mb={4}>{dateDisplay}</Text>
                  ) : null}
                  {agentDescription ? (
                    <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.75" whiteSpace="pre-wrap">
                      {agentDescription.replace(/\\n/g, "\n")}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text fontSize="sm" color="var(--color-text-muted)">Aucune information de persona disponible.</Text>
              )}
            </VStack>
          ) : null}

          {/* GRILLE */}
          {rightTab === "grille" ? (
            <VStack alignItems="stretch" gap={4} p={5}>
              <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">Grille d&apos;entretien</Text>
              <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.7">
                Consultez les thèmes et questions de relance définis pour ce persona.
              </Text>
              <InterviewGridPanel agentId={agentId ?? null} />
            </VStack>
          ) : null}

          {/* ANALYSE — vue condensée adaptée au drawer */}
          {rightTab === "analyse" ? (
            <VStack alignItems="stretch" gap={4} p={5}>
              {/* En-tête */}
              <HStack gap={2} flexWrap="wrap">
                <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">Analyse du matériau</Text>
                {analysis ? (
                  <Badge colorPalette={qualityPalette} variant="subtle" px={2} py={0.5} borderRadius="full" fontSize="2xs" fontWeight="700">
                    {qualityLabel}
                  </Badge>
                ) : isAnalysisLoading ? (
                  <Badge colorPalette="purple" variant="subtle" px={2} py={0.5} borderRadius="full" fontSize="2xs">En cours…</Badge>
                ) : null}
              </HStack>

              {isAnalysisLoading ? (
                <Text color="var(--color-text-muted)" fontSize="sm">Analyse en cours…</Text>
              ) : analysisError ? (
                <Text color="red.600" fontSize="sm">{analysisError}</Text>
              ) : analysis ? (
                <VStack alignItems="stretch" gap={4}>
                  {/* Score */}
                  <Badge
                    colorPalette={analysis.material_quality === "exploitable" ? "green" : analysis.material_quality === "partiel" ? "orange" : "blue"}
                    variant="subtle"
                    alignSelf="flex-start"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                  >
                    Score {analysis.score_breakdown.total_score} / {analysis.score_breakdown.max_score}
                  </Badge>

                  {/* Feedback */}
                  <VStack alignItems="stretch" gap={1}>
                    <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)" lineHeight="1.4">
                      {analysis.feedback_title}
                    </Text>
                    <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.65">
                      {analysis.summary_line}
                    </Text>
                  </VStack>

                  {/* Indicateurs clés — 2 colonnes */}
                  <VStack alignItems="stretch" gap={2}>
                    <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color="var(--color-text-muted)">
                      Indicateurs
                    </Text>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                      {([
                        ["Messages", analysis.metrics.student_messages],
                        ["Mots produits", analysis.metrics.student_words],
                        ["Rép. longues", analysis.metrics.long_answers],
                        ["Questions ouvertes", `${analysis.metrics.open_question_ratio_percent}%`],
                      ] as [string, string | number][]).map(([label, value]) => (
                        <Box
                          key={label}
                          p={3}
                          borderRadius="12px"
                          backgroundColor="var(--color-surface-muted)"
                          borderWidth="1px"
                          borderColor="var(--color-border)"
                        >
                          <Text fontSize="2xs" color="var(--color-text-muted)" mb={0.5}>{label}</Text>
                          <Text fontSize="md" fontWeight="700" color="var(--color-text-primary)">{value}</Text>
                        </Box>
                      ))}
                    </Box>
                  </VStack>

                  {/* Points forts / limites */}
                  {analysis.strengths.length > 0 ? (
                    <VStack alignItems="stretch" gap={1.5}>
                      <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color="#10b981">
                        Ce qui est déjà bien
                      </Text>
                      {analysis.strengths.map((s) => (
                        <Text key={s} fontSize="sm" color="var(--color-text-muted)" lineHeight="1.6">
                          · {s}
                        </Text>
                      ))}
                    </VStack>
                  ) : null}

                  {analysis.limits.length > 0 ? (
                    <VStack alignItems="stretch" gap={1.5}>
                      <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color="#f59e0b">
                        Ce qui manque encore
                      </Text>
                      {analysis.limits.map((l) => (
                        <Text key={l} fontSize="sm" color="var(--color-text-muted)" lineHeight="1.6">
                          · {l}
                        </Text>
                      ))}
                    </VStack>
                  ) : null}

                  {/* Coaching tip */}
                  <Box
                    p={3}
                    borderRadius="12px"
                    backgroundColor="var(--color-accent-muted)"
                    borderWidth="1px"
                    borderColor="var(--color-accent-border)"
                  >
                    <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color="var(--color-accent)" mb={1}>
                      Prochain geste
                    </Text>
                    <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.65">
                      {analysis.coaching_tip}
                    </Text>
                  </Box>

                  {/* Lien analyse complète */}
                  {currentInterviewId ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      borderRadius="xl"
                      width="100%"
                    >
                      <a href={`/interview/${currentInterviewId}/analysis`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        Voir l&apos;analyse complète
                        <ArrowRight size={14} />
                      </a>
                    </Button>
                  ) : null}
                </VStack>
              ) : (
                <Text color="var(--color-text-muted)" fontSize="sm" lineHeight="1.6">
                  L&apos;analyse apparaîtra ici une fois l&apos;entretien commencé.
                </Text>
              )}
            </VStack>
          ) : null}

          {/* EXPORT */}
          {rightTab === "export" ? (
            <VStack alignItems="stretch" gap={3} p={5}>
              <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">Exporter l&apos;entretien</Text>
              <Button
                onClick={onExportPdf}
                loading={isExportingPdf}
                disabled={disableExport}
                size="sm"
                borderRadius="xl"
                variant="outline"
                width="100%"
                justifyContent="flex-start"
                gap={2}
              >
                <FileDown size={14} />
                Exporter en PDF
              </Button>
              {onExportGoogleDocs ? (
                <Button
                  onClick={onExportGoogleDocs}
                  loading={isExportingGoogleDocs}
                  disabled={disableExport}
                  size="sm"
                  borderRadius="xl"
                  variant="outline"
                  width="100%"
                  justifyContent="flex-start"
                  gap={2}
                >
                  <FileDown size={14} />
                  Exporter vers Google Docs
                </Button>
              ) : null}
              {disableExport ? (
                <Text fontSize="xs" color="var(--color-text-muted)">
                  L&apos;export sera disponible une fois l&apos;entretien démarré.
                </Text>
              ) : null}
            </VStack>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
