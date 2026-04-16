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
import { InterviewScene3D } from "@/app/components/InterviewScene3D";
import { Reveal, FadeIn, AnimatedCounter } from "@/app/components/ScrollReveal";

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
    color: "#6366f1",
  },
  {
    icon: MessageSquare,
    title: "Conduisez l'entretien",
    body: "Engagez le dialogue avec le persona. Guidez, relancez, approfondissez. L'erreur fait partie de l'apprentissage.",
    color: "#059669",
  },
  {
    icon: BarChart2,
    title: "Analysez votre pratique",
    body: "Transcription automatique, thèmes couverts, premières pistes de codage. Prenez du recul sur votre posture d'enquêteur.",
    color: "#e53e3e",
  },
];

const THEORIES = [
  {
    author: "Bourdieu",
    title: "Capital & Habitus",
    body: "Comment les pratiques numériques reproduisent-elles les inégalités ? Jade vous confronte à la logique des capitaux culturels et des dispositions incorporées.",
    color: "#e53e3e",
    persona: "Jade",
  },
  {
    author: "Crozier & Friedberg",
    title: "Pouvoir & Stratégie",
    body: "Dans les organisations, tout usage est stratégique. Oriane révèle les jeux d'acteurs autour de l'adoption des outils IA.",
    color: "#6366f1",
    persona: "Oriane",
  },
  {
    author: "Latour",
    title: "Réseau & Inscription",
    body: "Les technologies ne font pas que des outils. Théo vous entraîne dans la construction sociotechnique des usages quotidiens.",
    color: "#059669",
    persona: "Théo",
  },
];

const STATS = [
  { value: "∞", label: "Personas créables" },
  { value: "3", label: "Cadres théoriques" },
  { value: "Auto", label: "Analyse post-entretien" },
  { value: "PDF", label: "Export disponible" },
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
        position="relative"
        overflow="hidden"
        py={{ base: 20, md: 28 }}
        textAlign="center"
        background="linear-gradient(160deg, #f8faff 0%, #f0ebff 55%, #fdf2ff 100%)"
        borderBottom="1px solid"
        borderColor="border.subtle"
        px={{ base: 4, md: 8 }}
      >
        {/* Mesh background : blobs flottants animés */}
        <Box className="hero-blob-1" />
        <Box className="hero-blob-2" />
        <Box className="hero-blob-3" />
        {/* Grille de points */}
        <Box className="hero-dot-grid" />
        {/* Scène 3D : deux entités en entretien */}
        <Box position="absolute" inset={0} opacity={0.55} pointerEvents="none">
          <InterviewScene3D />
        </Box>

        <VStack gap={6} maxW="720px" mx="auto" position="relative" zIndex={1}>

          {/* Logo Mimesis wordmark aurora */}
          <Box className="hero-animate">
            <Text
              className="mimesis-wordmark"
              fontSize={{ base: "5xl", md: "6xl", lg: "7xl" }}
              fontWeight="900"
              letterSpacing="-0.05em"
              lineHeight="1"
              as="span"
            >
              Mimesis
            </Text>
          </Box>

          <VStack gap={5} className="hero-animate" style={{ animationDelay: "0.18s" }}>
            <Badge
              variant="subtle"
              colorPalette="purple"
              borderRadius="full"
              px={4}
              py={1}
              fontSize="xs"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Simulateur d&apos;entretien sociologique
            </Badge>

            <Heading
              as="h1"
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
              fontWeight="800"
              lineHeight="1.1"
              letterSpacing="-0.03em"
            >
              Pratiquez avant{" "}
              <Text
                as="span"
                style={{
                  background: "linear-gradient(135deg, #6366f1 30%, #8b5cf6 70%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                le terrain
              </Text>
            </Heading>

            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="fg.muted"
              lineHeight="1.75"
              maxW="480px"
            >
              Conduisez des entretiens semi-directifs face à des enquêtés
              virtuels. Analysez votre pratique, comprenez vos données.
            </Text>

            <HStack gap={3} mt={2} flexWrap="wrap" justifyContent="center">
              <Button
                asChild
                size="lg"
                colorPalette="blue"
                borderRadius="xl"
                px={8}
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
                >
                  <Link href="/login">Se connecter</Link>
                </Button>
              )}
            </HStack>
          </VStack>
        </VStack>
      </Box>

      {/* ─── STATS STRIP ─── */}
      <Box
        py={8}
        borderBottom="1px solid"
        borderColor="border.subtle"
        background="linear-gradient(90deg, #fafbff 0%, #f5f0ff 50%, #fafbff 100%)"
      >
        <Flex
          maxW="760px"
          mx="auto"
          px={{ base: 4, md: 8 }}
          gap={0}
          direction={{ base: "column", sm: "row" }}
          alignItems="stretch"
        >
          {STATS.map((s, i) => (
            <FadeIn key={s.label} index={i} style={{ flex: 1 }}>
              <Box
                textAlign="center"
                px={4}
                py={{ base: 4, sm: 0 }}
                borderLeft={i > 0 ? { base: "none", sm: "1px solid" } : "none"}
                borderTop={i > 0 ? { base: "1px solid", sm: "none" } : "none"}
                borderColor="border.subtle"
              >
                <Text
                  fontSize={{ base: "2xl", md: "3xl" }}
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  lineHeight="1"
                  mb={1}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  <AnimatedCounter value={s.value} />
                </Text>
                <Text fontSize="xs" color="fg.muted" fontWeight="500">
                  {s.label}
                </Text>
              </Box>
            </FadeIn>
          ))}
        </Flex>
      </Box>

      {/* ─── PERSONAS VITRINE ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        backgroundColor="bg.subtle"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <VStack gap={10} maxW="1100px" mx="auto" px={{ base: 2, md: 4 }}>
          <Reveal>
            <VStack gap={3} textAlign="center">
              <Text
                fontSize="xs"
                fontWeight="700"
                color="blue.500"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                Vos enquêtés
              </Text>
              <Heading as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" letterSpacing="-0.02em">
                Rencontrez les personas
              </Heading>
              <Text fontSize="sm" color="fg.muted" maxW="420px" lineHeight="1.8">
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
        borderBottom="1px solid"
        borderColor="border.subtle"
        position="relative"
        overflow="hidden"
        background="linear-gradient(180deg, #ffffff 0%, #f8f7ff 100%)"
      >
        {/* Subtle grid pattern */}
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <VStack gap={10} maxW="860px" mx="auto" px={{ base: 2, md: 4 }} position="relative" zIndex={1}>
          <Reveal>
            <VStack gap={3} textAlign="center">
              <Text
                fontSize="xs"
                fontWeight="700"
                color="blue.500"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                La méthode
              </Text>
              <Heading as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" letterSpacing="-0.02em">
                Comment ça fonctionne
              </Heading>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.8">
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
                  height="100%"
                  position="relative"
                  overflow="hidden"
                  style={{
                    borderColor: `${step.color}22`,
                    background: `linear-gradient(135deg, ${step.color}08 0%, white 60%)`,
                    boxShadow: `0 4px 24px -8px ${step.color}22`,
                  }}
                >
                  <Box
                    position="absolute"
                    top="-20px"
                    right="-20px"
                    width="80px"
                    height="80px"
                    borderRadius="full"
                    pointerEvents="none"
                    style={{
                      background: `radial-gradient(circle, ${step.color}20, transparent 70%)`,
                      filter: "blur(12px)",
                    }}
                  />
                  <HStack gap={3} alignItems="center">
                    <Box
                      width="34px"
                      height="34px"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      style={{ backgroundColor: step.color }}
                    >
                      <Text fontSize="sm" fontWeight="800" color="white" lineHeight="1">
                        {i + 1}
                      </Text>
                    </Box>
                    <Box
                      width="34px"
                      height="34px"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      style={{ backgroundColor: `${step.color}14` }}
                    >
                      <step.icon size={16} color={step.color} />
                    </Box>
                  </HStack>
                  <Text fontWeight="700" fontSize="md" lineHeight="1.3">
                    {step.title}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
                    {step.body}
                  </Text>
                </VStack>
              </FadeIn>
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── ANCRAGE THÉORIQUE ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        position="relative"
        overflow="hidden"
        style={{
          background: "linear-gradient(160deg, #07071a 0%, #100d28 55%, #070f1e 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Grille de points sombre */}
        <Box className="dark-section-dots" />
        {/* Blob central lumineux */}
        <Box
          position="absolute"
          width="700px"
          height="380px"
          borderRadius="50%"
          top="-60px"
          left="50%"
          style={{
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)",
            filter: "blur(64px)",
            pointerEvents: "none",
          }}
        />

        <VStack gap={10} maxW="860px" mx="auto" px={{ base: 2, md: 4 }} position="relative" zIndex={1}>
          <Reveal>
            <VStack gap={3} textAlign="center">
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="widest"
                textTransform="uppercase"
                style={{ color: "#818cf8" }}
              >
                Ancrage théorique
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="700"
                letterSpacing="-0.02em"
                color="white"
              >
                Trois grandes théories,<br />un terrain commun
              </Heading>
              <Text fontSize="sm" maxW="440px" lineHeight="1.8" style={{ color: "rgba(255,255,255,0.5)" }}>
                Chaque persona est adossé à un cadre analytique de la sociologie
                classique.
              </Text>
            </VStack>
          </Reveal>

          <Flex gap={5} direction={{ base: "column", md: "row" }} width="100%">
              {THEORIES.map((t) => (
                <FadeIn key={t.author} index={THEORIES.indexOf(t)} style={{ flex: 1 }}>
                  <Box
                    p={6}
                    borderRadius="2xl"
                    borderWidth="1px"
                    className="theory-glass-card"
                    position="relative"
                    overflow="hidden"
                    height="100%"
                    style={{
                      borderColor: `${t.color}30`,
                      background: `linear-gradient(135deg, ${t.color}12 0%, ${t.color}05 100%)`,
                    }}
                    _hover={{
                      transform: "translateY(-5px)",
                      boxShadow: `0 20px 48px -8px ${t.color}44`,
                    }}
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      height="2px"
                      style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }}
                    />
                    <VStack align="flex-start" gap={3} pt={2}>
                      <Text
                        fontSize="xs"
                        fontWeight="800"
                        letterSpacing="widest"
                        textTransform="uppercase"
                        style={{ color: t.color }}
                      >
                        {t.author}
                      </Text>
                      <Text fontWeight="700" fontSize="lg" lineHeight="1.25" letterSpacing="-0.01em" color="white">
                        {t.title}
                      </Text>
                      <Text fontSize="sm" lineHeight="1.75" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {t.body}
                      </Text>
                      <Box
                        display="inline-flex"
                        alignItems="center"
                        gap={1}
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        style={{ backgroundColor: `${t.color}20` }}
                      >
                        <Text fontSize="xs" style={{ color: t.color }} fontWeight="600">
                          → {t.persona}
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                </FadeIn>
              ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── POUR LES ENSEIGNANTS ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        borderBottom="1px solid"
        borderColor="border.subtle"
        position="relative"
        overflow="hidden"
        background="linear-gradient(180deg, #f8f7ff 0%, #ffffff 100%)"
      >
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <VStack gap={10} maxW="900px" mx="auto" px={{ base: 2, md: 4 }} position="relative" zIndex={1}>
          <Reveal>
            <VStack gap={3} textAlign="center">
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="widest"
                textTransform="uppercase"
                style={{ color: "#6366f1" }}
              >
                Pour les enseignants
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="700"
                letterSpacing="-0.02em"
              >
                Conçu pour l&apos;enseignement universitaire
              </Heading>
              <Text fontSize="sm" color="fg.muted" maxW="480px" lineHeight="1.8">
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
                  height="100%"
                  style={{
                    borderColor: "rgba(99,102,241,0.15)",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, white 60%)",
                    boxShadow: "0 2px 16px -4px rgba(99,102,241,0.12)",
                  }}
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
                      style={{ backgroundColor: "rgba(99,102,241,0.1)" }}
                    >
                      <f.icon size={17} color="#6366f1" />
                    </Box>
                    <VStack align="flex-start" gap={1}>
                      <Text fontWeight="700" fontSize="sm">{f.title}</Text>
                      <Text fontSize="sm" color="fg.muted" lineHeight="1.7">{f.body}</Text>
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
              borderColor="border.subtle"
              backgroundColor="bg.subtle"
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
              <Box width="1px" height="28px" backgroundColor="border.muted" display={{ base: "none", sm: "block" }} />
              <Text fontSize="xs" color="fg.muted" textAlign="center">
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
        position="relative"
        overflow="hidden"
        background="linear-gradient(160deg, #f8faff 0%, #f0ebff 55%, #fdf2ff 100%)"
        px={{ base: 4, md: 8 }}
      >
        {/* Blob central */}
        <Box
          position="absolute"
          width="600px"
          height="400px"
          borderRadius="50%"
          top="-130px"
          left="50%"
          style={{
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 65%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />
        {/* Blob bas-droite */}
        <Box
          position="absolute"
          width="360px"
          height="300px"
          borderRadius="50%"
          bottom="-80px"
          right="8%"
          style={{
            background: "radial-gradient(ellipse, rgba(236,72,153,0.13) 0%, transparent 65%)",
            filter: "blur(72px)",
            pointerEvents: "none",
          }}
        />
        {/* Blob bas-gauche */}
        <Box
          position="absolute"
          width="280px"
          height="240px"
          borderRadius="50%"
          bottom="-60px"
          left="8%"
          style={{
            background: "radial-gradient(ellipse, rgba(6,182,212,0.1) 0%, transparent 65%)",
            filter: "blur(64px)",
            pointerEvents: "none",
          }}
        />
        <Box className="hero-dot-grid" />

        <VStack gap={5} maxW="480px" mx="auto" className="hero-animate" position="relative" zIndex={1}>
          <Text
            className="mimesis-wordmark"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="900"
            letterSpacing="-0.04em"
            lineHeight="1"
            as="span"
          >
            Mimesis
          </Text>
          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="800"
            letterSpacing="-0.02em"
            mt={-2}
          >
            Prêt à commencer ?
          </Heading>
          <Text fontSize="md" color="fg.muted" lineHeight="1.75">
            {user
              ? "Choisissez un persona et commencez votre premier entretien."
              : "Créez un compte pour accéder aux personas et démarrer votre premier entretien."}
          </Text>
          <Button
            asChild
            size="lg"
            colorPalette="blue"
            borderRadius="xl"
            px={10}
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
