import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { VOICE_CACHE_BUCKET } from "./types";

/**
 * Deterministic cache key for a (voiceId, text) pair.
 * Identical inputs always produce the same key → same audio is generated only once.
 */
export function computeCacheKey(voiceId: string, text: string): string {
  return createHash("sha256").update(`${voiceId}\n${text}`).digest("hex");
}

export function buildTtsCachePath(voiceId: string, hash: string): string {
  return `tts/${voiceId}/${hash}.mp3`;
}

/**
 * Look up a cached audio file in the voice-cache bucket.
 * Returns its public URL if found, null otherwise.
 */
export async function getCachedAudioUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string | null> {
  const lastSlash = path.lastIndexOf("/");
  const folder = lastSlash >= 0 ? path.slice(0, lastSlash) : "";
  const filename = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;

  const { data, error } = await supabase.storage
    .from(VOICE_CACHE_BUCKET)
    .list(folder, { search: filename, limit: 1 });

  if (error) {
    throw new Error(`Failed to query voice cache: ${error.message}`);
  }

  const found = (data ?? []).some((entry) => entry.name === filename);
  if (!found) return null;

  return supabase.storage.from(VOICE_CACHE_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

/**
 * Upload generated audio bytes to the cache and return its public URL.
 */
export async function uploadAudioToCache(
  supabase: SupabaseClient,
  path: string,
  audio: ArrayBuffer
): Promise<string> {
  const { error } = await supabase.storage
    .from(VOICE_CACHE_BUCKET)
    .upload(path, audio, {
      contentType: "audio/mpeg",
      upsert: false,
    });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(`Failed to upload audio to cache: ${error.message}`);
  }

  return supabase.storage.from(VOICE_CACHE_BUCKET).getPublicUrl(path).data
    .publicUrl;
}
