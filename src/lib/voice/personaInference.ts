/**
 * Persona inference helpers for voice recommendations.
 *
 * Best-effort inference of gender + age from the persona's name and prompt
 * content, so the voice audition can pre-filter candidates without the user
 * having to fill dropdowns manually.
 *
 * These functions never throw and never overreach: when in doubt, they
 * return `undefined`. The matcher gracefully handles missing attributes.
 */

// ─── French first names → gender ────────────────────────────────────────
//
// Curated list of common French first names (without accents, lowercase).
// Not exhaustive — covers the bulk of names a sociology M2 student is
// likely to use for a persona. Easy to extend.

const FRENCH_FEMALE_NAMES = new Set<string>([
  "adele", "agathe", "agnes", "alice", "alicia", "aline", "alix", "amandine",
  "amelie", "amina", "anais", "anna", "anne", "annie", "apolline", "ariane",
  "audrey", "aurelie", "aurore", "barbara", "beatrice", "berenice", "blanche",
  "brigitte", "camille", "candice", "capucine", "carine", "carla", "carole",
  "caroline", "catherine", "celia", "celine", "cendrine", "chantal", "charlotte",
  "chloe", "christelle", "christiane", "christine", "claire", "clara", "clarisse",
  "claude", "claudette", "claudine", "clemence", "colette", "constance", "coralie",
  "corinne", "danielle", "delphine", "diane", "dorothee", "elea", "eleonore",
  "eliane", "elif", "elisa", "elisabeth", "elise", "ella", "elodie", "eloise",
  "elsa", "emilie", "emma", "emmanuelle", "estelle", "eugenie", "eva", "evelyne",
  "fanny", "fatiha", "fatima", "florence", "francine", "francoise", "gabrielle",
  "genevieve", "georgette", "gisele", "gladys", "hanae", "helena", "helene",
  "henriette", "ines", "ingrid", "irene", "iris", "isabelle", "jacqueline",
  "jade", "jeanne", "jeannette", "jeannine", "jenny", "jessica", "joelle",
  "josette", "josephine", "josiane", "judith", "julia", "julie", "juliette",
  "justine", "karima", "karine", "kenza", "khadija", "lara", "laure", "laurence",
  "laurie", "lea", "leila", "lena", "leonie", "leslie", "lila", "lilou", "lily",
  "lina", "linda", "lise", "liza", "lola", "lou", "louise", "lucette", "lucie",
  "lucile", "lucy", "ludivine", "lydie", "maelle", "magali", "manon", "marcelle",
  "margaux", "margot", "marguerite", "maria", "marianne", "marie", "marina",
  "marine", "marion", "marjorie", "marlene", "martine", "maryam", "maryline",
  "mathilde", "maud", "maxime", "melanie", "melissa", "michele", "micheline",
  "mireille", "monique", "morgane", "muriel", "myriam", "nadege", "nadia",
  "nadine", "naima", "naomi", "natacha", "nathalie", "nicole", "ninon", "noemie",
  "nora", "norah", "odile", "odette", "olga", "olivia", "ophelie", "oriane",
  "pamela", "pascale", "patricia", "paulette", "pauline", "perrine", "raphaelle",
  "rebecca", "regine", "renee", "romane", "rose", "roxane", "sabine", "sabrina",
  "salima", "salome", "samia", "sandra", "sandrine", "sara", "sarah", "sasha",
  "selma", "severine", "sheila", "sibylle", "simone", "sofia", "solene", "sonia",
  "sophie", "stella", "stephanie", "suzanne", "sylvie", "tania", "tatiana",
  "thais", "therese", "tiffany", "valentine", "valerie", "vanessa", "veronique",
  "victoire", "victoria", "violette", "virginie", "vivienne", "wassila", "yasmina",
  "yasmine", "yolande", "yvette", "zineb", "zoe",
]);

const FRENCH_MALE_NAMES = new Set<string>([
  "abdel", "abdou", "achille", "adam", "adrien", "ahmed", "alain", "albert",
  "alexandre", "alexis", "ali", "alphonse", "amadou", "amine", "andre", "anthony",
  "antoine", "armand", "arnaud", "arsene", "arthur", "augustin", "axel", "ayoub",
  "balthazar", "baptiste", "bastien", "benjamin", "benoit", "bernard", "bertrand",
  "boris", "boubacar", "brahim", "brendan", "brice", "bruno", "cedric", "cesar",
  "charles", "christian", "christophe", "claude", "clement", "constantin", "corentin",
  "cyprien", "cyril", "cyrille", "damien", "daniel", "dany", "david", "denis",
  "didier", "dimitri", "diego", "dominique", "donatien", "edmond", "edouard",
  "elias", "elie", "elliot", "emile", "emmanuel", "enzo", "eric", "ernest",
  "esteban", "etienne", "eugene", "evan", "fabien", "fabrice", "farid", "felix",
  "ferdinand", "fernand", "florent", "florian", "francis", "francois", "frederic",
  "gabriel", "gael", "gaspard", "gaston", "gauthier", "georges", "gerard", "geoffrey",
  "gilbert", "gilles", "gregoire", "gregory", "guillaume", "gustave", "guy",
  "habib", "hakim", "hamza", "hassan", "hector", "henri", "herve", "hicham",
  "honore", "hugo", "hugues", "ibrahim", "ilyas", "isaac", "ismael", "ivan",
  "jacques", "jamel", "jean", "jeremie", "jeremy", "jerome", "jimmy", "joel",
  "johan", "jonas", "jonathan", "jordan", "jose", "joseph", "joshua", "joel",
  "jules", "julien", "kader", "karim", "kemal", "kevin", "khalil", "killian",
  "kylian", "lamine", "laurent", "leandre", "leo", "leon", "leopold", "liam",
  "lilian", "lionel", "loic", "loris", "louis", "luc", "lucas", "lucien",
  "ludovic", "maamadou", "mahdi", "mahmoud", "malik", "malo", "mamadou", "manuel",
  "marc", "marcel", "marius", "martial", "martin", "mathias", "mathieu", "matheo",
  "mathys", "matteo", "maurice", "max", "maxence", "maxime", "mehdi", "michael",
  "michel", "miguel", "milo", "mohamed", "morgan", "moussa", "mustapha", "nabil",
  "nael", "nasser", "nathan", "nicolas", "nils", "noah", "noe", "norbert",
  "olivier", "omar", "oscar", "othman", "owen", "pablo", "pascal", "patrice",
  "patrick", "paul", "philippe", "pierre", "pol", "quentin", "rachid", "rafael",
  "raphael", "raymond", "regis", "rejean", "remi", "remy", "renaud", "rene",
  "richard", "robert", "robin", "rodolphe", "rodrigue", "roger", "roland",
  "romain", "roman", "romeo", "ronan", "ronaldo", "rui", "ryan", "saad", "sacha",
  "said", "salah", "samir", "samuel", "sebastien", "selim", "serge", "simon",
  "stan", "stanislas", "stephane", "stephen", "steve", "sylvain", "tariq", "theo",
  "theodore", "theophile", "thiago", "thibault", "thierry", "thomas", "tim",
  "timeo", "timothy", "tom", "tony", "tristan", "ulysse", "valentin", "vianney",
  "victor", "vincent", "wassim", "william", "xavier", "yacine", "yanis", "yann",
  "youssef", "yves", "zakaria", "zinedine",
]);

function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .split(/[\s\-]/)[0] ?? "";
}

export function inferGenderFromName(name: string | undefined | null): "female" | "male" | undefined {
  if (!name) return undefined;
  const normalized = normalizeName(name);
  if (!normalized) return undefined;
  if (FRENCH_FEMALE_NAMES.has(normalized)) return "female";
  if (FRENCH_MALE_NAMES.has(normalized)) return "male";
  return undefined;
}

// ─── Prompt-based inference ────────────────────────────────────────────

const FEMALE_KEYWORDS = [
  "femme", "etudiante", "elle est", "elle s'appelle", "elle a ",
  "mere ", "fille", "soeur", "tante", "epouse",
];

const MALE_KEYWORDS = [
  "homme", "etudiant ", "etudiant.", "etudiant,", "il est", "il s'appelle", "il a ",
  "pere ", "fils", "garcon", "frere", "oncle", "mari ", "mari.",
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function inferGenderFromPrompt(prompt: string | undefined | null): "female" | "male" | undefined {
  if (!prompt) return undefined;
  const text = normalizeText(prompt);
  let femaleHits = 0;
  let maleHits = 0;
  for (const k of FEMALE_KEYWORDS) {
    if (text.includes(k)) femaleHits += 1;
  }
  for (const k of MALE_KEYWORDS) {
    if (text.includes(k)) maleHits += 1;
  }
  if (femaleHits === 0 && maleHits === 0) return undefined;
  if (femaleHits >= maleHits) return femaleHits > maleHits ? "female" : undefined;
  return "male";
}

export function inferAgeFromPrompt(prompt: string | undefined | null): number | undefined {
  if (!prompt) return undefined;
  const text = normalizeText(prompt);
  // Match patterns like "22 ans", "vingt-deux ans", "agee de 34", etc.
  const numericMatch = text.match(/(\d{1,3})\s*ans?\b/);
  if (numericMatch) {
    const age = parseInt(numericMatch[1], 10);
    if (!isNaN(age) && age >= 5 && age <= 110) return age;
  }
  return undefined;
}

// ─── Combined inference ────────────────────────────────────────────────

/**
 * Combine all signals into a final guess.
 * Priority: explicit override > name lookup > prompt analysis.
 */
export function inferPersonaVoiceHints(opts: {
  name?: string;
  prompt?: string;
  overrideGender?: string;
  overrideAge?: number;
}): { gender?: string; age?: number; source: { gender?: string; age?: string } } {
  const source: { gender?: string; age?: string } = {};

  let gender: string | undefined;
  if (opts.overrideGender) {
    gender = opts.overrideGender;
    source.gender = "Choix manuel";
  } else {
    const fromName = inferGenderFromName(opts.name);
    if (fromName) {
      gender = fromName;
      source.gender = "Détecté depuis le prénom";
    } else {
      const fromPrompt = inferGenderFromPrompt(opts.prompt);
      if (fromPrompt) {
        gender = fromPrompt;
        source.gender = "Détecté depuis le prompt";
      }
    }
  }

  let age: number | undefined;
  if (typeof opts.overrideAge === "number") {
    age = opts.overrideAge;
    source.age = "Choix manuel";
  } else {
    const fromPrompt = inferAgeFromPrompt(opts.prompt);
    if (fromPrompt) {
      age = fromPrompt;
      source.age = "Détecté depuis le prompt";
    }
  }

  return { gender, age, source };
}
