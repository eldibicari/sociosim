import type { PersonaConfig, PersonaDifficulty, PersonaPromptBlueprint } from "@/lib/personaConfig";

function optionalLine(label: string, value?: string) {
  const trimmed = value?.trim();
  return trimmed ? `- ${label} : ${trimmed}` : null;
}

function listLines(label: string, values: string[]) {
  const cleanValues = values.map((value) => value.trim()).filter(Boolean);
  if (cleanValues.length === 0) return null;
  return `- ${label} : ${cleanValues.join("; ")}`;
}

function difficultyInstruction(difficulty: PersonaDifficulty) {
  if (difficulty === "facile") {
    return [
      "La persona repond de maniere plutot accessible et cooperative.",
      "Elle donne assez facilement des exemples concrets quand la question est claire.",
      "Elle peut demander une precision, mais ne bloque pas artificiellement l'echange.",
    ];
  }

  if (difficulty === "difficile") {
    return [
      "La persona peut etre plus evasive, defensive ou contradictoire.",
      "Elle ne livre pas toujours les exemples importants tout de suite.",
      "Elle demande des relances precises avant de detailler une experience sensible.",
    ];
  }

  return [
    "La persona repond de maniere nuancee, avec quelques hesitations credibles.",
    "Elle donne des exemples quand l'enqueteur relance correctement.",
    "Elle peut rester generale si la question est trop vague.",
  ];
}

function compactBlock(title: string, lines: Array<string | null>) {
  const cleanLines = lines.filter((line): line is string => Boolean(line));
  if (cleanLines.length === 0) return `## ${title}\n- Non renseigne.`;
  return `## ${title}\n${cleanLines.join("\n")}`;
}

export function buildPersonaPromptBlueprint(config: PersonaConfig): PersonaPromptBlueprint {
  const { identity, subjectRelation, interactionStyle, difficulty, sensitiveZones, language } = config;
  const firstName = identity.firstName.trim();

  return {
    identityBlock: compactBlock("Identite de la persona", [
      `- Prenom : ${firstName}`,
      optionalLine("Age", identity.age),
      optionalLine("Genre", identity.gender),
      optionalLine("Role social ou professionnel", identity.role),
      optionalLine("Niveau d'etude ou experience", identity.educationLevel),
    ]),
    socialContextBlock: compactBlock("Contexte social et trajectoire", [
      optionalLine("Environnement social", identity.socialEnvironment),
      optionalLine("Lieu ou contexte de vie", identity.livingContext),
    ]),
    subjectPostureBlock: compactBlock("Rapport au sujet de l'entretien", [
      `- Position generale : ${subjectRelation.position}`,
      optionalLine("Niveau d'implication", subjectRelation.involvementLevel),
      optionalLine("Niveau de politisation ou de conscience du sujet", subjectRelation.politicizationLevel),
      listLines("Tensions principales", subjectRelation.keyTensions),
    ]),
    conversationBehaviorBlock: compactBlock("Comportement conversationnel", [
      `- Longueur des reponses : ${interactionStyle.verbosity}`,
      `- Posture : ${interactionStyle.stance}`,
      `- Cooperation : ${interactionStyle.cooperation}`,
      `- Coherence interne : ${interactionStyle.consistency}`,
      `- Ton affectif : ${interactionStyle.affect}`,
      `- Registre de langue : ${language.register}`,
      `- Longueur moyenne attendue : ${language.averageAnswerLength}`,
      `- Ton general : ${language.tone}`,
      `- Niveau de vocabulaire : ${language.vocabularyLevel}`,
    ]),
    difficultyBlock: compactBlock("Niveau de difficulte pedagogique", [
      `- Niveau : ${difficulty}`,
      ...difficultyInstruction(difficulty).map((line) => `- ${line}`),
    ]),
    coherenceGuardsBlock: compactBlock("Garde-fous de coherence", [
      `- ${firstName} reste dans son role pendant tout l'entretien.`,
      "- La persona ne parle pas comme un assistant IA, un enseignant ou un expert omniscient.",
      "- Elle peut hesiter, se contredire ou rester partielle, mais toujours de maniere credible.",
      "- Elle n'invente pas d'evenements spectaculaires ou incoherents avec son profil.",
      listLines("Zones sensibles ou delicates", sensitiveZones),
      config.additionalInstructions?.trim()
        ? `- Instructions complementaires : ${config.additionalInstructions.trim()}`
        : null,
    ]),
    responseRulesBlock: compactBlock("Regles de reponse pendant l'entretien", [
      "- Repondre comme une personne interrogee dans un entretien semi-directif.",
      "- Favoriser les scenes du quotidien, les pratiques concretes et les nuances.",
      "- Ne pas produire de titres, listes formelles, gras ou sous-sections dans les reponses.",
      "- Ne pas transformer l'echange en cours magistral.",
      "- Demander une clarification si la question est ambigue ou trop large.",
    ]),
  };
}

export function buildPersonaPromptFromConfig(config: PersonaConfig) {
  const blueprint = buildPersonaPromptBlueprint(config);
  return [
    "# Simulation d'entretien sociologique",
    blueprint.identityBlock,
    blueprint.socialContextBlock,
    blueprint.subjectPostureBlock,
    blueprint.conversationBehaviorBlock,
    blueprint.difficultyBlock,
    blueprint.coherenceGuardsBlock,
    blueprint.responseRulesBlock,
  ].join("\n\n");
}
