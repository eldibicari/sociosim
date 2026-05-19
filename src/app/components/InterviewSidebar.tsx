"use client";

import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Link,
  Menu,
  Stack,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { InterviewGridPanel } from "@/app/components/InterviewGridPanel";
import {
  ArrowRight,
  BookOpenText,
  ChevronsLeft,
  CirclePlus,
  FileDown,
  FileText,
  Menu as MenuIcon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";

type InterviewStats = {
  answeredQuestions: number;
  inputTokens: number;
  outputTokens: number;
};

type HistoryItem = {
  id: string;
  title: string;
  agentName: string;
  date: string;
  qaCount: number;
  agentId?: string | null;
};

type HistoryMessage = {
  role?: string;
  content?: string;
  created_at?: string;
};

type SidebarPrefs = {
  customTitles: Record<string, string>;
  pinnedIds: string[];
};

const EMPTY_PREFS: SidebarPrefs = {
  customTitles: {},
  pinnedIds: [],
};

function buildHistoryTitle(messages: HistoryMessage[] | undefined, fallbackAgentName: string) {
  if (!messages || messages.length === 0) {
    return fallbackAgentName;
  }

  const firstUserMessage = [...messages]
    .sort((a, b) => {
      const dateA = new Date(a.created_at ?? 0).getTime();
      const dateB = new Date(b.created_at ?? 0).getTime();
      return dateA - dateB;
    })
    .find((message) => message.role === "user" && message.content?.trim());

  const content = firstUserMessage?.content?.trim();
  if (!content) {
    return fallbackAgentName;
  }

  const normalized = content.replace(/\s+/g, " ");
  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}

function getSidebarPrefsKey(historyUserId?: string | null, agentId?: string | null) {
  return `mimesis:interview-sidebar:${historyUserId ?? "anonymous"}:${agentId ?? "all"}`;
}

function formatRepliesLabel(count: number) {
  return `${count} ${count > 1 ? "réponses" : "réponse"}`;
}

function HistoryCard({
  item,
  title,
  isCurrent = false,
  isPinned = false,
  onRename,
  onTogglePin,
  onDelete,
  isDeleting,
}: {
  item: HistoryItem;
  title: string;
  isCurrent?: boolean;
  isPinned?: boolean;
  onRename: (item: HistoryItem) => void;
  onTogglePin: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  isDeleting: boolean;
}) {
  return (
    <Box
      padding={3}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={isCurrent ? "var(--color-accent-border)" : "var(--color-border)"}
      backgroundColor={isCurrent ? "var(--color-accent-soft)" : "var(--color-surface)"}
      boxShadow={
        isCurrent ? "0 12px 28px rgba(109, 93, 246, 0.10)" : "0 6px 18px rgba(15, 23, 42, 0.04)"
      }
      transition="transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease"
      _hover={{
        transform: "translateY(-1px)",
        boxShadow: isCurrent ? "0 14px 30px rgba(109, 93, 246, 0.14)" : "0 10px 22px rgba(15, 23, 42, 0.08)",
        borderColor: isCurrent ? "var(--color-accent)" : "var(--color-border-strong)",
      }}
    >
      <HStack justify="space-between" align="start" gap={3}>
        <Link
          as={NextLink}
          href={`/interview/${item.id}`}
          flex="1"
          minWidth={0}
          _hover={{ textDecoration: "none" }}
        >
          <Stack gap={1}>
            <HStack gap={2} flexWrap="wrap">
              {isCurrent ? (
                <Badge colorPalette="purple" variant="subtle" borderRadius="full">
                  Actuel
                </Badge>
              ) : null}
              {isPinned ? (
                <Badge colorPalette="purple" variant="subtle" borderRadius="full">
                  Epingle
                </Badge>
              ) : null}
            </HStack>
            <Text fontSize="sm" fontWeight="700" color="var(--color-text-primary)" lineClamp={2}>
              {title}
            </Text>
            <Text fontSize="xs" color="var(--color-text-muted)">
              {item.agentName}
            </Text>
            <Text fontSize="xs" color="var(--color-text-muted)">
              {item.date} · {formatRepliesLabel(item.qaCount)}
            </Text>
          </Stack>
        </Link>

        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger asChild>
            <IconButton
              aria-label={`Actions du chat ${title}`}
              size="2xs"
              variant="ghost"
              borderRadius="full"
              color={isCurrent ? "var(--color-accent)" : "var(--color-text-muted)"}
              _hover={{ backgroundColor: isCurrent ? "var(--color-accent-soft)" : "var(--color-surface-muted)" }}
            >
              <MoreHorizontal size={14} />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content minWidth="190px">
              <Menu.Item value={`rename-${item.id}`} onClick={() => onRename(item)}>
                <HStack gap={2}>
                  <Pencil size={14} />
                  <Text>Renommer</Text>
                </HStack>
              </Menu.Item>
              <Menu.Item value={`pin-${item.id}`} onClick={() => onTogglePin(item.id)}>
                <HStack gap={2}>
                  <Pin size={14} />
                  <Text>{isPinned ? "Desepingler" : "Epingler"}</Text>
                </HStack>
              </Menu.Item>
              <Menu.Item
                value={`delete-${item.id}`}
                color="red.600"
                onClick={() => onDelete(item.id)}
                disabled={isDeleting}
              >
                <HStack gap={2}>
                  <Trash2 size={14} />
                  <Text>Supprimer</Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </HStack>
    </Box>
  );
}

type InterviewSidebarProps = {
  agentDisplayName?: string;
  agentId?: string | null;
  userId?: string | null;
  agentDescription?: string | null;
  userName?: string;
  dateDisplay?: string;
  error?: string | null;
  stats: InterviewStats;
  isOpen?: boolean;
  onToggle?: () => void;
  historyUserId?: string | null;
  currentInterviewId?: string | null;
  onExportPdf: () => void;
  onExportGoogleDocs?: () => void;
  isExportingPdf?: boolean;
  isExportingGoogleDocs?: boolean;
  disableExport?: boolean;
};

export function InterviewSidebar({
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
  isExportingPdf = false,
  isExportingGoogleDocs = false,
  disableExport = false,
  isOpen,
  onToggle,
}: InterviewSidebarProps) {
  const [introHtml, setIntroHtml] = useState("");
  const [introPreview, setIntroPreview] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConversationFocus, setIsConversationFocus] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyAgentId, setHistoryAgentId] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sidebarPrefs, setSidebarPrefs] = useState<SidebarPrefs>(EMPTY_PREFS);
  const [newInterviewError, setNewInterviewError] = useState<string | null>(null);
  const isCompact = true;
  const router = useRouter();

  useEffect(() => {
    if (isOpen !== undefined) {
      setIsCollapsed(!isOpen);
    }
  }, [isOpen]);
  const prefsKey = useMemo(() => getSidebarPrefsKey(historyUserId, agentId), [historyUserId, agentId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(prefsKey);
      if (!raw) {
        setSidebarPrefs(EMPTY_PREFS);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<SidebarPrefs>;
      setSidebarPrefs({
        customTitles: parsed.customTitles ?? {},
        pinnedIds: Array.isArray(parsed.pinnedIds) ? parsed.pinnedIds : [],
      });
    } catch {
      setSidebarPrefs(EMPTY_PREFS);
    }
  }, [prefsKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(prefsKey, JSON.stringify(sidebarPrefs));
  }, [prefsKey, sidebarPrefs]);

  useEffect(() => {
    if (!historyUserId) return;
    let isMounted = true;

    const loadHistory = async () => {
      try {
        setHistoryError(null);
        const response = await fetch(`/api/user/interviews?userId=${historyUserId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = payload?.error ?? "Impossible de charger l'historique.";
          throw new Error(message);
        }

        const payload = (await response.json().catch(() => null)) as
          | {
              interviews?: Array<{
                id: string;
                agent_id?: string;
                updated_at?: string;
                started_at?: string;
                agents?: { agent_name?: string };
                messages?: Array<{ role?: string; content?: string; created_at?: string }>;
              }>;
            }
          | null;

        const interviews = payload?.interviews ?? [];
        const formatted = interviews
          .filter((item) => {
            if (!item.id) return false;
            if (!item.messages || item.messages.length === 0) return false;
            if (agentId && item.agent_id !== agentId) return false;
            return true;
          })
          .sort((a, b) => {
            const dateA = new Date(a.updated_at ?? a.started_at ?? 0).getTime();
            const dateB = new Date(b.updated_at ?? b.started_at ?? 0).getTime();
            return dateB - dateA;
          })
          .map((item) => {
            const rawName = item.agents?.agent_name ?? "Agent";
            const agentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            const title = buildHistoryTitle(item.messages, agentName);
            const dateValue = item.updated_at ?? item.started_at ?? "";
            const dateLabel = dateValue
              ? new Date(dateValue).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
              : "";
            const qaCount = (item.messages || []).filter((msg) => msg.role === "assistant").length;

            return {
              id: item.id,
              title,
              agentName,
              date: dateLabel,
              qaCount,
              agentId: item.agent_id ?? null,
            };
          });

        if (isMounted) {
          setHistoryItems(formatted);
          setHistoryAgentId(formatted[0]?.agentId ?? null);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Erreur inconnue";
        console.error("[Interview] Failed to load history:", message);
        if (isMounted) {
          setHistoryError(message);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [historyUserId, currentInterviewId, agentId]);

  useEffect(() => {
    let isMounted = true;

    async function loadIntro() {
      try {
        const response = await fetch("/docs/guide_entretien_court.md");
        if (!response.ok) {
          throw new Error("Impossible de charger le guide");
        }

        const markdown = await response.text();
        if (!isMounted) return;

        const lines = markdown.split(/\r?\n/);
        const firstLineIndex = lines.findIndex((line) => line.trim().length > 0);
        const previewLine = firstLineIndex >= 0 ? lines[firstLineIndex].trim() : "";
        const remainingLines = firstLineIndex >= 0 ? lines.slice(firstLineIndex + 1) : [];
        if (remainingLines[0]?.trim() === "") {
          remainingLines.shift();
        }

        const remainingMarkdown = remainingLines.join("\n");
        const parsed = remainingMarkdown.trim() ? await marked.parse(remainingMarkdown) : "";
        setIntroPreview(previewLine);
        setIntroHtml(parsed);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Erreur inconnue";
        console.error("[Interview] Failed to load guide:", message);
        if (isMounted) {
          setIntroPreview("");
          setIntroHtml("");
        }
      }
    }

    loadIntro();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNewInterview = async () => {
    if (!userId) {
      setNewInterviewError("Impossible de demarrer un entretien sans utilisateur.");
      return;
    }
    if (!agentId) {
      setNewInterviewError("Impossible de demarrer un entretien sans persona.");
      return;
    }

    try {
      setIsCreatingSession(true);
      setNewInterviewError(null);

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          agent_id: agentId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error ?? "Impossible de creer une nouvelle session.";
        throw new Error(message);
      }

      const data = await response.json();
      router.push(
        `/interview?interviewId=${data.interviewId}&sessionId=${data.sessionId}&adkSessionId=${data.adkSessionId}`
      );
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Erreur inconnue";
      console.error("[InterviewSidebar] Failed to start new interview:", message);
      setNewInterviewError(message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    const confirmed = window.confirm("Supprimer ce chat et son historique ?");
    if (!confirmed) {
      return;
    }

    try {
      setPendingDeleteId(interviewId);
      setHistoryError(null);

      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error ?? "Impossible de supprimer ce chat.";
        throw new Error(message);
      }

      setHistoryItems((items) => items.filter((item) => item.id !== interviewId));
      setSidebarPrefs((current) => {
        const customTitles = { ...current.customTitles };
        delete customTitles[interviewId];
        return {
          customTitles,
          pinnedIds: current.pinnedIds.filter((id) => id !== interviewId),
        };
      });

      if (currentInterviewId === interviewId) {
        router.push("/interviews");
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Erreur inconnue";
      console.error("[InterviewSidebar] Failed to delete interview:", message);
      setHistoryError(message);
    } finally {
      setPendingDeleteId(null);
    }
  };

  const currentHistoryItem = historyItems.find((item) => item.id === currentInterviewId) ?? null;
  const otherHistoryItems = historyItems.filter((item) => item.id !== currentInterviewId);
  const pinnedHistoryItems = otherHistoryItems.filter((item) => sidebarPrefs.pinnedIds.includes(item.id));
  const recentHistoryItems = otherHistoryItems.filter((item) => !sidebarPrefs.pinnedIds.includes(item.id));
  const getDisplayTitle = (item: HistoryItem) => {
    const override = sidebarPrefs.customTitles[item.id]?.trim();
    return override && override.length > 0 ? override : item.title;
  };
  const handleRenameInterview = (item: HistoryItem) => {
    const nextTitle = window.prompt("Renommer ce chat", getDisplayTitle(item));
    if (nextTitle === null) return;
    const trimmed = nextTitle.trim();
    setSidebarPrefs((current) => {
      const customTitles = { ...current.customTitles };
      if (!trimmed || trimmed === item.title) {
        delete customTitles[item.id];
      } else {
        customTitles[item.id] = trimmed;
      }
      return { ...current, customTitles };
    });
  };
  const handleTogglePin = (itemId: string) => {
    setSidebarPrefs((current) => {
      const alreadyPinned = current.pinnedIds.includes(itemId);
      return {
        ...current,
        pinnedIds: alreadyPinned
          ? current.pinnedIds.filter((id) => id !== itemId)
          : [itemId, ...current.pinnedIds],
      };
    });
  };
  const sidebarWidth = isCompact
    ? "min(88vw, 380px)"
    : isCollapsed
      ? "56px"
      : isExpanded
        ? "440px"
        : "360px";

  return (
    <>
      {isCompact && !isCollapsed ? (
        <Box
          position="fixed"
          inset={0}
          backgroundColor="rgba(15, 23, 42, 0.12)"
          zIndex={20}
          onClick={() => { if (onToggle) onToggle(); else setIsCollapsed(true); }}
        />
      ) : null}

      <Box
        width={sidebarWidth}
        minWidth={sidebarWidth}
        borderBottom={{ base: "1px solid", lg: "none" }}
        borderRight={{ base: "none", lg: "1px solid" }}
        borderRightColor={{ base: "transparent", lg: "var(--color-border)" }}
        backgroundColor={{ base: "rgba(247,246,243,0.98)", _dark: "bg.subtle" }}
        padding={isCompact ? 4 : isCollapsed ? 2 : 4}
        position={isCompact ? "fixed" : "sticky"}
        top={0}
        left={isCompact ? 0 : "auto"}
        display="flex"
        flexDirection="column"
        height="100dvh"
        zIndex={25}
        overflow="hidden"
        transition={isCompact ? "transform 0.2s ease" : "width 0.2s ease, padding 0.2s ease"}
        transform={isCompact ? (isCollapsed ? "translateX(-100%)" : "translateX(0)") : "translateX(0)"}
      >
        {!isCompact && isCollapsed ? (
          <Tooltip.Root openDelay={150}>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label="Ouvrir le panneau"
                size="sm"
                variant="ghost"
                onClick={() => setIsCollapsed(false)}
                position="absolute"
                top={2}
                right={2}
                borderRadius="full"
              >
                <MenuIcon size={16} />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content px={3} py={2}>Ouvrir le panneau</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        ) : null}

        {error ? (
          <Heading as="h1" size="lg" color="red.600">
            Erreur: {error}
          </Heading>
        ) : (
          <Stack
            gap={4}
            height="100%"
            minHeight={0}
            opacity={isCollapsed ? 0 : 1}
            pointerEvents={isCollapsed ? "none" : "auto"}
            transition="opacity 0.2s ease"
          >
            <Stack gap={3}>
              <HStack justify="space-between" align="start">
                <Button
                  size="sm"
                  flex="1"
                  justifyContent="start"
                  borderRadius="full"
                  colorPalette="purple"
                  onClick={handleNewInterview}
                  loading={isCreatingSession}
                  disabled={isCreatingSession}
                  fontWeight="700"
                >
                  <CirclePlus size={15} />
                  Nouvel entretien
                </Button>

                <HStack gap={1}>
                  <Tooltip.Root openDelay={150}>
                    <Tooltip.Trigger asChild>
                      <IconButton
                        aria-label="Aide pour l'entretien"
                        size="sm"
                        variant="outline"
                        borderRadius="full"
                        onClick={() => setIsHelpOpen(true)}
                      >
                        <BookOpenText size={16} />
                      </IconButton>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content px={3} py={2}>Aide</Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>

                  {!isCompact ? (
                    <Tooltip.Root openDelay={150}>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label={isExpanded ? "Reduire la largeur" : "Agrandir le panneau"}
                          size="sm"
                          variant="ghost"
                          borderRadius="full"
                          onClick={() => setIsExpanded((prev) => !prev)}
                        >
                          {isExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content px={3} py={2}>
                          {isExpanded ? "Réduire la largeur" : "Agrandir le panneau"}
                        </Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
                  ) : null}

                  <Tooltip.Root openDelay={150}>
                    <Tooltip.Trigger asChild>
                      <IconButton
                        aria-label="Reduire le panneau"
                        size="sm"
                        variant="ghost"
                        borderRadius="full"
                        onClick={() => { if (onToggle) onToggle(); else setIsCollapsed(true); }}
                      >
                        <ChevronsLeft size={16} />
                      </IconButton>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content px={3} py={2}>Réduire</Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                </HStack>
              </HStack>

              {isConversationFocus ? (
                <HStack
                  justify="space-between"
                  align="center"
                  paddingX={3}
                  paddingY={2}
                  borderRadius="2xl"
                  backgroundColor="var(--color-accent-muted)"
                  borderWidth="1px"
                  borderColor="var(--color-accent-border)"
                >
                  <Text fontSize="sm" fontWeight="600" color="var(--color-accent)">
                    Mode focus conversations actif
                  </Text>
                  <Button size="xs" variant="ghost" borderRadius="full" onClick={() => setIsConversationFocus(false)}>
                    Voir infos
                  </Button>
                </HStack>
              ) : (
                <>
              <Box
                borderRadius="24px"
                borderWidth="1px"
                borderColor="var(--color-accent-border)"
                overflow="hidden"
                boxShadow="var(--color-shadow-soft)"
              >
                {/* Gradient header */}
                <Box
                  position="relative"
                  background="var(--color-accent-soft)"
                  px={4}
                  pt={4}
                  pb={3}
                >
                  {/* 3px accent bar */}
                  <Box
                    position="absolute"
                    insetX={0}
                    top={0}
                    height="3px"
                    background="linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))"
                  />
                  <HStack gap={2} mb={2} flexWrap="wrap">
                    <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="2xs" fontWeight="700">
                      Persona active
                    </Badge>
                    <Badge colorPalette="green" variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="2xs" fontWeight="700">
                      En cours
                    </Badge>
                  </HStack>
                  <Text
                    fontWeight="900"
                    fontSize="lg"
                    letterSpacing="-0.03em"
                    lineHeight="1.2"
                    style={{
                      background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {agentDisplayName ?? "Entretien"}
                  </Text>
                  {agentDescription ? (
                    <Text fontSize="xs" color="var(--color-text-muted)" lineHeight="1.6" mt={1} lineClamp={3}>
                      {agentDescription}
                    </Text>
                  ) : null}
                </Box>

                {/* Body */}
                <Box
                  background="var(--color-surface)"
                  px={4}
                  py={3}
                >
                  <Stack gap={3}>
                    {/* User + date */}
                    <HStack gap={3} flexWrap="wrap">
                      <Box flex="1">
                        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="var(--color-text-muted)">
                          Enquêteur
                        </Text>
                        <Text fontSize="xs" fontWeight="600" color="var(--color-text-primary)" mt={0.5}>{userName ?? "—"}</Text>
                      </Box>
                      <Box flex="1">
                        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="var(--color-text-muted)">
                          Date
                        </Text>
                        <Text fontSize="xs" fontWeight="600" color="var(--color-text-primary)" mt={0.5}>{dateDisplay ?? "—"}</Text>
                      </Box>
                    </HStack>

                    <InterviewGridPanel agentId={agentId ?? null} />

                    {/* Divider */}
                    <Box height="1px" background="var(--color-border)" />

                    {/* Stats */}
                    <HStack gap={3}>
                      <Box
                        flex="1"
                        px={3}
                        py={2}
                        borderRadius="12px"
                        background="var(--color-accent-muted)"
                        borderWidth="1px"
                        borderColor="var(--color-accent-border)"
                      >
                        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="var(--color-text-muted)">
                          Réponses
                        </Text>
                        <Text
                          fontWeight="900"
                          fontSize="xl"
                          letterSpacing="-0.03em"
                          style={{
                            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
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
                        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="var(--color-text-muted)">
                          Tokens
                        </Text>
                        <Text fontSize="xs" fontWeight="700" color="var(--color-text-primary)" mt={0.5}>
                          {stats.inputTokens + stats.outputTokens > 0
                            ? `${stats.inputTokens + stats.outputTokens}`
                            : "—"}
                        </Text>
                      </Box>
                    </HStack>

                    {/* Export buttons */}
                    <HStack gap={2} flexWrap="wrap">
                      <Button
                        size="xs"
                        variant="subtle"
                        borderRadius="lg"
                        onClick={onExportPdf}
                        loading={isExportingPdf}
                        disabled={disableExport}
                        flex="1"
                        fontWeight="700"
                      >
                        <FileDown size={12} />
                        PDF
                      </Button>
                      {onExportGoogleDocs ? (
                        <Button
                          size="xs"
                          variant="subtle"
                          borderRadius="lg"
                          onClick={onExportGoogleDocs}
                          loading={isExportingGoogleDocs}
                          disabled={disableExport}
                          flex="1"
                          fontWeight="700"
                        >
                          <FileText size={12} />
                          Google Docs
                        </Button>
                      ) : null}
                    </HStack>
                  </Stack>
                </Box>
              </Box>

              {newInterviewError ? (
                <Text fontSize="sm" color="red.600">
                  {newInterviewError}
                </Text>
              ) : null}
                </>
              )}
            </Stack>

            <Stack
              gap={3}
              flex={1}
              minHeight={0}
              overflow="hidden"
              paddingTop={1}
              borderTop="1px solid"
              borderTopColor="var(--color-border)"
            >
              <HStack justify="space-between" align="center">
                <HStack gap={2}>
                  <Box height="1px" width="14px" background="var(--color-accent)" opacity={0.4} />
                  <Text fontSize="2xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color="var(--color-text-muted)">
                    Conversations
                  </Text>
                </HStack>
                <HStack gap={1}>
                  {!isConversationFocus ? (
                    <Button
                      size="2xs"
                      variant="ghost"
                      borderRadius="full"
                      onClick={() => setIsConversationFocus(true)}
                    >
                      Focus chats
                    </Button>
                  ) : null}
                  <Tooltip.Root openDelay={150}>
                    <Tooltip.Trigger asChild>
                      <IconButton
                        aria-label="Voir tous les entretiens"
                        size="xs"
                        variant="ghost"
                        borderRadius="full"
                        onClick={() => router.push(`/interviews${historyAgentId ? `?agent=${historyAgentId}` : ""}`)}
                      >
                        <ArrowRight size={14} />
                      </IconButton>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content px={3} py={2}>Voir tout</Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                </HStack>
              </HStack>

              <Stack
                gap={4}
                flex={1}
                minHeight={0}
                overflowY="auto"
                paddingRight={1}
                paddingBottom={3}
              >
                {historyError ? (
                  <Text fontSize="sm" color="red.600">
                    {historyError}
                  </Text>
                ) : historyItems.length === 0 ? (
                  <Text fontSize="sm" color="var(--color-text-muted)">
                    Aucun entretien précédent.
                  </Text>
                ) : (
                  <>
                    {currentHistoryItem ? (
                      <Stack gap={2}>
                        <Text
                          fontSize="2xs"
                          fontWeight="700"
                          color="var(--color-text-muted)"
                          textTransform="uppercase"
                          letterSpacing="0.1em"
                        >
                          Chat en cours
                        </Text>
                        <HistoryCard
                          item={currentHistoryItem}
                          title={getDisplayTitle(currentHistoryItem)}
                          isCurrent
                          isPinned={sidebarPrefs.pinnedIds.includes(currentHistoryItem.id)}
                          onRename={handleRenameInterview}
                          onTogglePin={handleTogglePin}
                          onDelete={handleDeleteInterview}
                          isDeleting={pendingDeleteId === currentHistoryItem.id}
                        />
                      </Stack>
                    ) : null}

                    {pinnedHistoryItems.length > 0 ? (
                      <Stack gap={2}>
                        <Text
                          fontSize="2xs"
                          fontWeight="700"
                          color="var(--color-text-muted)"
                          textTransform="uppercase"
                          letterSpacing="0.1em"
                        >
                          Épinglés
                        </Text>
                        <Stack gap={2}>
                          {pinnedHistoryItems.map((item) => (
                            <HistoryCard
                              key={item.id}
                              item={item}
                              title={getDisplayTitle(item)}
                              isPinned
                              onRename={handleRenameInterview}
                              onTogglePin={handleTogglePin}
                              onDelete={handleDeleteInterview}
                              isDeleting={pendingDeleteId === item.id}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    ) : null}

                    <Stack gap={2}>
                      <Text
                        fontSize="2xs"
                        fontWeight="700"
                        color="var(--color-text-muted)"
                        textTransform="uppercase"
                        letterSpacing="0.1em"
                      >
                        Récents
                      </Text>
                      {recentHistoryItems.length === 0 ? (
                        <Text fontSize="sm" color="var(--color-text-muted)">
                          Aucun autre chat récent.
                        </Text>
                      ) : (
                        <Stack gap={2}>
                          {recentHistoryItems.map((item) => (
                            <HistoryCard
                              key={item.id}
                              item={item}
                              title={getDisplayTitle(item)}
                              onRename={handleRenameInterview}
                              onTogglePin={handleTogglePin}
                              onDelete={handleDeleteInterview}
                              isDeleting={pendingDeleteId === item.id}
                            />
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </Stack>
          </Stack>
        )}
      </Box>

      <>
        <Box
          position="fixed"
          inset={0}
          backgroundColor="rgba(15, 23, 42, 0.2)"
          zIndex={40}
          onClick={() => setIsHelpOpen(false)}
          opacity={isHelpOpen ? 1 : 0}
          pointerEvents={isHelpOpen ? "auto" : "none"}
          transition="opacity 0.2s ease"
        />
        <Box
          position="fixed"
          top={0}
          right={0}
          height="100dvh"
          width={{ base: "100%", sm: "min(92vw, 520px)" }}
          backgroundColor="var(--color-surface)"
          borderLeft="1px solid"
          borderLeftColor="var(--color-border)"
          zIndex={45}
          padding={6}
          overflowY="auto"
          transform={isHelpOpen ? "translateX(0)" : "translateX(100%)"}
          transition="transform 0.25s ease"
          pointerEvents={isHelpOpen ? "auto" : "none"}
        >
          <HStack justify="space-between" align="center" marginBottom={4}>
            <Heading as="h3" size="md">
              Guide d&apos;entretien
            </Heading>
            <Tooltip.Root openDelay={150}>
              <Tooltip.Trigger asChild>
                <IconButton
                  aria-label="Fermer"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsHelpOpen(false)}
                  borderRadius="full"
                >
                  <X size={16} />
                </IconButton>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content px={3} py={2}>Fermer</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>

          <VStack align="stretch" gap={3}>
            {introPreview ? <Text fontWeight="600">{introPreview}</Text> : null}
            {introHtml ? (
              <Box
                css={{
                  "& h2": { marginTop: "1.5rem", fontWeight: "600", color: "fg.default" },
                  "& h3": { marginTop: "1rem", fontWeight: "600", color: "fg.default" },
                  "& ul": { paddingLeft: "1.25rem", marginTop: "0.75rem" },
                  "& li": { marginBottom: "0.5rem" },
                  "& p": { marginBottom: "0.75rem" },
                  "& strong": { color: "fg.default" },
                }}
                dangerouslySetInnerHTML={{ __html: introHtml }}
              />
            ) : (
              <Text color="var(--color-text-muted)">Chargement du guide d&apos;entretien...</Text>
            )}
          </VStack>
        </Box>
      </>
    </>
  );
}
