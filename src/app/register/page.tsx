"use client";

import {
  Box,
  Button,
  Field,
  HStack,
  Input,
  InputGroup,
  IconButton,
  Link,
  Stack,
  Text,
  Tooltip,
  chakra,
} from "@chakra-ui/react";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { withTimeout } from "@/lib/withTimeout";
import { toaster } from "@/components/ui/toaster";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmation: string;
};

type FieldErrors = Partial<Record<keyof RegisterFormState, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmation: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleChange = (field: keyof RegisterFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.firstName.trim()) errors.firstName = "Votre prénom est requis.";
    if (!form.lastName.trim()) errors.lastName = "Votre nom est requis.";
    if (!form.email.trim()) errors.email = "Votre adresse e-mail est requise.";
    else if (!emailRegex.test(form.email.trim())) errors.email = "Merci de fournir une adresse e-mail valide.";
    if (!form.password) errors.password = "Votre mot de passe est requis.";
    else if (form.password.length < MIN_PASSWORD_LENGTH) errors.password = `Au moins ${MIN_PASSWORD_LENGTH} caractères requis.`;
    if (!form.confirmation) errors.confirmation = "Merci de confirmer votre mot de passe.";
    else if (form.confirmation !== form.password) errors.confirmation = "La confirmation ne correspond pas.";
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await withTimeout(
        "register",
        fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            password: form.password,
          }),
        }),
        30000
      );

      if (response.ok) {
        router.replace("/login?signup=success");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toaster.create({
        title: "Inscription impossible",
        description: payload?.error ?? "Impossible de créer votre compte. Veuillez réessayer.",
        type: "error",
      });
    } catch (error) {
      console.error("[register] Failed to submit:", error);
      toaster.create({
        title: "Inscription impossible",
        description: "Impossible de créer votre compte. Veuillez réessayer.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputProps = {
    borderRadius: "xl",
    borderColor: "var(--color-border)",
    _focus: { borderColor: "var(--color-accent)", boxShadow: "0 0 0 3px var(--color-accent-muted)" },
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
      <Box className="hero-blob-3" style={{ opacity: 0.07 }} />
      <Box className="hero-dot-grid" style={{ opacity: 0.4 }} />

      {/* Card */}
      <Box
        width="100%"
        maxWidth="480px"
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
          background="linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
        />

        <Stack gap={6} p={8}>
          {/* Branding */}
          <Stack gap={2} alignItems="center" textAlign="center">
            <Box
              width="48px"
              height="48px"
              borderRadius="16px"
              background="linear-gradient(135deg, #6366f1, #8b5cf6)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 6px 20px rgba(99,102,241,0.3)"
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
              Créez votre accès au simulateur
            </Text>
          </Stack>

          {/* Form */}
          <chakra.form
            onSubmit={handleSubmit}
            display="flex"
            flexDirection="column"
            gap={4}
          >
            <HStack gap={3}>
              <Field.Root required invalid={Boolean(fieldErrors.firstName)} flex="1">
                <Field.Label fontSize="sm" fontWeight="600" color="var(--color-text-primary)">
                  Prénom
                </Field.Label>
                <Input
                  type="text"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  placeholder="Prénom"
                  autoComplete="given-name"
                  {...inputProps}
                />
                {fieldErrors.firstName && <Field.ErrorText fontSize="xs">{fieldErrors.firstName}</Field.ErrorText>}
              </Field.Root>

              <Field.Root required invalid={Boolean(fieldErrors.lastName)} flex="1">
                <Field.Label fontSize="sm" fontWeight="600" color="var(--color-text-primary)">
                  Nom
                </Field.Label>
                <Input
                  type="text"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  placeholder="Nom"
                  autoComplete="family-name"
                  {...inputProps}
                />
                {fieldErrors.lastName && <Field.ErrorText fontSize="xs">{fieldErrors.lastName}</Field.ErrorText>}
              </Field.Root>
            </HStack>

            <Field.Root required invalid={Boolean(fieldErrors.email)}>
              <Field.Label fontSize="sm" fontWeight="600" color="var(--color-text-primary)">
                Adresse e-mail
              </Field.Label>
              <Input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="exemple@universite.fr"
                autoComplete="email"
                {...inputProps}
              />
              {fieldErrors.email && <Field.ErrorText fontSize="xs">{fieldErrors.email}</Field.ErrorText>}
            </Field.Root>

            <Field.Root required invalid={Boolean(fieldErrors.password)}>
              <Field.Label fontSize="sm" fontWeight="600" color="var(--color-text-primary)">
                Mot de passe
              </Field.Label>
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
                      <Tooltip.Content px={3} py={2}>{showPassword ? "Masquer" : "Afficher"}</Tooltip.Content>
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
                  {...inputProps}
                />
              </InputGroup>
              {fieldErrors.password && <Field.ErrorText fontSize="xs">{fieldErrors.password}</Field.ErrorText>}
            </Field.Root>

            <Field.Root required invalid={Boolean(fieldErrors.confirmation)}>
              <Field.Label fontSize="sm" fontWeight="600" color="var(--color-text-primary)">
                Confirmez le mot de passe
              </Field.Label>
              <InputGroup
                endElement={
                  <Tooltip.Root openDelay={150}>
                    <Tooltip.Trigger asChild>
                      <IconButton
                        aria-label={showConfirmation ? "Masquer" : "Afficher"}
                        onClick={() => setShowConfirmation(!showConfirmation)}
                        variant="ghost"
                        size="sm"
                        color="var(--color-text-muted)"
                      >
                        {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content px={3} py={2}>{showConfirmation ? "Masquer" : "Afficher"}</Tooltip.Content>
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
                  {...inputProps}
                />
              </InputGroup>
              {fieldErrors.confirmation && <Field.ErrorText fontSize="xs">{fieldErrors.confirmation}</Field.ErrorText>}
            </Field.Root>

            <Button
              type="submit"
              loading={isSubmitting}
              width="100%"
              borderRadius="xl"
              height="44px"
              fontWeight="700"
              fontSize="sm"
              background="linear-gradient(135deg, var(--color-accent), #8b5cf6)"
              color="white"
              _hover={{ opacity: 0.92, transform: "translateY(-1px)", boxShadow: "0 8px 24px rgba(91,91,214,0.3)" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.15s ease"
              mt={1}
            >
              Créer mon compte
            </Button>
          </chakra.form>

          <Text fontSize="sm" color="var(--color-text-muted)" textAlign="center">
            Vous avez un compte ?{" "}
            <Link
              as={NextLink}
              href="/login"
              color="var(--color-accent)"
              fontWeight="600"
              _hover={{ textDecoration: "none", opacity: 0.8 }}
            >
              Se connecter
            </Link>
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}
