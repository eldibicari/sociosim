import { describe, expect, it } from "vitest";
import { buildPromptHighlights, getPersonaHistoryTitle, getPersonaInterviewGuide, pickPrimaryPrompt } from "./personaFiche";

describe("personaFiche helpers", () => {
  it("prefers a published prompt when selecting the main prompt", () => {
    const prompt = pickPrimaryPrompt([
      {
        id: "draft",
        system_prompt: "draft",
        version: 1,
        last_edited: "2026-04-14T10:00:00Z",
        published: false,
      },
      {
        id: "published",
        system_prompt: "published",
        version: 2,
        last_edited: "2026-04-14T11:00:00Z",
        published: true,
      },
    ]);

    expect(prompt?.id).toBe("published");
  });

  it("builds prompt highlights from meaningful prompt lines", () => {
    const highlights = buildPromptHighlights(`
## Profil general
Etudiante en master qui utilise l'IA pour organiser son travail.
- Se sent plus a l'aise pour brainstormer que pour rediger
- Cherche des exemples concrets et des arbitrages
`);

    expect(highlights).toContain("Profil general");
    expect(highlights.some((line) => line.includes("utilise l'IA"))).toBe(true);
  });

  it("creates a pedagogical interview guide and history labels", () => {
    const guide = getPersonaInterviewGuide(
      {
        id: "jade",
        agent_name: "jade",
        description: "Etudiante prudente face a l'IA",
        active: true,
      },
      "## Vigilances\nDemande des exemples concrets."
    );

    const historyTitle = getPersonaHistoryTitle({
      id: "int-1",
      messages: [
        { role: "assistant", content: "Bonjour" },
        { role: "user", content: "Peux-tu me raconter un exemple recent d'usage de l'IA ?" },
      ],
    });

    expect(guide).toHaveLength(4);
    expect(guide[0]?.title).toBe("Entrer dans le contexte");
    expect(historyTitle).toContain("Peux-tu me raconter");
  });
});
