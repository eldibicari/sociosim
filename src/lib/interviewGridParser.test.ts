import { describe, expect, it } from "vitest";
import { parseInterviewGrid } from "./interviewGridParser";

describe("parseInterviewGrid", () => {
  it("retourne null pour un texte vide", () => {
    expect(parseInterviewGrid("")).toBeNull();
    expect(parseInterviewGrid("   ")).toBeNull();
  });

  it("parse un seul bloc sans en-tête global", () => {
    const text = `Rapport au quartier
- Depuis combien de temps habitez-vous ici ?
- Qu'est-ce qui a changé autour de vous ?`;

    const result = parseInterviewGrid(text);
    expect(result).not.toBeNull();
    expect(result!.themes).toHaveLength(1);
    expect(result!.themes[0].title).toBe("Rapport au quartier");
    expect(result!.themes[0].questions).toHaveLength(2);
    expect(result!.themes[0].questions[0].label).toBe(
      "Depuis combien de temps habitez-vous ici ?"
    );
  });

  it("parse plusieurs thèmes avec un en-tête global", () => {
    const text = `Grille d'entretien - Marie

Rapport au quartier
- Depuis combien de temps habitez-vous ici ?
- Qu'est-ce qui vous plaît dans le quartier ?

Relations de voisinage
- Connaissez-vous vos voisins ?
- Y a-t-il des moments de solidarité dans l'immeuble ?`;

    const result = parseInterviewGrid(text);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Grille d'entretien - Marie");
    expect(result!.themes).toHaveLength(2);
    expect(result!.themes[0].title).toBe("Rapport au quartier");
    expect(result!.themes[1].title).toBe("Relations de voisinage");
    expect(result!.themes[0].questions).toHaveLength(2);
    expect(result!.themes[1].questions).toHaveLength(2);
  });

  it("supprime les préfixes de thème courants", () => {
    const text = `Thème 1 : Rapport au logement
- Comment décrivez-vous votre logement ?

Thème 2 - Vie quotidienne
- Décrivez une journée type.`;

    const result = parseInterviewGrid(text);
    expect(result!.themes[0].title).toBe("Rapport au logement");
    expect(result!.themes[1].title).toBe("Vie quotidienne");
  });

  it("génère des IDs stables et uniques par thème et question", () => {
    const text = `Thème A
- Question 1
- Question 2

Thème B
- Question 3`;

    const result = parseInterviewGrid(text);
    const ids = result!.themes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);

    const qIds = result!.themes.flatMap((t) => t.questions.map((q) => q.id));
    expect(new Set(qIds).size).toBe(qIds.length);
  });

  it("produit un tableau de thèmes vide pour un en-tête seul", () => {
    const result = parseInterviewGrid("Grille sans thèmes");
    expect(result).not.toBeNull();
    expect(result!.themes).toHaveLength(0);
  });

  it("ignore les lignes non-bullet comme objectif de thème", () => {
    const text = `Rapport au travail
Explorer les conditions de travail et les tensions vécues.
- Décrivez votre poste actuel.
- Qu'est-ce qui vous pèse le plus ?`;

    const result = parseInterviewGrid(text);
    expect(result!.themes[0].objective).toBe(
      "Explorer les conditions de travail et les tensions vécues."
    );
    expect(result!.themes[0].questions).toHaveLength(2);
  });
});
