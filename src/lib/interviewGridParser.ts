import type { GridQuestion, GridTheme, InterviewGrid } from "@/lib/personaConfig";

function compactLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function isBulletLine(line: string): boolean {
  return /^[-*•]\s+/.test(line.trim());
}

function parseBulletContent(line: string): string {
  return compactLine(line.trim().replace(/^[-*•]\s+/, ""));
}

function cleanThemeTitle(raw: string, fallback: string): string {
  const cleaned = compactLine(
    raw
      .replace(/^#+\s*/, "")
      .replace(/^th[eè]me\s*\d*\s*[:–\-]?\s*/i, "")
      .replace(/^section\s*\d*\s*[:–\-]?\s*/i, "")
  );
  return cleaned || fallback;
}

function parseBlockToTheme(block: string, index: number): GridTheme {
  const lines = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const [titleLine, ...rest] = lines;
  const title = cleanThemeTitle(titleLine ?? "", `Thème ${index}`);

  const objectiveLines: string[] = [];
  const questions: GridQuestion[] = [];
  let questionIndex = 0;

  for (const line of rest) {
    if (isBulletLine(line)) {
      const label = parseBulletContent(line);
      if (label) {
        questions.push({
          id: `q_${index}_${++questionIndex}`,
          label,
          followUps: [],
        });
      }
    } else {
      const cleaned = compactLine(line.replace(/^#+\s*/, ""));
      if (cleaned) objectiveLines.push(cleaned);
    }
  }

  return {
    id: `theme_${index}`,
    title,
    objective: objectiveLines.join(" "),
    questions,
  };
}

/**
 * Parse le texte brut d'un `interview_guide` en objet `InterviewGrid` structuré.
 *
 * Format attendu (souple) :
 *
 *   [Titre global optionnel]
 *
 *   Titre du thème 1
 *   - Question principale
 *   - Autre question
 *
 *   Thème 2 : Rapport au sujet
 *   - Question...
 *
 * Retourne `null` si le texte est vide.
 */
export function parseInterviewGrid(text: string): InterviewGrid | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const blocks = trimmed
    .split(/\r?\n[ \t]*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  let gridTitle = "Grille d'entretien";
  let gridObjective = "";
  let themeBlocks = blocks;

  // Si le premier bloc n'a aucune ligne bullet et qu'il y a d'autres blocs,
  // on le traite comme l'en-tête global (titre + objectif global).
  const firstBlockLines = blocks[0].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const firstBlockHasBullets = firstBlockLines.some(isBulletLine);

  if (!firstBlockHasBullets) {
    const [titleLine, ...objectiveLines] = firstBlockLines;
    gridTitle = compactLine(titleLine ?? "Grille d'entretien");
    gridObjective = objectiveLines.map(compactLine).filter(Boolean).join(" ");
    themeBlocks = blocks.slice(1);
  }

  const themes: GridTheme[] = themeBlocks.map((block, i) => parseBlockToTheme(block, i + 1));

  return {
    title: gridTitle,
    objective: gridObjective,
    themes,
  };
}
