// app/components/Header.tsx
"use client";

import { Avatar, Box, Flex, HStack, IconButton, Link, Popover, Separator, Stack, Text, Tooltip } from "@chakra-ui/react";
import { BookOpen, ClipboardList, LogOut, MessageSquare, Radio, Settings, Users } from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabaseStorageKey } from "@/lib/supabaseClient";
import { authService } from "@/lib/authService";

type UserRole = "student" | "teacher" | "admin";

type UserInfo = {
  firstName: string;
  lastName: string;
  role: UserRole | null;
} | null;

const NAV_ITEMS = [
  { href: "/personnas", label: "Personas", icon: Users, adminOnly: false },
  { href: "/interviews", label: "Entretiens", icon: MessageSquare, adminOnly: false, adminLabel: "Entretiens" },
  { href: "/guide-entretien", label: "Guide", icon: BookOpen, adminOnly: false },
  { href: "/manage-users", label: "Utilisateurs", icon: Settings, adminOnly: true },
] as const;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, role, user_admin } = useAuthUser();
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [fontSize, setFontSize] = useState<"md" | "lg" | "xl">("md");
  const [scrolled, setScrolled] = useState(false);
  const [peekVisible, setPeekVisible] = useState(false);
  const isInInterview = pathname.startsWith("/interview/") || pathname === "/interview";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isInInterview) return;
    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 12) setPeekVisible(true);
      else if (e.clientY > 64) setPeekVisible(false);
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [isInInterview]);

  const handleLogout = async () => {
    const clearLocalAuth = () => {
      try {
        window.localStorage.removeItem(supabaseStorageKey);
        document.cookie = `${supabaseStorageKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      } catch (error) {
        console.warn("[Header] Failed to clear local auth storage", error);
      }
    };
    try {
      const timeout = new Promise<{ error: Error }>((resolve) => {
        window.setTimeout(() => resolve({ error: new Error("Logout timeout") }), 2000);
      });
      const result = await Promise.race([authService.signOutLocal(), timeout]);
      if ("error" in result && result.error) {
        console.warn("[Header] Logout warning:", result.error);
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      clearLocalAuth();
      setUserInfo(null);
      router.replace("/login");
    }
  };

  useEffect(() => {
    if (!user) { setUserInfo(null); return; }
    const firstName = (user.user_metadata?.firstName as string) || "";
    const lastName = (user.user_metadata?.lastName as string) || "";
    if (firstName || lastName) { setUserInfo({ firstName, lastName, role }); return; }
    const fallbackName = user.email?.split("@")[0] ?? "Utilisateur";
    setUserInfo({ firstName: fallbackName, lastName: "", role });
  }, [user, role]);

  useEffect(() => {
    const stored = window.localStorage.getItem("fontSize") as "md" | "lg" | "xl" | null;
    if (stored === "lg" || stored === "xl") {
      setFontSize(stored);
      document.documentElement.dataset.font = stored;
    }
  }, []);

  const handleToggleFontSize = () => {
    const next = fontSize === "md" ? "lg" : fontSize === "lg" ? "xl" : "md";
    setFontSize(next);
    if (next === "md") delete document.documentElement.dataset.font;
    else document.documentElement.dataset.font = next;
    window.localStorage.setItem("fontSize", next);
  };

  const fontSizeLabel = fontSize === "md" ? "Taille normale" : fontSize === "lg" ? "Taille grande" : "Très grande";

  const initials = userInfo
    ? `${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`.toUpperCase().trim() || "U"
    : "U";

  const fullName = userInfo
    ? `${userInfo.firstName} ${userInfo.lastName}`.trim() || "Utilisateur"
    : "Utilisateur";

  return (
    <Box
      as="header"
      position={isInInterview ? "fixed" : "sticky"}
      top={0}
      left={isInInterview ? 0 : undefined}
      right={isInInterview ? 0 : undefined}
      zIndex={isInInterview ? 150 : 100}
      height="var(--app-header-height)"
      style={isInInterview ? {
        transform: peekVisible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
      } : undefined}
      transition={isInInterview ? undefined : "background 0.2s ease, box-shadow 0.2s ease, backdrop-filter 0.2s ease"}
      background={isInInterview
        ? "rgba(247,246,243,0.97)"
        : scrolled ? "rgba(247,246,243,0.92)" : "rgba(247,246,243,0.98)"
      }
      backdropFilter={isInInterview ? "blur(20px)" : scrolled ? "blur(20px)" : "blur(8px)"}
      borderBottomWidth="1px"
      borderBottomColor={scrolled ? "var(--color-border-strong)" : "var(--color-border)"}
      boxShadow={isInInterview ? "var(--color-shadow-md)" : scrolled ? "var(--color-shadow-sm)" : "none"}
    >
      {/* Static top accent line */}
      <Box
        position="absolute"
        insetX={0}
        top={0}
        height="1px"
        background="linear-gradient(90deg, transparent 0%, #6366f1 25%, #8b5cf6 50%, #ec4899 75%, transparent 100%)"
        opacity={0.6}
      />

      <Flex
        maxW="7xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        height="100%"
        align="center"
        justify="space-between"
        gap={4}
      >
        {/* Logo */}
        <Link
          as={NextLink}
          href="/"
          _hover={{ textDecoration: "none", opacity: 0.85 }}
          flexShrink={0}
        >
          <Text
            className="mimesis-wordmark display-heading"
            fontSize="xl"
            letterSpacing="-0.03em"
          >
            Mimesis
          </Text>
        </Link>

        {/* Nav */}
        {!isLoading && user ? (
          <HStack gap={0} flex="1" justifyContent="center" display={{ base: "none", md: "flex" }} align="center">
            {NAV_ITEMS.filter((item) => !item.adminOnly || user_admin).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const label = item.adminOnly ? item.label : (role === "admin" && "adminLabel" in item ? item.adminLabel : item.label);
              return (
                <Link
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  position="relative"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight={isActive ? "600" : "450"}
                  color={isActive ? "var(--color-accent)" : "var(--color-text-muted)"}
                  _hover={{
                    textDecoration: "none",
                    color: "var(--color-accent)",
                  }}
                  transition="color 0.15s ease"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "var(--app-header-height)",
                    borderBottom: isActive
                      ? "2px solid var(--color-accent)"
                      : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {label}
                </Link>
              );
            })}
            {isInInterview && (
              <HStack
                gap={1.5}
                px={3}
                py={1}
                ml={3}
                borderRadius="full"
                background="rgba(34,197,94,0.1)"
                borderWidth="1px"
                borderColor="rgba(34,197,94,0.25)"
                style={{ animation: "none" }}
              >
                <Radio size={10} color="rgb(22,163,74)" style={{ width: 10, height: 10 }} />
                <Text fontSize="xs" fontWeight="600" color="rgb(22,163,74)" letterSpacing="0.02em">
                  Entretien en cours
                </Text>
              </HStack>
            )}
          </HStack>
        ) : (
          <Box flex="1" />
        )}

        {/* Right side */}
        <HStack gap={2} flexShrink={0}>
          {!isLoading && user ? (
            <>
              <Popover.Root
                open={isPopoverOpen}
                onOpenChange={(state) => setIsPopoverOpen(state.open)}
                positioning={{ placement: "bottom-end" }}
                lazyMount
                unmountOnExit
              >
                <Popover.Trigger asChild>
                  <Box
                    cursor="pointer"
                    borderRadius="full"
                    borderWidth="2px"
                    borderColor={isPopoverOpen ? "var(--color-accent)" : "var(--color-border-strong)"}
                    transition="border-color 0.15s ease"
                    _hover={{ borderColor: "var(--color-accent)" }}
                  >
                    <Avatar.Root size="sm">
                      <Avatar.Fallback
                        name={fullName}
                        background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                        color="white"
                        fontSize="xs"
                        fontWeight="700"
                      >
                        {initials}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </Box>
                </Popover.Trigger>
                <Popover.Positioner>
                  <Popover.Content
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="rgba(148,163,184,0.18)"
                    boxShadow="0 20px 60px rgba(15,23,42,0.12)"
                    backdropFilter="blur(20px)"
                    background="rgba(255,255,255,0.96)"
                    minWidth="240px"
                    overflow="hidden"
                  >
                    {/* User header */}
                    <Box
                      px={4}
                      py={4}
                      background="linear-gradient(135deg, rgba(239,246,255,0.8), rgba(237,233,254,0.5))"
                      borderBottomWidth="1px"
                      borderBottomColor="rgba(148,163,184,0.14)"
                    >
                      <HStack gap={3}>
                        <Avatar.Root size="md">
                          <Avatar.Fallback
                            name={fullName}
                            background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                            color="white"
                            fontSize="sm"
                            fontWeight="700"
                          >
                            {initials}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="700" fontSize="sm" lineHeight="1.3">{fullName}</Text>
                          <Text fontSize="xs" color="fg.muted" lineHeight="1.4">{user?.email}</Text>
                          {userInfo?.role && (
                            <Text
                              fontSize="2xs"
                              textTransform="uppercase"
                              letterSpacing="0.12em"
                              color="blue.600"
                              fontWeight="600"
                              mt={0.5}
                            >
                              {userInfo.role}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                    </Box>

                    <Stack gap={0} p={2}>
                      <Link
                        as={NextLink}
                        href="/profile"
                        display="flex"
                        alignItems="center"
                        gap={2.5}
                        px={3}
                        py={2.5}
                        borderRadius="xl"
                        fontSize="sm"
                        color="fg.default"
                        _hover={{ textDecoration: "none", background: "rgba(99,102,241,0.06)" }}
                        transition="background 0.15s"
                        onClick={() => setIsPopoverOpen(false)}
                      >
                        <ClipboardList size={14} />
                        Modifier le profil
                      </Link>

                      <Separator my={1} borderColor="rgba(148,163,184,0.14)" />

                      {/* Text size */}
                      <HStack px={3} py={2} justifyContent="space-between">
                        <Text fontSize="sm" color="fg.muted">Taille du texte</Text>
                        <Tooltip.Root openDelay={150}>
                          <Tooltip.Trigger asChild>
                            <IconButton
                              aria-label={fontSizeLabel}
                              variant="ghost"
                              size="xs"
                              onClick={handleToggleFontSize}
                              borderRadius="lg"
                            >
                              <HStack gap={0.5}>
                                <Text fontSize="xs" fontWeight="600">A</Text>
                                <Text fontSize="sm" fontWeight="600">A</Text>
                              </HStack>
                            </IconButton>
                          </Tooltip.Trigger>
                          <Tooltip.Positioner>
                            <Tooltip.Content px={2} py={1.5} borderRadius="lg">{fontSizeLabel}</Tooltip.Content>
                          </Tooltip.Positioner>
                        </Tooltip.Root>
                      </HStack>

                      {/* Theme */}
                      <HStack px={3} py={2} justifyContent="space-between">
                        <Text fontSize="sm" color="fg.muted">Thème</Text>
                        <ColorModeButton />
                      </HStack>

                      <Separator my={1} borderColor="rgba(148,163,184,0.14)" />

                      {/* Logout */}
                      <Box
                        as="button"
                        display="flex"
                        alignItems="center"
                        gap={2.5}
                        px={3}
                        py={2.5}
                        borderRadius="xl"
                        fontSize="sm"
                        color="red.600"
                        width="100%"
                        textAlign="left"
                        cursor="pointer"
                        onClick={handleLogout}
                        _hover={{ background: "rgba(239,68,68,0.06)" }}
                        transition="background 0.15s"
                      >
                        <LogOut size={14} />
                        Déconnexion
                      </Box>
                    </Stack>
                  </Popover.Content>
                </Popover.Positioner>
              </Popover.Root>
            </>
          ) : (
            !isLoading && (
              <Link
                as={NextLink}
                href="/login"
                fontSize="sm"
                fontWeight="600"
                px={4}
                py={1.5}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="rgba(99,102,241,0.3)"
                color="blue.700"
                _hover={{ textDecoration: "none", background: "rgba(99,102,241,0.06)" }}
              >
                Se connecter
              </Link>
            )
          )}
        </HStack>
      </Flex>
    </Box>
  );
}
