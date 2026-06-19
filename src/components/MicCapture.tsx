"use client";

/**
 * MicCapture — bouton micro avec visualisation d'onde sonore temps réel.
 *
 * Phase 3 / Morceau 1 : capture audio uniquement. Pas encore de transcription
 * ni d'envoi au serveur. L'audio enregistré est passé au callback `onRecorded`
 * sous forme de Blob (webm/opus) avec la durée en ms.
 *
 * États : idle → recording → stopped → idle
 *   - idle      : bouton micro discret
 *   - recording : panneau étendu avec bars audio + timer + stop/cancel
 *   - stopped   : aperçu de la durée enregistrée + boutons "réenregistrer" ou "envoyer"
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Mic, MicOff, RotateCcw, Send, Square, X } from "lucide-react";

type RecordingState = "idle" | "recording" | "stopped";

interface RecordedAudio {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

interface MicCaptureProps {
  /** Appelé quand l'utilisateur valide son enregistrement (clic "envoyer"). */
  onRecorded?: (audio: RecordedAudio) => void;
  /** Désactive le bouton micro (ex : pendant que le persona parle). */
  disabled?: boolean;
  /** Limite de durée max d'enregistrement, par défaut 60s. */
  maxDurationMs?: number;
}

const BAR_COUNT = 24;
const DEFAULT_MAX_DURATION_MS = 60_000;

export function MicCapture({
  onRecorded,
  disabled = false,
  maxDurationMs = DEFAULT_MAX_DURATION_MS,
}: MicCaptureProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(
    () => Array(BAR_COUNT).fill(0)
  );
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<RecordedAudio | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalDurationRef = useRef(0);
  const onStopResolveRef = useRef<(() => void) | null>(null);

  const stopAnimations = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (durationIntervalRef.current !== null) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const fullReset = useCallback(() => {
    stopAnimations();
    releaseStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setAudioLevels(Array(BAR_COUNT).fill(0));
    setDurationMs(0);
    finalDurationRef.current = 0;
    setRecorded(null);
  }, [stopAnimations, releaseStream]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopAnimations();
      releaseStream();
    };
  }, [stopAnimations, releaseStream]);

  const updateAudioLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Map the frequency data into BAR_COUNT buckets, normalize 0-1.
    const bucketSize = Math.max(1, Math.floor(dataArray.length / BAR_COUNT));
    const levels: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      for (let j = 0; j < bucketSize; j++) {
        sum += dataArray[i * bucketSize + j] ?? 0;
      }
      const avg = sum / bucketSize / 255;
      // Slight curve to make low-level activity more visible.
      levels.push(Math.min(1, avg * 2.2));
    }
    setAudioLevels(levels);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, []);

  const pickMimeType = (): string => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    for (const t of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return "audio/webm";
  };

  const startRecording = async () => {
    setError(null);
    setRecorded(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio analysis pipeline.
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;
      source.connect(analyser);

      const mimeType = pickMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecorded({ blob, durationMs: finalDurationRef.current, mimeType });
        setState("stopped");
        releaseStream();
        // Signal that the recorder has finished flushing.
        onStopResolveRef.current?.();
        onStopResolveRef.current = null;
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setState("recording");
      setDurationMs(0);

      // Tick the duration counter every ~100ms.
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDurationMs(elapsed);
        if (elapsed >= maxDurationMs) {
          stopRecording();
        }
      }, 100);

      updateAudioLevels();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d'accéder au micro";
      // Permission denied is the most common case — make the wording friendly.
      const friendly =
        message.toLowerCase().includes("permission") ||
        message.toLowerCase().includes("denied") ||
        message.toLowerCase().includes("notallowed")
          ? "Permission micro refusée. Autorisez l'accès depuis votre navigateur."
          : message;
      setError(friendly);
      fullReset();
      setState("idle");
    }
  };

  const stopRecording = () => {
    stopAnimations();
    finalDurationRef.current = Date.now() - startTimeRef.current;
    setDurationMs(finalDurationRef.current);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      // Should not happen, but make sure we end up in a sane state.
      releaseStream();
      setState("stopped");
    }
  };

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      // Discard the onstop result by clearing chunks before it fires.
      chunksRef.current = [];
      mediaRecorderRef.current.stop();
    }
    fullReset();
    setState("idle");
  };

  const restartRecording = () => {
    fullReset();
    void startRecording();
  };

  const sendRecording = () => {
    if (!recorded) return;
    onRecorded?.(recorded);
    fullReset();
    setState("idle");
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // ─── Idle state ────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <VStack alignItems="stretch" gap={1.5}>
        {error ? (
          <HStack
            gap={2}
            paddingX={3}
            paddingY={2}
            borderRadius="lg"
            backgroundColor="red.50"
            borderWidth="1px"
            borderColor="red.200"
          >
            <MicOff size={14} color="var(--chakra-colors-red-700)" />
            <Text fontSize="xs" color="red.700" flex={1}>
              {error}
            </Text>
            <IconButton
              aria-label="Fermer"
              size="2xs"
              variant="ghost"
              colorPalette="red"
              onClick={() => setError(null)}
            >
              <X size={12} />
            </IconButton>
          </HStack>
        ) : null}
        <IconButton
          aria-label="Parler au persona"
          title="Parler au persona"
          size="md"
          variant="ghost"
          borderRadius="full"
          onClick={startRecording}
          disabled={disabled}
          colorPalette="purple"
          _hover={{
            backgroundColor: "var(--color-accent-muted)",
            color: "var(--color-accent)",
          }}
        >
          <Mic size={20} />
        </IconButton>
      </VStack>
    );
  }

  // ─── Recording state ───────────────────────────────────────────────
  if (state === "recording") {
    const reachedLimit = durationMs >= maxDurationMs - 500;
    return (
      <HStack
        gap={3}
        paddingX={3}
        paddingY={2}
        borderRadius="full"
        backgroundColor="var(--color-accent-soft)"
        borderWidth="1px"
        borderColor="var(--color-accent-border)"
        boxShadow="0 4px 14px rgba(109,93,246,0.18)"
      >
        {/* Pulsing recording dot */}
        <Box
          width="10px"
          height="10px"
          borderRadius="full"
          backgroundColor="#ef4444"
          flexShrink={0}
          style={{ animation: "voicePlayerSpin 1.4s ease-in-out infinite alternate" }}
        />

        {/* Waveform bars */}
        <HStack gap="3px" alignItems="center" height="36px" minW="180px">
          {audioLevels.map((level, i) => (
            <Box
              key={i}
              width="3px"
              height={`${Math.max(4, level * 32)}px`}
              backgroundColor="var(--color-accent)"
              borderRadius="full"
              opacity={0.65 + level * 0.35}
              style={{ transition: "height 60ms ease-out, opacity 60ms ease-out" }}
            />
          ))}
        </HStack>

        {/* Timer */}
        <Text
          fontSize="sm"
          fontWeight="700"
          color={reachedLimit ? "red.600" : "var(--color-accent)"}
          minW="48px"
          textAlign="center"
          fontVariantNumeric="tabular-nums"
        >
          {formatDuration(durationMs)}
        </Text>

        {/* Stop = validate the recording */}
        <IconButton
          aria-label="Arrêter et envoyer"
          title="Arrêter et envoyer"
          size="sm"
          variant="solid"
          colorPalette="purple"
          borderRadius="full"
          onClick={stopRecording}
        >
          <Square size={14} fill="currentColor" />
        </IconButton>

        {/* Cancel */}
        <IconButton
          aria-label="Annuler"
          title="Annuler"
          size="sm"
          variant="ghost"
          colorPalette="purple"
          borderRadius="full"
          onClick={cancelRecording}
        >
          <X size={14} />
        </IconButton>
      </HStack>
    );
  }

  // ─── Stopped / preview state ───────────────────────────────────────
  return (
    <HStack
      gap={3}
      paddingX={3}
      paddingY={2}
      borderRadius="full"
      backgroundColor="var(--color-surface)"
      borderWidth="1px"
      borderColor="var(--color-border)"
      boxShadow="0 2px 8px rgba(26,26,46,0.06)"
    >
      <Box
        width="8px"
        height="8px"
        borderRadius="full"
        backgroundColor="#10b981"
        flexShrink={0}
      />
      <Text fontSize="sm" color="var(--color-text-primary)" fontWeight="500">
        Enregistrement
      </Text>
      <Text
        fontSize="sm"
        fontWeight="700"
        color="var(--color-accent)"
        minW="48px"
        textAlign="center"
        fontVariantNumeric="tabular-nums"
      >
        {formatDuration(durationMs)}
      </Text>

      <IconButton
        aria-label="Recommencer"
        title="Recommencer"
        size="sm"
        variant="ghost"
        colorPalette="purple"
        borderRadius="full"
        onClick={restartRecording}
      >
        <RotateCcw size={14} />
      </IconButton>

      <IconButton
        aria-label="Envoyer au persona"
        title="Envoyer au persona"
        size="sm"
        variant="solid"
        colorPalette="purple"
        borderRadius="full"
        onClick={sendRecording}
      >
        <Send size={14} />
      </IconButton>
    </HStack>
  );
}
