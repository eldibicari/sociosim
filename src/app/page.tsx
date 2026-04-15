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
import { BarChart2, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  PersonaShowcaseCard,
  type ShowcasePersona,
} from "@/app/components/PersonaShowcaseCard";

// Static persona data — IDs are merged at runtime from /api/home/featured
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
    label: "Étape 1",
    title: "Préparez votre grille",
    body: "Définissez vos thèmes, vos questions de relance et votre objectif d'entretien. La grille est votre boussole méthodologique.",
    color: "#6366f1",
  },
  {
    icon: MessageSquare,
    label: "Étape 2",
    title: "Conduisez l'entretien",
    body: "Engagez le dialogue avec le persona. Guidez, relancez, approfondissez. L'erreur fait partie de l'apprentissage.",
    color: "#059669",
  },
  {
    icon: BarChart2,
    label: "Étape 3",
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
        textAlign="center"
        background="linear-gradient(160deg, #f8faff 0%, #fdf8ff 100%)"
        borderBottom="1px solid"
        borderColor="border.subtle"
        borderRadius="2xl"
      >
        <VStack gap={6} maxW="640px" mx="auto" className="hero-animate">
          <Badge
            variant="subtle"
            colorPalette="purple"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            letterSpacing="wide"
          >
            Simulateur d&apos;entretien sociologique
          </Badge>

          <Heading
            as="h1"
            fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
            fontWeight="800"
            lineHeight="1.1"
            letterSpacing="-0.02em"
          >
            Pratiquez avant le terrain
          </Heading>

          <Text
            fontSize={{ base: "md", md: "lg" }}
            color="fg.muted"
            lineHeight="1.7"
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
      </Box>

      {/* ─── PERSONAS VITRINE ─── */}
      <Box
        py={{ base: 12, md: 16 }}
        backgroundColor="bg.subtle"
        borderRadius="2xl"
      >
        <VStack gap={8} maxW="1100px" mx="auto">
          <VStack gap={2} textAlign="center">
            <Heading as="h2" fontSize={{ base: "xl", md: "2xl" }} fontWeight="700">
              Rencontrez les enquêtés
            </Heading>
            <Text fontSize="sm" color="fg.muted" maxW="440px" lineHeight="1.7">
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
      <Box py={{ base: 12, md: 16 }}>
        <VStack gap={8} maxW="860px" mx="auto">
          <VStack gap={2} textAlign="center">
            <Heading as="h2" fontSize={{ base: "xl", md: "2xl" }} fontWeight="700">
              Comment ça fonctionne
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              Trois étapes pour un entretien complet, de la préparation à
              l&apos;analyse.
            </Text>
          </VStack>

          <Flex gap={5} direction={{ base: "column", md: "row" }} width="100%">
            {STEPS.map((step) => (
              <VStack
                key={step.title}
                flex="1"
                align="flex-start"
                gap={3}
                p={5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                backgroundColor="white"
              >
                <Box
                  width="40px"
                  height="40px"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  style={{ backgroundColor: `${step.color}18` }}
                >
                  <step.icon size={18} color={step.color} />
                </Box>
                <Text
                  fontSize="2xs"
                  fontWeight="700"
                  color="fg.muted"
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  {step.label}
                </Text>
                <Text fontWeight="600" fontSize="md">
                  {step.title}
                </Text>
                <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
                  {step.body}
                </Text>
              </VStack>
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── ANCRAGE THÉORIQUE ─── */}
      <Box
        py={{ base: 12, md: 16 }}
        backgroundColor="bg.subtle"
        borderRadius="2xl"
      >
        <VStack gap={8} maxW="860px" mx="auto">
          <VStack gap={2} textAlign="center">
            <Heading as="h2" fontSize={{ base: "xl", md: "2xl" }} fontWeight="700">
              Trois grandes théories, un terrain commun
            </Heading>
            <Text fontSize="sm" color="fg.muted" maxW="460px" lineHeight="1.7">
              Chaque persona est adossé à un cadre analytique de la sociologie
              classique.
            </Text>
          </VStack>

          <Flex gap={5} direction={{ base: "column", md: "row" }} width="100%">
            {THEORIES.map((t) => (
              <Box
                key={t.author}
                flex="1"
                p={5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                backgroundColor="white"
                borderTopWidth="3px"
                style={{ borderTopColor: t.color }}
              >
                <VStack align="flex-start" gap={2}>
                  <Text
                    fontSize="2xs"
                    fontWeight="700"
                    letterSpacing="wider"
                    textTransform="uppercase"
                    style={{ color: t.color }}
                  >
                    {t.author}
                  </Text>
                  <Text fontWeight="600" fontSize="md">
                    {t.title}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
                    {t.body}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" mt={1}>
                    Persona :{" "}
                    <strong style={{ color: t.color }}>{t.persona}</strong>
                  </Text>
                </VStack>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Box>

      {/* ─── CTA FINAL ─── */}
      <Box py={{ base: 14, md: 20 }} textAlign="center">
        <VStack gap={5} maxW="480px" mx="auto">
          <Heading as="h2" fontSize={{ base: "xl", md: "2xl" }} fontWeight="700">
            Prêt à commencer ?
          </Heading>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
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
