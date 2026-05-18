"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Ban, Mail, Power, Shield, UserCheck, UserPlus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRole = "student" | "teacher" | "admin";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_banned: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_CONFIG: Record<UserRole, { label: string; palette: string; next: UserRole }> = {
  admin:   { label: "Admin",      palette: "purple", next: "student" },
  teacher: { label: "Enseignant", palette: "orange", next: "student" },
  student: { label: "Étudiant",   palette: "blue",   next: "admin" },
};

const AVATAR_COLORS = [
  { from: "#6366f1", to: "#8b5cf6" },
  { from: "#0ea5e9", to: "#6366f1" },
  { from: "#10b981", to: "#0ea5e9" },
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#ec4899", to: "#8b5cf6" },
];
function getAvatarColor(str: string) {
  return AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── User row card ──────────────────────────────────────────────────────────────
function UserRow({
  userRow,
  isCurrent,
  isRoleLoading,
  isBanLoading,
  onToggleRole,
  onToggleBan,
  index,
}: {
  userRow: UserSummary;
  isCurrent: boolean;
  isRoleLoading: boolean;
  isBanLoading: boolean;
  onToggleRole: (u: UserSummary) => void;
  onToggleBan: (u: UserSummary) => void;
  index: number;
}) {
  const initials = userRow.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || userRow.email[0].toUpperCase();
  const color = getAvatarColor(userRow.email);
  const role = ROLE_CONFIG[userRow.role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <HStack
        px={4}
        py={3}
        borderRadius="16px"
        borderWidth="1px"
        borderColor={isCurrent ? "rgba(99,102,241,0.2)" : "rgba(148,163,184,0.14)"}
        background={isCurrent ? "rgba(239,246,255,0.8)" : "rgba(255,255,255,0.97)"}
        boxShadow={isCurrent
          ? "0 4px 16px rgba(99,102,241,0.08)"
          : "0 2px 8px rgba(15,23,42,0.04)"}
        gap={4}
        transition="box-shadow 0.18s ease"
        _hover={{ boxShadow: "0 6px 20px rgba(15,23,42,0.07)" }}
        opacity={userRow.is_banned ? 0.55 : 1}
      >
        {/* Avatar */}
        <Box
          width="36px"
          height="36px"
          borderRadius="12px"
          background={`linear-gradient(135deg, ${color.from}, ${color.to})`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          boxShadow={`0 3px 10px ${color.from}30`}
        >
          <Text fontSize="xs" fontWeight="800" color="white" lineHeight="1">
            {initials}
          </Text>
        </Box>

        {/* Name + email */}
        <VStack alignItems="flex-start" gap={0} flex="1" minWidth={0}>
          <HStack gap={2}>
            <Text fontWeight="700" fontSize="sm" color="gray.900" lineClamp={1}>
              {userRow.name}
            </Text>
            {isCurrent && (
              <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={2} fontSize="2xs" fontWeight="700">
                Moi
              </Badge>
            )}
            {userRow.is_banned && (
              <Badge colorPalette="red" variant="subtle" borderRadius="full" px={2} fontSize="2xs" fontWeight="700">
                Banni
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>{userRow.email}</Text>
        </VStack>

        {/* Role badge (clickable for admins) */}
        <Button
          size="xs"
          variant="subtle"
          colorPalette={role.palette}
          borderRadius="full"
          fontWeight="700"
          px={3}
          loading={isRoleLoading}
          onClick={() => !isCurrent && onToggleRole(userRow)}
          disabled={isCurrent || userRow.is_banned}
          flexShrink={0}
        >
          {role.label}
        </Button>

        {/* Ban / unban */}
        {!isCurrent && (
          <Button
            size="xs"
            variant="ghost"
            colorPalette={userRow.is_banned ? "green" : "red"}
            borderRadius="lg"
            loading={isBanLoading}
            onClick={() => onToggleBan(userRow)}
            flexShrink={0}
            title={userRow.is_banned ? "Réactiver" : "Bannir"}
          >
            {userRow.is_banned ? <Power size={13} /> : <Ban size={13} />}
          </Button>
        )}
      </HStack>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ManageUsersClient() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, user_admin } = useAuthUser();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteIsAdmin, setInviteIsAdmin] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [banLoading, setBanLoading] = useState<Record<string, boolean>>({});
  const [roleLoading, setRoleLoading] = useState<Record<string, boolean>>({});
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { router.push("/login"); return; }
    if (!user_admin) { router.push("/personnas"); return; }

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setError(payload.error || "Impossible de charger les utilisateurs.");
          setIsLoading(false);
          return;
        }
        const payload = (await response.json()) as { users?: UserSummary[] };
        setUsers(payload.users ?? []);
      } catch (fetchError) {
        console.error("[ManageUsers] Failed to load users:", fetchError);
        setError("Une erreur est survenue lors du chargement des utilisateurs.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [isAuthLoading, router, user, user_admin]);

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteError(null);

    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError("Merci de renseigner un email et un nom.");
      return;
    }

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      setInviteError("Le format de l'adresse email est invalide.");
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          name: inviteName.trim(),
          isAdmin: inviteIsAdmin,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | { user?: UserSummary }
        | null;

      if (!response.ok) {
        const message = payload && "error" in payload ? payload.error : null;
        setInviteError(message ?? "Impossible d'inviter cet utilisateur.");
        toaster.create({
          title: "Invitation échouée",
          description: message ?? "Impossible d'inviter cet utilisateur.",
          type: "error",
        });
        return;
      }

      const nextUser = payload && "user" in payload ? payload.user : null;
      if (nextUser) {
        setUsers((current) =>
          [...current, nextUser].sort((a, b) => a.email.localeCompare(b.email, "fr"))
        );
      }

      setInviteEmail("");
      setInviteName("");
      setInviteIsAdmin(false);
      toaster.create({
        title: "Invitation envoyée",
        description: "Le nouvel utilisateur va recevoir un email d'inscription.",
        type: "success",
      });
    } catch (err) {
      console.error("[ManageUsers] Invite failed:", err);
      setInviteError("Une erreur est survenue lors de l'invitation.");
      toaster.create({
        title: "Invitation échouée",
        description: "Une erreur est survenue lors de l'invitation.",
        type: "error",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleBan = async (target: UserSummary) => {
    setBanLoading((c) => ({ ...c, [target.id]: true }));
    try {
      const response = await fetch(`/api/users/${target.id}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !target.is_banned }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string } | { user?: UserSummary } | null;
      if (!response.ok) {
        const message = payload && "error" in payload ? payload.error : null;
        toaster.create({ title: "Action échouée", description: message ?? "Impossible de mettre à jour ce compte.", type: "error" });
        return;
      }
      const updated = payload && "user" in payload ? payload.user : null;
      if (updated) setUsers((c) => c.map((e) => (e.id === updated.id ? updated : e)));
      toaster.create({
        title: target.is_banned ? "Utilisateur réactivé" : "Utilisateur banni",
        description: target.is_banned ? "Le compte est de nouveau actif." : "Le compte a été désactivé.",
        type: "success",
      });
    } catch (err) {
      console.error("[ManageUsers] Ban toggle failed:", err);
      toaster.create({ title: "Action échouée", description: "Impossible de mettre à jour ce compte.", type: "error" });
    } finally {
      setBanLoading((c) => ({ ...c, [target.id]: false }));
    }
  };

  const handleToggleRole = async (target: UserSummary) => {
    const nextRole: UserRole = target.role === "admin" ? "student" : "admin";
    setRoleLoading((c) => ({ ...c, [target.id]: true }));
    try {
      const response = await fetch(`/api/users/${target.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string } | { user?: UserSummary } | null;
      if (!response.ok) {
        const message = payload && "error" in payload ? payload.error : null;
        toaster.create({ title: "Action échouée", description: message ?? "Impossible de mettre à jour ce compte.", type: "error" });
        return;
      }
      const updated = payload && "user" in payload ? payload.user : null;
      if (updated) setUsers((c) => c.map((e) => (e.id === updated.id ? updated : e)));
      toaster.create({
        title: "Rôle mis à jour",
        description: nextRole === "admin"
          ? "L'utilisateur est maintenant administrateur."
          : "L'utilisateur est maintenant étudiant.",
        type: "success",
      });
    } catch (err) {
      console.error("[ManageUsers] Role toggle failed:", err);
      toaster.create({ title: "Action échouée", description: "Impossible de mettre à jour ce compte.", type: "error" });
    } finally {
      setRoleLoading((c) => ({ ...c, [target.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="3xl" height="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement des utilisateurs...</Text>
        </VStack>
      </Container>
    );
  }

  const sortUser = (a: UserSummary, b: UserSummary) => {
    const isCurrentA = a.id === currentUserId;
    const isCurrentB = b.id === currentUserId;
    if (isCurrentA !== isCurrentB) return isCurrentA ? -1 : 1;
    return a.email.localeCompare(b.email, "fr");
  };

  const activeUsers = [...users].filter((u) => !u.is_banned).sort(sortUser);
  const bannedUsers = [...users].filter((u) => u.is_banned).sort(sortUser);
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <Container maxWidth="3xl" py={8} px={{ base: 4, md: 6 }}>
      <VStack gap={8} alignItems="stretch">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            borderRadius="28px"
            overflow="hidden"
            position="relative"
            background="linear-gradient(135deg, rgba(239,246,255,0.9) 0%, rgba(237,233,254,0.7) 60%, rgba(239,246,255,0.9) 100%)"
            borderWidth="1px"
            borderColor="rgba(99,102,241,0.15)"
            boxShadow="0 12px 40px rgba(15,23,42,0.06)"
          >
            <Box position="absolute" insetX={0} top={0} height="3px"
              background="linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9)" />
            <Box position="absolute" top="-40px" right="-30px" width="180px" height="180px"
              borderRadius="full"
              background="radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)"
              pointerEvents="none" />

            <Box px={{ base: 6, md: 8 }} pt={8} pb={6} position="relative">
              <HStack gap={2} mb={3}>
                <Box height="1px" width="20px" background="rgba(99,102,241,0.4)" />
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="blue.600">
                  Administration
                </Text>
              </HStack>

              <HStack gap={3} alignItems="center" mb={2}>
                <Box
                  width="44px" height="44px" borderRadius="14px"
                  background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                  display="flex" alignItems="center" justifyContent="center"
                  boxShadow="0 6px 16px rgba(99,102,241,0.25)" flexShrink={0}
                >
                  <Users size={20} color="white" />
                </Box>
                <VStack alignItems="flex-start" gap={0}>
                  <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="-0.04em" lineHeight="1.1" color="gray.900">
                    Utilisateurs
                  </Text>
                  <Text fontSize="sm" color="fg.muted">Gestion des accès et des rôles</Text>
                </VStack>
              </HStack>

              {/* Stats strip */}
              {users.length > 0 && (
                <HStack
                  gap={0} mt={5} borderRadius="16px" overflow="hidden"
                  borderWidth="1px" borderColor="rgba(148,163,184,0.16)"
                  background="rgba(255,255,255,0.7)" backdropFilter="blur(8px)"
                  display="inline-flex"
                >
                  {[
                    { label: "Total", value: String(users.length), icon: Users },
                    { label: "Actifs", value: String(activeUsers.length), icon: UserCheck },
                    { label: "Admins", value: String(adminCount), icon: Shield },
                    ...(bannedUsers.length > 0 ? [{ label: "Bannis", value: String(bannedUsers.length), icon: Ban }] : []),
                  ].map((stat, i, arr) => (
                    <HStack
                      key={stat.label} gap={2} px={4} py={2.5}
                      borderRight={i < arr.length - 1 ? "1px solid rgba(148,163,184,0.16)" : undefined}
                    >
                      <Box color="blue.500" opacity={0.7}><stat.icon size={12} /></Box>
                      <Box>
                        <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="fg.muted">
                          {stat.label}
                        </Text>
                        <Text fontWeight="900" fontSize="sm" letterSpacing="-0.02em"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                        >
                          {stat.value}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </HStack>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <Box borderRadius="16px" px={5} py={4} borderWidth="1px"
            borderColor="rgba(239,68,68,0.25)" background="rgba(254,242,242,0.9)"
            borderLeft="4px solid" borderLeftColor="red.400"
          >
            <Text color="red.700" fontWeight="600">{error}</Text>
          </Box>
        )}

        {/* ── Invite form ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            borderRadius="20px" borderWidth="1px"
            borderColor="rgba(148,163,184,0.16)"
            background="rgba(255,255,255,0.97)"
            boxShadow="0 4px 16px rgba(15,23,42,0.05)"
            overflow="hidden"
          >
            {/* Card header */}
            <Box px={5} pt={5} pb={4}
              background="linear-gradient(135deg, rgba(239,246,255,0.7), rgba(237,233,254,0.4))"
              borderBottom="1px solid rgba(148,163,184,0.12)"
            >
              <HStack gap={3} alignItems="center">
                <Box
                  width="32px" height="32px" borderRadius="10px"
                  background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                  display="flex" alignItems="center" justifyContent="center"
                >
                  <UserPlus size={15} color="white" />
                </Box>
                <VStack alignItems="flex-start" gap={0}>
                  <Text fontWeight="800" fontSize="sm" letterSpacing="-0.01em" color="gray.900">
                    Inviter un utilisateur
                  </Text>
                  <Text fontSize="xs" color="fg.muted">Un email d&apos;inscription sera envoyé automatiquement</Text>
                </VStack>
              </HStack>
            </Box>

            {/* Form body */}
            <Box px={5} py={4}>
              <form onSubmit={handleInvite}>
                <VStack gap={3} alignItems="stretch">
                  <HStack gap={3} flexDirection={{ base: "column", sm: "row" }}>
                    <Box flex="1">
                      <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={1.5} letterSpacing="0.04em">
                        Adresse email
                      </Text>
                      <Input
                        aria-label="Adresse e-mail"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="nom@exemple.fr"
                        borderRadius="xl"
                        borderColor="rgba(148,163,184,0.3)"
                        fontSize="sm"
                      />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={1.5} letterSpacing="0.04em">
                        Nom complet
                      </Text>
                      <Input
                        aria-label="Nom"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Prénom Nom"
                        borderRadius="xl"
                        borderColor="rgba(148,163,184,0.3)"
                        fontSize="sm"
                      />
                    </Box>
                  </HStack>

                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack gap={2.5} alignItems="center" cursor="pointer"
                      onClick={() => setInviteIsAdmin((v) => !v)}
                    >
                      <Checkbox.Root checked={inviteIsAdmin}
                        onCheckedChange={(d: { checked: boolean | "indeterminate" }) => setInviteIsAdmin(d.checked === true)}
                      >
                        <Checkbox.Control borderRadius="md" />
                      </Checkbox.Root>
                      <Text fontSize="sm" color="fg.default" fontWeight="500">
                        Droits administrateur
                      </Text>
                    </HStack>

                    <Button
                      type="submit"
                      size="sm"
                      colorPalette="blue"
                      borderRadius="xl"
                      fontWeight="700"
                      loading={isInviting}
                      px={5}
                    >
                      <Mail size={13} />
                      Inviter
                    </Button>
                  </HStack>

                  {inviteError && (
                    <Text fontSize="xs" color="red.600" fontWeight="600">{inviteError}</Text>
                  )}
                </VStack>
              </form>
            </Box>
          </Box>
        </motion.div>

        {/* ── Active users ──────────────────────────────────────────────── */}
        {activeUsers.length > 0 && (
          <VStack gap={3} alignItems="stretch">
            <HStack gap={2} px={1}>
              <Box height="1px" width="16px" background="rgba(99,102,241,0.4)" />
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color="fg.muted">
                Actifs
              </Text>
              <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={2.5} fontSize="2xs" fontWeight="700">
                {activeUsers.length}
              </Badge>
            </HStack>

            {activeUsers.map((u, i) => (
              <UserRow
                key={u.id}
                userRow={u}
                isCurrent={u.id === currentUserId}
                isRoleLoading={!!roleLoading[u.id]}
                isBanLoading={!!banLoading[u.id]}
                onToggleRole={handleToggleRole}
                onToggleBan={handleToggleBan}
                index={i}
              />
            ))}
          </VStack>
        )}

        {/* ── Banned users ──────────────────────────────────────────────── */}
        {bannedUsers.length > 0 && (
          <VStack gap={3} alignItems="stretch">
            <HStack gap={2} px={1}>
              <Box height="1px" width="16px" background="rgba(239,68,68,0.4)" />
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color="fg.muted">
                Bannis
              </Text>
              <Badge colorPalette="red" variant="subtle" borderRadius="full" px={2.5} fontSize="2xs" fontWeight="700">
                {bannedUsers.length}
              </Badge>
            </HStack>

            {bannedUsers.map((u, i) => (
              <UserRow
                key={u.id}
                userRow={u}
                isCurrent={u.id === currentUserId}
                isRoleLoading={!!roleLoading[u.id]}
                isBanLoading={!!banLoading[u.id]}
                onToggleRole={handleToggleRole}
                onToggleBan={handleToggleBan}
                index={i}
              />
            ))}
          </VStack>
        )}

      </VStack>
    </Container>
  );
}
