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
        py={{ base: 20, md: 28 }}
        textAlign="center"
        background="linear-gradient(150deg, #eef2ff 0%, #f5f0ff 55%, #fdf4ff 100%)"
        borderBottom="1px solid"
        borderColor="border.subtle"
        px={{ base: 4, md: 8 }}
      >
        <VStack gap={7} maxW="720px" mx="auto" className="hero-animate">
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
            fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
            fontWeight="800"
            lineHeight="1.08"
            letterSpacing="-0.03em"
          >
            Pratiquez avant<br />le terrain
          </Heading>

          <Text
            fontSize={{ base: "md", md: "xl" }}
            color="fg.muted"
            lineHeight="1.75"
            maxW="500px"
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
      </Box>

      {/* ─── STATS STRIP ─── */}
      <Box
        py={8}
        borderBottom="1px solid"
        borderColor="border.subtle"
        backgroundColor="white"
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
            <Box
              key={s.label}
              flex="1"
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
                color="blue.600"
                lineHeight="1"
                mb={1}
              >
                {s.value}
              </Text>
              <Text fontSize="xs" color="fg.muted" fontWeight="500">
                {s.label}
              </Text>
            </Box>
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

          <Flex
            gap={5}
            direction={{ base: "column", lg: "row" }}
            width="100%"
            alignItems="stretch"
          >
            {displayPersonas.map((p, i) => (
              <PersonaShowcaseCard key={p.agent_name} persona={p} index={i} />
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── 3 ÉTAPES ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <VStack gap={10} maxW="860px" mx="auto" px={{ base: 2, md: 4 }}>
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

          <Flex gap={5} direction={{ base: "column", md: "row" }} width="100%">
            {STEPS.map((step, i) => (
              <VStack
                key={step.title}
                flex="1"
                align="flex-start"
                gap={4}
                p={6}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                backgroundColor="white"
                boxShadow="sm"
              >
                {/* Numéro + icône */}
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
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── ANCRAGE THÉORIQUE ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        backgroundColor="bg.subtle"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <VStack gap={10} maxW="860px" mx="auto" px={{ base: 2, md: 4 }}>
          <VStack gap={3} textAlign="center">
            <Text
              fontSize="xs"
              fontWeight="700"
              color="blue.500"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Ancrage théorique
            </Text>
            <Heading as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" letterSpacing="-0.02em">
              Trois grandes théories,<br />un terrain commun
            </Heading>
            <Text fontSize="sm" color="fg.muted" maxW="440px" lineHeight="1.8">
              Chaque persona est adossé à un cadre analytique de la sociologie
              classique.
            </Text>
          </VStack>

          <Flex gap={5} direction={{ base: "column", md: "row" }} width="100%">
            {THEORIES.map((t) => (
              <Box
                key={t.author}
                flex="1"
                p={6}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                backgroundColor="white"
                boxShadow="sm"
                position="relative"
                overflow="hidden"
              >
                {/* Accent bar top */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  height="3px"
                  style={{ backgroundColor: t.color }}
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
                  <Text fontWeight="700" fontSize="lg" lineHeight="1.25" letterSpacing="-0.01em">
                    {t.title}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
                    {t.body}
                  </Text>
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    gap={1}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    style={{ backgroundColor: `${t.color}12` }}
                  >
                    <Text fontSize="xs" style={{ color: t.color }} fontWeight="600">
                      → {t.persona}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── POUR LES ENSEIGNANTS ─── */}
      <Box
        py={{ base: 14, md: 20 }}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <VStack gap={10} maxW="900px" mx="auto" px={{ base: 2, md: 4 }}>
          <VStack gap={3} textAlign="center">
            <Text
              fontSize="xs"
              fontWeight="700"
              color="blue.500"
              letterSpacing="widest"
              textTransform="uppercase"
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

          <Flex
            gap={5}
            direction={{ base: "column", md: "row" }}
            width="100%"
            flexWrap="wrap"
          >
            {TEACHER_FEATURES.map((f) => (
              <Box
                key={f.title}
                flex={{ base: "1 1 100%", md: "1 1 calc(50% - 10px)" }}
                p={5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                backgroundColor="white"
                boxShadow="sm"
              >
                <HStack gap={3} alignItems="flex-start">
                  <Box
                    mt={0.5}
                    width="36px"
                    height="36px"
                    borderRadius="lg"
                    backgroundColor="#6366f114"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <f.icon size={17} color="#6366f1" />
                  </Box>
                  <VStack align="flex-start" gap={1}>
                    <Text fontWeight="700" fontSize="sm">
                      {f.title}
                    </Text>
                    <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
                      {f.body}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </Flex>

          {/* Crédibilité institutionnelle */}
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
            <Box
              width="1px"
              height="28px"
              backgroundColor="border.muted"
              display={{ base: "none", sm: "block" }}
            />
            <Text fontSize="xs" color="fg.muted" textAlign="center">
              Développé par l&apos;UMR LISIS — Laboratoire Interdisciplinaire Sciences,
              Innovations, Sociétés
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* ─── CTA FINAL ─── */}
      <Box
        py={{ base: 16, md: 24 }}
        textAlign="center"
        background="linear-gradient(150deg, #eef2ff 0%, #f5f0ff 55%, #fdf4ff 100%)"
        px={{ base: 4, md: 8 }}
      >
        <VStack gap={5} maxW="480px" mx="auto" className="hero-animate">
          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="800"
            letterSpacing="-0.02em"
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
