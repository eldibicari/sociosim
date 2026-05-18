import { Box, HStack, Text } from "@chakra-ui/react";

interface ChatMessageProps {
  role: "user" | "assistant";
  text: string;
  userName?: string;
  agentName?: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  text,
  userName,
  agentName,
  timestamp,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";
  const initial = isUser
    ? (userName ?? "U").charAt(0).toUpperCase()
    : (agentName ?? "A").charAt(0).toUpperCase();

  return (
    <HStack
      width="100%"
      justifyContent={isUser ? "flex-end" : "flex-start"}
      align="flex-start"
      paddingX={4}
      paddingY={2}
      gap={3}
    >
      {!isUser && (
        <Box
          width="32px"
          height="32px"
          borderRadius="10px"
          background="linear-gradient(135deg, #6366f1, #8b5cf6)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          marginTop="2px"
          boxShadow="0 2px 8px rgba(99,102,241,0.25)"
        >
          <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1">
            {initial}
          </Text>
        </Box>
      )}

      <Box maxWidth={isUser ? "62%" : "72%"} width="fit-content" wordBreak="break-word">
        {/* Sender label */}
        <Text
          fontSize="2xs"
          fontWeight="600"
          letterSpacing="0.06em"
          textTransform="uppercase"
          color="var(--color-text-muted)"
          mb={1}
          textAlign={isUser ? "right" : "left"}
        >
          {isUser ? (userName ?? "Vous") : (agentName ?? "Persona")}
        </Text>

        {/* Bubble */}
        <Box
          padding={4}
          borderRadius={isUser ? "20px 4px 20px 20px" : "4px 20px 20px 20px"}
          background={isUser
            ? "linear-gradient(135deg, var(--color-accent), #8b5cf6)"
            : "var(--color-surface)"
          }
          borderWidth={isUser ? "0" : "1px"}
          borderColor="var(--color-border)"
          boxShadow={isUser
            ? "0 4px 16px rgba(91,91,214,0.22)"
            : "var(--color-shadow-sm)"
          }
        >
          <Text
            fontSize="sm"
            lineHeight="1.75"
            whiteSpace="pre-wrap"
            color={isUser ? "white" : "var(--color-text-primary)"}
          >
            {text}
            {!isUser && isStreaming && (
              <Box
                as="span"
                display="inline-block"
                marginLeft={1}
                opacity={0.6}
                style={{ animation: "pulse 1s infinite" }}
              >
                ▋
              </Box>
            )}
          </Text>
        </Box>

        {timestamp && (
          <Text
            fontSize="2xs"
            color="var(--color-text-muted)"
            marginTop={1}
            textAlign={isUser ? "right" : "left"}
          >
            {timestamp}
          </Text>
        )}
      </Box>

      {isUser && (
        <Box
          width="32px"
          height="32px"
          borderRadius="10px"
          background="linear-gradient(135deg, #1a1a2e, #4f46e5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          marginTop="2px"
        >
          <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1">
            {initial}
          </Text>
        </Box>
      )}
    </HStack>
  );
}
