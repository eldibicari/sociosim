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
    ? (userName ?? "V").charAt(0).toUpperCase()
    : (agentName ?? "A").charAt(0).toUpperCase();

  if (isUser) {
    return (
      <Box
        width="100%"
        paddingX={4}
        paddingY="6px"
        display="flex"
        justifyContent="flex-end"
      >
        <Box maxWidth="68%" width="fit-content">
          <Box
            px={4}
            py="10px"
            borderRadius="18px 4px 18px 18px"
            background="rgba(91,91,214,0.09)"
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
              mt="3px"
              textAlign="right"
              opacity={0.7}
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
      paddingY="6px"
      display="flex"
      justifyContent="flex-start"
    >
      <HStack align="flex-start" gap={3} maxWidth="80%">
        <Box
          width="30px"
          height="30px"
          borderRadius="9px"
          background="linear-gradient(135deg, #6366f1, #8b5cf6)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          marginTop="2px"
          boxShadow="0 2px 6px rgba(99,102,241,0.2)"
        >
          <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1">
            {initial}
          </Text>
        </Box>

        <Box>
          <Text
            fontSize="2xs"
            fontWeight="600"
            letterSpacing="0.05em"
            textTransform="uppercase"
            color="var(--color-text-muted)"
            mb="4px"
          >
            {agentName ?? "Persona"}
          </Text>

          <Box
            px={4}
            py="10px"
            borderRadius="4px 18px 18px 18px"
            background="var(--color-surface)"
            borderWidth="1px"
            borderColor="var(--color-border)"
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
                  opacity={0.5}
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
              mt="3px"
              opacity={0.7}
            >
              {timestamp}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
}
