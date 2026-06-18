"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HStack, IconButton, Text } from "@chakra-ui/react";
import { Loader2, Pause, Play, VolumeX } from "lucide-react";
import type { TTSResponseBody } from "@/lib/voice/types";

type PreviewProps = {
  mode: "preview";
  audioUrl: string;
};

type TtsProps = {
  mode: "tts";
  /** Provide either agentId (looks up voice_profile in DB) OR voiceId (audition mode). */
  agentId?: string;
  voiceId?: string;
  text: string;
};

type CommonProps = {
  label?: string;
  size?: "2xs" | "xs" | "sm" | "md";
  variant?: "ghost" | "subtle" | "solid" | "outline";
  ariaLabel?: string;
  /** Auto-trigger playback once when mounted (used by autoplay toggle). */
  autoplay?: boolean;
};

export type VoicePlayerProps = (PreviewProps | TtsProps) & CommonProps;

const iconSizeFor = (size: CommonProps["size"]) => {
  switch (size) {
    case "2xs":
      return 11;
    case "xs":
      return 12;
    case "md":
      return 16;
    default:
      return 14;
  }
};

export function VoicePlayer(props: VoicePlayerProps) {
  const {
    label,
    size = "sm",
    variant = "subtle",
    ariaLabel,
    autoplay = false,
  } = props;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedUrlRef = useRef<string | null>(
    props.mode === "preview" ? props.audioUrl : null
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playKey =
    props.mode === "preview"
      ? `preview:${props.audioUrl}`
      : `tts:${props.agentId ?? props.voiceId ?? ""}:${props.text}`;

  // Reset state whenever the audio source identity changes.
  useEffect(() => {
    cachedUrlRef.current =
      props.mode === "preview" ? props.audioUrl : null;
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const resolveUrl = useCallback(async (): Promise<string> => {
    if (cachedUrlRef.current) return cachedUrlRef.current;
    if (props.mode !== "tts") {
      throw new Error("Audio URL missing");
    }
    if (!props.agentId && !props.voiceId) {
      throw new Error("VoicePlayer tts mode requires agentId or voiceId");
    }
    const body: Record<string, string> = { text: props.text };
    if (props.agentId) body.agentId = props.agentId;
    if (props.voiceId) body.voiceId = props.voiceId;
    const response = await fetch("/api/voice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(
        detail?.error ?? `Lecture indisponible (${response.status})`
      );
    }
    const data = (await response.json()) as TTSResponseBody;
    cachedUrlRef.current = data.audioUrl;
    return data.audioUrl;
  }, [props]);

  const play = useCallback(async () => {
    setError(null);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      return;
    }
    try {
      if (!cachedUrlRef.current) {
        setIsLoading(true);
      }
      const url = await resolveUrl();
      if (!audioRef.current) {
        const audio = new Audio(url);
        audio.addEventListener("play", () => setIsPlaying(true));
        audio.addEventListener("pause", () => setIsPlaying(false));
        audio.addEventListener("ended", () => setIsPlaying(false));
        audio.addEventListener("error", () => {
          setError("Lecture impossible");
          setIsPlaying(false);
        });
        audioRef.current = audio;
      }
      await audioRef.current.play();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inattendue";
      setError(message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, resolveUrl]);

  // Optional autoplay (used by the chat autoplay toggle).
  const autoplayedRef = useRef(false);
  useEffect(() => {
    if (autoplay && !autoplayedRef.current) {
      autoplayedRef.current = true;
      void play();
    }
    if (!autoplay) {
      autoplayedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, playKey]);

  const iconSize = iconSizeFor(size);
  const computedAriaLabel =
    ariaLabel ??
    (error
      ? "Voix indisponible"
      : isLoading
        ? "Génération en cours"
        : isPlaying
          ? "Pause"
          : "Écouter la voix");

  return (
    <HStack gap={1.5} alignItems="center">
      <IconButton
        aria-label={computedAriaLabel}
        size={size}
        variant={variant}
        borderRadius="full"
        onClick={play}
        disabled={!!error}
        title={error ?? undefined}
        colorPalette="purple"
      >
        {error ? (
          <VolumeX size={iconSize} />
        ) : isLoading ? (
          <Loader2 size={iconSize} className="voice-player-spin" />
        ) : isPlaying ? (
          <Pause size={iconSize} />
        ) : (
          <Play size={iconSize} />
        )}
      </IconButton>
      {label ? (
        <Text fontSize="xs" color="var(--color-text-muted)">
          {error ?? label}
        </Text>
      ) : null}
    </HStack>
  );
}
