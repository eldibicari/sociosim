"use client";

import {
  Box,
  Button,
  Collapsible,
  Field,
  HStack,
  Input,
  Menu,
  Separator,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import HeadingExtension from "@tiptap/extension-heading";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import TextExtension from "@tiptap/extension-text";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import PersonaConfigBuilder from "@/app/personnas/components/PersonaConfigBuilder";
import PersonnaLayout from "@/app/personnas/components/PersonnaLayout";
import PersonnaLeftSidebar from "@/app/personnas/components/PersonnaLeftSidebar";
import PersonnaPromptEditor from "@/app/personnas/components/PersonnaPromptEditor";
import PersonnaRightSidebar from "@/app/personnas/components/PersonnaRightSidebar";
import PromptReviewSidebar, {
  type CauldronReview,
} from "@/app/personnas/components/PromptReviewSidebar";
import NewInterviewButton from "@/app/components/NewInterviewButton";
import { toaster } from "@/components/ui/toaster";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { PersonaConfig } from "@/lib/personaConfig";
import { withTimeout } from "@/lib/withTimeout";

type AgentPromptState = {
  systemPrompt: string;
  version: number;
};

type PromptOption = {
  id: string;
  system_prompt: string;
  version: number;
  last_edited: string;
  published: boolean;
  users?: { name?: string | null } | null;
};

function createPersonaConfigDraft(agentName: string, description: string): PersonaConfig {
  return {
    identity: {
      firstName: agentName,
      role: description,
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
  };
}

export default function EditAgentPromptPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = typeof params.id === "string" ? params.id : "";
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const [agentName, setAgentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [interviewGuide, setInterviewGuide] = useState<string>("");
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const basePromptRef = useRef("");
  const baseAgentRef = useRef({ agentName: "", description: "", interviewGuide: "" });
  const [promptState, setPromptState] = useState<AgentPromptState>({
    systemPrompt: "",
    version: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<CauldronReview | null>(null);
  const [reviewedContent, setReviewedContent] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [advancedHelpOpen, setAdvancedHelpOpen] = useState(false);
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig>(
    createPersonaConfigDraft("", "")
  );

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
      setPromptState((current) =>
        current.systemPrompt === nextMarkdown ? current : { ...current, systemPrompt: nextMarkdown }
      );
      setIsDirty(nextMarkdown !== basePromptRef.current);
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  const isReviewCurrent = Boolean(
    review && reviewedContent.trim() === promptState.systemPrompt.trim()
  );

  const formatPromptLabel = (prompt: PromptOption) => {
    const date = new Date(prompt.last_edited);
    const pad2 = (value: number) => value.toString().padStart(2, "0");
    const formattedDate = Number.isNaN(date.getTime())
      ? "date inconnue"
      : `${date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    const editorName = prompt.users?.name || "Inconnu";
    const prefix = prompt.published ? "[publie] " : "";
    return `${prefix}${formattedDate} - ${editorName}`;
  };

  const applyPromptList = (prompts: PromptOption[], nextSelectedId?: string) => {
    setPromptOptions(prompts);
    const initialPrompt = nextSelectedId
      ? prompts.find((prompt) => prompt.id === nextSelectedId) || prompts[0]
      : prompts[0];
    if (initialPrompt) {
      setSelectedPromptId(initialPrompt.id);
      basePromptRef.current = initialPrompt.system_prompt;
      setIsDirty(false);
      setPromptState({
        systemPrompt: initialPrompt.system_prompt,
        version: initialPrompt.version,
      });
    } else {
      setSelectedPromptId("");
      basePromptRef.current = "";
      setIsDirty(false);
      setPromptState({
        systemPrompt: "",
        version: 0,
      });
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!agentId) {
      setError("Agent introuvable.");
      setIsLoading(false);
      return;
    }

    const loadAgentPrompt = async () => {
      try {
        const response = await withTimeout(
          "loadAgentPrompts",
          fetch(`/api/agents/${agentId}/prompts`),
          15000
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          console.error("Error fetching agent prompt:", payload);
          setError("Impossible de charger le prompt.");
          setIsLoading(false);
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | {
              agent?: {
                agent_name?: string;
                description?: string | null;
                interview_guide?: string | null;
              };
              prompts?: PromptOption[];
            }
          | null;
        const prompts = (payload?.prompts || []) as PromptOption[];
        const nextAgentName = payload?.agent?.agent_name ?? "";
        const nextDescription = payload?.agent?.description ?? "";
        const nextInterviewGuide = payload?.agent?.interview_guide ?? "";
        setAgentName(nextAgentName);
        setDescription(nextDescription);
        setInterviewGuide(nextInterviewGuide);
        setPersonaConfig(createPersonaConfigDraft(nextAgentName, nextDescription));
        baseAgentRef.current = {
          agentName: nextAgentName,
          description: nextDescription,
          interviewGuide: nextInterviewGuide,
        };
        applyPromptList(prompts);
      } catch (loadError) {
        console.error("Error loading agent prompt:", loadError);
        setError("Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentPrompt();
  }, [agentId, isAuthLoading, router, user]);

  useEffect(() => {
    if (!editor) return;
    const currentMarkdown = editor.getMarkdown();
    if (currentMarkdown !== promptState.systemPrompt) {
      editor.commands.setContent(promptState.systemPrompt, { contentType: "markdown" });
    }
  }, [editor, promptState.systemPrompt]);

  useEffect(() => {
    document.body.classList.add("personna-layout");
    return () => {
      document.body.classList.remove("personna-layout");
    };
  }, []);

  const handlePromptSelection = (value: string) => {
    setSelectedPromptId(value);
    const selectedPrompt = promptOptions.find((prompt) => prompt.id === value);
    if (!selectedPrompt) return;
    setReview(null);
    setReviewedContent("");
    setReviewError(null);
    basePromptRef.current = selectedPrompt.system_prompt;
    setIsDirty(false);
    setPromptState({
      systemPrompt: selectedPrompt.system_prompt,
      version: selectedPrompt.version,
    });
  };

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

  const ensurePromptReview = async (content: string) => {
    if (review && isReviewCurrent) {
      return review;
    }
    return await reviewPrompt(content);
  };

  const handlePublish = async () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    if (!selectedPromptId) {
      setError("Aucun prompt selectionne.");
      return;
    }
    try {
      setIsPublishing(true);
      setError(null);
      const trimmedPrompt = promptState.systemPrompt.trim();
      if (!trimmedPrompt) {
        setError("Le prompt ne peut pas etre vide.");
        return;
      }
      const reviewResult = await ensurePromptReview(trimmedPrompt);
      if (!reviewResult) {
        setError("Impossible de valider le prompt.");
        return;
      }
      if (reviewResult.status === "invalid") {
        setError("Le prompt a ete refuse par la validation.");
        return;
      }
      const response = await withTimeout(
        "publishPrompt",
        fetch(`/api/agents/${agentId}/prompts/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId: selectedPromptId }),
        }),
        15000
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error("Error publishing prompt:", payload);
        setError("Impossible de publier le prompt.");
        return;
      }
      setPromptOptions((current) =>
        current.map((prompt) => ({
          ...prompt,
          published: prompt.id === selectedPromptId,
        }))
      );
      toaster.create({
        title: "Prompt publie",
        description: "Le prompt est maintenant actif pour les entretiens.",
        type: "success",
      });
    } catch (publishError) {
      console.error("Error publishing prompt:", publishError);
      setError("Une erreur est survenue lors de la publication.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleNewInterview = async () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    try {
      setIsCreatingSession(true);
      const response = await withTimeout(
        "createSession",
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, agent_id: agentId }),
        }),
        15000
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Impossible de creer une nouvelle session");
        return;
      }
      const data = await response.json();
      router.push(
        `/interview?interviewId=${data.interviewId}&sessionId=${data.sessionId}&adkSessionId=${data.adkSessionId}`
      );
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Une erreur est survenue lors de la creation de la session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    const trimmedName = agentName.trim();
    const trimmedDescription = description.trim();
    const trimmedInterviewGuide = interviewGuide.trim();
    if (!trimmedName) {
      setError("Le nom du persona est requis.");
      return;
    }
    if (!trimmedDescription) {
      setError("La description est requise.");
      return;
    }
    try {
      setIsSavingAgent(true);
      setError(null);
      const updateResponse = await withTimeout(
        "updateAgent",
        fetch(`/api/agents/${agentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_name: trimmedName,
            description: trimmedDescription,
          }),
        }),
        15000
      );
      if (!updateResponse.ok) {
        const payload = await updateResponse.json().catch(() => null);
        console.error("Error updating agent:", payload);
        setError("Impossible de mettre a jour le persona.");
        return;
      }
      baseAgentRef.current = {
        agentName: trimmedName,
        description: trimmedDescription,
        interviewGuide: trimmedInterviewGuide,
      };
      toaster.create({
        title: "Persona mis a jour",
        description: "Les informations du persona ont ete enregistrees.",
        type: "success",
      });
    } catch (saveError) {
      console.error("Error saving agent:", saveError);
      setError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSavingAgent(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    const trimmedPrompt = promptState.systemPrompt.trim();
    if (!trimmedPrompt) {
      setError("Le prompt ne peut pas etre vide.");
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
      setIsSavingPrompt(true);
      setError(null);
      const saveResponse = await withTimeout(
        "savePrompt",
        fetch(`/api/agents/${agentId}/prompts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_prompt: trimmedPrompt,
            edited_by: user.id,
          }),
        }),
        15000
      );
      if (!saveResponse.ok) {
        const payload = await saveResponse.json().catch(() => null);
        console.error("Error saving agent prompt:", payload);
        setError("Impossible d'enregistrer le prompt pour le moment.");
        return;
      }
      const refreshResponse = await withTimeout(
        "refreshPrompts",
        fetch(`/api/agents/${agentId}/prompts`),
        15000
      );
      if (!refreshResponse.ok) {
        const payload = await refreshResponse.json().catch(() => null);
        console.error("Error refreshing prompts:", payload);
        setError("Le prompt est enregistre mais la liste ne peut pas etre mise a jour.");
        return;
      }
      const refreshedPayload = (await refreshResponse.json().catch(() => null)) as
        | { prompts?: PromptOption[] }
        | null;
      applyPromptList((refreshedPayload?.prompts || []) as PromptOption[]);
      toaster.create({
        title: "Prompt enregistre",
        description: "Vos modifications ont ete sauvegardees.",
        type: "success",
      });
    } catch (saveError) {
      console.error("Error saving agent prompt:", saveError);
      setError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleGeneratePrompt = (nextPrompt: string) => {
    setPromptState((current) => ({
      ...current,
      systemPrompt: nextPrompt,
    }));
    setReview(null);
    setReviewedContent("");
    setReviewError(null);
    setIsDirty(nextPrompt !== basePromptRef.current);
    setError(null);
  };

  if (isLoading) {
    return (
      <Box maxWidth="4xl" height="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="fg.muted">Chargement du prompt...</Text>
        </VStack>
      </Box>
    );
  }

  const selectedPrompt = promptOptions.find((prompt) => prompt.id === selectedPromptId);
  const isSelectedPublished = selectedPrompt?.published ?? false;
  const isAgentDirty =
    agentName.trim() !== baseAgentRef.current.agentName ||
    description.trim() !== baseAgentRef.current.description ||
    interviewGuide.trim() !== baseAgentRef.current.interviewGuide;

  return (
    <Box width="full" height="100%">
      <PersonnaLayout
        left={
          <PersonnaLeftSidebar
            title={agentName || "Persona"}
            titleColor="blue.600"
            subtitle="Configuration de la simulation et reperes methodologiques."
            titleRight={
              <NewInterviewButton
                onClick={handleNewInterview}
                loading={isCreatingSession}
                disabled={isCreatingSession}
              />
            }
          >
            <VStack align="stretch" gap={4}>
              <Button
                alignSelf="flex-start"
                variant="ghost"
                colorPalette="blue"
                size="sm"
                onClick={() => router.push(`/personnas/${agentId}`)}
              >
                <ArrowLeft size={14} />
                Retour a la fiche
              </Button>

              <Box borderRadius="3xl" borderWidth="1px" borderColor="rgba(99, 102, 241, 0.14)" background="linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.96) 100%)" boxShadow="0 18px 48px rgba(15, 23, 42, 0.06)" padding={4}>
                <VStack align="stretch" gap={3}>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.14em" color="blue.600" fontWeight="700">
                      Fiche publique
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold">Identite visible du persona</Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
                      Cette couche sert a reconnaitre le persona dans la bibliotheque, l&apos;historique et les entretiens.
                    </Text>
                  </VStack>

                  <Field.Root>
                    <Field.Label fontSize="sm">Nom affiche</Field.Label>
                    <Input
                      size="xs"
                      value={agentName}
                      onChange={(event) => setAgentName(event.target.value)}
                      placeholder="Camille, Karim, Zoe, Alexis, Bilel..."
                      paddingInlineStart={4}
                      backgroundColor="white"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="sm">Description</Field.Label>
                    <Textarea
                      size="xs"
                      rows={3}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Etudiante curieuse, negociateur experimente, posture prudente face a l'IA..."
                      paddingInlineStart={4}
                      resize="vertical"
                      backgroundColor="white"
                    />
                    <Field.HelperText fontSize="xs" color="fg.muted">
                      Une phrase claire suffit : profil, contexte et rapport a l&apos;IA.
                    </Field.HelperText>
                  </Field.Root>
                </VStack>
              </Box>

              <Box borderRadius="3xl" borderWidth="1px" borderColor="rgba(99, 102, 241, 0.14)" background="linear-gradient(180deg, rgba(239,246,255,0.78) 0%, rgba(255,255,255,0.92) 100%)" padding={4}>
                <VStack align="stretch" gap={3}>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.14em" color="blue.600" fontWeight="700">
                      Architecture
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold">Trois couches distinctes</Text>
                  </VStack>
                  <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                    On separe clairement les roles de chaque couche pour eviter de melanger preparation, moteur interne et methode d&apos;entretien.
                  </Text>
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                      1. <Text as="span" fontWeight="semibold" color="fg.default">Parametrage guide</Text> : construire un profil credible et generer une premiere base.
                    </Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                      2. <Text as="span" fontWeight="semibold" color="fg.default">Grille d&apos;entretien</Text> : organiser les themes, les questions et les relances visibles.
                    </Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                      3. <Text as="span" fontWeight="semibold" color="fg.default">Prompt systeme avance</Text> : conserver le texte integral des personas historiques et affiner les cas complexes.
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              <Box borderRadius="3xl" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)" backgroundColor="bg.subtle" padding={4}>
                <VStack align="stretch" gap={2}>
                  <Text fontSize="sm" fontWeight="semibold">Grille d&apos;entretien</Text>
                  <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
                    La grille reste separee du prompt. Elle structure les themes, les questions et les relances methodologiques.
                  </Text>
                  <Button
                    size="sm"
                    variant="subtle"
                    alignSelf="flex-start"
                    onClick={() => router.push(`/personnas/${agentId}/grille`)}
                  >
                    Ouvrir la grille d&apos;entretien
                  </Button>
                </VStack>
              </Box>

              <Button
                size="sm"
                variant="subtle"
                onClick={handleSaveAgent}
                loading={isSavingAgent}
                disabled={!isAgentDirty || isSavingAgent}
                alignSelf="stretch"
                paddingInline={5}
              >
                Enregistrer la fiche
              </Button>

              <Separator />

              <Collapsible.Root
                open={advancedHelpOpen}
                onOpenChange={({ open }) => setAdvancedHelpOpen(open)}
              >
                <Collapsible.Trigger asChild>
                  <Button
                    variant="plain"
                    size="xs"
                    alignSelf="flex-start"
                    paddingInline={0}
                    color="fg.muted"
                  >
                    <Text fontSize="xs">Mode avance et personas historiques</Text>
                    {advancedHelpOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <VStack align="stretch" gap={2} paddingTop={2}>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                      Le bloc central ci-dessous contient le prompt systeme complet. Pour les personas historiques comme Jade, c&apos;est ici que reste le texte integral qui pilotait deja la simulation avant l&apos;arrivee du parametrage guide.
                    </Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                      Si tu veux un comportement plus personnalise que les champs guides, tu peux encore retoucher ce texte a la main ou repartir d&apos;un template.
                    </Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.7">
                      Ressources utiles :
                      <br />- un PDF d&apos;entretien
                      <br />- un fichier de{" "}
                      <Button asChild variant="plain" size="xs" colorPalette="blue" textDecoration="underline">
                        <a href="/docs/template_agent_system_prompt.md" target="_blank" rel="noreferrer">
                          template markdown
                        </a>
                      </Button>
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
            maxWidth="900px"
            marginX="auto"
            paddingX={{ base: 4, lg: 6 }}
            paddingTop={{ base: 4, lg: 5 }}
            paddingBottom={{ base: 6, lg: 8 }}
            overflowY="auto"
            minHeight={0}
          >
            <VStack align="stretch" gap={6}>
              <PersonaConfigBuilder
                personaName={agentName}
                value={personaConfig}
                onChange={setPersonaConfig}
                onGenerate={handleGeneratePrompt}
              />
              <Box minHeight={{ base: "640px", xl: "720px" }} display="flex">
                <PersonnaPromptEditor
                  title="Prompt systeme avance"
                  editor={editor}
                  subtitle="Ce texte complet reste le moteur interne de la simulation. Il sert aux personas historiques et aux ajustements fins apres generation guidee."
                  error={error}
                  headingRight={
                    <Menu.Root positioning={{ placement: "bottom-end" }}>
                      <Menu.Trigger asChild>
                        <Button variant="subtle" size="xs" justifyContent="space-between" gap={2} disabled={promptOptions.length === 0}>
                          <Text fontSize="xs" color={selectedPrompt ? "fg.default" : "fg.muted"} truncate>
                            {selectedPrompt ? formatPromptLabel(selectedPrompt) : "Aucun prompt disponible"}
                          </Text>
                          <ChevronDown size={14} />
                        </Button>
                      </Menu.Trigger>
                      <Menu.Positioner>
                        <Menu.Content maxHeight="320px" overflowY="auto" paddingX={2}>
                          {promptOptions.map((prompt) => (
                            <Menu.Item
                              key={prompt.id}
                              value={prompt.id}
                              onClick={() => handlePromptSelection(prompt.id)}
                              fontSize="xs"
                              fontWeight={prompt.id === selectedPromptId ? "semibold" : "normal"}
                              color={prompt.published ? { base: "red.600", _dark: "red.300" } : "fg.default"}
                            >
                              {formatPromptLabel(prompt)}
                            </Menu.Item>
                          ))}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>
                  }
                  editorToolbarRight={
                    <>
                      <Text fontSize="sm" color={isSelectedPublished ? "fg.default" : "fg.muted"} fontWeight={isSelectedPublished ? "semibold" : "normal"}>
                        {isSelectedPublished ? "Publie" : "Brouillon"}
                      </Text>
                      <HStack gap={2} flex="1" justify="flex-end" flexWrap="wrap">
                        <Button size="sm" variant="subtle" onClick={handleSavePrompt} loading={isSavingPrompt} disabled={!isDirty || isSavingPrompt} paddingInline={5}>
                          Enregistrer
                        </Button>
                        <Button
                          size="sm"
                          colorPalette="blue"
                          onClick={handlePublish}
                          loading={isPublishing}
                          disabled={!selectedPromptId || isSelectedPublished || isReviewing || review?.status === "invalid"}
                          paddingInline={5}
                        >
                          Publier
                        </Button>
                      </HStack>
                    </>
                  }
                />
              </Box>
            </VStack>
          </Box>
        }
        right={
          <PersonnaRightSidebar
            title="Validation du prompt avance"
            subtitle="Cette validation concerne uniquement le moteur interne complet utilise par la simulation. Elle ne remplace ni la grille ni l'analyse finale."
          >
            <PromptReviewSidebar
              review={review}
              reviewError={reviewError}
              isReviewing={isReviewing}
              isCurrent={Boolean(isReviewCurrent)}
            />
          </PersonnaRightSidebar>
        }
      />
    </Box>
  );
}
