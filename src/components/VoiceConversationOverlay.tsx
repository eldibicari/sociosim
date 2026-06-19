"use client";

/**
 * VoiceConversationOverlay — mode "vrai entretien" fullscreen.
 *
 * Phase 3 / Morceau 4 : coquille statique. L'utilisateur appuie sur un gros
 * bouton micro, parle, relâche, ça envoie la transcription au chat. Plus
 * tard (Morceau 5) on ajoutera la boucle auto record/écoute ; au Morceau 6
 * le streaming TTS qui jouera la voix de Jade en direct dans cet overlay.
 *
 * États visuels :
 *   - idle           : silhouette calme, "Appuyez et parlez"
 *   - recording      : barres audio dansent, "Vous parlez…"
 *   - transcribing   : pulsation, "Transcription…"
 *   - personaThinking: silhouette pulse, "Persona réfléchit…"
 *   - personaSpeaking: halo + barres réactives, "Persona parle…"
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { Mic, Repeat, Square, X } from "lucide-react";
import { PersonaSilhouette } from "@/app/personnas/components/PersonaSilhouette";
import { getPersonaVisual } from "@/lib/personaVisuals";
import type { STTResponseBody, TTSResponseBody } from "@/lib/voice/types";
import type { UIMessage } from "@/types/ui";

type ConversationState =
  | "idle"
  | "recording"
  | "transcribing"
  | "personaThinking"
  | "personaSpeaking";

interface VoiceConversationOverlayProps {
  open: boolean;
  onClose: () => void;
  agentId: string | null;
  agentName: string | null;
  /** Whether the persona has voice configured. */
  agentHasVoice: boolean;
  /** True while the persona's text response is being streamed back. */
  isStreaming: boolean;
  /** Hand the transcribed user text to the existing chat handler. */
  onSendMessage: (text: string) => void;
  /** Live chat messages. Used to auto-play Jade's reply via TTS. */
  messages: UIMessage[];
}

const BAR_COUNT = 32;
const MAX_DURATION_MS = 180_000;

export function VoiceConversationOverlay({
  open,
  onClose,
  agentId,
  agentName,
  agentHasVoice,
  isStreaming,
  onSendMessage,
  messages,
}: VoiceConversationOverlayProps) {
  const [state, setState] = useState<ConversationState>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(() =>
    Array(BAR_COUNT).fill(0)
  );
  const [error, setError] = useState<string | null>(null);
  const [autoLoop, setAutoLoop] = useState(true);

  // Ref-copy so the audio "ended" listener (captured at setup time) can read
  // the LATEST toggle value without resubscribing.
  const autoLoopRef = useRef(true);
  useEffect(() => {
    autoLoopRef.current = autoLoop;
  }, [autoLoop]);

  // Ref to the open-state for the same reason (event closures).
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Used to schedule the auto-restart timeout so we can cancel it on
  // unmount or when the overlay closes.
  const autoRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Forward reference to startRecording so the audio.ended listener
  // (captured at setup time) can invoke the latest closure.
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback machinery — separate from the recording pipeline.
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const lastPlayedMessageIdRef = useRef<string | null>(null);
  const playbackAnimationFrameRef = useRef<number | null>(null);

  const visual = agentName ? getPersonaVisual(agentName) : null;
  const displayName = agentName
    ? agentName.charAt(0).toUpperCase() + agentName.slice(1)
    : "Persona";

  // ─── Cleanup ────────────────────────────────────────────────────────
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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const releasePlayback = useCallback(() => {
    if (playbackAnimationFrameRef.current !== null) {
      cancelAnimationFrame(playbackAnimationFrameRef.current);
      playbackAnimationFrameRef.current = null;
    }
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.src = "";
      playbackAudioRef.current = null;
    }
    if (
      playbackContextRef.current &&
      playbackContextRef.current.state !== "closed"
    ) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
    playbackAnalyserRef.current = null;
  }, []);

  // Reset every time the overlay opens/closes.
  useEffect(() => {
    if (!open) {
      stopAnimations();
      releaseStream();
      releasePlayback();
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current);
        autoRestartTimeoutRef.current = null;
      }
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      lastPlayedMessageIdRef.current = null;
      setState("idle");
      setDurationMs(0);
      setAudioLevels(Array(BAR_COUNT).fill(0));
      setError(null);
    } else {
      // When opening, seed "lastPlayed" with whatever the latest assistant
      // message is, so we DON'T auto-play history when the user opens the
      // overlay. Only NEW messages will trigger playback.
      const latestAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant" && !m.isStreaming);
      lastPlayedMessageIdRef.current = latestAssistant?.id ?? null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Final cleanup on unmount.
  useEffect(
    () => () => {
      stopAnimations();
      releaseStream();
      releasePlayback();
    },
    [stopAnimations, releaseStream, releasePlayback]
  );

  // Reflect the streaming state from the chat into the visual state machine.
  // While Jade is still streaming text, we keep "personaThinking". When the
  // streaming finishes, the next useEffect picks up the new message and
  // triggers TTS playback ("personaSpeaking").
  useEffect(() => {
    if (!open) return;
    if (
      isStreaming &&
      state !== "personaSpeaking" &&
      state !== "personaThinking"
    ) {
      setState("personaThinking");
    }
  }, [isStreaming, open, state]);

  // ─── Audio level visualization ─────────────────────────────────────
  const sampleAnalyser = (analyser: AnalyserNode, boost = 2.3): number[] => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const bucketSize = Math.max(1, Math.floor(dataArray.length / BAR_COUNT));
    const levels: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      for (let j = 0; j < bucketSize; j++) {
        sum += dataArray[i * bucketSize + j] ?? 0;
      }
      const avg = sum / bucketSize / 255;
      levels.push(Math.min(1, avg * boost));
    }
    return levels;
  };

  const updateAudioLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    setAudioLevels(sampleAnalyser(analyser));
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, []);

  const updatePlaybackLevels = useCallback(() => {
    const analyser = playbackAnalyserRef.current;
    if (!analyser) return;
    setAudioLevels(sampleAnalyser(analyser, 2.6));
    playbackAnimationFrameRef.current = requestAnimationFrame(updatePlaybackLevels);
  }, []);

  // ─── Persona TTS playback ──────────────────────────────────────────
  const playPersonaMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!agentId) return;
      lastPlayedMessageIdRef.current = messageId;
      setError(null);
      setState("personaSpeaking");

      try {
        const response = await fetch("/api/voice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, text }),
        });
        if (!response.ok) {
          const detail = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            detail?.error ?? `Voix indisponible (${response.status})`
          );
        }
        const data = (await response.json()) as TTSResponseBody;

        const audio = new Audio(data.audioUrl);
        audio.crossOrigin = "anonymous";
        playbackAudioRef.current = audio;

        // Wire the playing audio into an analyser for the waveform.
        const ctx = new AudioContext();
        playbackContextRef.current = ctx;
        const sourceNode = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        sourceNode.connect(analyser);
        analyser.connect(ctx.destination);
        playbackAnalyserRef.current = analyser;

        audio.addEventListener("ended", () => {
          releasePlayback();
          setAudioLevels(Array(BAR_COUNT).fill(0));
          setState("idle");
          // Auto-restart recording for hands-free conversation.
          if (autoLoopRef.current && openRef.current) {
            if (autoRestartTimeoutRef.current) {
              clearTimeout(autoRestartTimeoutRef.current);
            }
            autoRestartTimeoutRef.current = setTimeout(() => {
              autoRestartTimeoutRef.current = null;
              if (openRef.current && autoLoopRef.current) {
                void startRecordingRef.current?.();
              }
            }, 600);
          }
        });
        audio.addEventListener("error", () => {
          releasePlayback();
          setError("Lecture de la voix échouée");
          setState("idle");
        });

        await audio.play();
        updatePlaybackLevels();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Voix indisponible";
        releasePlayback();
        setError(message);
        setState("idle");
      }
    },
    [agentId, releasePlayback, updatePlaybackLevels]
  );

  // Detect the persona's latest reply and play it.
  useEffect(() => {
    if (!open) return;
    if (!agentHasVoice || !agentId) return;
    if (state === "recording" || state === "transcribing") return;
    if (state === "personaSpeaking") return;

    const latestAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.isStreaming);
    if (!latestAssistant) return;
    if (!latestAssistant.text?.trim()) return;
    if (latestAssistant.id === lastPlayedMessageIdRef.current) return;

    void playPersonaMessage(latestAssistant.id, latestAssistant.text);
  }, [messages, open, agentId, agentHasVoice, state, playPersonaMessage]);

  // ─── Recording lifecycle ───────────────────────────────────────────
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stopAnimations();
        releaseStream();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        // Skip transcription if the user explicitly cancelled.
        if (blob.size === 0) {
          setState("idle");
          return;
        }
        setState("transcribing");
        try {
          const form = new FormData();
          const extension = mimeType.includes("mp4")
            ? "mp4"
            : mimeType.includes("ogg")
              ? "ogg"
              : "webm";
          form.append("file", blob, `voice.${extension}`);

          const response = await fetch("/api/voice/stt", {
            method: "POST",
            body: form,
          });
          if (!response.ok) {
            const detail = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;
            throw new Error(
              detail?.error ?? `Transcription échouée (${response.status})`
            );
          }
          const data = (await response.json()) as STTResponseBody;
          const text = data.text.trim();
          if (!text) {
            setError("Aucun texte capté. Réessayez en parlant plus fort.");
            setState("idle");
            return;
          }
          onSendMessage(text);
          // The "personaThinking" state will be set by the isStreaming effect.
          setState("personaThinking");
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Erreur inconnue";
          setError(message);
          setState("idle");
        }
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setState("recording");
      setDurationMs(0);
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDurationMs(elapsed);
        if (elapsed >= MAX_DURATION_MS) {
          stopRecording();
        }
      }, 100);

      updateAudioLevels();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d'accéder au micro";
      const friendly =
        message.toLowerCase().includes("permission") ||
        message.toLowerCase().includes("denied") ||
        message.toLowerCase().includes("notallowed")
          ? "Permission micro refusée. Autorisez l'accès depuis votre navigateur."
          : message;
      setError(friendly);
      stopAnimations();
      releaseStream();
      setState("idle");
    }
  };

  // Keep the ref pointing at the latest startRecording closure so the
  // audio.ended listener (set up earlier in time) can reach it.
  startRecordingRef.current = startRecording;

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      releaseStream();
      setState("idle");
    }
  };

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      chunksRef.current = []; // Make sure onstop discards the take.
      mediaRecorderRef.current.stop();
    }
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
      autoRestartTimeoutRef.current = null;
    }
    stopAnimations();
    releaseStream();
    setState("idle");
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!open) return null;

  const stateLabel: Record<ConversationState, string> = {
    idle: agentHasVoice
      ? `Appuyez et parlez à ${displayName}`
      : `${displayName} n'a pas encore de voix — vous pouvez lui parler quand même`,
    recording: "Vous parlez…",
    transcribing: "Transcription…",
    personaThinking: `${displayName} réfléchit…`,
    personaSpeaking: `${displayName} parle…`,
  };

  const stateColor: Record<ConversationState, string> = {
    idle: "var(--color-text-muted)",
    recording: "var(--color-accent)",
    transcribing: "var(--color-accent)",
    personaThinking: "var(--color-accent)",
    personaSpeaking: visual?.accent ?? "var(--color-accent)",
  };

  const showWaveform = state === "recording" || state === "personaSpeaking";
  const haloIntensity =
    state === "recording" || state === "personaSpeaking"
      ? 1
      : state === "personaThinking"
        ? 0.6
        : 0.25;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={100}
      backgroundColor="rgba(15,23,42,0.92)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      backdropFilter="blur(12px)"
    >
      {/* Top-right controls */}
      <Box position="absolute" top={4} right={4}>
        <HStack gap={2}>
          <IconButton
            aria-label={
              autoLoop
                ? "Désactiver la boucle automatique"
                : "Activer la boucle automatique"
            }
            title={
              autoLoop
                ? "Boucle auto : ON — le micro se réactive après Jade"
                : "Boucle auto : OFF — cliquez le micro à chaque tour"
            }
            size="md"
            variant="ghost"
            borderRadius="full"
            color={autoLoop ? "var(--color-accent)" : "rgba(255,255,255,0.6)"}
            _hover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            onClick={() => {
              setAutoLoop((prev) => {
                const next = !prev;
                if (!next && autoRestartTimeoutRef.current) {
                  clearTimeout(autoRestartTimeoutRef.current);
                  autoRestartTimeoutRef.current = null;
                }
                return next;
              });
            }}
          >
            <Repeat size={18} />
          </IconButton>
          <IconButton
            aria-label="Quitter le mode conversation"
            size="md"
            variant="ghost"
            borderRadius="full"
            color="white"
            _hover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            onClick={() => {
              cancelRecording();
              onClose();
            }}
          >
            <X size={20} />
          </IconButton>
        </HStack>
      </Box>

      <VStack gap={10} maxWidth="540px" width="100%" px={6}>
        {/* Silhouette + halo */}
        <Box position="relative" width="240px" height="240px">
          {/* Halo */}
          <Box
            position="absolute"
            inset={0}
            borderRadius="full"
            background={
              visual
                ? `radial-gradient(circle, ${visual.accent}80 0%, ${visual.color2}40 35%, transparent 70%)`
                : "radial-gradient(circle, rgba(109,93,246,0.6) 0%, transparent 70%)"
            }
            opacity={haloIntensity}
            style={{
              transition: "opacity 250ms ease",
              animation:
                state === "personaThinking"
                  ? "voicePlayerSpin 2.4s ease-in-out infinite alternate"
                  : undefined,
              filter: "blur(28px)",
              transform: "scale(1.15)",
            }}
          />
          {/* Silhouette */}
          <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center">
            {visual ? (
              <PersonaSilhouette
                shapeIndex={visual.shapeIndex}
                color1={visual.color1}
                color2={visual.color2}
                uid={agentId ?? displayName}
                size={200}
              />
            ) : (
              <Box
                width="200px"
                height="200px"
                borderRadius="full"
                background="linear-gradient(135deg, #6D5DF6, #8b5cf6)"
              />
            )}
          </Box>
        </Box>

        {/* Persona name */}
        <VStack gap={1}>
          <Text fontSize="2xl" fontWeight="800" color="white" letterSpacing="-0.02em">
            {displayName}
          </Text>
          <Text fontSize="sm" color={stateColor[state]} fontWeight="600">
            {stateLabel[state]}
          </Text>
        </VStack>

        {/* Audio visualization (when active) */}
        {showWaveform ? (
          <HStack gap="4px" alignItems="center" height="56px" minH="56px">
            {audioLevels.map((level, i) => (
              <Box
                key={i}
                width="4px"
                height={`${Math.max(6, level * 48)}px`}
                backgroundColor={state === "personaSpeaking" ? visual?.accent ?? "var(--color-accent)" : "var(--color-accent)"}
                borderRadius="full"
                opacity={0.6 + level * 0.4}
                style={{ transition: "height 60ms ease-out, opacity 60ms ease-out" }}
              />
            ))}
          </HStack>
        ) : (
          <Box height="56px" />
        )}

        {/* Timer when recording */}
        {state === "recording" ? (
          <Text fontSize="sm" color="white" fontWeight="600" fontVariantNumeric="tabular-nums">
            {formatDuration(durationMs)}
          </Text>
        ) : null}

        {/* Error */}
        {error ? (
          <Box
            paddingX={4}
            paddingY={2}
            borderRadius="lg"
            backgroundColor="rgba(239,68,68,0.15)"
            borderWidth="1px"
            borderColor="rgba(239,68,68,0.4)"
          >
            <Text fontSize="xs" color="#fca5a5">
              {error}
            </Text>
          </Box>
        ) : null}

        {/* Action button */}
        <HStack gap={4}>
          {state === "idle" ? (
            <IconButton
              aria-label="Commencer à parler"
              size="2xl"
              borderRadius="full"
              colorPalette="purple"
              variant="solid"
              width="84px"
              height="84px"
              onClick={startRecording}
              disabled={isStreaming}
            >
              <Mic size={32} />
            </IconButton>
          ) : null}

          {state === "recording" ? (
            <>
              <IconButton
                aria-label="Arrêter et envoyer"
                size="2xl"
                borderRadius="full"
                colorPalette="purple"
                variant="solid"
                width="84px"
                height="84px"
                onClick={stopRecording}
              >
                <Square size={28} fill="currentColor" />
              </IconButton>
              <IconButton
                aria-label="Annuler"
                size="md"
                borderRadius="full"
                variant="ghost"
                color="white"
                _hover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                onClick={cancelRecording}
              >
                <X size={20} />
              </IconButton>
            </>
          ) : null}

          {(state === "transcribing" || state === "personaThinking" || state === "personaSpeaking") ? (
            <Box
              width="84px"
              height="84px"
              borderRadius="full"
              borderWidth="2px"
              borderColor="rgba(255,255,255,0.2)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                width="20px"
                height="20px"
                borderRadius="full"
                backgroundColor="var(--color-accent)"
                style={{ animation: "pulse 1.2s ease-in-out infinite" }}
              />
            </Box>
          ) : null}
        </HStack>

        {/* Hint */}
        <Text fontSize="xs" color="rgba(255,255,255,0.5)" textAlign="center">
          {state === "idle"
            ? "Appuyez sur le micro, parlez, puis arrêtez."
            : state === "recording"
              ? "Appuyez sur ▢ pour envoyer, sur ✕ pour annuler."
              : ""}
        </Text>
      </VStack>
    </Box>
  );
}
