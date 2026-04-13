import type { Dispatch, SetStateAction } from "react";
import { generateUuid } from "@/lib/uuid";
import type { UIMessage } from "@/types/ui";

type InterviewSession = {
  sessionId: string;
  adkSessionId: string;
  interviewId: string;
};

type InterviewStats = {
  answeredQuestions: number;
  inputTokens: number;
  outputTokens: number;
};

type SendInterviewMessageArgs = {
  message: string;
  userId: string;
  session: InterviewSession;
  setMessages: Dispatch<SetStateAction<UIMessage[]>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
  setInterviewStats: Dispatch<SetStateAction<InterviewStats>>;
};

function splitTextForTyping(text: string) {
  const pieces = text.match(/\S+\s*|\n+/g);
  return pieces && pieces.length > 0 ? pieces : [text];
}

function getFriendlyInterviewErrorMessage(code?: string, fallback?: string) {
  if (code === "session_not_found") {
    return "La session du chat n'existe plus cote agent. Rechargez la page ou relancez un nouvel entretien pour reprendre proprement.";
  }

  if (fallback) {
    return `Erreur: ${fallback}`;
  }

  return "Erreur: le chat a rencontre un probleme inattendu.";
}

export async function sendInterviewMessage({
  message,
  userId,
  session,
  setMessages,
  setIsStreaming,
  setInterviewStats,
}: SendInterviewMessageArgs) {
  const assistantMessageId = generateUuid();
  let assistantText = "";
  let assistantMessageStarted = false;
  const typingQueue: string[] = [];
  let typingTimer: ReturnType<typeof setTimeout> | null = null;

  const upsertAssistantMessage = (text: string, isAssistantStreaming: boolean) => {
    setMessages((prev) => {
      const existing = prev.findIndex((current) => current.id === assistantMessageId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          text,
          isStreaming: isAssistantStreaming,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant" as const,
          text,
          isStreaming: isAssistantStreaming,
          timestamp: new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        } as UIMessage,
      ];
    });
  };

  const flushTypingQueue = () => {
    if (typingQueue.length === 0) {
      typingTimer = null;
      return;
    }

    const batchSize = typingQueue.length > 10 ? 3 : 1;
    const nextChunk = typingQueue.splice(0, batchSize).join("");
    assistantText += nextChunk;
    upsertAssistantMessage(assistantText, true);

    typingTimer = setTimeout(flushTypingQueue, 24);
  };

  const enqueueAssistantChunk = (textChunk: string) => {
    if (!textChunk) return;
    assistantMessageStarted = true;
    typingQueue.push(...splitTextForTyping(textChunk));
    if (typingTimer === null) {
      flushTypingQueue();
    }
  };

  const waitForTypingQueueToDrain = async () => {
    while (typingQueue.length > 0 || typingTimer !== null) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  };

  // Add user message to display
  const userMessage: UIMessage = {
    id: generateUuid(),
    role: "user",
    text: message,
    timestamp: new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  setMessages((prev) => [...prev, userMessage]);
  setIsStreaming(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        userId,
        sessionId: session.sessionId, // Database session UUID
        adkSessionId: session.adkSessionId, // ADK session ID
        interviewId: session.interviewId,
        // Agent is now loaded from database, no longer passed in request
        streaming: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Process all complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "message" && data.event?.content?.parts) {
              const textChunk = data.event.content.parts
                .map((part: { text?: string }) => part.text || "")
                .join("");

              enqueueAssistantChunk(textChunk);
            } else if (data.type === "error") {
              if (typingTimer) {
                clearTimeout(typingTimer);
                typingTimer = null;
              }
              typingQueue.length = 0;
              assistantText = getFriendlyInterviewErrorMessage(data.code, data.error);
              assistantMessageStarted = true;
              upsertAssistantMessage(assistantText, false);
            } else if (data.type === "done") {
              console.log("[Interview SSE] done event:", data);
              // Stream finished, token info available but not displayed yet
              console.log("[Interview] Stream finished, tokens:", {
                input: data.event.total_input_tokens,
                output: data.event.total_output_tokens,
              });
              const totalInputTokens = data.event.total_input_tokens;
              const totalOutputTokens = data.event.total_output_tokens;
              setInterviewStats((prev) => ({
                answeredQuestions: prev.answeredQuestions + 1,
                inputTokens: prev.inputTokens + (totalInputTokens ?? 0),
                outputTokens: prev.outputTokens + (totalOutputTokens ?? 0),
              }));
            } else {
              console.log("[Interview SSE] event:", data);
            }
          } catch {
            // JSON parse error, incomplete data
            console.debug("[Interview] Incomplete JSON, buffering...");
            buffer = line + "\n" + lines.slice(i + 1).join("\n");
            break;
          }
        }
      }

      // Keep incomplete line in buffer
      buffer = lines[lines.length - 1];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Interview] Error sending message:", errorMessage);

    setMessages((prev) => [
      ...prev,
      {
        id: generateUuid(),
        role: "assistant" as const,
        text: `Erreur: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      } as UIMessage,
    ]);
  } finally {
    await waitForTypingQueueToDrain();
    if (assistantMessageStarted) {
      upsertAssistantMessage(assistantText, false);
    }
    setIsStreaming(false);
  }
}
