import { type Agent } from "@/lib/agents";

export interface PersonaPromptOption {
  id: string;
  system_prompt: string;
  version: number;
  last_edited: string;
  published: boolean;
  users?: { name?: string | null } | null;
}

export interface PersonaHistoryMessage {
  content: string;
  role?: string;
  created_at?: string;
}

export interface PersonaHistoryItem {
  id: string;
  agent_id?: string;
  status?: string;
  updated_at?: string;
  message_count?: number;
  messages?: PersonaHistoryMessage[];
}

export interface PersonaGuideSection {
  title: string;
  objective: string;
  sampleQuestions: string[];
}

export interface PersonaGuideItem {
  title: string;
  lines: string[];
}

export interface PersonaPostureTip {
  title: string;
  body: string;
}

function toTitleCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

export function pickPrimaryPrompt(prompts: PersonaPromptOption[]) {
  return prompts.find((prompt) => prompt.published) ?? prompts[0] ?? null;
}

export function buildPromptHighlights(promptText: string) {
  if (!promptText.trim()) return [];

  const lines = promptText
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line.replace(/^#+\s*/, "").replace(/^[-*]\s*/, "")))
    .filter(Boolean);

  const highlights: string[] = [];
  for (const line of lines) {
    if (line.length < 12) continue;
    if (highlights.some((existing) => existing.toLowerCase() === line.toLowerCase())) {
      continue;
    }
    highlights.push(truncate(line, 110));
    if (highlights.length === 4) break;
  }

  return highlights;
}

export function buildPromptSummaryPoints(promptText: string) {
  if (!promptText.trim()) return [];

  const lines = promptText
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line.replace(/^#+\s*/, "").replace(/^[-*]\s*/, "")))
    .filter((line) => line.length >= 12);

  const points: string[] = [];
  for (const line of lines) {
    if (points.some((existing) => existing.toLowerCase() === line.toLowerCase())) {
      continue;
    }
    points.push(line);
    if (points.length === 6) break;
  }

  return points;
}

export function getPersonaInterviewGuide(
  agent: Agent,
  promptText: string
): PersonaGuideSection[] {
  const title = toTitleCase(agent.agent_name);
  const description = compactWhitespace((agent.description ?? "").replace(/\\n/g, " "));
  const promptHighlights = buildPromptHighlights(promptText);
  const contextualCue = promptHighlights[0] ?? description;

  return [
    {
      title: "Entrer dans le contexte",
      objective: contextualCue
        ? `Situer ${title} dans son cadre d'etudes, ses habitudes et son rapport general a l'IA.`
        : `Poser le cadre de vie et de travail de ${title} avant de creuser l'entretien.`,
      sampleQuestions: [
        "Comment te presenterais-tu aujourd'hui dans ton parcours et ton quotidien ?",
        "A quel moment l'IA apparait-elle pour toi dans tes etudes ou ton travail ?",
      ],
    },
    {
      title: "Faire raconter des usages concrets",
      objective:
        "Obtenir des situations precises plutot que des opinions generales sur l'IA.",
      sampleQuestions: [
        "Peux-tu me raconter la derniere fois ou tu as utilise un outil d'IA de bout en bout ?",
        "Qu'est-ce que tu lui as demande, et qu'est-ce que tu en as vraiment garde ?",
      ],
    },
    {
      title: "Explorer les arbitrages et les tensions",
      objective:
        "Faire emerger les hesitations, les limites, les arrangements et les contradictions.",
      sampleQuestions: [
        "Qu'est-ce qui te met a l'aise ou au contraire te freine quand tu utilises l'IA ?",
        "Y a-t-il des situations ou tu preferes ne pas l'utiliser ? Pourquoi ?",
      ],
    },
    {
      title: "Ouvrir des relances utiles",
      objective:
        "Verifier ce qui reste flou et preparer une suite exploitable pour l'analyse.",
      sampleQuestions: [
        "Quel exemple faudrait-il encore approfondir pour mieux comprendre ton usage ?",
        "Si on reprenait cet entretien demain, sur quel point faudrait-il revenir ?",
      ],
    },
  ];
}

export function parseStoredInterviewGuide(guideText: string): PersonaGuideItem[] {
  const trimmed = guideText.trim();
  if (!trimmed) return [];

  const blocks = trimmed
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => compactWhitespace(line.replace(/^[-*]\s*/, "").replace(/^#+\s*/, "")))
      .filter(Boolean);

    const [first, ...rest] = lines;
    return {
      title: first || `Theme ${index + 1}`,
      lines: rest,
    };
  });
}

export function getPersonaPostureTips(agent: Agent, promptText: string): PersonaPostureTip[] {
  const title = toTitleCase(agent.agent_name);
  const promptHighlights = buildPromptHighlights(promptText);
  const firstHighlight = promptHighlights[0];

  return [
    {
      title: "Partir du concret",
      body: `Avec ${title}, privilegie les scenes precises, les exemples dates, les outils cites et les gestes reelement decrits.`,
    },
    {
      title: "Relancer sans suggerer",
      body:
        "Garde des questions ouvertes, puis relance sur les details, les raisons, les doutes et les consequences.",
    },
    {
      title: "Revenir sur les tensions",
      body: firstHighlight
        ? `Si ${title} evoque "${firstHighlight}", demande comment cela se traduit dans la pratique et ce que cela change vraiment.`
        : `Repere les contradictions, les zones de confort et les moments de blocage pour enrichir l'entretien.`,
    },
  ];
}

export function getPersonaHistoryTitle(interview: PersonaHistoryItem) {
  const firstUserMessage = interview.messages?.find(
    (message) => message.role === "user" && compactWhitespace(message.content || "").length > 0
  );

  if (firstUserMessage) {
    return truncate(compactWhitespace(firstUserMessage.content), 72);
  }

  return "Entretien sans titre";
}

export function getPersonaPromptPreview(promptText: string) {
  const cleaned = compactWhitespace(promptText);
  if (!cleaned) return "";
  return truncate(cleaned, 420);
}
