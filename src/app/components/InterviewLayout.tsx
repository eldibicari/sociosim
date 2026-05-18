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
import { useEffect, useState } from "react";
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

type RecentItem = {
  id: string;
  title: string;
  agentName: string;
  date: string;
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
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const router = useRouter();
  const { user, user_admin } = useAuthUser();

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

  const userInitial = (displayUserName[0] ?? "U").toUpperCase();

  useEffect(() => {
    if (!historyUserId) return;
    let mounted = true;
    fetch(`/api/user/interviews?userId=${historyUserId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !Array.isArray(data?.interviews)) return;
        const items: RecentItem[] = (
          data.interviews as Array<{
            id: string;
            updated_at?: string;
            agents?: { agent_name?: string };
            messages?: Array<{ role?: string; content?: string }>;
          }>
        )
          .filter((item) => item.id && item.messages && item.messages.length > 0)
          .slice(0, 6)
          .map((item) => {
            const firstUser = item.messages?.find((m) => m.role === "user")?.content ?? "";
            const title =
              firstUser.length > 0
                ? firstUser.length > 46
                  ? firstUser.slice(0, 44) + "…"
                  : firstUser
                : (item.agents?.agent_name ?? "Entretien");
            const date = item.updated_at
              ? new Date(item.updated_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                })
              : "";
            return { id: item.id, title, agentName: item.agents?.agent_name ?? "", date };
          });
        setRecentItems(items);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [historyUserId]);

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
      {/* ── HEADER ──────────────────────────────────────── */}
      <Box
        height="52px"
        borderBottom="1px solid var(--color-border)"
        backgroundColor="var(--color-surface)"
        display="flex"
        alignItems="center"
        px={3}
        gap={2}
        flexShrink={0}
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
          <Menu size={17} />
        </IconButton>

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
            <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">
              Entretien
            </Text>
          )}
        </HStack>

        {/* Analysis indicator badge */}
        {hasAnalysis && messages.length > 0 ? (
          <Box
            as="button"
            display="flex"
            alignItems="center"
            gap={1.5}
            px={2.5}
            py={1}
            borderRadius="full"
            background={analysis ? "rgba(16,185,129,0.08)" : "rgba(148,163,184,0.1)"}
            borderWidth="1px"
            borderColor={analysis ? "rgba(16,185,129,0.2)" : "rgba(148,163,184,0.2)"}
            cursor="pointer"
            onClick={() => { setRightOpen(true); setAnalysisOpen(true); }}
            transition="all 0.15s ease"
            _hover={{ background: "rgba(16,185,129,0.14)" }}
          >
            <Box
              width="6px"
              height="6px"
              borderRadius="full"
              background={analysis ? "#10b981" : isAnalysisLoading ? "#f59e0b" : "#94a3b8"}
            />
            <Text fontSize="2xs" fontWeight="600" color="var(--color-text-muted)">
              {isAnalysisLoading ? "Analyse…" : analysis ? qualityLabel : "Analyse"}
            </Text>
          </Box>
        ) : null}

        <IconButton
          aria-label="Informations persona"
          size="sm"
          variant="ghost"
          borderRadius="full"
          onClick={() => setRightOpen(true)}
          color="var(--color-text-muted)"
          _hover={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
        >
          <Info size={17} />
        </IconButton>
      </Box>

      {/* ── CHAT AREA ───────────────────────────────────── */}
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
                    maxWidth: "580px",
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

      {/* ── LEFT DRAWER ─────────────────────────────────── */}
      <Box
        position="fixed"
        inset={0}
        backgroundColor="rgba(0,0,0,0.3)"
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
        width="272px"
        backgroundColor="var(--color-surface)"
        borderRight="1px solid var(--color-border)"
        zIndex={105}
        display="flex"
        flexDirection="column"
        style={{
          transform: leftOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Drawer header */}
        <HStack justify="space-between" align="center" px={4} py={3} borderBottom="1px solid var(--color-border)" flexShrink={0}>
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
            aria-label="Fermer"
            size="sm"
            variant="ghost"
            borderRadius="full"
            onClick={() => setLeftOpen(false)}
            color="var(--color-text-muted)"
          >
            <X size={16} />
          </IconButton>
        </HStack>

        <Box flex={1} minHeight={0} overflowY="auto" display="flex" flexDirection="column" gap={0}>
          {/* New interview button */}
          <Box px={3} pt={4} pb={2}>
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
              <Plus size={14} />
              Nouvel entretien
            </Button>
          </Box>

          {/* Navigation */}
          <Box px={3} pt={2} pb={1}>
            <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)" px={2} mb={1}>
              Navigation
            </Text>
            <VStack gap={0.5} align="stretch">
              {navItems.map(({ label, href, icon: Icon }) => (
                <HStack
                  key={href}
                  gap={3}
                  px={2}
                  py="0.5rem"
                  borderRadius="8px"
                  cursor="pointer"
                  color="var(--color-text-muted)"
                  fontSize="sm"
                  transition="background 0.12s, color 0.12s"
                  _hover={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
                  onClick={() => { setLeftOpen(false); router.push(href); }}
                >
                  <Icon size={15} />
                  <Text>{label}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>

          {/* Recent interviews */}
          {recentItems.length > 0 ? (
            <Box px={3} pt={3} pb={1} borderTop="1px solid var(--color-border)" mt={1}>
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)" px={2} mb={1}>
                Récents
              </Text>
              <VStack gap={0.5} align="stretch">
                {recentItems.map((item) => (
                  <Box
                    key={item.id}
                    px={2}
                    py="0.45rem"
                    borderRadius="8px"
                    cursor="pointer"
                    transition="background 0.12s"
                    _hover={{ background: "var(--color-surface-muted)" }}
                    onClick={() => { setLeftOpen(false); router.push(`/interview/${item.id}`); }}
                  >
                    <Text
                      fontSize="xs"
                      color={currentInterviewId === item.id ? "var(--color-accent)" : "var(--color-text-primary)"}
                      fontWeight={currentInterviewId === item.id ? "600" : "400"}
                      lineHeight="1.4"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {item.title}
                    </Text>
                    {item.agentName ? (
                      <Text fontSize="2xs" color="var(--color-text-muted)" mt="1px">
                        {item.agentName}{item.date ? ` · ${item.date}` : ""}
                      </Text>
                    ) : null}
                  </Box>
                ))}
              </VStack>
            </Box>
          ) : null}
        </Box>

        {/* Account section */}
        {user ? (
          <Box px={3} py={3} borderTop="1px solid var(--color-border)" flexShrink={0}>
            <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)" px={2} mb={1.5}>
              Compte
            </Text>
            <VStack gap={0.5} align="stretch">
              <HStack
                gap={2.5}
                px={2}
                py="0.5rem"
                borderRadius="8px"
                cursor="pointer"
                fontSize="sm"
                color="var(--color-text-muted)"
                _hover={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
                onClick={() => { setLeftOpen(false); router.push("/profile"); }}
              >
                <Box
                  width="22px"
                  height="22px"
                  borderRadius="50%"
                  background="var(--color-accent-muted)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Text fontSize="2xs" fontWeight="700" color="var(--color-accent)">
                    {userInitial}
                  </Text>
                </Box>
                <Text
                  fontWeight="500"
                  fontSize="sm"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  flex={1}
                >
                  {displayUserName}
                </Text>
              </HStack>

              <HStack
                gap={2.5}
                px={2}
                py="0.5rem"
                borderRadius="8px"
                cursor="pointer"
                fontSize="sm"
                color="var(--color-text-muted)"
                _hover={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
                onClick={handleLogout}
              >
                <LogOut size={14} />
                <Text fontSize="sm">Déconnexion</Text>
              </HStack>
            </VStack>
          </Box>
        ) : null}
      </Box>

      {/* ── RIGHT DRAWER ─────────────────────────────────── */}
      <Box
        position="fixed"
        inset={0}
        backgroundColor="rgba(0,0,0,0.3)"
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
        style={{
          transform: rightOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Drawer header */}
        <HStack justify="space-between" align="center" px={4} py={3} borderBottom="1px solid var(--color-border)" flexShrink={0}>
          <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">
            {agentDisplayName ?? "Persona"}
          </Text>
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

        <Box flex={1} minHeight={0} overflowY="auto" display="flex" flexDirection="column" gap={0}>
          {agentDisplayName ? (
            <>
              {/* Persona card */}
              <Box px={4} pt={4} pb={4} borderBottom="1px solid var(--color-border)">
                <HStack gap={3} align="flex-start">
                  <Box
                    width="48px"
                    height="48px"
                    borderRadius="14px"
                    background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    boxShadow="0 3px 10px rgba(99,102,241,0.22)"
                  >
                    <Text fontSize="lg" fontWeight="700" color="white" lineHeight="1">
                      {agentDisplayName.charAt(0).toUpperCase()}
                    </Text>
                  </Box>
                  <VStack align="flex-start" gap={1} flex={1} minWidth={0}>
                    <Badge
                      colorPalette="blue"
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="2xs"
                      fontWeight="700"
                    >
                      Persona active
                    </Badge>
                    <Text fontWeight="700" fontSize="md" color="var(--color-text-primary)" letterSpacing="-0.01em" lineHeight="1.2">
                      {agentDisplayName}
                    </Text>
                    {agentDescription ? (
                      <Text
                        fontSize="xs"
                        color="var(--color-text-muted)"
                        lineHeight="1.6"
                        whiteSpace="pre-wrap"
                      >
                        {agentDescription.replace(/\\n/g, "\n")}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>

                {(userName || dateDisplay) ? (
                  <HStack gap={4} mt={3} flexWrap="wrap">
                    {userName ? (
                      <Box>
                        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="var(--color-text-muted)">Enquêteur</Text>
                        <Text fontSize="xs" fontWeight="600" color="var(--color-text-primary)" mt="2px">{userName}</Text>
                      </Box>
                    ) : null}
                    {dateDisplay ? (
                      <Box>
                        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="var(--color-text-muted)">Date</Text>
                        <Text fontSize="xs" fontWeight="600" color="var(--color-text-primary)" mt="2px">{dateDisplay}</Text>
                      </Box>
                    ) : null}
                  </HStack>
                ) : null}
              </Box>

              {/* Grille */}
              <Box px={4} py={3} borderBottom="1px solid var(--color-border)">
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)" mb={2}>
                  Grille d&apos;entretien
                </Text>
                <InterviewGridPanel agentId={agentId ?? null} />
              </Box>

              {/* Analyse */}
              {hasAnalysis && messages.length > 0 ? (
                <Box px={4} py={3} borderBottom="1px solid var(--color-border)">
                  <Box
                    as="button"
                    width="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    onClick={() => setAnalysisOpen((v) => !v)}
                    mb={analysisOpen ? 3 : 0}
                    cursor="pointer"
                  >
                    <HStack gap={2}>
                      <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)">
                        Analyse
                      </Text>
                      {analysis ? (
                        <Badge colorPalette={qualityPalette} variant="subtle" px={2} py={0.5} borderRadius="full" fontSize="2xs" fontWeight="700">
                          {qualityLabel}
                        </Badge>
                      ) : isAnalysisLoading ? (
                        <Badge colorPalette="blue" variant="subtle" px={2} py={0.5} borderRadius="full" fontSize="2xs">
                          En cours…
                        </Badge>
                      ) : null}
                    </HStack>
                    <Box
                      color="var(--color-text-muted)"
                      style={{ transform: analysisOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <ChevronDown size={14} />
                    </Box>
                  </Box>
                  {analysisOpen ? (
                    <Box>
                      {isAnalysisLoading ? (
                        <Text fontSize="xs" color="var(--color-text-muted)">Analyse en cours…</Text>
                      ) : analysisError ? (
                        <Text fontSize="xs" color="red.600">{analysisError}</Text>
                      ) : analysis ? (
                        <InterviewAnalysisContent analysis={analysis} analysisHref={analysisHref} />
                      ) : null}
                    </Box>
                  ) : null}
                </Box>
              ) : null}

              {/* Export */}
              <Box px={4} py={3} borderBottom="1px solid var(--color-border)">
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)" mb={2}>
                  Export
                </Text>
                <VStack gap={1.5} align="stretch">
                  <Button
                    size="sm"
                    variant="outline"
                    borderRadius="8px"
                    onClick={onExportPdf}
                    loading={isExportingPdf}
                    disabled={disableExport}
                    fontWeight="500"
                    fontSize="xs"
                    height="34px"
                  >
                    Exporter en PDF
                  </Button>
                  {onExportGoogleDocs ? (
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="8px"
                      onClick={onExportGoogleDocs}
                      loading={isExportingGoogleDocs}
                      disabled={disableExport}
                      fontWeight="500"
                      fontSize="xs"
                      height="34px"
                    >
                      Google Docs
                    </Button>
                  ) : null}
                </VStack>
              </Box>

              {/* Stats */}
              {stats.answeredQuestions > 0 ? (
                <Box px={4} py={3}>
                  <Text fontSize="2xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color="var(--color-text-muted)" mb={2}>
                    Statistiques
                  </Text>
                  <HStack gap={2}>
                    <Box
                      flex="1"
                      px={3}
                      py={2}
                      borderRadius="10px"
                      background="rgba(99,102,241,0.05)"
                      borderWidth="1px"
                      borderColor="rgba(99,102,241,0.1)"
                    >
                      <Text fontSize="2xs" color="var(--color-text-muted)" fontWeight="600">Réponses</Text>
                      <Text
                        fontWeight="800"
                        fontSize="lg"
                        lineHeight="1.2"
                        mt="2px"
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
                      borderRadius="10px"
                      background="rgba(16,185,129,0.05)"
                      borderWidth="1px"
                      borderColor="rgba(16,185,129,0.1)"
                    >
                      <Text fontSize="2xs" color="var(--color-text-muted)" fontWeight="600">Tokens</Text>
                      <Text fontSize="sm" fontWeight="700" color="var(--color-text-primary)" mt="2px">
                        {stats.inputTokens + stats.outputTokens > 0
                          ? `${stats.inputTokens + stats.outputTokens}`
                          : "—"}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ) : null}
            </>
          ) : (
            <Box px={4} py={6}>
              <Text fontSize="sm" color="var(--color-text-muted)">Chargement du persona…</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
