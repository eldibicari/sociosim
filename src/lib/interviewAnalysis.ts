import { InterviewAnalysis, MaterialQuality, Message } from "@/lib/schemas";

type UsageTotals = {
  totalInputTokens: number;
  totalOutputTokens: number;
};

const CONCRETE_PATTERNS = [
  /\bpar exemple\b/i,
  /\bparce que\b/i,
  /\bquand\b/i,
  /\bpendant\b/i,
  /\bau debut\b/i,
  /\bune fois\b/i,
  /\ben cours\b/i,
  /\ben stage\b/i,
  /\bpour mon memoire\b/i,
  /\bpour un expos[ée]\b/i,
];

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function roundAverage(total: number, count: number) {
  return count === 0 ? 0 : Math.round(total / count);
}

function detectConcreteExampleSignals(messages: Message[]) {
  return messages.reduce((count, message) => {
    const hasSignal = CONCRETE_PATTERNS.some((pattern) => pattern.test(message.content));
    return hasSignal ? count + 1 : count;
  }, 0);
}

function decideMaterialQuality({
  userMessageCount,
  totalUserWords,
  longUserAnswers,
  concreteExampleSignals,
}: {
  userMessageCount: number;
  totalUserWords: number;
  longUserAnswers: number;
  concreteExampleSignals: number;
}): MaterialQuality {
  if (userMessageCount < 3 || totalUserWords < 120 || longUserAnswers < 2) {
    return "insuffisant";
  }

  if (
    userMessageCount >= 5 &&
    totalUserWords >= 280 &&
    longUserAnswers >= 3 &&
    concreteExampleSignals >= 2
  ) {
    return "exploitable";
  }

  return "partiel";
}

function buildStrengths(
  quality: MaterialQuality,
  signals: InterviewAnalysis["signals"]
): string[] {
  const strengths: string[] = [];

  if (signals.user_message_count >= 3) {
    strengths.push("L'entretien contient deja plusieurs prises de parole de l'etudiant.");
  }
  if (signals.long_user_answers >= 2) {
    strengths.push("Certaines reponses developpent deja le point de vue de l'etudiant.");
  }
  if (signals.concrete_example_signals >= 1) {
    strengths.push("On repere au moins un exemple ou une situation concrete mobilisable.");
  }
  if (signals.total_output_tokens > 0) {
    strengths.push("L'echange a produit un historique exploitable pour une relecture.");
  }

  if (strengths.length === 0) {
    strengths.push(
      quality === "insuffisant"
        ? "Le premier echange existe, ce qui donne une base pour relancer l'entretien."
        : "Le materiau commence a prendre forme."
    );
  }

  return strengths.slice(0, 3);
}

function buildLimits(
  quality: MaterialQuality,
  signals: InterviewAnalysis["signals"]
): string[] {
  const limits: string[] = [];

  if (signals.user_message_count < 3) {
    limits.push("Le nombre de reponses reste trop faible pour soutenir une analyse detaillee.");
  }
  if (signals.total_user_words < 120) {
    limits.push("Le volume de materiau est encore limite.");
  }
  if (signals.short_user_answers >= 2) {
    limits.push("Plusieurs reponses sont tres courtes et demanderaient une relance.");
  }
  if (signals.concrete_example_signals === 0) {
    limits.push("L'entretien manque encore d'exemples precis ou de situations concretes.");
  }

  if (limits.length === 0 && quality !== "insuffisant") {
    limits.push("Certaines zones restent a clarifier avant un codage plus solide.");
  }

  return limits.slice(0, 3);
}

function buildNextSteps(
  quality: MaterialQuality,
  signals: InterviewAnalysis["signals"]
): string[] {
  if (quality === "insuffisant") {
    return [
      "Relance avec une question ouverte centree sur une pratique precise.",
      "Demande un exemple recent, concret et situe dans le temps.",
      "Invite l'etudiant a expliquer comment il agit, et pas seulement ce qu'il pense.",
    ];
  }

  if (quality === "partiel") {
    return [
      "Creuse une situation deja mentionnee pour obtenir plus de details.",
      "Demande ce qui change selon les cours, les enseignants ou les contraintes de temps.",
      "Fais expliciter un exemple complet : contexte, usage de l'IA, resultat, ressenti.",
    ];
  }

  const steps = [
    "Repere 2 ou 3 extraits forts a conserver comme verbatims.",
    "Commence un premier codage simple : usages, justifications, limites, effets sur le travail etudiant.",
    "Compare les exemples entre eux pour distinguer pratiques routinieres et usages plus personnels.",
  ];

  if (signals.concrete_example_signals < 3) {
    steps[2] = "Ajoute encore un ou deux exemples contrastes pour consolider l'analyse.";
  }

  return steps;
}

function buildFeedback(
  quality: MaterialQuality,
  signals: InterviewAnalysis["signals"]
): Pick<InterviewAnalysis, "feedback_title" | "feedback_text"> {
  if (quality === "insuffisant") {
    return {
      feedback_title: "Materiau encore insuffisant",
      feedback_text:
        "Le materiau est encore trop faible pour une analyse detaillee. Il faut obtenir plus de reponses developpees et au moins un exemple concret avant d'aller plus loin.",
    };
  }

  if (quality === "partiel") {
    return {
      feedback_title: "Materiau partiellement exploitable",
      feedback_text:
        "Quelques elements sont exploitables, mais plusieurs zones restent floues. L'entretien commence a produire de la matiere, sans encore offrir une base vraiment solide pour l'analyse.",
    };
  }

  const nuance =
    signals.concrete_example_signals >= 3
      ? "Plusieurs passages semblent deja mobilisables comme premiers verbatims."
      : "La base est bonne, meme si quelques exemples supplementaires renforceraient encore l'ensemble.";

  return {
    feedback_title: "Materiau exploitable",
    feedback_text: `L'entretien fournit deja une base exploitable pour une premiere lecture sociologique. ${nuance}`,
  };
}

export function analyzeInterviewMessages(
  messages: Message[],
  usage: UsageTotals
): InterviewAnalysis {
  const userMessages = messages.filter((message) => message.role === "user");
  const assistantMessages = messages.filter((message) => message.role === "assistant");
  const userWordCounts = userMessages.map((message) => countWords(message.content));
  const totalUserWords = userWordCounts.reduce((sum, count) => sum + count, 0);
  const longUserAnswers = userWordCounts.filter((count) => count >= 20).length;
  const shortUserAnswers = userWordCounts.filter((count) => count > 0 && count < 8).length;
  const concreteExampleSignals = detectConcreteExampleSignals(userMessages);

  const materialQuality = decideMaterialQuality({
    userMessageCount: userMessages.length,
    totalUserWords,
    longUserAnswers,
    concreteExampleSignals,
  });

  const signals: InterviewAnalysis["signals"] = {
    user_message_count: userMessages.length,
    assistant_message_count: assistantMessages.length,
    total_user_words: totalUserWords,
    average_user_words: roundAverage(totalUserWords, userMessages.length),
    long_user_answers: longUserAnswers,
    short_user_answers: shortUserAnswers,
    concrete_example_signals: concreteExampleSignals,
    total_input_tokens: usage.totalInputTokens,
    total_output_tokens: usage.totalOutputTokens,
  };

  const feedback = buildFeedback(materialQuality, signals);

  return {
    material_quality: materialQuality,
    feedback_title: feedback.feedback_title,
    feedback_text: feedback.feedback_text,
    strengths: buildStrengths(materialQuality, signals),
    limits: buildLimits(materialQuality, signals),
    next_steps: buildNextSteps(materialQuality, signals),
    signals,
  };
}
