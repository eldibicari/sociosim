import { Box, IconButton, Textarea, BoxProps, Tooltip } from "@chakra-ui/react";
import { ArrowUp } from "lucide-react";
import { useRef, useState } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  containerProps?: BoxProps;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function MessageInput({
  onSendMessage,
  isLoading = false,
  placeholder = "Posez votre question...",
  containerProps = {},
  value,
  onValueChange,
}: MessageInputProps) {
  const [internalMessage, setInternalMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const message = value ?? internalMessage;

  const updateMessage = (nextValue: string) => {
    if (value === undefined) setInternalMessage(nextValue);
    onValueChange?.(nextValue);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      updateMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    updateMessage(nextValue);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 128);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  };

  const canSend = !isLoading && message.trim().length > 0;

  return (
    <Box width="100%" {...containerProps}>
      <Box
        width="100%"
        px={4}
        py={3}
        borderTop="1px solid"
        borderTopColor="var(--color-border)"
        backgroundColor="var(--color-bg)"
        flexShrink={0}
        display="flex"
        justifyContent="center"
      >
        <Box
          width={{ base: "100%", md: "90%", lg: "80%" }}
          position="relative"
          borderRadius="2xl"
          borderWidth="1.5px"
          borderColor={canSend ? "var(--color-accent-border)" : "var(--color-border)"}
          backgroundColor="var(--color-surface)"
          boxShadow={canSend ? "0 4px 20px rgba(91,91,214,0.1)" : "var(--color-shadow-sm)"}
          transition="border-color 0.15s ease, box-shadow 0.15s ease"
          _focusWithin={{
            borderColor: "var(--color-accent-border)",
            boxShadow: "0 4px 20px rgba(91,91,214,0.12)",
          }}
        >
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            minHeight={10}
            maxHeight={32}
            resize="none"
            overflow="hidden"
            border="none"
            outline="none"
            backgroundColor="transparent"
            color="var(--color-text-primary)"
            paddingRight="3rem"
            paddingY={3}
            paddingX={4}
            fontSize="sm"
            lineHeight="1.65"
            _placeholder={{ color: "var(--color-text-muted)" }}
            _focus={{ outline: "none", boxShadow: "none" }}
          />
          <Tooltip.Root openDelay={150}>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label="Envoyer"
                onClick={handleSendMessage}
                disabled={!canSend}
                position="absolute"
                right={2}
                bottom={2}
                borderRadius="xl"
                width={8}
                height={8}
                minWidth={8}
                background={canSend
                  ? "linear-gradient(135deg, var(--color-accent), #8b5cf6)"
                  : "var(--color-border)"
                }
                color="white"
                transition="background 0.15s ease, transform 0.1s ease"
                _hover={canSend ? { transform: "scale(1.05)" } : {}}
                _active={canSend ? { transform: "scale(0.97)" } : {}}
              >
                <ArrowUp size={15} />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content px={3} py={2}>Envoyer (Entrée)</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </Box>
      </Box>
    </Box>
  );
}
