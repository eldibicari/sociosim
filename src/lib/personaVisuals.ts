export interface PersonaVisual {
  gradient: string;
  color1: string;
  color2: string;
  accent: string;
  bg: string;
  shapeIndex: number;
  imagePath?: string;
}

const PERSONA_VISUALS: Record<string, PersonaVisual> = {
  jade: {
    gradient: "linear-gradient(160deg, #34D399, #065F46)",
    color1: "#6EE7B7",
    color2: "#065F46",
    accent: "#10B981",
    bg: "rgba(16,185,129,0.06)",
    shapeIndex: 0,
  },
  oriane: {
    gradient: "linear-gradient(160deg, #FBBF24, #92400E)",
    color1: "#FDE68A",
    color2: "#92400E",
    accent: "#D97706",
    bg: "rgba(217,119,6,0.06)",
    shapeIndex: 1,
  },
  theo: {
    gradient: "linear-gradient(160deg, #818CF8, #1E1B4B)",
    color1: "#A5B4FC",
    color2: "#1E1B4B",
    accent: "#4F46E5",
    bg: "rgba(79,70,229,0.06)",
    shapeIndex: 2,
  },
  mona: {
    gradient: "linear-gradient(160deg, #C084FC, #4C1D95)",
    color1: "#DDD6FE",
    color2: "#4C1D95",
    accent: "#9333EA",
    bg: "rgba(147,51,234,0.06)",
    shapeIndex: 3,
  },
  lucas: {
    gradient: "linear-gradient(160deg, #A78BFA, #312E81)",
    color1: "#C4B5FD",
    color2: "#312E81",
    accent: "#6D5DF6",
    bg: "rgba(109,93,246,0.06)",
    shapeIndex: 4,
  },
};

const FALLBACK_PALETTE: PersonaVisual[] = [
  { gradient: "linear-gradient(160deg, #A78BFA, #312E81)", color1: "#C4B5FD", color2: "#312E81", accent: "#6D5DF6", bg: "rgba(109,93,246,0.06)", shapeIndex: 0 },
  { gradient: "linear-gradient(160deg, #34D399, #065F46)", color1: "#6EE7B7", color2: "#065F46", accent: "#10B981", bg: "rgba(16,185,129,0.06)", shapeIndex: 1 },
  { gradient: "linear-gradient(160deg, #FBBF24, #92400E)", color1: "#FDE68A", color2: "#92400E", accent: "#D97706", bg: "rgba(217,119,6,0.06)", shapeIndex: 2 },
  { gradient: "linear-gradient(160deg, #818CF8, #1E1B4B)", color1: "#A5B4FC", color2: "#1E1B4B", accent: "#4F46E5", bg: "rgba(79,70,229,0.06)", shapeIndex: 3 },
  { gradient: "linear-gradient(160deg, #C084FC, #4C1D95)", color1: "#DDD6FE", color2: "#4C1D95", accent: "#9333EA", bg: "rgba(147,51,234,0.06)", shapeIndex: 4 },
  { gradient: "linear-gradient(160deg, #7DD3FC, #0C4A6E)", color1: "#BAE6FD", color2: "#0C4A6E", accent: "#0EA5E9", bg: "rgba(14,165,233,0.06)", shapeIndex: 5 },
];

export function getPersonaVisual(agentName: string): PersonaVisual {
  const key = agentName.toLowerCase();
  if (PERSONA_VISUALS[key]) return PERSONA_VISUALS[key];
  const idx = agentName.charCodeAt(0) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[idx];
}
