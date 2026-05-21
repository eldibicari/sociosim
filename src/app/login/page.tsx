"use client";

import {
  Alert,
  Box,
  Button,
  Field,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Link,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authService } from "@/lib/authService";
import { toaster } from "@/components/ui/toaster";

type AuthState = {
  email: string;
  password: string;
};

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordJustCreated = searchParams.get("password") === "created";
  const passwordJustReset = searchParams.get("password") === "reset";
  const signupSuccess = searchParams.get("signup") === "success";
  const [form, setForm] = useState<AuthState>({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof AuthState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const getLoginErrorMessage = (message?: string | null) => {
    if (!message) return "Impossible de vous connecter pour le moment. Veuillez réessayer.";
    const lower = message.toLowerCase();
    if (lower.includes("timed out")) return "La connexion prend trop de temps. Réessayez dans quelques secondes.";
    if (lower.includes("banned")) return "Impossible de vous connecter. Contacter un administrateur.";
    if (message === "Invalid login credentials") return "Identifiants incorrects. Vérifiez votre email et mot de passe.";
    return "Impossible de vous connecter pour le moment. Veuillez réessayer.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    console.log("[login] Attempting sign in with:", form.email);

    try {
      const { data, error: signInError } = await authService.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      console.log("[login] Sign in response - session:", !!data?.session, "error:", signInError?.message);

      if (signInError) {
        console.error("[login] Sign in error:", signInError);
        toaster.create({
          title: "Connexion impossible",
          description: getLoginErrorMessage(signInError.message),
          type: "error",
        });
        return;
      }

      if (!data?.session?.user?.id) {
        toaster.create({
          title: "Connexion impossible",
          description: "Impossible de vous connecter pour le moment. Veuillez réessayer.",
          type: "error",
        });
        return;
      }

      console.log("[login] Sign in successful, redirecting");
      router.replace("/personnas");
    } catch (submitError) {
      console.error("[login] Sign in failed:", submitError);
      const isTimeout = submitError instanceof Error && submitError.message.includes("timed out");
      toaster.create({
        title: "Connexion impossible",
        description: isTimeout
          ? "La connexion prend trop de temps. Réessayez dans quelques secondes."
          : "Impossible de vous connecter pour le moment. Veuillez réessayer.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      minHeight="calc(100dvh - var(--app-header-height))"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={12}
      position="relative"
      overflow="hidden"
    >
      {/* Background blobs */}
      <Box className="hero-blob-1" style={{ opacity: 0.1, top: "-80px", left: "-120px" }} />
      <Box className="hero-blob-2" style={{ opacity: 0.08, bottom: "-60px", right: "-80px" }} />
      <Box className="hero-dot-grid" style={{ opacity: 0.4 }} />

      {/* Card */}
      <Box
        width="100%"
        maxWidth="440px"
        position="relative"
        zIndex={1}
        borderRadius="28px"
        borderWidth="1px"
        borderColor="var(--color-border)"
        background="var(--color-surface)"
        boxShadow="var(--color-shadow-lg)"
        overflow="hidden"
      >
        {/* Top accent line */}
        <Box
          height="3px"
          background="linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))"
        />

        <Stack gap={6} p={8}>
          {/* Branding */}
          <Stack gap={2} alignItems="center" textAlign="center">
            <Box
              width="48px"
              height="48px"
              borderRadius="16px"
              background="linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 6px 20px rgba(109,93,246,0.25)"
            >
              <GraduationCap size={24} color="white" />
            </Box>
            <Text
              className="mimesis-wordmark display-heading"
              fontSize="2xl"
              letterSpacing="-0.03em"
            >
              Mimesis
            </Text>
            <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.6">
              Simulateur d&apos;entretiens sociologiques
            </Text>
          </Stack>

          {/* Success alert */}
          {(passwordJustCreated || passwordJustReset || signupSuccess) && (
            <Alert.Root status="success" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Compte prêt</Alert.Title>
                <Alert.Description>
                  {passwordJustCreated
                    ? "Vous pouvez maintenant vous connecter."
                    : passwordJustReset
                      ? "Mot de passe réinitialisé. Connectez-vous."
                      : "Compte créé. Vérifiez vos e-mails pour confirmer votre inscription."}
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <Field.Root required>
              <Field.Label fontSize="sm" fontWeight="600" color="var(--color-text-primary)">
                Adresse e-mail
              </Field.Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="exemple@universite.fr"
                autoComplete="email"
                borderRadius="xl"
                borderColor="var(--color-border)"
                _focus={{ borderColor: "var(--color-accent)", boxShadow: "0 0 0 3px var(--color-accent-muted)" }}
              />
            </Field.Root>

            <Field.Root required>
              <HStack justify="space-between" align="center">
                <Field.Label fontSize="sm" fontWeight="600" color="var(--color-text-primary)" mb={0}>
                  Mot de passe
                </Field.Label>
                <Link
                  as={NextLink}
                  href="/reset-password"
                  fontSize="xs"
                  color="var(--color-accent)"
                  fontWeight="600"
                  _hover={{ textDecoration: "none", opacity: 0.8 }}
                >
                  Mot de passe oublié ?
                </Link>
              </HStack>
              <InputGroup
                endElement={
                  <Tooltip.Root openDelay={150}>
                    <Tooltip.Trigger asChild>
                      <IconButton
                        aria-label={showPassword ? "Masquer" : "Afficher"}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                        color="var(--color-text-muted)"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content px={3} py={2}>
                        {showPassword ? "Masquer" : "Afficher"}
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                }
              >
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  borderRadius="xl"
                  borderColor="var(--color-border)"
                  _focus={{ borderColor: "var(--color-accent)", boxShadow: "0 0 0 3px var(--color-accent-muted)" }}
                />
              </InputGroup>
            </Field.Root>

            <Button
              type="submit"
              loading={isSubmitting}
              width="100%"
              borderRadius="xl"
              height="44px"
              fontWeight="700"
              fontSize="sm"
              background="linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))"
              color="white"
              _hover={{ opacity: 0.92, transform: "translateY(-1px)", boxShadow: "0 8px 24px rgba(109,93,246,0.3)" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.15s ease"
              mt={2}
            >
              Se connecter
            </Button>
          </form>

          {/* Register link */}
          <Text fontSize="sm" color="var(--color-text-muted)" textAlign="center">
            Pas encore de compte ?{" "}
            <Link
              as={NextLink}
              href="/register"
              color="var(--color-accent)"
              fontWeight="600"
              _hover={{ textDecoration: "none", opacity: 0.8 }}
            >
              Créer un compte
            </Link>
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box minHeight="calc(100dvh - var(--app-header-height))" display="flex" alignItems="center" justifyContent="center">
          <Text color="var(--color-text-muted)">Chargement...</Text>
        </Box>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
