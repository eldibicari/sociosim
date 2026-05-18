"use client";

import {
  Badge,
  Box,
  Button,
  Field,
  Grid,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { WandSparkles } from "lucide-react";
import type { PersonaConfig } from "@/lib/personaConfig";
import { buildPersonaPromptFromConfig } from "@/lib/personaPromptComposer";

type Props = {
  personaName: string;
  value: PersonaConfig;
  onChange: (nextValue: PersonaConfig) => void;
  onGenerate: (prompt: string) => void;
};

function arrayToMultiline(values: string[]) {
  return values.join("\n");
}

function multilineToArray(value: string) {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="rgba(148, 163, 184, 0.18)"
      backgroundColor="rgba(255,255,255,0.88)"
      px={{ base: 4, md: 5 }}
      py={{ base: 4, md: 5 }}
    >
      <VStack align="stretch" gap={4}>
        <VStack align="stretch" gap={1}>
          <Heading size="sm">{title}</Heading>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.7">
            {description}
          </Text>
        </VStack>
        {children}
      </VStack>
    </Box>
  );
}

export default function PersonaConfigBuilder({
  personaName,
  value,
  onChange,
  onGenerate,
}: Props) {
  const updateIdentity = (patch: Partial<PersonaConfig["identity"]>) => {
    onChange({
      ...value,
      identity: {
        ...value.identity,
        ...patch,
      },
    });
  };

  const updateSubjectRelation = (patch: Partial<PersonaConfig["subjectRelation"]>) => {
    onChange({
      ...value,
      subjectRelation: {
        ...value.subjectRelation,
        ...patch,
      },
    });
  };

  const updateInteractionStyle = (patch: Partial<PersonaConfig["interactionStyle"]>) => {
    onChange({
      ...value,
      interactionStyle: {
        ...value.interactionStyle,
        ...patch,
      },
    });
  };

  const updateLanguage = (patch: Partial<PersonaConfig["language"]>) => {
    onChange({
      ...value,
      language: {
        ...value.language,
        ...patch,
      },
    });
  };

  const handleGenerate = () => {
    const configForPrompt: PersonaConfig = {
      ...value,
      identity: {
        ...value.identity,
        firstName: personaName.trim() || value.identity.firstName,
      },
    };

    onGenerate(buildPersonaPromptFromConfig(configForPrompt));
  };

  return (
    <Box
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="rgba(99, 102, 241, 0.18)"
      background="linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(239,246,255,0.92) 100%)"
      boxShadow="0 18px 50px rgba(15, 23, 42, 0.08)"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      maxHeight={{ base: "none", lg: "74vh" }}
    >
      <Box
        px={{ base: 5, md: 6 }}
        py={{ base: 5, md: 6 }}
        borderBottomWidth="1px"
        borderBottomColor="rgba(148, 163, 184, 0.14)"
        background="linear-gradient(135deg, rgba(239,246,255,0.6) 0%, rgba(237,233,254,0.4) 100%)"
        position="relative"
      >
        <Box position="absolute" insetX={0} top={0} height="3px" background="linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)" />
        <VStack align="stretch" gap={3}>
          <HStack gap={2} alignItems="center">
            <Box width="16px" height="1.5px" background="linear-gradient(90deg, #6366f1, #8b5cf6)" borderRadius="full" />
            <Text fontSize="2xs" textTransform="uppercase" letterSpacing="0.22em" color="blue.600" fontWeight="700">
              Configuration guidée
            </Text>
          </HStack>
          <VStack align="stretch" gap={1}>
            <Heading size="md" letterSpacing="-0.025em">Construire le persona avant le prompt</Heading>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
              On part d&apos;un profil crédible, puis le système fabrique une première
              version du prompt interne. Le texte du prompt reste éditable plus bas si
              on veut aller plus loin.
            </Text>
          </VStack>
        </VStack>
      </Box>

      <Box
        px={{ base: 5, md: 6 }}
        py={{ base: 5, md: 6 }}
        overflowY={{ base: "visible", lg: "auto" }}
        overscrollBehavior="contain"
        flex="1"
      >
        <VStack align="stretch" gap={4}>
          <SectionBlock
            title="Identité et contexte"
            description="Ces champs posent la base sociale du personnage. Mieux ils sont clairs, plus la simulation sera stable."
          >
            <Grid templateColumns={{ base: "1fr", lg: "repeat(2, minmax(0, 1fr))" }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm">Nom utilisé pour la simulation</Field.Label>
                <Input value={personaName} readOnly backgroundColor="white" />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Repris automatiquement depuis le nom du persona dans la colonne de gauche.
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Âge</Field.Label>
                <Input
                  value={value.identity.age ?? ""}
                  onChange={(event) => updateIdentity({ age: event.target.value })}
                  placeholder="24 ans"
                  backgroundColor="white"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Indique un âge ou une tranche crédible.
                </Field.HelperText>
              </Field.Root>

              <Field.Root gridColumn={{ base: "auto", lg: "1 / span 2" }}>
                <Field.Label fontSize="sm">Rôle social ou professionnel</Field.Label>
                <Textarea
                  rows={2}
                  value={value.identity.role ?? ""}
                  onChange={(event) => updateIdentity({ role: event.target.value })}
                  placeholder="Étudiante de master, chargée de TD, médiatrice..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Exemple : étudiante de master, enseignante vacataire, salariée en reprise d&apos;études.
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Niveau d&apos;étude / expérience</Field.Label>
                <Textarea
                  rows={2}
                  value={value.identity.educationLevel ?? ""}
                  onChange={(event) => updateIdentity({ educationLevel: event.target.value })}
                  placeholder="Master 2, doctorante, début de carrière..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Situe rapidement le niveau académique ou professionnel.
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Environnement social</Field.Label>
                <Textarea
                  rows={3}
                  value={value.identity.socialEnvironment ?? ""}
                  onChange={(event) => updateIdentity({ socialEnvironment: event.target.value })}
                  placeholder="Milieu urbain, forte pression académique..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Décris le milieu, les contraintes, la position sociale ou les ressources.
                </Field.HelperText>
              </Field.Root>

              <Field.Root gridColumn={{ base: "auto", lg: "1 / span 2" }}>
                <Field.Label fontSize="sm">Contexte de vie</Field.Label>
                <Textarea
                  rows={3}
                  value={value.identity.livingContext ?? ""}
                  onChange={(event) => updateIdentity({ livingContext: event.target.value })}
                  placeholder="Vit en colocation, alterne stage et mémoire..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Ajoute ce qui influence concrètement le quotidien du persona.
                </Field.HelperText>
              </Field.Root>
            </Grid>
          </SectionBlock>

          <SectionBlock
            title="Rapport au sujet"
            description="Ici, on décide comment le persona se situe face au thème de l&apos;entretien : adhésion, ambivalence, résistance ou tension."
          >
            <Grid templateColumns={{ base: "1fr", lg: "repeat(2, minmax(0, 1fr))" }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm">Position face au sujet</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={value.subjectRelation.position}
                    onChange={(event) =>
                      updateSubjectRelation({
                        position: event.currentTarget.value as PersonaConfig["subjectRelation"]["position"],
                      })
                    }
                    backgroundColor="white"
                  >
                    <option value="favorable">Favorable</option>
                    <option value="ambivalent">Ambivalent</option>
                    <option value="reticent">Réticent</option>
                    <option value="conflictuel">Conflictuel</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Niveau de difficulté pédagogique</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={value.difficulty}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        difficulty: event.currentTarget.value as PersonaConfig["difficulty"],
                      })
                    }
                    backgroundColor="white"
                  >
                    <option value="facile">Facile</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="difficile">Difficile</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Niveau d&apos;implication</Field.Label>
                <Textarea
                  rows={2}
                  value={value.subjectRelation.involvementLevel ?? ""}
                  onChange={(event) =>
                    updateSubjectRelation({ involvementLevel: event.target.value })
                  }
                  placeholder="Très concernée, usage ponctuel, implication distante..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Est-ce que ce sujet le touche fortement ou seulement à la marge ?
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Niveau de conscience du sujet</Field.Label>
                <Textarea
                  rows={2}
                  value={value.subjectRelation.politicizationLevel ?? ""}
                  onChange={(event) =>
                    updateSubjectRelation({ politicizationLevel: event.target.value })
                  }
                  placeholder="Peu réflexif, très analytique, politisé..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Aide à régler la profondeur d&apos;analyse spontanée du persona.
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Tensions principales</Field.Label>
                <Textarea
                  rows={4}
                  value={arrayToMultiline(value.subjectRelation.keyTensions)}
                  onChange={(event) =>
                    updateSubjectRelation({
                      keyTensions: multilineToArray(event.target.value),
                    })
                  }
                  placeholder={"Veut gagner du temps\nCraint la triche\nSe sent dépendant sans l'assumer"}
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Une tension par ligne. Ce sont elles qui rendront le persona plus nuancé.
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Zones sensibles</Field.Label>
                <Textarea
                  rows={4}
                  value={arrayToMultiline(value.sensitiveZones)}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      sensitiveZones: multilineToArray(event.target.value),
                    })
                  }
                  placeholder={"Plagiat\nRapport aux notes\nConflits avec les enseignants"}
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Une zone délicate par ligne. Le prompt s&apos;en servira pour doser la résistance.
                </Field.HelperText>
              </Field.Root>
            </Grid>
          </SectionBlock>

          <SectionBlock
            title="Style interactionnel"
            description="On règle ici la manière de parler, d&apos;hésiter, de coopérer ou de résister pendant l&apos;entretien."
          >
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm">Longueur des réponses</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={value.interactionStyle.verbosity}
                    onChange={(event) =>
                      updateInteractionStyle({
                        verbosity: event.currentTarget.value as PersonaConfig["interactionStyle"]["verbosity"],
                      })
                    }
                    backgroundColor="white"
                  >
                    <option value="concis">Concis</option>
                    <option value="equilibre">Équilibré</option>
                    <option value="bavard">Bavard</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Posture</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={value.interactionStyle.stance}
                    onChange={(event) =>
                      updateInteractionStyle({
                        stance: event.currentTarget.value as PersonaConfig["interactionStyle"]["stance"],
                      })
                    }
                    backgroundColor="white"
                  >
                    <option value="direct">Directe</option>
                    <option value="prudent">Prudente</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Coopération</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={value.interactionStyle.cooperation}
                    onChange={(event) =>
                      updateInteractionStyle({
                        cooperation: event.currentTarget.value as PersonaConfig["interactionStyle"]["cooperation"],
                      })
                    }
                    backgroundColor="white"
                  >
                    <option value="cooperatif">Coopératif</option>
                    <option value="mefiant">Méfiant</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Stabilité du discours</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={value.interactionStyle.consistency}
                    onChange={(event) =>
                      updateInteractionStyle({
                        consistency: event.currentTarget.value as PersonaConfig["interactionStyle"]["consistency"],
                      })
                    }
                    backgroundColor="white"
                  >
                    <option value="stable">Stable</option>
                    <option value="contradictoire">Contradictoire</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Tonalité affective</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={value.interactionStyle.affect}
                    onChange={(event) =>
                      updateInteractionStyle({
                        affect: event.currentTarget.value as PersonaConfig["interactionStyle"]["affect"],
                      })
                    }
                    backgroundColor="white"
                  >
                    <option value="factuel">Factuel</option>
                    <option value="emotionnel">Émotionnel</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Registre de langue</Field.Label>
                <Input
                  value={value.language.register}
                  onChange={(event) => updateLanguage({ register: event.target.value })}
                  placeholder="Oral, académique, technique..."
                  backgroundColor="white"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Choisis le niveau de langage dominant.
                </Field.HelperText>
              </Field.Root>
            </Grid>
          </SectionBlock>

          <SectionBlock
            title="Langage et réglages fins"
            description="Ces champs servent à affiner le rythme des réponses et la couleur générale de la parole."
          >
            <Grid templateColumns={{ base: "1fr", lg: "repeat(2, minmax(0, 1fr))" }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm">Longueur moyenne attendue</Field.Label>
                <Textarea
                  rows={2}
                  value={value.language.averageAnswerLength}
                  onChange={(event) =>
                    updateLanguage({ averageAnswerLength: event.target.value })
                  }
                  placeholder="2 à 4 phrases, réponses brèves mais situées..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Décris la longueur moyenne souhaitée, pas une règle rigide.
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm">Ton général</Field.Label>
                <Textarea
                  rows={2}
                  value={value.language.tone}
                  onChange={(event) => updateLanguage({ tone: event.target.value })}
                  placeholder="Nuancé, défensif, calme, sceptique..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Ce ton doit rester compatible avec le reste du profil.
                </Field.HelperText>
              </Field.Root>

              <Field.Root gridColumn={{ base: "auto", lg: "1 / span 2" }}>
                <Field.Label fontSize="sm">Niveau de vocabulaire</Field.Label>
                <Textarea
                  rows={2}
                  value={value.language.vocabularyLevel}
                  onChange={(event) =>
                    updateLanguage({ vocabularyLevel: event.target.value })
                  }
                  placeholder="Accessible, courant, plus technique selon le contexte..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Exemple : vocabulaire simple, mais quelques termes universitaires.
                </Field.HelperText>
              </Field.Root>

              <Field.Root gridColumn={{ base: "auto", lg: "1 / span 2" }}>
                <Field.Label fontSize="sm">Instructions complémentaires</Field.Label>
                <Textarea
                  rows={3}
                  value={value.additionalInstructions ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      additionalInstructions: event.target.value,
                    })
                  }
                  placeholder="Exemple : éviter les réponses trop scolaires, laisser paraître des hésitations crédibles..."
                  backgroundColor="white"
                  resize="vertical"
                />
                <Field.HelperText fontSize="xs" color="fg.muted">
                  Optionnel. À utiliser seulement pour un réglage fin que les autres champs ne couvrent pas.
                </Field.HelperText>
              </Field.Root>
            </Grid>
          </SectionBlock>
        </VStack>
      </Box>

      <Box
        px={{ base: 5, md: 6 }}
        py={{ base: 4, md: 5 }}
        borderTopWidth="1px"
        borderTopColor="rgba(148, 163, 184, 0.18)"
        backgroundColor="rgba(248,250,252,0.95)"
      >
        <HStack
          justifyContent="space-between"
          alignItems={{ base: "stretch", md: "center" }}
          flexDirection={{ base: "column", md: "row" }}
          gap={3}
        >
          <Text fontSize="sm" color="fg.muted" lineHeight="1.75" maxWidth="2xl">
            Quand cette base te semble solide, génère une première version du prompt.
            Tu pourras l&apos;affiner dans l&apos;éditeur avancé juste en dessous.
          </Text>
          <Button
            colorPalette="blue"
            onClick={handleGenerate}
            alignSelf={{ base: "stretch", md: "auto" }}
            borderRadius="xl"
            fontWeight="700"
          >
            <WandSparkles size={16} />
            Générer le prompt
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
