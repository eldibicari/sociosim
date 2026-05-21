"use client";

import {
  Badge,
  Box,
  Button,
  Field,
  Heading,
  HStack,
  IconButton,
  Input,
  Popover,
  Portal,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useEditor } from "@tiptap/react";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import HeadingExtension from "@tiptap/extension-heading";
import ListItem from "@tiptap/extension-list-item";
import { Markdown } from "@tiptap/markdown";
import Paragraph from "@tiptap/extension-paragraph";
import TextExtension from "@tiptap/extension-text";
import { ArrowLeft, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import PersonnaLayout from "@/app/personnas/components/PersonnaLayout";
import PersonaConfigBuilder from "@/app/personnas/components/PersonaConfigBuilder";
import PersonnaPromptEditor from "@/app/personnas/components/PersonnaPromptEditor";
import PromptReviewSidebar, {
  type CauldronReview,
} from "@/app/personnas/components/PromptReviewSidebar";
import { toaster } from "@/components/ui/toaster";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { PersonaConfig } from "@/lib/personaConfig";
import { withTimeout } from "@/lib/withTimeout";

type NewPersonnaFormProps = {
  templatePrompt: string;
};

export default function NewPersonnaForm({ templatePrompt }: NewPersonnaFormProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const interviewGuide = "";
  const [systemPrompt, setSystemPrompt] = useState(templatePrompt);
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig>({
    identity: {
      firstName: "",
      role: "",
      socialEnvironment: "",
      livingContext: "",
      educationLevel: "",
    },
    subjectRelation: {
      position: "ambivalent",
      involvementLevel: "",
      politicizationLevel: "",
      keyTensions: [],
    },
    interactionStyle: {
      verbosity: "equilibre",
      stance: "prudent",
      cooperation: "cooperatif",
      consistency: "stable",
      affect: "factuel",
    },
    difficulty: "intermediaire",
    sensitiveZones: [],
    language: {
      register: "oral mais precis",
      averageAnswerLength: "2 a 4 phrases",
      tone: "nuance",
      vocabularyLevel: "accessible",
    },
    additionalInstructions: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [review, setReview] = useState<CauldronReview | null>(null);
  const [reviewedContent, setReviewedContent] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [validationInfoOpen, setValidationInfoOpen] = useState(false);
  const promptEditorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      TextExtension,
      HeadingExtension.configure({ levels: [2] }),
      Bold,
      BulletList,
      ListItem,
      Markdown,
    ],
    content: "",
    contentType: "markdown",
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const nextMarkdown = currentEditor.getMarkdown();
      setSystemPrompt((current) => (current === nextMarkdown ? current : nextMarkdown));
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  const isReviewCurrent = Boolean(review && reviewedContent.trim() === systemPrompt.trim());

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    document.body.classList.add("personna-layout");
    return () => {
      document.body.classList.remove("personna-layout");
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    const currentMarkdown = editor.getMarkdown();
    if (currentMarkdown !== systemPrompt) {
      editor.commands.setContent(systemPrompt, { contentType: "markdown" });
    }
  }, [editor, systemPrompt]);

  const reviewPrompt = async (content: string) => {
    try {
      setIsReviewing(true);
      setReviewError(null);

      const response = await withTimeout(
        "reviewPrompt",
        fetch("/api/cauldron/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }),
        30000
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error("Error validating prompt:", payload);
        setReviewError("Impossible de valider le prompt pour le moment.");
        return null;
      }

      const payload = (await response.json().catch(() => null)) as CauldronReview | null;
      if (!payload?.status) {
        console.error("Invalid cauldron response:", payload);
        setReviewError("La reponse de validation est invalide.");
        return null;
      }

      setReview(payload);
      setReviewedContent(content);
      return payload;
    } catch (reviewFailure) {
      console.error("Error validating prompt:", reviewFailure);
      setReviewError("Une erreur est survenue lors de la validation.");
      return null;
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      router.push("/login");
      return;
    }

    const trimmedName = agentName.trim();
    const trimmedDescription = description.trim();
    const trimmedGuide = interviewGuide.trim();
    const trimmedPrompt = systemPrompt.trim();

    if (!trimmedName) {
      setError("Le nom du persona est requis.");
      return;
    }

    if (!trimmedDescription) {
      setError("La description est requise.");
      return;
    }

    if (!trimmedPrompt) {
      setError("Le prompt systeme est requis.");
      return;
    }

    try {
      const reviewResult = await reviewPrompt(trimmedPrompt);
      if (!reviewResult) {
        setError("Impossible de valider le prompt.");
        return;
      }
      if (reviewResult.status === "invalid") {
        setError("Le prompt a ete refuse par la validation.");
        return;
      }

      setIsSaving(true);
      setError(null);

      const response = await withTimeout(
        "createPersonna",
        fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_name: trimmedName,
            description: trimmedDescription,
            interview_guide: trimmedGuide,
            system_prompt: trimmedPrompt,
            edited_by: user.id,
          }),
        }),
        15000
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error("Error creating personna:", payload);
        setError("Impossible de creer le persona.");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { id?: string } | null;
      if (!payload?.id) {
        setError("Impossible de creer le persona.");
        return;
      }

      toaster.create({
        title: "Persona cree",
        description: "Le prompt a ete enregistre et peut maintenant etre retravaille.",
        type: "success",
      });
      router.push(`/personnas/${payload.id}`);
    } catch (submitError) {
      console.error("Error creating personna:", submitError);
      setError("Une erreur est survenue lors de la creation.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box width="full" height="100%">
      <form onSubmit={handleSubmit} style={{ height: "100%" }}>
        <PersonnaLayout
          center={
            <Box
              height="100%"
              maxWidth="1200px"
              marginX="auto"
              paddingX={{ base: 4, lg: 8, xl: 12 }}
              paddingTop={{ base: 4, lg: 5 }}
              overflowX="hidden"
              overflowY="auto"
              paddingBottom={{ base: 6, lg: 8 }}
            >
              <VStack align="stretch" gap={4}>
                <Button
                  alignSelf="flex-start"
                  variant="ghost"
                  colorPalette="blue"
                  size="sm"
                  onClick={() => router.push("/personnas")}
                >
                  <ArrowLeft size={14} />
                  Retour aux personas
                </Button>

                <Box
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  backgroundColor="white"
                  padding={5}
                >
                  <VStack align="stretch" gap={4}>
                    <Heading size="md">Identité du persona</Heading>
                    <Field.Root>
                      <Field.Label fontSize="sm">Nom du persona</Field.Label>
                      <Input
                        value={agentName}
                        onChange={(event) => setAgentName(event.target.value)}
                        placeholder="Camille, Karim, Zoé, Léa, Maxime, Tom..."
                      />
                      <Field.HelperText fontSize="xs" color="fg.muted">
                        Le nom doit aider à retrouver vite le persona dans la liste et l&apos;historique.
                      </Field.HelperText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label fontSize="sm">Description courte</Field.Label>
                      <Textarea
                        rows={2}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Étudiant curieux, négociatrice prudente, usage ponctuel mais réflexif..."
                        resize="none"
                      />
                      <Field.HelperText fontSize="xs" color="fg.muted">
                        Décris le niveau, la posture et le contexte d&apos;usage en quelques mots très lisibles.
                      </Field.HelperText>
                    </Field.Root>
                  </VStack>
                </Box>

                <PersonaConfigBuilder
                  personaName={agentName}
                  value={personaConfig}
                  onChange={setPersonaConfig}
                  onGenerate={(prompt) => {
                    setSystemPrompt(prompt);
                    setError(null);
                    toaster.create({
                      title: "Prompt genere",
                      description:
                        "Une premiere version du prompt interne a ete creee a partir de la configuration guidee.",
                      type: "success",
                    });
                    setTimeout(() => {
                      promptEditorRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 100);
                  }}
                />

                <Box ref={promptEditorRef}>
                  <PersonnaPromptEditor
                    editor={editor}
                    subtitle="Le texte ci-dessous est le moteur interne du persona. Il peut etre genere automatiquement via la configuration guidee, puis affine ici en mode avance."
                    error={error}
                    headingRight={
                      <HStack gap={2}>
                        <Badge
                          colorPalette={
                            isReviewing
                              ? "orange"
                              : !review
                                ? "gray"
                                : review.status === "valid"
                                  ? "green"
                                  : "red"
                          }
                          variant="subtle"
                          borderRadius="full"
                          paddingX={2.5}
                          fontSize="xs"
                        >
                          {isReviewing
                            ? "Analyse..."
                            : !review
                              ? "Non vérifié"
                              : review.status === "valid"
                                ? "Valide"
                                : "Invalide"}
                        </Badge>
                        <Popover.Root
                          open={validationInfoOpen}
                          onOpenChange={(e) => setValidationInfoOpen(e.open)}
                          positioning={{ placement: "bottom-end" }}
                        >
                          <Popover.Trigger asChild>
                            <IconButton
                              aria-label="Plus d'infos sur la validation"
                              size="xs"
                              variant="ghost"
                            >
                              <Info size={14} />
                            </IconButton>
                          </Popover.Trigger>
                          <Portal>
                            <Popover.Positioner>
                              <Popover.Content
                                maxWidth="340px"
                                borderRadius="lg"
                                boxShadow="lg"
                                borderColor="var(--color-border)"
                              >
                                <Popover.Arrow>
                                  <Popover.ArrowTip />
                                </Popover.Arrow>
                                <Popover.Body padding={4}>
                                  <Box
                                    fontSize="xs"
                                    color="fg.muted"
                                    lineHeight="1.7"
                                  >
                                    <Box
                                      fontSize="sm"
                                      fontWeight="semibold"
                                      color="var(--color-text-primary)"
                                      marginBottom={2}
                                    >
                                      Validation du prompt
                                    </Box>
                                    Cette vérification analyse uniquement le prompt
                                    système actif : voix, contexte, usages, tensions et
                                    garde-fous. Elle ne vérifie pas la grille
                                    d&apos;entretien ni le paramétrage guidé.
                                    <Box
                                      as="ul"
                                      marginTop={3}
                                      paddingLeft={4}
                                      style={{ listStyleType: "disc" }}
                                    >
                                      <li>Clarté du profil et de la voix</li>
                                      <li>Situations, usages et tensions observables</li>
                                      <li>Absence d&apos;incohérences bloquantes</li>
                                    </Box>
                                  </Box>
                                </Popover.Body>
                              </Popover.Content>
                            </Popover.Positioner>
                          </Portal>
                        </Popover.Root>
                        <Button
                          type="submit"
                          size="sm"
                          variant="subtle"
                          loading={isSaving}
                          disabled={!agentName.trim() || !description.trim() || isSaving}
                          paddingInline={5}
                        >
                          Créer la persona
                        </Button>
                      </HStack>
                    }
                  />
                  {(review || reviewError) && (
                    <Box marginTop={2}>
                      <PromptReviewSidebar
                        review={review}
                        reviewError={reviewError}
                        isReviewing={isReviewing}
                        isCurrent={Boolean(isReviewCurrent)}
                      />
                    </Box>
                  )}
                </Box>
              </VStack>
            </Box>
          }
        />
      </form>
    </Box>
  );
}
