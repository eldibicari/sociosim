export interface PersonaVisual {
  gradient: string;
  accent: string;
  bg: string;
  emoji: string;
  imagePath?: string;
}

const PERSONA_VISUALS: Record<string, PersonaVisual> = {
  oriane: {
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
    emoji: "🌿",
    imagePath: "/personas/oriane.webp",
  },
  theo: {
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    accent: "#0ea5e9",
    bg: "rgba(14,165,233,0.10)",
    emoji: "📐",
    imagePath: "/personas/theo.webp",
  },
  jade: {
    gradient: "linear-gradient(135deg, #10b981, #0ea5e9)",
    accent: "#10b981",
    bg: "rgba(16,185,129,0.10)",
    emoji: "🎓",
    imagePath: "/personas/jade.webp",
  },
  mona: {
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    accent: "#ec4899",
    bg: "rgba(236,72,153,0.10)",
    emoji: "🎨",
  },
  lucas: {
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    accent: "#6366f1",
    bg: "rgba(99,102,241,0.10)",
    emoji: "🔬",
  },
};

const FALLBACK_PALETTE = [
  { gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)", accent: "#6366f1", bg: "rgba(99,102,241,0.10)", emoji: "👤" },
  { gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)", accent: "#0ea5e9", bg: "rgba(14,165,233,0.10)", emoji: "👤" },
  { gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)", accent: "#8b5cf6", bg: "rgba(139,92,246,0.10)", emoji: "👤" },
  { gradient: "linear-gradient(135deg, #10b981, #0ea5e9)", accent: "#10b981", bg: "rgba(16,185,129,0.10)", emoji: "👤" },
  { gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", accent: "#f59e0b", bg: "rgba(245,158,11,0.10)", emoji: "👤" },
  { gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)", accent: "#ec4899", bg: "rgba(236,72,153,0.10)", emoji: "👤" },
];

export function getPersonaVisual(agentName: string): PersonaVisual {
  const key = agentName.toLowerCase();
  if (PERSONA_VISUALS[key]) return PERSONA_VISUALS[key];
  const fallback = FALLBACK_PALETTE[agentName.charCodeAt(0) % FALLBACK_PALETTE.length];
  return fallback;
}
