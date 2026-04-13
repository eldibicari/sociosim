import { InterviewAnalysis, MaterialQuality, Message } from "@/lib/schemas";

type UsageTotals = {
  totalInputTokens: number;
  totalOutputTokens: number;
};

type ScoreBreakdown = InterviewAnalysis["score_breakdown"];
type Signals = InterviewAnalysis["signals"];

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
  /\bpour un expose\b/i,
  /\bdans ce cours\b/i,
  /\bla derniere fois\b/i,
];

const OPEN_QUESTION_PATTERNS = [
  /\bcomment\b/i,
  /\bpourquoi\b/i,
  /\bqu[' ]est-ce que\b/i,
  /\bdans quel cas\b/i,
  /\bpeux-tu\b/i,
  /\bpouvez-vous\b/i,
  /\bdecris\b/i,
  /\bdecrire\b/i,
  /\braconte\b/i,
  /\braconter\b/i,
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

function toPercent(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function detectConcreteExampleSignals(messages: Message[]) {
  return messages.reduce((count, message) => {
    const hasSignal = CONCRETE_PATTERNS.some((pattern) => pattern.test(message.content));
    return hasSignal ? count + 1 : count;
  }, 0);
}

function detectOpenQuestionSignals(messages: Message[]) {
  return messages.reduce((count, message) => {
    const normalized = message.content.trim();
    const hasSignal =
      normalized.includes("?") || OPEN_QUESTION_PATTERNS.some((pattern) => pattern.test(normalized));
    return hasSignal ? count + 1 : count;
  }, 0);
}

function scoreVolume(studentMessageCount: number, totalStudentWords: number, totalTokens: number) {
  if (studentMessageCount < 2 || totalStudentWords < 60) {
    return 0;
  }

  if (studentMessageCount >= 5 && totalStudentWords >= 260) {
    return 3;
  }

  if (studentMessageCount >= 3 && totalStudentWords >= 140) {
    return totalTokens >= 1600 ? 3 : 2;
  }

  return 1;
}

function scoreDepth(averageStudentWords: number, longStudentAnswers: number) {
  if (averageStudentWords < 18 || longStudentAnswers === 0) {
    return 0;
  }

  if (averageStudentWords >= 45 && longStudentAnswers >= 4) {
    return 3;
  }

  if (averageStudentWords >= 30 && longStudentAnswers >= 2) {
    return 2;
  }

  return 1;
}

function scoreConcrete(concreteExampleSignals: number) {
  if (concreteExampleSignals >= 4) return 3;
  if (concreteExampleSignals >= 2) return 2;
  if (concreteExampleSignals >= 1) return 1;
  return 0;
}

function scoreOpenness(openQuestionRatioPercent: number, interviewerMessageCount: number) {
  if (interviewerMessageCount === 0) return 0;
  if (openQuestionRatioPercent >= 75 && interviewerMessageCount >= 4) return 3;
  if (openQuestionRatioPercent >= 55) return 2;
  if (openQuestionRatioPercent >= 35) return 1;
  return 0;
}

function decideMaterialQuality(scores: ScoreBreakdown): MaterialQuality {
  if (scores.volume_score === 0 || scores.depth_score === 0) {
    return "insuffisant";
  }

  if (
    scores.total_score >= 8 &&
    scores.volume_score >= 2 &&
    scores.depth_score >= 2 &&
    (scores.concrete_score >= 1 || scores.openness_score >= 2)
  ) {
    return "exploitable";
  }

  if (scores.total_score >= 4) {
    return "partiel";
  }

  return "insuffisant";
}

function buildSummaryLine(quality: MaterialQuality, signals: Signals) {
  const prefix =
    quality === "exploitable"
      ? "Base deja exploitable"
      : quality === "partiel"
        ? "Base encore inegale"
        : "Base encore trop faible";

  return `${prefix} : ${signals.student_message_count} reponses etudiantes, ${signals.total_student_words} mots, ${signals.concrete_example_signals} exemple(s) concret(s).`;
}

function buildStrengths(quality: MaterialQuality, signals: Signals, scores: ScoreBreakdown): string[] {
  const strengths: string[] = [];

  if (scores.volume_score >= 1) {
    strengths.push("L'entretien contient deja plusieurs prises de parole du persona etudiant.");
  }
  if (scores.depth_score >= 2) {
    strengths.push("Certaines reponses sont assez developpees pour depasser la simple opinion generale.");
  }
  if (scores.concrete_score >= 1) {
    strengths.push("On repere des situations, usages ou exemples concrets mobilisables.");
  }
  if (scores.openness_score >= 2) {
    strengths.push("La conduite d'entretien laisse une vraie place a des questions ouvertes.");
  }

  if (strengths.length === 0) {
    strengths.push(
      quality === "insuffisant"
        ? "Le premier echange existe deja, ce qui donne une base pour mieux relancer."
        : "Le materiau commence a devenir exploitable."
    );
  }

  return strengths.slice(0, 3);
}

function buildLimits(quality: MaterialQuality, signals: Signals, scores: ScoreBreakdown): string[] {
  const limits: string[] = [];

  if (scores.volume_score <= 1) {
    limits.push("Le volume de materiau reste encore trop limite pour soutenir une analyse solide.");
  }
  if (scores.depth_score <= 1) {
    limits.push("Les reponses du persona restent souvent trop courtes ou trop generales.");
  }
  if (scores.concrete_score === 0) {
    limits.push("L'entretien manque encore d'exemples precis, situes ou racontes en detail.");
  }
  if (scores.openness_score <= 1) {
    limits.push("La conduite d'entretien gagnerait a utiliser davantage de questions ouvertes.");
  }

  if (limits.length === 0 && quality !== "insuffisant") {
    limits.push("Quelques zones restent a approfondir avant un codage plus confiant.");
  }

  return limits.slice(0, 3);
}

function buildNextSteps(quality: MaterialQuality, scores: ScoreBreakdown): string[] {
  if (quality === "insuffisant") {
    return [
      "Demande une situation recente et precise plutot qu'un avis general.",
      "Relance avec 'comment', 'dans quel cas' ou 'peux-tu me raconter un exemple ?'.",
      "Laisse le persona decrire ce qu'il a fait, avec quel outil et dans quel contexte.",
    ];
  }

  if (quality === "partiel") {
    return [
      "Creuse une situation deja mentionnee pour obtenir plus de details concrets.",
      "Demande ce qui change selon les cours, le temps disponible ou le type de travail.",
      "Fais expliciter un exemple complet : contexte, usage de l'IA, resultat, ressenti.",
    ];
  }

  const steps = [
    "Repere 2 ou 3 extraits forts a conserver comme verbatims.",
    "Commence un premier codage simple : usages, justifications, limites, effets sur le travail etudiant.",
    "Compare plusieurs exemples pour distinguer usages routiniers et usages plus personnels.",
  ];

  if (scores.concrete_score <= 1) {
    steps[2] = "Ajoute encore un ou deux exemples contrastes pour consolider l'analyse.";
  }

  return steps;
}

function buildCoachingTip(quality: MaterialQuality, scores: ScoreBreakdown) {
  if (quality === "insuffisant") {
    return "Le prochain bon geste est de demander un exemple recent, detaille et situe dans un cours precis.";
  }

  if (quality === "partiel") {
    return scores.concrete_score === 0
      ? "Cherche maintenant un exemple complet, du contexte jusqu'au resultat obtenu."
      : "Garde la meme piste, mais creuse davantage les raisons, les hesitations et les variations selon les situations.";
  }

  return "Tu peux maintenant passer d'une collecte generale a une premiere lecture analytique des verbatims.";
}

function buildFeedback(
  quality: MaterialQuality,
  signals: Signals,
  scores: ScoreBreakdown
): Pick<InterviewAnalysis, "feedback_title" | "feedback_text" | "summary_line" | "coaching_tip"> {
  const summaryLine = buildSummaryLine(quality, signals);
  const coachingTip = buildCoachingTip(quality, scores);

  if (quality === "insuffisant") {
    return {
      summary_line: summaryLine,
      feedback_title: "Materiau encore insuffisant",
      feedback_text:
        "Le bloc entretien produit encore trop peu de matiere etudiante pour une analyse fiable. Le probleme ne vient pas seulement du nombre de messages : il manque surtout des reponses plus developpees et plus concretes.",
      coaching_tip: coachingTip,
    };
  }

  if (quality === "partiel") {
    return {
      summary_line: summaryLine,
      feedback_title: "Materiau partiellement exploitable",
      feedback_text:
        "L'entretien commence a produire une base utile, mais elle reste inegale. Il y a de la matiere, sans encore avoir assez de profondeur ou d'exemples pour une lecture vraiment solide.",
      coaching_tip: coachingTip,
    };
  }

  return {
    summary_line: summaryLine,
    feedback_title: "Materiau exploitable",
    feedback_text:
      "L'entretien fournit deja une base exploitable pour une premiere analyse. Le volume, la profondeur et la conduite de l'echange sont suffisamment solides pour commencer a isoler des verbatims et des themes.",
    coaching_tip: coachingTip,
  };
}

export function analyzeInterviewMessages(messages: Message[], usage: UsageTotals): InterviewAnalysis {
  const interviewerMessages = messages.filter((message) => message.role === "user");
  const studentMessages = messages.filter((message) => message.role === "assistant");
  const studentWordCounts = studentMessages.map((message) => countWords(message.content));
  const totalStudentWords = studentWordCounts.reduce((sum, count) => sum + count, 0);
  const averageStudentWords = roundAverage(totalStudentWords, studentMessages.length);
  const longStudentAnswers = studentWordCounts.filter((count) => count >= 20).length;
  const shortStudentAnswers = studentWordCounts.filter((count) => count > 0 && count < 8).length;
  const concreteExampleSignals = detectConcreteExampleSignals(studentMessages);
  const openQuestionSignals = detectOpenQuestionSignals(interviewerMessages);
  const totalTokens = usage.totalInputTokens + usage.totalOutputTokens;
  const openQuestionRatioPercent = toPercent(openQuestionSignals, interviewerMessages.length);

  const scoreBreakdown: ScoreBreakdown = {
    volume_score: scoreVolume(studentMessages.length, totalStudentWords, totalTokens),
    depth_score: scoreDepth(averageStudentWords, longStudentAnswers),
    concrete_score: scoreConcrete(concreteExampleSignals),
    openness_score: scoreOpenness(openQuestionRatioPercent, interviewerMessages.length),
    total_score: 0,
    max_score: 12,
  };
  scoreBreakdown.total_score =
    scoreBreakdown.volume_score +
    scoreBreakdown.depth_score +
    scoreBreakdown.concrete_score +
    scoreBreakdown.openness_score;

  const materialQuality = decideMaterialQuality(scoreBreakdown);

  const signals: Signals = {
    interviewer_message_count: interviewerMessages.length,
    student_message_count: studentMessages.length,
    total_student_words: totalStudentWords,
    average_student_words: averageStudentWords,
    long_student_answers: longStudentAnswers,
    short_student_answers: shortStudentAnswers,
    concrete_example_signals: concreteExampleSignals,
    open_question_signals: openQuestionSignals,
    open_question_ratio_percent: openQuestionRatioPercent,
    total_input_tokens: usage.totalInputTokens,
    total_output_tokens: usage.totalOutputTokens,
    total_tokens: totalTokens,
  };

  const feedback = buildFeedback(materialQuality, signals, scoreBreakdown);

  return {
    material_quality: materialQuality,
    summary_line: feedback.summary_line,
    feedback_title: feedback.feedback_title,
    feedback_text: feedback.feedback_text,
    strengths: buildStrengths(materialQuality, signals, scoreBreakdown),
    limits: buildLimits(materialQuality, signals, scoreBreakdown),
    next_steps: buildNextSteps(materialQuality, scoreBreakdown),
    coaching_tip: feedback.coaching_tip,
    metrics: {
      student_messages: studentMessages.length,
      student_words: totalStudentWords,
      avg_words_per_answer: averageStudentWords,
      long_answers: longStudentAnswers,
      concrete_examples: concreteExampleSignals,
      open_question_ratio_percent: openQuestionRatioPercent,
      total_tokens: totalTokens,
    },
    score_breakdown: scoreBreakdown,
    signals,
  };
}
