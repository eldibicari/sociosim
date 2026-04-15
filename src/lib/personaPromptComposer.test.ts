import { describe, expect, it } from "vitest";
import { buildPersonaPromptBlueprint, buildPersonaPromptFromConfig } from "./personaPromptComposer";
import type { PersonaConfig } from "./personaConfig";

const baseConfig: PersonaConfig = {
  identity: {
    firstName: "Jade",
    age: "24",
    role: "Etudiante en master",
    socialEnvironment: "milieu universitaire critique",
    livingContext: "colocation en region parisienne",
    educationLevel: "Master 2 sociologie",
  },
  subjectRelation: {
    position: "conflictuel",
    involvementLevel: "eleve",
    politicizationLevel: "fort",
    keyTensions: ["usage contraint", "valeurs ecologiques"],
  },
  interactionStyle: {
    verbosity: "bavard",
    stance: "prudent",
    cooperation: "cooperatif",
    consistency: "contradictoire",
    affect: "emotionnel",
  },
  difficulty: "difficile",
  sensitiveZones: ["surveillance", "conditions de production de l'IA"],
  language: {
    register: "universitaire accessible",
    averageAnswerLength: "moyenne a longue",
    tone: "critique et situe",
    vocabularyLevel: "conceptuel",
  },
};

describe("persona prompt composer", () => {
  it("builds a modular prompt blueprint from visible persona parameters", () => {
    const blueprint = buildPersonaPromptBlueprint(baseConfig);

    expect(blueprint.identityBlock).toContain("Jade");
    expect(blueprint.subjectPostureBlock).toContain("conflictuel");
    expect(blueprint.difficultyBlock).toContain("defensive");
    expect(blueprint.responseRulesBlock).toContain("entretien semi-directif");
  });

  it("generates an internal prompt without exposing the interview grid", () => {
    const prompt = buildPersonaPromptFromConfig(baseConfig);

    expect(prompt).toContain("Simulation d'entretien sociologique");
    expect(prompt).toContain("Garde-fous de coherence");
    expect(prompt).toContain("ne parle pas comme un assistant IA");
    expect(prompt).not.toContain("GridTheme");
    expect(prompt).not.toContain("questions principales");
  });
});
