/**
 * Generate Jade's official voice preview and upload it to Supabase Storage.
 *
 * The preview is the audio clip that plays on Jade's showcase card when a user
 * clicks "Écouter la voix". It is generated ONCE and reused forever (zero TTS
 * cost on every subsequent click).
 *
 * Usage:
 *   node scripts/generate-jade-preview.mjs
 *
 * Requires:
 *   - ELEVENLABS_API_KEY in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - SUPABASE_SERVICE_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - Jade's agent row in DB must already have voice_profile.voiceId set
 *
 * What it does:
 *   1. Loads Jade's voice_profile from the agents table
 *   2. Generates the preview audio via ElevenLabs (using her configured voiceId)
 *   3. Saves a local copy to tmp/jade-preview.mp3 (for verification)
 *   4. Uploads to voice-cache/previews/jade.mp3 (upsert: overrides any existing)
 *   5. Prints the public URL
 *
 * See docs/voice/JADE_VOICE_DECISION.md for context.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

const ENV_FILE = join(PROJECT_ROOT, ".env.local");
const OUTPUT_DIR = join(PROJECT_ROOT, "tmp");
const LOCAL_OUTPUT = join(OUTPUT_DIR, "jade-preview.mp3");
const BUCKET = "voice-cache";
const PREVIEW_PATH = "previews/jade.mp3";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

const JADE_PREVIEW_TEXT = [
  "Bonjour, je m'appelle Jade.",
  "J'ai vingt-six ans, je suis en master de droit.",
  "Je lis tout ce qui sort sur ces outils.",
  "Le vrai problème, c'est que personne ne réfléchit vraiment à ce qu'il fait avec.",
].join(" ");

function readEnvLocal() {
  let content;
  try {
    content = readFileSync(ENV_FILE, "utf-8");
  } catch (error) {
    throw new Error(`Could not read ${ENV_FILE}: ${error.message}`);
  }
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  return env;
}

async function generateAudio(apiKey, voiceProfile, text) {
  const voiceId = voiceProfile.voiceId;
  const modelId = voiceProfile.modelId ?? DEFAULT_MODEL_ID;
  const settings = voiceProfile.settings ?? {
    stability: 0.5,
    similarity_boost: 0.75,
  };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: settings,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs returned ${response.status} ${response.statusText}: ${detail.slice(0, 300)}`
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const env = readEnvLocal();

  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ERROR: ELEVENLABS_API_KEY not found in .env.local");
    process.exit(1);
  }

  // This script runs from the host. Prefer the explicit Cloud variables when
  // present (the app dev env may point at a local Docker Supabase that this
  // script cannot reach). Fall back to the standard names otherwise.
  const supabaseUrl =
    env.SUPABASE_CLOUD_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_SERVICE_URL;
  const serviceRoleKey =
    env.SUPABASE_CLOUD_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error(
      "ERROR: SUPABASE_CLOUD_URL (or NEXT_PUBLIC_SUPABASE_URL) missing in .env.local"
    );
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error(
      "ERROR: SUPABASE_CLOUD_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY) missing in .env.local"
    );
    process.exit(1);
  }

  console.log(`Using Supabase URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Loading Jade's voice_profile from DB...");
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, agent_name, voice_profile")
    .eq("agent_name", "jade")
    .maybeSingle();

  if (agentError) {
    console.error("ERROR loading agent:", agentError.message);
    process.exit(1);
  }
  if (!agent) {
    console.error("ERROR: Jade agent not found in DB");
    process.exit(1);
  }
  if (!agent.voice_profile?.voiceId) {
    console.error(
      "ERROR: Jade has no voice_profile yet. Apply the UPDATE SQL first (see docs/voice/JADE_VOICE_DECISION.md)."
    );
    process.exit(1);
  }

  console.log(`  voiceId: ${agent.voice_profile.voiceId}`);
  console.log(`  displayName: ${agent.voice_profile.displayName ?? "(none)"}`);

  console.log(`\nGenerating preview audio (${JADE_PREVIEW_TEXT.length} chars)...`);
  const audio = await generateAudio(apiKey, agent.voice_profile, JADE_PREVIEW_TEXT);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(LOCAL_OUTPUT, audio);
  console.log(`  Local copy saved: ${LOCAL_OUTPUT}`);

  console.log(`\nUploading to Supabase Storage: ${BUCKET}/${PREVIEW_PATH} ...`);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(PREVIEW_PATH, audio, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError.message);
    process.exit(1);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(PREVIEW_PATH);

  console.log(`\nDone.`);
  console.log(`  Public URL: ${publicUrlData.publicUrl}`);
  console.log(`\nTo verify:`);
  console.log(`  1. Double-click ${LOCAL_OUTPUT} to listen locally`);
  console.log(`  2. Or open ${publicUrlData.publicUrl} in a browser`);
}

main().catch((error) => {
  console.error("\nFailed:", error.message);
  process.exit(1);
});
