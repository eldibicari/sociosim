/**
 * Audition script for Jade's voice.
 *
 * Generates one MP3 per candidate voice, saying the same Jade greeting.
 * Output: tmp/voice-auditions/<voice-name>.mp3 (gitignored).
 *
 * Usage:
 *   node scripts/audition-jade-voices.mjs
 *
 * Requires:
 *   - ELEVENLABS_API_KEY in .env.local
 *   - Node 18+ (built-in fetch)
 *
 * See docs/voice/JADE_VOICE_DECISION.md for context.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

const ENV_FILE = join(PROJECT_ROOT, ".env.local");
const OUTPUT_DIR = join(PROJECT_ROOT, "tmp", "voice-auditions");
const MODEL_ID = "eleven_multilingual_v2";

const JADE_GREETING = [
  "Bonjour, je m'appelle Jade.",
  "J'ai vingt-six ans, je suis en master de droit.",
  "Je lis tout ce qui sort sur ces outils.",
  "Le vrai problème, c'est que personne ne réfléchit vraiment à ce qu'il fait avec.",
].join(" ");

const CANDIDATES = [
  {
    name: "charlotte",
    voiceId: "XB0fDUnXU5powFXDhCwa",
    description: "Jeune femme, calme, multilingue, conversationnelle",
  },
  {
    name: "sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    description: "Jeune femme douce, chaleureuse, narration-friendly",
  },
  {
    name: "lily",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    description: "Jeune femme expressive, chaleureuse",
  },
];

const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
};

function readEnvLocal(key) {
  let content;
  try {
    content = readFileSync(ENV_FILE, "utf-8");
  } catch (error) {
    throw new Error(`Could not read ${ENV_FILE}: ${error.message}`);
  }
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    if (k === key) {
      return trimmed.slice(eqIdx + 1).trim();
    }
  }
  return null;
}

async function generateForCandidate(apiKey, candidate) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${candidate.voiceId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: JADE_GREETING,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs returned ${response.status} ${response.statusText} for ${candidate.name}: ${detail.slice(0, 300)}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const outputPath = join(OUTPUT_DIR, `${candidate.name}.mp3`);
  writeFileSync(outputPath, buffer);
  return outputPath;
}

async function main() {
  const apiKey = readEnvLocal("ELEVENLABS_API_KEY");
  if (!apiKey) {
    console.error("ERROR: ELEVENLABS_API_KEY not found in .env.local");
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Greeting (${JADE_GREETING.length} chars):`);
  console.log(`  "${JADE_GREETING}"\n`);
  console.log(`Generating ${CANDIDATES.length} candidate audio files...\n`);

  for (const candidate of CANDIDATES) {
    process.stdout.write(`  ${candidate.name.padEnd(12)} (${candidate.description}) ... `);
    try {
      const outputPath = await generateForCandidate(apiKey, candidate);
      console.log(`✓ ${outputPath}`);
    } catch (error) {
      console.log(`✗ ${error.message}`);
    }
  }

  console.log(`\nDone. Open ${OUTPUT_DIR} and double-click each .mp3 to compare.`);
  console.log("Then come back to Claude and say which one you prefer (charlotte / sarah / lily).");
}

main().catch((error) => {
  console.error("Audition failed:", error.message);
  process.exit(1);
});
