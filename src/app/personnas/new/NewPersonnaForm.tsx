"use client";

import {
  Box,
  Button,
  Collapsible,
  Field,
  Input,
  Separator,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useEditor } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import HeadingExtension from "@tiptap/extension-heading";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import TextExtension from "@tiptap/extension-text";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import PersonnaLayout from "@/app/personnas/components/PersonnaLayout";
import PersonnaLeftSidebar from "@/app/personnas/components/PersonnaLeftSidebar";
import PersonnaRightSidebar from "@/app/personnas/components/PersonnaRightSidebar";
import PersonnaPromptEditor from "@/app/personnas/components/PersonnaPromptEditor";
import PromptReviewSidebar, {
  type CauldronReview,
} from "@/app/personnas/components/PromptReviewSidebar";
import { useAuthUser } from "@/hooks/useAuthUser";
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
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [review, setReview] = useState<CauldronReview | null>(null);
  const [reviewedContent, setReviewedContent] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
      setError("Le nom du personna est requis.");
      return;
    }

    if (!trimmedDescription) {
      setError("La description est requise.");
      return;
    }

    if (!trimmedPrompt) {
      setError("Le prompt système est requis.");
      return;
    }

    try {
      const reviewResult = await reviewPrompt(trimmedPrompt);
      if (!reviewResult) {
        setError("Impossible de valider le prompt.");
        return;
      }
      if (reviewResult.status === "invalid") {
        setError("Le prompt a été refusé par la validation.");
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
        setError("Impossible de créer le personna.");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { id?: string } | null;
      if (!payload?.id) {
        setError("Impossible de créer le personna.");
        return;
      }

      toaster.create({
        title: "Personna créé",
        description: "Le prompt a été enregistré et peut maintenant être retravaillé.",
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
          left={
            <PersonnaLeftSidebar
              title="Créer un nouveau personna"
              subtitle="Nommer le profil, clarifier son contexte et poser une première base de prompt."
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
                  padding={4}
                >
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="sm" fontWeight="semibold">
                      Avant de commencer
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Cette page sert à poser une première version crédible du persona. Le prompt pourra ensuite être retravaillé dans sa fiche.
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      - choisis un nom clair et reconnaissable
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      - résume en deux lignes le profil et le rapport à l&apos;IA
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      - colle un prompt qui donne déjà une voix et des situations
                    </Text>
                  </VStack>
                </Box>

                <Field.Root>
                  <Field.Label fontSize="sm">Nom du persona</Field.Label>
                  <Input
                    size="xs"
                    value={agentName}
                    onChange={(event) => setAgentName(event.target.value)}
                    placeholder="Camille, Karim, Zoe, Alexis, Bilel..."
                    paddingInlineStart={4}
                  />
                  <Field.HelperText fontSize="xs" color="fg.muted">
                    Le nom doit aider a retrouver vite le persona dans la liste et dans l&apos;historique.
                  </Field.HelperText>
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="sm">Description courte</Field.Label>
                  <Textarea
                    size="xs"
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Etudiant curieux, negociatrice prudente, usage ponctuel mais reflexif..."
                    paddingInlineStart={4}
                    resize="none"
                  />
                  <Field.HelperText fontSize="xs" color="fg.muted">
                    Decris le niveau, la posture et le contexte d&apos;usage en quelques mots tres lisibles.
                  </Field.HelperText>
                </Field.Root>

                <Box
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  backgroundColor="bg.subtle"
                  padding={4}
                >
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="sm" fontWeight="semibold">Grille d&apos;entretien</Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
                      La grille sera disponible depuis la fiche du persona après la création. Elle se configure séparément du prompt.
                    </Text>
                  </VStack>
                </Box>

                <Separator />

                <Collapsible.Root open={helpOpen} onOpenChange={({ open }) => setHelpOpen(open)}>
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="plain"
                      size="xs"
                      alignSelf="flex-start"
                      paddingInline={0}
                      color="fg.muted"
                    >
                      <Text fontSize="xs">Comment générer un prompt système ?</Text>
                      {helpOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <VStack align="stretch" gap={2} paddingTop={2}>
                      <Text fontSize="xs" color="fg.muted">
                        Le plus simple est de fournir a un chatbot (Claude, ChatGPT, etc.) :
                        <br />- un PDF de l&apos;interview
                        <br />- un fichier de{" "}
                        <Button
                          asChild
                          variant="plain"
                          size="xs"
                          colorPalette="blue"
                          textDecoration="underline"
                        >
                          <a
                            href="/docs/template_agent_system_prompt.md"
                            target="_blank"
                            rel="noreferrer"
                          >
                            template au format markdown
                          </a>
                        </Button>
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        Ce prompt de départ sert surtout à poser une voix, des usages, des tensions et des scènes plausibles.
                      </Text>
                      <Box fontFamily="mono" fontSize="2xs" color="fg.muted" paddingLeft={3}>
                        Nous allons construire un prompt système pour une personna à partir d&apos;une interview
                        sociologique de la personne réelle sur son usage de l&apos;IA.
                        <br />
                        Voir le fichier PDF de l&apos;entretien
                        <br />
                        Le but est de generer un fichier markdown suivant le template fourni.
                        <br />
                        Il faut renseigner tous les éléments entre accolades {"{"}{"}"}.
                        <br />
                        Ce fichier markdown servira de prompt système pour une personna dans une application de
                        simulation d&apos;entretien sociologique.
                      </Box>
                      <Text fontSize="xs" color="fg.muted">
                        Tu peux ensuite coller le résultat généré par l&apos;IA dans l&apos;éditeur central.
                      </Text>
                    </VStack>
                  </Collapsible.Content>
                </Collapsible.Root>
              </VStack>
            </PersonnaLeftSidebar>
          }
          center={
            <Box
              height="100%"
              maxWidth="720px"
              marginX="auto"
              paddingX={{ base: 4, lg: 6 }}
              paddingTop={{ base: 4, lg: 5 }}
              overflow="hidden"
              minHeight={0}
              display="flex"
              flexDirection="column"
            >
              <Box flex="1" minHeight={0} display="flex">
                <PersonnaPromptEditor
                  editor={editor}
                  subtitle="Redige ou colle ici le coeur du persona : sa voix, ses usages, ses tensions et ses reactions probables pendant l&apos;entretien."
                  error={error}
                  headingRight={
                    <Button
                      type="submit"
                      size="sm"
                      variant="subtle"
                      loading={isSaving}
                      disabled={!agentName.trim() || !description.trim() || isSaving}
                      paddingInline={5}
                    >
                      Créer la personna
                    </Button>
                  }
                />
              </Box>
            </Box>
          }
          right={
            <PersonnaRightSidebar subtitle="Cette validation concerne seulement le prompt du persona. Elle vérifie si sa voix, son contexte et ses tensions sont assez clairs pour être utilisés en entretien.">
              <PromptReviewSidebar
                review={review}
                reviewError={reviewError}
                isReviewing={isReviewing}
                isCurrent={Boolean(isReviewCurrent)}
              />
            </PersonnaRightSidebar>
          }
        />
      </form>
    </Box>
  );
}
