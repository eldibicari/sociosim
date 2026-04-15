import { Box, Button, Container, Text, VStack } from "@chakra-ui/react";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { renderMarkdownFromPublic } from "@/lib/markdown";

export default async function GuideEntretienPage() {
  const html = await renderMarkdownFromPublic("docs/guide_entretien.md");

  return (
    <Container maxW="3xl" py={10}>
      <VStack gap={0} align="stretch">
        {/* Hero */}
        <Box
          mb={10}
          pb={8}
          borderBottom="1px solid"
          borderColor="border.subtle"
        >
          <VStack align="flex-start" gap={4}>
            <Box
              width="44px"
              height="44px"
              borderRadius="xl"
              backgroundColor="#6366f118"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <BookOpen size={20} color="#6366f1" />
            </Box>
            <Box>
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="800"
                lineHeight="1.15"
                letterSpacing="-0.02em"
                mb={2}
              >
                Guide d&apos;entretien
              </Text>
              <Text fontSize="md" color="fg.muted" lineHeight="1.7" maxW="520px">
                Ce guide accompagne la conduite des entretiens semi-directifs
                avec les personas. Il détaille les phases, les relances et les
                points de vigilance méthodologique.
              </Text>
            </Box>
            <Button
              asChild
              size="sm"
              colorPalette="blue"
              variant="subtle"
              borderRadius="lg"
            >
              <Link href="/personnas">Choisir un persona et commencer</Link>
            </Button>
          </VStack>
        </Box>

        {/* Contenu markdown */}
        <Box
          className="guide-content"
          css={{
            "& h1": {
              fontSize: "1.6rem",
              fontWeight: "700",
              marginBottom: "0.75rem",
              marginTop: "0.25rem",
              letterSpacing: "-0.01em",
            },
            "& h2": {
              fontSize: "1.2rem",
              fontWeight: "700",
              marginTop: "2.25rem",
              marginBottom: "0.65rem",
              paddingBottom: "0.4rem",
              borderBottom: "1px solid var(--chakra-colors-border-subtle)",
            },
            "& h3": {
              fontSize: "1rem",
              fontWeight: "600",
              marginTop: "1.5rem",
              marginBottom: "0.4rem",
              color: "var(--chakra-colors-fg-default)",
            },
            "& p": {
              marginBottom: "0.8rem",
              lineHeight: "1.75",
              color: "var(--chakra-colors-fg-default)",
            },
            "& ul, & ol": {
              paddingLeft: "1.25rem",
              marginBottom: "0.8rem",
            },
            "& li": {
              marginBottom: "0.4rem",
              lineHeight: "1.65",
            },
            /* Blockquotes = prompts d'entretien → style callout distinct */
            "& blockquote": {
              background: "#6366f10c",
              borderLeft: "3px solid #6366f1",
              borderRadius: "0 12px 12px 0",
              paddingTop: "0.8rem",
              paddingBottom: "0.8rem",
              paddingLeft: "1.1rem",
              paddingRight: "1rem",
              marginTop: "0.75rem",
              marginBottom: "1rem",
              color: "var(--chakra-colors-fg-default)",
            },
            "& blockquote p": {
              marginBottom: "0.3rem",
              fontStyle: "italic",
            },
            "& table": {
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "0.75rem",
              marginBottom: "1.25rem",
              fontSize: "0.875rem",
            },
            "& th": {
              border: "1px solid var(--chakra-colors-border-muted)",
              padding: "0.5rem 0.65rem",
              textAlign: "left",
              verticalAlign: "top",
              background: "var(--chakra-colors-bg-subtle)",
              fontWeight: "600",
            },
            "& td": {
              border: "1px solid var(--chakra-colors-border-muted)",
              padding: "0.5rem 0.65rem",
              textAlign: "left",
              verticalAlign: "top",
            },
            "& hr": {
              borderColor: "var(--chakra-colors-border-subtle)",
              marginTop: "1.75rem",
              marginBottom: "1.75rem",
            },
            "& strong": { fontWeight: "600" },
            "& em": { fontStyle: "italic" },
            "& code": {
              background: "var(--chakra-colors-bg-subtle)",
              borderRadius: "4px",
              padding: "0.1em 0.35em",
              fontSize: "0.85em",
              fontFamily: "monospace",
            },
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* CTA bas de page */}
        <Box
          mt={12}
          pt={8}
          borderTop="1px solid"
          borderColor="border.subtle"
          textAlign="center"
        >
          <VStack gap={3}>
            <Text fontSize="sm" color="fg.muted">
              Guide lu ? Passez à la pratique.
            </Text>
            <Button
              asChild
              size="md"
              colorPalette="blue"
              borderRadius="xl"
              px={8}
            >
              <Link href="/personnas">Choisir un persona</Link>
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
