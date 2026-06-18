/**
 * ElevenLabs voice catalog fetcher with in-memory cache.
 *
 * Strategy:
 *  - Fetch the shared voice library (community + premade voices).
 *  - Keep an in-memory cache for ~24h so we don't hammer ElevenLabs on every
 *    persona creation. The catalog rarely changes meaningfully.
 *  - Normalize each voice into our CatalogVoice shape.
 *
 * NOTE: ElevenLabs returns voices in pages via the `next_page_token` field
 * (or `last_sort_id` depending on endpoint). We fetch up to a configurable
 * cap (default 500) to keep memory reasonable while still giving the matcher
 * enough variety. The library has thousands of voices but the vast majority
 * are not useful for our use case.
 */

import type { CatalogVoice } from "./types";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_VOICES_TO_FETCH = 500;
const PAGE_SIZE = 100;

interface CacheEntry {
  voices: CatalogVoice[];
  fetchedAt: number;
  language: string;
}

const cache = new Map<string, CacheEntry>();

interface SharedVoiceApiItem {
  voice_id?: string;
  name?: string;
  category?: string;
  description?: string;
  preview_url?: string;
  language?: string;
  gender?: string;
  age?: string;
  accent?: string;
  use_case?: string;
  labels?: Record<string, string>;
  // Some endpoints expose attributes nested differently
  attributes?: Record<string, string>;
}

function normalize(raw: SharedVoiceApiItem): CatalogVoice | null {
  const voiceId = raw.voice_id?.trim();
  if (!voiceId) return null;
  const labels = { ...(raw.labels ?? {}), ...(raw.attributes ?? {}) };
  return {
    voiceId,
    name: raw.name?.trim() || "Sans nom",
    category: raw.category,
    description: raw.description,
    previewUrl: raw.preview_url,
    language: raw.language ?? labels.language,
    gender: raw.gender ?? labels.gender,
    age: raw.age ?? labels.age,
    accent: raw.accent ?? labels.accent,
    useCase: raw.use_case ?? labels.use_case ?? labels.description,
    labels,
  };
}

async function fetchSharedVoicesPage(
  apiKey: string,
  language: string,
  pageToken?: string
): Promise<{ items: SharedVoiceApiItem[]; nextPageToken?: string }> {
  const params = new URLSearchParams();
  params.set("page_size", String(PAGE_SIZE));
  if (language) params.set("language", language);
  if (pageToken) params.set("page_token", pageToken);

  const url = `${ELEVENLABS_API_BASE}/shared-voices?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs shared-voices failed (${response.status}): ${detail.slice(0, 300)}`
    );
  }

  const json = (await response.json()) as {
    voices?: SharedVoiceApiItem[];
    next_page_token?: string;
    last_sort_id?: string;
    has_more?: boolean;
  };

  return {
    items: json.voices ?? [],
    nextPageToken: json.has_more ? (json.next_page_token ?? json.last_sort_id) : undefined,
  };
}

/**
 * Fetch the voice catalog (cached). Filters at fetch time by the given
 * `language` (defaults to "fr") to keep the result set focused.
 */
export async function getVoiceCatalog(
  apiKey: string,
  language: string = "fr"
): Promise<CatalogVoice[]> {
  const cacheKey = language;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.voices;
  }

  const collected: CatalogVoice[] = [];
  let pageToken: string | undefined;

  while (collected.length < MAX_VOICES_TO_FETCH) {
    const { items, nextPageToken } = await fetchSharedVoicesPage(
      apiKey,
      language,
      pageToken
    );
    for (const item of items) {
      const normalized = normalize(item);
      if (normalized) collected.push(normalized);
      if (collected.length >= MAX_VOICES_TO_FETCH) break;
    }
    if (!nextPageToken || items.length === 0) break;
    pageToken = nextPageToken;
  }

  cache.set(cacheKey, {
    voices: collected,
    fetchedAt: Date.now(),
    language,
  });

  return collected;
}

/** Force-invalidate the catalog cache (useful for admin actions). */
export function invalidateCatalogCache(language?: string): void {
  if (language) {
    cache.delete(language);
  } else {
    cache.clear();
  }
}
