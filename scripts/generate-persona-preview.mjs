/**
 * Generate a persona's voice preview and upload it to Supabase Storage.
 *
 * Generic version of generate-jade-preview.mjs — works for any persona that
 * has voice_profile set in the DB.
 *
 * Usage:
 *   node scripts/generate-persona-preview.mjs <agent_name> [preview_text]
 *
 * Examples:
 *   node scripts/generate-persona-preview.mjs jade
 *   node scripts/generate-persona-preview.mjs theo "Salut, moi c'est Théo, 21 ans, je suis en licence de sociologie."
 *   node scripts/generate-persona-preview.mjs oriane
 *
 * Requires:
 *   - ELEVENLABS_API_KEY in .env.local
 *   - SUPABASE_CLOUD_SERVICE_ROLE_KEY in .env.local
 *   - SUPABASE_CLOUD_URL (or NEXT_PUBLIC_SUPABASE_URL) in .env.local
 *   - The persona must already have voice_profile.voiceId in DB
 *
 * What it does:
 *   1. Loads the persona's voice_profile from agents table
 *   2. Generates preview audio via ElevenLabs
 *   3. Saves a local copy to tmp/<agent_name>-preview.mp3
 *   4. Uploads to voice-cache/previews/<agent_name>.mp3 (upsert: true)
 *
 * Default preview text per persona (overridable by 2nd CLI arg):
 *   - jade   : phrase complète de présentation (étudiante en master de droit)
 *   - theo   : phrase complète de présentation (licence socio, accessible)
 *   - oriane : phrase complète de présentation (chargée RH, réflexive)
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
const BUCKET = "voice-cache";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

// Default preview texts. "Jad" (not "Jade") in Jade's text helps Victoria
// pronounce it in French. Adjust per voice as needed.
const DEFAULT_PREVIEW_TEXTS = {
  jade: [
    "Bonjour, je m'appelle Jad.",
    "J'ai vingt-six ans, je suis en master de droit.",
    "Je lis tout ce qui sort sur ces outils.",
    "Le vrai problème, c'est que personne ne réfléchit vraiment à ce qu'il fait avec.",
  ].join(" "),

  theo: [
    "Salut, moi c'est Théo, j'ai vingt-et-un ans.",
    "Je suis en licence de sociologie.",
    "Honnêtement, j'y connais pas grand-chose en IA.",
    "Je l'ai utilisé pour résumer des cours, c'est à peu près tout.",
  ].join(" "),

  oriane: [
    "Bonjour, moi c'est Oriane.",
    "J'ai vingt-deux ans, je suis en master 1 de sciences sociales.",
    "Je l'utilise, en fait, mais c'est ambivalent quoi.",
    "Je passe mon temps à reformuler ce qu'il sort pour que ça me ressemble.",
  ].join(" "),
};

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
  const agentName = process.argv[2]?.toLowerCase();
  if (!agentName) {
    console.error("ERROR: missing <agent_name> argument.");
    console.error("Usage: node scripts/generate-persona-preview.mjs <agent_name> [preview_text]");
    process.exit(1);
  }

  const customText = process.argv[3];

  const env = readEnvLocal();
  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ERROR: ELEVENLABS_API_KEY not found in .env.local");
    process.exit(1);
  }

  const supabaseUrl =
    env.SUPABASE_CLOUD_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_SERVICE_URL;
  const serviceRoleKey =
    env.SUPABASE_CLOUD_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "ERROR: Supabase URL or SERVICE_ROLE_KEY missing in .env.local (need cloud values for this script)"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Using Supabase URL: ${supabaseUrl}`);
  console.log(`Loading ${agentName}'s voice_profile from DB...`);
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, agent_name, voice_profile")
    .eq("agent_name", agentName)
    .maybeSingle();

  if (agentError) {
    console.error("ERROR loading agent:", agentError.message);
    process.exit(1);
  }
  if (!agent) {
    console.error(`ERROR: agent "${agentName}" not found in DB`);
    process.exit(1);
  }
  if (!agent.voice_profile?.voiceId) {
    console.error(
      `ERROR: ${agentName} has no voice_profile yet. Apply the UPDATE SQL first.`
    );
    process.exit(1);
  }

  console.log(`  voiceId: ${agent.voice_profile.voiceId}`);
  console.log(`  displayName: ${agent.voice_profile.displayName ?? "(none)"}`);

  const text = customText ?? DEFAULT_PREVIEW_TEXTS[agentName];
  if (!text) {
    console.error(
      `ERROR: no default preview text for "${agentName}". Pass one as 2nd CLI argument.`
    );
    process.exit(1);
  }

  console.log(`\nGenerating preview audio (${text.length} chars)...`);
  const audio = await generateAudio(apiKey, agent.voice_profile, text);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const localOutput = join(OUTPUT_DIR, `${agentName}-preview.mp3`);
  writeFileSync(localOutput, audio);
  console.log(`  Local copy saved: ${localOutput}`);

  const previewPath = `previews/${agentName}.mp3`;
  console.log(`\nUploading to Supabase Storage: ${BUCKET}/${previewPath} ...`);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(previewPath, audio, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError.message);
    process.exit(1);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(previewPath);

  console.log(`\nDone.`);
  console.log(`  Public URL: ${publicUrlData.publicUrl}`);
  console.log(`\nTo verify:`);
  console.log(`  1. Double-click ${localOutput} to listen locally`);
  console.log(`  2. Or open ${publicUrlData.publicUrl} in a browser`);
}

main().catch((error) => {
  console.error("\nFailed:", error.message);
  process.exit(1);
});
