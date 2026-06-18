/**
 * Voice matching / scoring engine.
 *
 * Given a set of PersonaVoiceAttributes and a CatalogVoice list, score each
 * voice and return them sorted best-first. The scoring is intentionally
 * simple and additive — every match contributes points, mismatches are
 * neutral (we don't penalize, we just reward matches), and we keep a list
 * of "matchReasons" in French for the UI to explain why each voice was
 * suggested.
 *
 * Design choices:
 *   - We never EXCLUDE a voice for a missing attribute (the catalog has
 *     incomplete metadata; excluding would empty the result set).
 *   - We score on gender, age bucket, accent, language, tone/use_case,
 *     and a small fallback for "conversational" voices.
 *   - The matcher returns ALL voices ranked. The caller paginates.
 */

import type {
  CatalogVoice,
  PersonaVoiceAttributes,
  VoiceCandidate,
} from "./types";

const SCORE_GENDER = 30;
const SCORE_AGE = 18;
const SCORE_LANGUAGE = 15;
const SCORE_ACCENT = 12;
const SCORE_TONE = 8;
const SCORE_CONVERSATIONAL_FALLBACK = 4;

function normalizeText(s?: string): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

function matchesGender(personaGender: string | undefined, voiceGender?: string): boolean {
  if (!personaGender || !voiceGender) return false;
  const p = normalizeText(personaGender);
  const v = normalizeText(voiceGender);
  if (!p || !v) return false;
  if (p === v) return true;
  // map free-form persona genders to voice genders
  const feminine = ["f", "femme", "feminin", "feminine", "female", "fem"];
  const masculine = ["m", "h", "homme", "masculin", "male", "masc"];
  if (feminine.includes(p) && feminine.includes(v)) return true;
  if (masculine.includes(p) && masculine.includes(v)) return true;
  if (feminine.includes(p) && v.includes("female")) return true;
  if (masculine.includes(p) && v.includes("male") && !v.includes("female")) return true;
  return false;
}

function ageBucket(age: number): "young" | "middle_aged" | "old" {
  if (age <= 30) return "young";
  if (age <= 55) return "middle_aged";
  return "old";
}

function matchesAge(personaAge: number | undefined, voiceAge?: string): boolean {
  if (personaAge === undefined || !voiceAge) return false;
  const v = normalizeText(voiceAge);
  const targetBucket = ageBucket(personaAge);
  if (v.includes(targetBucket.replace("_", " "))) return true;
  if (v.includes(targetBucket.replace("_", "-"))) return true;
  if (v.includes(targetBucket)) return true;
  if (targetBucket === "young" && (v.includes("young") || v.includes("teen") || v.includes("adolescent"))) return true;
  if (targetBucket === "middle_aged" && (v.includes("middle") || v.includes("adult") || v.includes("mature"))) return true;
  if (targetBucket === "old" && (v.includes("old") || v.includes("senior") || v.includes("elder"))) return true;
  return false;
}

function matchesLanguage(personaLanguage: string | undefined, voiceLanguage?: string): boolean {
  if (!voiceLanguage) return false;
  if (!personaLanguage) return false;
  const p = normalizeText(personaLanguage).slice(0, 2);
  const v = normalizeText(voiceLanguage).slice(0, 2);
  return p === v;
}

function matchesAccent(personaAccent: string | undefined, voiceAccent?: string): boolean {
  if (!personaAccent || !voiceAccent) return false;
  const p = normalizeText(personaAccent);
  const v = normalizeText(voiceAccent);
  if (!p || !v) return false;
  return p === v || v.includes(p) || p.includes(v);
}

function matchesTone(personaTone: string | undefined, voiceUseCase?: string): boolean {
  if (!personaTone || !voiceUseCase) return false;
  const p = normalizeText(personaTone);
  const v = normalizeText(voiceUseCase);
  if (!p || !v) return false;
  return p === v || v.includes(p) || p.includes(v);
}

function isConversational(voice: CatalogVoice): boolean {
  const v = normalizeText(voice.useCase) + " " + normalizeText(voice.description);
  return v.includes("conversational") || v.includes("conversation") || v.includes("dialogue");
}

/**
 * Score a single voice against persona attributes.
 * Returns the candidate with `score` and `matchReasons`.
 */
export function scoreVoice(
  voice: CatalogVoice,
  attrs: PersonaVoiceAttributes
): VoiceCandidate {
  let score = 0;
  const reasons: string[] = [];

  if (matchesGender(attrs.gender, voice.gender)) {
    score += SCORE_GENDER;
    reasons.push(`Genre ${voice.gender}`);
  }

  if (matchesAge(attrs.age, voice.age)) {
    score += SCORE_AGE;
    reasons.push(`Âge ${voice.age}`);
  }

  if (matchesLanguage(attrs.language, voice.language)) {
    score += SCORE_LANGUAGE;
    reasons.push(`Langue ${voice.language}`);
  }

  if (matchesAccent(attrs.accent, voice.accent)) {
    score += SCORE_ACCENT;
    reasons.push(`Accent ${voice.accent}`);
  }

  if (matchesTone(attrs.tone, voice.useCase)) {
    score += SCORE_TONE;
    reasons.push(`Ton ${voice.useCase}`);
  } else if (!attrs.tone && isConversational(voice)) {
    score += SCORE_CONVERSATIONAL_FALLBACK;
    reasons.push("Voix conversationnelle");
  }

  return { ...voice, score, matchReasons: reasons };
}

/**
 * Rank all voices against the attributes. Returns sorted best-first.
 * Voices with score 0 are still returned (after all matches) so the UI
 * can show "Other voices to try" if needed.
 */
export function rankVoices(
  voices: CatalogVoice[],
  attrs: PersonaVoiceAttributes
): VoiceCandidate[] {
  return voices
    .map((v) => scoreVoice(v, attrs))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
