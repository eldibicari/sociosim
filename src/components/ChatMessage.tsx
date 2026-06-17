import { Box, HStack, Text } from "@chakra-ui/react";
import { VoicePlayer } from "@/components/VoicePlayer";

interface ChatMessageProps {
  role: "user" | "assistant";
  text: string;
  userName?: string;
  agentName?: string;
  timestamp?: string;
  isStreaming?: boolean;
  agentId?: string | null;
  voiceEnabled?: boolean;
  autoplayVoice?: boolean;
}

export function ChatMessage({
  role,
  text,
  userName,
  agentName,
  timestamp,
  isStreaming = false,
  agentId,
  voiceEnabled = false,
  autoplayVoice = false,
}: ChatMessageProps) {
  const isUser = role === "user";
  const showVoiceButton =
    !isUser && voiceEnabled && !!agentId && !isStreaming && text.trim().length > 0;

  if (isUser) {
    return (
      <Box
        width="100%"
        paddingX={4}
        paddingY="5px"
        display="flex"
        justifyContent="flex-end"
      >
        <Box maxWidth="72%" width="fit-content">
          <Box
            px={4}
            py="11px"
            borderRadius="20px 4px 20px 20px"
            background="var(--color-accent-soft)"
            boxShadow="0 1px 4px rgba(109,93,246,0.08)"
          >
            <Text
              fontSize="sm"
              lineHeight="1.75"
              whiteSpace="pre-wrap"
              color="var(--color-text-primary)"
            >
              {text}
            </Text>
          </Box>
          {timestamp && (
            <Text
              fontSize="2xs"
              color="var(--color-text-muted)"
              mt="4px"
              textAlign="right"
              opacity={0.6}
            >
              {timestamp}
            </Text>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      width="100%"
      paddingX={4}
      paddingY="5px"
      display="flex"
      justifyContent="flex-start"
    >
      <HStack align="flex-start" gap={3} maxWidth="82%">
        <Box
          width="32px"
          height="32px"
          borderRadius="10px"
          background="linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          marginTop="2px"
          boxShadow="0 2px 8px rgba(109,93,246,0.22)"
        >
          <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1">
            {(agentName ?? "A").charAt(0).toUpperCase()}
          </Text>
        </Box>

        <Box>
          <Text
            fontSize="xs"
            fontWeight="600"
            color="var(--color-text-muted)"
            mb="5px"
            letterSpacing="0.01em"
          >
            {agentName ?? "Persona"}
          </Text>

          <Box
            px={4}
            py="11px"
            borderRadius="4px 20px 20px 20px"
            background="var(--color-surface)"
            borderWidth="1px"
            borderColor="var(--color-border)"
            boxShadow="0 1px 4px rgba(26,26,46,0.05)"
          >
            <Text
              fontSize="sm"
              lineHeight="1.8"
              whiteSpace="pre-wrap"
              color="var(--color-text-primary)"
            >
              {text}
              {isStreaming && (
                <Box
                  as="span"
                  display="inline-block"
                  marginLeft={1}
                  opacity={0.4}
                  style={{ animation: "pulse 1s infinite" }}
                >
                  ▋
                </Box>
              )}
            </Text>
          </Box>

          {showVoiceButton ? (
            <Box mt="6px">
              <VoicePlayer
                mode="tts"
                agentId={agentId as string}
                text={text}
                size="2xs"
                variant="ghost"
                autoplay={autoplayVoice}
              />
            </Box>
          ) : null}

          {timestamp && (
            <Text
              fontSize="2xs"
              color="var(--color-text-muted)"
              mt="4px"
              opacity={0.6}
            >
              {timestamp}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
}
