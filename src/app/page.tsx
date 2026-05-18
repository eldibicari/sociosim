"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { BarChart2, BookOpen, Eye, FileText, MessageSquare, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  PersonaShowcaseCard,
  type ShowcasePersona,
} from "@/app/components/PersonaShowcaseCard";
import { InterviewSceneSVG } from "@/app/components/InterviewSceneSVG";
import { Reveal, FadeIn } from "@/app/components/ScrollReveal";

const SHOWCASE_BASE: Omit<ShowcasePersona, "id">[] = [
  {
    agent_name: "jade",
    role: "Étudiante en master de droit, 26 ans",
    posture: "Utilisatrice critique",
    difficulty: "Exigeante",
    greeting:
      "Je lis tout ce qui sort sur ces outils. Le vrai problème ? Personne ne réfléchit vraiment à ce qu'il fait avec.",
    sampleQuestion: "Comment utilisez-vous l'IA dans vos études ?",
    sampleAnswer:
      "Je l'utilise, oui. Mais avec méfiance. Je vérifie toujours. C'est pas parce qu'une machine le dit que c'est vrai.",
    color: "#e53e3e",
    accent: "#dd6b20",
    avatarBg: "#c53030",
  },
  {
    agent_name: "oriane",
    role: "Chargée de mission RH, 34 ans",
    posture: "Utilisatrice réflexive",
    difficulty: "Intermédiaire",
    greeting:
      "Je m'en sers pour les comptes-rendus, la prépa de réunions... Pratique, mais je garde toujours un œil dessus.",
    sampleQuestion: "Est-ce que vous le trouvez fiable ?",
    sampleAnswer:
      "Ça dépend pour quoi. Pour reformuler un texte, oui. Pour analyser des situations humaines... pas vraiment.",
    color: "#6366f1",
    accent: "#8b5cf6",
    avatarBg: "#4f46e5",
  },
  {
    agent_name: "theo",
    role: "Étudiant en licence de sociologie, 21 ans",
    posture: "Utilisateur curieux",
    difficulty: "Accessible",
    greeting:
      "Honnêtement, j'y connais pas grand-chose. Je l'ai utilisé pour résumer des cours, c'est à peu près tout.",
    sampleQuestion: "Vous lui faites confiance ?",
    sampleAnswer:
      "Bah... à peu près. Une fois il m'a sorti un truc complètement faux. Depuis je recoupe toujours.",
    color: "#059669",
    accent: "#0d9488",
    avatarBg: "#047857",
  },
];

const STEPS = [
  {
    icon: BookOpen,
    title: "Préparez votre grille",
    body: "Définissez vos thèmes, vos questions de relance et votre objectif d'entretien. La grille est votre boussole méthodologique.",
  },
  {
    icon: MessageSquare,
    title: "Conduisez l'entretien",
    body: "Engagez le dialogue avec le persona. Guidez, relancez, approfondissez. L'erreur fait partie de l'apprentissage.",
  },
  {
    icon: BarChart2,
    title: "Analysez votre pratique",
    body: "Transcription automatique, thèmes couverts, premières pistes de codage. Prenez du recul sur votre posture d'enquêteur.",
  },
];

const TEACHER_FEATURES = [
  {
    icon: Users,
    title: "Créez vos propres personas",
    body: "Construisez des profils à partir de vos propres entretiens de recherche. Chaque persona dispose d'un prompt, d'une grille et d'un historique séparés.",
  },
  {
    icon: Eye,
    title: "Suivez les entretiens",
    body: "Accédez à tous les entretiens de vos étudiants depuis votre espace admin. Lisez les verbatims, consultez les analyses et identifiez les difficultés.",
  },
  {
    icon: Settings2,
    title: "Configurez la grille",
    body: "Définissez les thèmes et questions de relance propres à chaque persona. La grille est séparée du prompt : elle guide l'étudiant sans contraindre le persona.",
  },
  {
    icon: FileText,
    title: "Exportez les résultats",
    body: "Transcription horodatée, analyse pédagogique et export PDF pour chaque entretien. Réutilisable en TD, en correction ou dans un portfolio étudiant.",
  },
];

type FeaturedPersona = { id: string; agent_name: string };

export default function Home() {
  const { user, isLoading } = useAuthUser();
  const [personas, setPersonas] = useState<ShowcasePersona[]>([]);

  useEffect(() => {
    fetch("/api/home/featured")
      .then((r) => r.json())
      .then(({ personas: featured }: { personas?: FeaturedPersona[] }) => {
        const merged = SHOWCASE_BASE.map((base) => {
          const found = featured?.find((f) => f.agent_name === base.agent_name);
          return { ...base, id: found?.id ?? base.agent_name };
        });
        setPersonas(merged);
      })
      .catch(() => {
        setPersonas(SHOWCASE_BASE.map((b) => ({ ...b, id: b.agent_name })));
      });
  }, []);

  const displayPersonas =
    personas.length > 0
      ? personas
      : SHOWCASE_BASE.map((b) => ({ ...b, id: b.agent_name }));

  return (
    <VStack gap={0} width="100%" align="stretch">

      {/* ─── HERO ─── */}
      <Box
        py={{ base: 16, md: 24 }}
        background="var(--color-bg)"
        borderBottom="1px solid var(--color-border)"
        px={{ base: 6, md: 8 }}
      >
        <Flex
          maxW="1100px"
          mx="auto"
          gap={{ base: 12, md: 16 }}
          direction={{ base: "column", md: "row" }}
          align="center"
        >
          {/* Left: copy */}
          <VStack align="flex-start" gap={6} flex="1">
            <Badge
              borderRadius="full"
              px={4}
              py={1}
              fontSize="xs"
              letterSpacing="widest"
              textTransform="uppercase"
              style={{
                background: "var(--color-accent-soft)",
                color: "var(--color-accent)",
                border: "1px solid var(--color-accent-border)",
              }}
            >
              Simulateur d&apos;entretien sociologique
            </Badge>

            <Heading
              as="h1"
              className="display-heading"
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
              fontWeight="400"
              lineHeight="1.1"
              letterSpacing="-0.03em"
              color="var(--color-text-primary)"
            >
              Pratiquez avant le terrain
            </Heading>

            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="var(--color-text-muted)"
              lineHeight="1.75"
              maxW="440px"
            >
              Conduisez des entretiens semi-directifs face à des enquêtés
              virtuels. Analysez votre pratique, comprenez vos données.
            </Text>

            <HStack gap={3} mt={2} flexWrap="wrap">
              <Button
                asChild
                size="lg"
                borderRadius="xl"
                px={8}
                style={{
                  background: "var(--color-accent)",
                  color: "white",
                }}
              >
                <Link href="/personnas">
                  {user ? "Accéder aux personas" : "Voir les personas"}
                </Link>
              </Button>
              {!isLoading && !user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  borderRadius="xl"
                  px={8}
                  style={{
                    borderColor: "var(--color-border-strong)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <Link href="/login">Se connecter</Link>
                </Button>
              )}
            </HStack>
          </VStack>

          {/* Right: scene illustration */}
          <Box
            flex="1"
            display={{ base: "none", md: "block" }}
            position="relative"
            height="320px"
            borderRadius="2xl"
            overflow="hidden"
            borderWidth="1px"
            borderColor="var(--color-border)"
            background="var(--color-accent-soft)"
          >
            <InterviewSceneSVG />
          </Box>
        </Flex>
      </Box>

      {/* ─── PERSONAS VITRINE ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        background="var(--color-surface)"
        borderBottom="1px solid var(--color-border)"
      >
        <VStack gap={10} maxW="1100px" mx="auto" px={{ base: 4, md: 6 }}>
          <Reveal>
            <VStack gap={3} textAlign="center">
              <Text
                fontSize="xs"
                fontWeight="700"
                color="var(--color-accent)"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                Vos enquêtés
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="700"
                letterSpacing="-0.02em"
                color="var(--color-text-primary)"
              >
                Rencontrez les personas
              </Heading>
              <Text fontSize="sm" color="var(--color-text-muted)" maxW="420px" lineHeight="1.8">
                Trois profils construits à partir d&apos;entretiens réels sur
                l&apos;usage de l&apos;IA à l&apos;université.
              </Text>
            </VStack>
          </Reveal>

          <Flex gap={5} direction={{ base: "column", lg: "row" }} width="100%" alignItems="stretch">
            {displayPersonas.map((p, i) => (
              <FadeIn key={p.agent_name} index={i} style={{ flex: 1, minWidth: 0 }}>
                <PersonaShowcaseCard persona={p} index={0} />
              </FadeIn>
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── 3 ÉTAPES ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        borderBottom="1px solid var(--color-border)"
        background="var(--color-surface-muted)"
      >
        <VStack gap={10} maxW="860px" mx="auto" px={{ base: 4, md: 6 }}>
          <Reveal>
            <VStack gap={3} textAlign="center">
              <Text
                fontSize="xs"
                fontWeight="700"
                color="var(--color-accent)"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                La méthode
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="700"
                letterSpacing="-0.02em"
                color="var(--color-text-primary)"
              >
                Comment ça fonctionne
              </Heading>
              <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.8">
                Trois étapes pour un entretien complet, de la préparation à
                l&apos;analyse.
              </Text>
            </VStack>
          </Reveal>

          <Flex gap={5} direction={{ base: "column", md: "row" }} width="100%">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} index={i} style={{ flex: 1 }}>
                <VStack
                  align="flex-start"
                  gap={4}
                  p={6}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="var(--color-border)"
                  background="var(--color-surface)"
                  height="100%"
                  boxShadow="var(--color-shadow-sm)"
                >
                  <HStack gap={3} alignItems="center">
                    <Box
                      width="32px"
                      height="32px"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      background="var(--color-accent)"
                      flexShrink={0}
                    >
                      <Text fontSize="sm" fontWeight="800" color="white" lineHeight="1">
                        {i + 1}
                      </Text>
                    </Box>
                    <Box
                      width="32px"
                      height="32px"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      background="var(--color-accent-soft)"
                      flexShrink={0}
                    >
                      <step.icon size={16} color="var(--color-accent)" />
                    </Box>
                  </HStack>
                  <Text fontWeight="700" fontSize="md" lineHeight="1.3" color="var(--color-text-primary)">
                    {step.title}
                  </Text>
                  <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.75">
                    {step.body}
                  </Text>
                </VStack>
              </FadeIn>
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── POUR LES ENSEIGNANTS ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        borderBottom="1px solid var(--color-border)"
        background="var(--color-surface)"
      >
        <VStack gap={10} maxW="900px" mx="auto" px={{ base: 4, md: 6 }}>
          <Reveal>
            <VStack gap={3} textAlign="center">
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="widest"
                textTransform="uppercase"
                color="var(--color-accent)"
              >
                Pour les enseignants
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="700"
                letterSpacing="-0.02em"
                color="var(--color-text-primary)"
              >
                Conçu pour l&apos;enseignement universitaire
              </Heading>
              <Text fontSize="sm" color="var(--color-text-muted)" maxW="480px" lineHeight="1.8">
                Mimesis est développé au sein de l&apos;UMR LISIS — Université Gustave
                Eiffel. Les enseignants disposent d&apos;un espace admin complet pour
                piloter les activités pédagogiques.
              </Text>
            </VStack>
          </Reveal>

          <Flex gap={5} direction={{ base: "column", md: "row" }} width="100%" flexWrap="wrap">
            {TEACHER_FEATURES.map((f, i) => (
              <FadeIn key={f.title} index={i} style={{ flex: "1 1 calc(50% - 10px)", minWidth: "260px" }}>
                <Box
                  p={5}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="var(--color-border)"
                  background="var(--color-surface)"
                  height="100%"
                  boxShadow="var(--color-shadow-sm)"
                >
                  <HStack gap={3} alignItems="flex-start">
                    <Box
                      mt={0.5}
                      width="36px"
                      height="36px"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      background="var(--color-accent-soft)"
                    >
                      <f.icon size={17} color="var(--color-accent)" />
                    </Box>
                    <VStack align="flex-start" gap={1}>
                      <Text fontWeight="700" fontSize="sm" color="var(--color-text-primary)">{f.title}</Text>
                      <Text fontSize="sm" color="var(--color-text-muted)" lineHeight="1.7">{f.body}</Text>
                    </VStack>
                  </HStack>
                </Box>
              </FadeIn>
            ))}
          </Flex>

          <Reveal delay={0.2}>
            <HStack
              gap={4}
              px={6}
              py={4}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="var(--color-border)"
              background="var(--color-surface-muted)"
              width="100%"
              flexWrap="wrap"
              justifyContent="center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/Logo_Universite_Gustave_Eiffel_2020.svg"
                alt="Université Gustave Eiffel"
                style={{ height: "28px", width: "auto", opacity: 0.8 }}
              />
              <Box
                width="1px"
                height="28px"
                background="var(--color-border)"
                display={{ base: "none", sm: "block" }}
              />
              <Text fontSize="xs" color="var(--color-text-muted)" textAlign="center">
                Développé par l&apos;UMR LISIS — Laboratoire Interdisciplinaire Sciences,
                Innovations, Sociétés
              </Text>
            </HStack>
          </Reveal>
        </VStack>
      </Box>

      {/* ─── CTA FINAL ─── */}
      <Box
        py={{ base: 16, md: 24 }}
        textAlign="center"
        background="var(--color-accent-soft)"
        borderTop="1px solid var(--color-accent-border)"
        px={{ base: 6, md: 8 }}
      >
        <VStack gap={5} maxW="480px" mx="auto">
          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="700"
            letterSpacing="-0.02em"
            color="var(--color-text-primary)"
          >
            Prêt à commencer ?
          </Heading>
          <Text fontSize="md" color="var(--color-text-muted)" lineHeight="1.75">
            {user
              ? "Choisissez un persona et commencez votre premier entretien."
              : "Créez un compte pour accéder aux personas et démarrer votre premier entretien."}
          </Text>
          <Button
            asChild
            size="lg"
            borderRadius="xl"
            px={10}
            style={{
              background: "var(--color-accent)",
              color: "white",
            }}
          >
            <Link href={user ? "/personnas" : "/register"}>
              {user ? "Voir les personas" : "Créer un compte"}
            </Link>
          </Button>
        </VStack>
      </Box>

    </VStack>
  );
}
