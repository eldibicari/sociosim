"use client";

import {
  Alert,
  Badge,
  Box,
  Button,
  Field,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Link,
  Spinner,
  Text,
  Tooltip,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";

// ── Types ─────────────────────────────────────────────────────────────────────
type ProfileFormState = {
  firstName: string;
  lastName: string;
  password: string;
  confirmation: string;
};

type FieldErrors = Partial<Record<keyof ProfileFormState, string>>;

const MIN_PASSWORD_LENGTH = 8;

const ROLE_LABELS: Record<string, string> = {
  admin:   "Administrateur",
  teacher: "Enseignant",
  student: "Étudiant",
};
const ROLE_PALETTE: Record<string, string> = {
  admin:   "purple",
  teacher: "orange",
  student: "blue",
};

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        borderRadius="20px"
        borderWidth="1px"
        borderColor="rgba(148,163,184,0.16)"
        background="rgba(255,255,255,0.97)"
        boxShadow="0 4px 16px rgba(15,23,42,0.05)"
        overflow="hidden"
      >
        {/* Card header */}
        <Box
          px={6} pt={5} pb={4}
          background="linear-gradient(135deg, rgba(239,246,255,0.7), rgba(237,233,254,0.4))"
          borderBottom="1px solid rgba(148,163,184,0.12)"
        >
          <HStack gap={3}>
            <Box
              width="32px" height="32px" borderRadius="10px"
              background="linear-gradient(135deg, #6366f1, #8b5cf6)"
              display="flex" alignItems="center" justifyContent="center"
              flexShrink={0}
            >
              <Icon size={15} color="white" />
            </Box>
            <VStack alignItems="flex-start" gap={0}>
              <Text fontWeight="800" fontSize="sm" letterSpacing="-0.01em" color="gray.900">
                {title}
              </Text>
              <Text fontSize="xs" color="fg.muted">{description}</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Card body */}
        <Box px={6} py={5}>{children}</Box>
      </Box>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, role, updateUserMetadata } = useAuthUser();
  const [form, setForm] = useState<ProfileFormState>({
    firstName: "", lastName: "", password: "", confirmation: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { router.replace("/login"); return; }
    const metadata = user.user_metadata || {};
    setForm({
      firstName: (metadata.firstName as string) || "",
      lastName:  (metadata.lastName  as string) || "",
      password: "", confirmation: "",
    });
    setIsPrefilling(false);
  }, [isAuthLoading, router, user]);

  const handleChange =
    (field: keyof ProfileFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setServerError(null);
      setSuccessMessage(null);
    };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.firstName.trim()) errors.firstName = "Votre prénom est requis.";
    if (!form.lastName.trim())  errors.lastName  = "Votre nom est requis.";
    const p = form.password.trim();
    const c = form.confirmation.trim();
    if (p || c) {
      if (!p) errors.password = "Votre mot de passe est requis.";
      else if (p.length < MIN_PASSWORD_LENGTH)
        errors.password = `Au moins ${MIN_PASSWORD_LENGTH} caractères requis.`;
      if (!c) errors.confirmation = "Merci de confirmer votre mot de passe.";
      else if (c !== p) errors.confirmation = "La confirmation ne correspond pas.";
    }
    return errors;
  };

  const hasChanges = useMemo(() => {
    if (!user) return false;
    const meta = user.user_metadata || {};
    return (
      form.firstName.trim() !== ((meta.firstName as string) || "") ||
      form.lastName.trim()  !== ((meta.lastName  as string) || "") ||
      form.password.trim().length > 0 ||
      form.confirmation.trim().length > 0
    );
  }, [form, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    if (!user) { setServerError("Votre session a expiré. Merci de vous reconnecter."); return; }

    setIsSubmitting(true);
    const trimFirst = form.firstName.trim();
    const trimLast  = form.lastName.trim();
    const trimPass  = form.password.trim();
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: trimFirst, lastName: trimLast, password: trimPass || undefined }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok || payload?.error) {
        setServerError(payload?.error ?? "Impossible de mettre à jour votre profil.");
        return;
      }
      setSuccessMessage(payload?.message ?? "Profil mis à jour avec succès.");
      updateUserMetadata({ firstName: trimFirst, lastName: trimLast, name: `${trimFirst} ${trimLast}` });
      setForm((prev) => ({ ...prev, password: "", confirmation: "" }));
    } catch (err) {
      console.error("Erreur profil:", err);
      setServerError("Une erreur inattendue est survenue. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isPrefilling) {
    return (
      <Box maxW="520px" mx="auto" py={20} display="flex" flexDirection="column" alignItems="center" gap={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="fg.muted" fontSize="sm">Chargement du profil...</Text>
      </Box>
    );
  }

  // Computed display values
  const firstName = form.firstName || ((user?.user_metadata?.firstName as string) ?? "");
  const lastName  = form.lastName  || ((user?.user_metadata?.lastName  as string) ?? "");
  const initials  = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase().trim() || "U";
  const fullName  = `${firstName} ${lastName}`.trim() || "Utilisateur";
  const email     = user?.email ?? "";
  const roleLabel = ROLE_LABELS[role ?? "student"] ?? "Étudiant";
  const rolePalette = ROLE_PALETTE[role ?? "student"] ?? "blue";

  return (
    <Box maxW="520px" mx="auto" py={8} px={{ base: 4, md: 0 }}>
      <VStack gap={6} alignItems="stretch">

        {/* ── Hero profil card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            borderRadius="28px"
            overflow="hidden"
            position="relative"
            background="linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(237,233,254,0.75) 60%, rgba(239,246,255,0.95) 100%)"
            borderWidth="1px"
            borderColor="rgba(99,102,241,0.15)"
            boxShadow="0 12px 40px rgba(99,102,241,0.07)"
          >
            {/* 3px accent bar */}
            <Box position="absolute" insetX={0} top={0} height="3px"
              background="linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9)" />

            {/* Blob déco */}
            <Box position="absolute" top="-40px" right="-30px" width="180px" height="180px"
              borderRadius="full"
              background="radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)"
              pointerEvents="none" />

            <VStack gap={4} px={8} pt={9} pb={7} position="relative" alignItems="center">
              {/* Eyebrow */}
              <HStack gap={2} alignSelf="flex-start">
                <Box height="1px" width="16px" background="rgba(99,102,241,0.4)" />
                <Text fontSize="2xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="blue.600">
                  Compte
                </Text>
              </HStack>

              {/* Avatar */}
              <Box
                width="72px" height="72px" borderRadius="22px"
                background="linear-gradient(135deg, #6366f1, #8b5cf6)"
                display="flex" alignItems="center" justifyContent="center"
                boxShadow="0 10px 28px rgba(99,102,241,0.3)"
              >
                <Text fontSize="2xl" fontWeight="900" color="white" lineHeight="1">
                  {initials}
                </Text>
              </Box>

              {/* Name + meta */}
              <VStack gap={1.5} alignItems="center">
                <Text fontWeight="900" fontSize="xl" letterSpacing="-0.03em" color="gray.900">
                  {fullName}
                </Text>
                <Text fontSize="sm" color="fg.muted">{email}</Text>
                <Badge
                  colorPalette={rolePalette}
                  variant="subtle"
                  borderRadius="full"
                  px={3} py={0.5}
                  fontSize="2xs"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  {roleLabel}
                </Badge>
              </VStack>
            </VStack>
          </Box>
        </motion.div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        {serverError && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Alert.Root status="error" borderRadius="16px">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Erreur</Alert.Title>
                <Alert.Description>{serverError}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          </motion.div>
        )}

        {successMessage && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Box
              borderRadius="16px" px={5} py={4} borderWidth="1px"
              borderColor="rgba(16,185,129,0.25)"
              background="rgba(240,253,244,0.9)"
              borderLeft="4px solid" borderLeftColor="green.400"
            >
              <HStack gap={3}>
                <CheckCircle2 size={18} color="#10b981" />
                <Text fontSize="sm" fontWeight="700" color="green.700">{successMessage}</Text>
              </HStack>
            </Box>
          </motion.div>
        )}

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <chakra.form onSubmit={handleSubmit} display="flex" flexDirection="column" gap={4}>

          {/* Informations personnelles */}
          <SectionCard
            title="Informations personnelles"
            description="Votre prénom et nom affichés dans l'application"
            icon={User}
            delay={0.1}
          >
            <VStack gap={4} alignItems="stretch">
              <HStack gap={3} flexDirection={{ base: "column", sm: "row" }}>
                <Field.Root required invalid={Boolean(fieldErrors.firstName)} flex="1">
                  <Field.Label fontSize="xs" fontWeight="600" color="fg.muted" letterSpacing="0.04em">
                    Prénom
                  </Field.Label>
                  <Input
                    type="text"
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    placeholder="Votre prénom"
                    disabled={isSubmitting}
                    borderRadius="xl"
                    borderColor="rgba(148,163,184,0.3)"
                    fontSize="sm"
                  />
                  {fieldErrors.firstName && (
                    <Field.ErrorText fontSize="xs">{fieldErrors.firstName}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root required invalid={Boolean(fieldErrors.lastName)} flex="1">
                  <Field.Label fontSize="xs" fontWeight="600" color="fg.muted" letterSpacing="0.04em">
                    Nom
                  </Field.Label>
                  <Input
                    type="text"
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    placeholder="Votre nom"
                    disabled={isSubmitting}
                    borderRadius="xl"
                    borderColor="rgba(148,163,184,0.3)"
                    fontSize="sm"
                  />
                  {fieldErrors.lastName && (
                    <Field.ErrorText fontSize="xs">{fieldErrors.lastName}</Field.ErrorText>
                  )}
                </Field.Root>
              </HStack>
            </VStack>
          </SectionCard>

          {/* Sécurité */}
          <SectionCard
            title="Sécurité"
            description="Laissez vide pour conserver votre mot de passe actuel"
            icon={Lock}
            delay={0.15}
          >
            <VStack gap={4} alignItems="stretch">
              <Field.Root invalid={Boolean(fieldErrors.password)}>
                <Field.Label fontSize="xs" fontWeight="600" color="fg.muted" letterSpacing="0.04em">
                  Nouveau mot de passe
                </Field.Label>
                <InputGroup
                  endElement={
                    <Tooltip.Root openDelay={150}>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label={showPassword ? "Masquer" : "Afficher"}
                          onClick={() => setShowPassword((v) => !v)}
                          variant="ghost" size="sm" disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content px={3} py={1.5}>
                          {showPassword ? "Masquer" : "Afficher"}
                        </Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
                  }
                >
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder={`Au moins ${MIN_PASSWORD_LENGTH} caractères`}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    borderRadius="xl"
                    borderColor="rgba(148,163,184,0.3)"
                    fontSize="sm"
                  />
                </InputGroup>
                {fieldErrors.password && (
                  <Field.ErrorText fontSize="xs">{fieldErrors.password}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={Boolean(fieldErrors.confirmation)}>
                <Field.Label fontSize="xs" fontWeight="600" color="fg.muted" letterSpacing="0.04em">
                  Confirmer le mot de passe
                </Field.Label>
                <InputGroup
                  endElement={
                    <Tooltip.Root openDelay={150}>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label={showConfirmation ? "Masquer" : "Afficher"}
                          onClick={() => setShowConfirmation((v) => !v)}
                          variant="ghost" size="sm" disabled={isSubmitting}
                        >
                          {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content px={3} py={1.5}>
                          {showConfirmation ? "Masquer" : "Afficher"}
                        </Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
                  }
                >
                  <Input
                    type={showConfirmation ? "text" : "password"}
                    value={form.confirmation}
                    onChange={handleChange("confirmation")}
                    placeholder="Répétez votre mot de passe"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    borderRadius="xl"
                    borderColor="rgba(148,163,184,0.3)"
                    fontSize="sm"
                  />
                </InputGroup>
                {fieldErrors.confirmation && (
                  <Field.ErrorText fontSize="xs">{fieldErrors.confirmation}</Field.ErrorText>
                )}
              </Field.Root>
            </VStack>
          </SectionCard>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <VStack gap={3} alignItems="stretch">
              <Button
                type="submit"
                size="md"
                borderRadius="xl"
                fontWeight="700"
                colorPalette="blue"
                loading={isSubmitting}
                disabled={!hasChanges}
              >
                <KeyRound size={14} />
                Enregistrer les modifications
              </Button>

              <Box textAlign="center">
                <Link
                  as={NextLink}
                  href="/interviews"
                  fontSize="sm"
                  color="fg.muted"
                  fontWeight="500"
                  _hover={{ color: "blue.600", textDecoration: "none" }}
                  transition="color 0.15s"
                >
                  ← Retour aux entretiens
                </Link>
              </Box>
            </VStack>
          </motion.div>
        </chakra.form>

      </VStack>
    </Box>
  );
}
