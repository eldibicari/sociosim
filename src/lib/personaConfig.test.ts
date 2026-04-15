import { describe, expect, it } from "vitest";
import {
  InterviewGridSchema,
  PersonaConfigSchema,
  PersonaPromptBlueprintSchema,
} from "./personaConfig";

describe("persona advanced architecture schemas", () => {
  it("validates a structured persona config", () => {
    const config = PersonaConfigSchema.parse({
      identity: {
        firstName: "Jade",
        age: "24",
        role: "Etudiante en master",
        educationLevel: "Master 2",
      },
      subjectRelation: {
        position: "conflictuel",
        keyTensions: ["usage contraint", "valeurs ecologiques"],
      },
      interactionStyle: {
        verbosity: "bavard",
        stance: "prudent",
        cooperation: "cooperatif",
        consistency: "contradictoire",
        affect: "emotionnel",
      },
      difficulty: "intermediaire",
      sensitiveZones: ["surveillance", "travail gratuit des donnees"],
      language: {
        register: "universitaire accessible",
        averageAnswerLength: "moyenne",
        tone: "critique mais situe",
        vocabularyLevel: "conceptuel",
      },
    });

    expect(config.identity.firstName).toBe("Jade");
    expect(config.subjectRelation.position).toBe("conflictuel");
  });

  it("keeps prompt blueprint separate from the visible interview grid", () => {
    const blueprint = PersonaPromptBlueprintSchema.parse({
      identityBlock: "Identite",
      socialContextBlock: "Contexte social",
      subjectPostureBlock: "Rapport au sujet",
      conversationBehaviorBlock: "Comportement conversationnel",
      difficultyBlock: "Difficulte",
      coherenceGuardsBlock: "Garde-fous",
      responseRulesBlock: "Regles de reponse",
    });

    const grid = InterviewGridSchema.parse({
      title: "Entretien sur les usages de l'IA",
      objective: "Comprendre les usages, limites et arbitrages.",
      themes: [
        {
          id: "usages",
          title: "Usages concrets",
          objective: "Faire raconter une situation precise.",
          questions: [
            {
              id: "usage-1",
              label: "Peux-tu me raconter la derniere fois ou tu as utilise l'IA ?",
              followUps: ["Qu'est-ce que tu as garde ?", "Qu'est-ce qui t'a gene ?"],
            },
          ],
        },
      ],
    });

    expect(blueprint.identityBlock).toBe("Identite");
    expect(grid.themes[0]?.questions[0]?.followUps).toHaveLength(2);
  });
});
