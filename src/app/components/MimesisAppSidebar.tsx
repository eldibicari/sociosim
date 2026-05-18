"use client";

import { Box, VStack, HStack, Text, Button } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { Users, MessageSquare, BookOpen, Settings, LogOut, Plus, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authService } from "@/lib/authService";

const NAV_ITEMS = [
  { label: "Découvrir", href: "/personnas", icon: Users },
  { label: "Mes entretiens", href: "/interviews", icon: MessageSquare },
  { label: "Guide", href: "/guide-entretien", icon: BookOpen },
];

const ADMIN_ITEMS = [
  { label: "Gestion utilisateurs", href: "/manage-users", icon: Settings },
];

export function MimesisAppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, user_admin } = useAuthUser();

  const userName = user?.user_metadata?.firstName
    ?? user?.user_metadata?.name
    ?? user?.email?.split("@")[0]
    ?? "Utilisateur";

  async function handleLogout() {
    await authService.signOutLocal();
    router.push("/login");
  }

  const navItems = user_admin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <>
      {/* Bouton hamburger mobile */}
      <Box
        display={{ base: "flex", lg: "none" }}
        position="fixed"
        top={3}
        left={3}
        zIndex={200}
        background="var(--color-surface)"
        borderRadius="10px"
        borderWidth="1px"
        borderColor="var(--color-border)"
        boxShadow="var(--color-shadow-sm)"
        p={2}
        cursor="pointer"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </Box>

      {/* Overlay mobile */}
      {mobileOpen && (
        <Box
          display={{ base: "block", lg: "none" }}
          position="fixed"
          inset={0}
          background="rgba(0,0,0,0.4)"
          zIndex={150}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
    <Box
      as="nav"
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width="220px"
      background="var(--color-surface)"
      borderRight="1px solid var(--color-border)"
      display={{ base: mobileOpen ? "flex" : "none", lg: "flex" }}
      flexDirection="column"
      zIndex={160}
      padding="1.25rem 0.75rem"
      gap={0}
      transition="transform 0.2s ease"
    >
      {/* Logo */}
      <Box px={2} mb={6}>
        <Text
          className="mimesis-wordmark"
          fontSize="xl"
          fontWeight="800"
          letterSpacing="-0.03em"
          cursor="pointer"
          onClick={() => router.push("/")}
        >
          Mimesis
        </Text>
      </Box>

      {/* Bouton principal */}
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
          onClick={() => router.push("/personnas")}
        >
          <Plus size={15} />
          Nouvel entretien
        </Button>
      </Box>

      {/* Navigation */}
      <VStack gap={1} align="stretch" flex={1}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <HStack
              key={href}
              gap={3}
              px={3}
              py="0.55rem"
              borderRadius="10px"
              cursor="pointer"
              background={active ? "var(--color-accent-muted)" : "transparent"}
              color={active ? "var(--color-accent)" : "var(--color-text-muted)"}
              fontWeight={active ? "600" : "400"}
              fontSize="sm"
              transition="background 0.15s, color 0.15s"
              _hover={{
                background: active ? "var(--color-accent-muted)" : "var(--color-surface-muted)",
                color: active ? "var(--color-accent)" : "var(--color-text-primary)",
              }}
              onClick={() => router.push(href)}
            >
              <Icon size={16} />
              <Text>{label}</Text>
            </HStack>
          );
        })}
      </VStack>

      {/* Historique récent */}
      <Box pt={3} pb={2} borderTop="1px solid var(--color-border)">
        <Text fontSize="2xs" fontWeight="700" color="var(--color-text-muted)" textTransform="uppercase" letterSpacing="0.1em" px={3} mb={1}>
          Récents
        </Text>
        <HStack
          gap={3}
          px={3}
          py="0.5rem"
          borderRadius="10px"
          cursor="pointer"
          fontSize="sm"
          color="var(--color-text-muted)"
          _hover={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
          onClick={() => router.push("/interviews")}
        >
          <MessageSquare size={14} />
          <Text fontSize="xs">Voir tous mes entretiens</Text>
        </HStack>
      </Box>

      {/* Profil + déconnexion */}
      {user && (
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
            onClick={() => router.push("/profile")}
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
                {userName[0].toUpperCase()}
              </Text>
            </Box>
            <Text fontWeight="500" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              {userName}
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
      )}
    </Box>
    </>
  );
}
