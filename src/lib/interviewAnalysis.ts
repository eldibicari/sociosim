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
  /\bavant\b/i,
  /\bapres\b/i,
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
  /\bexplique\b/i,
  /\bexpliquez\b/i,
];

const FOLLOW_UP_PATTERNS = [
  /\bpeux-tu preciser\b/i,
  /\bpouvez-vous preciser\b/i,
  /\bplus precisement\b/i,
  /\bqu'est-ce qui\b/i,
  /\bet ensuite\b/i,
  /\bet apres\b/i,
  /\bqu'est-ce que tu veux dire\b/i,
  /\bsi je comprends bien\b/i,
];

const NOISE_PATTERNS = [
  /^test+$/i,
  /^ok+$/i,
  /^bonjour+$/i,
  /^salut+$/i,
  /^ca va$/i,
  /^[a-z]{1,4}$/i,
  /^[a-z\s]{0,12}$/i,
  /^[a-z]{2,}\s[a-z]{2,}$/i,
];

const THEME_KEYWORDS = [
  { theme: "usages concrets de l'IA", patterns: [/\bchatgpt\b/i, /\bia\b/i, /\butilis/i, /\boutil\b/i] },
  { theme: "rapport au travail universitaire", patterns: [/\bcours\b/i, /\bexpose\b/i, /\bdissertation\b/i, /\bmemoire\b/i] },
  { theme: "rapport aux enseignants", patterns: [/\benseignant\b/i, /\bprof\b/i, /\bprofesseur\b/i] },
  { theme: "doutes et hesitations", patterns: [/\bdoute\b/i, /\bhesit/i, /\bpeur\b/i, /\bmefian/i] },
  { theme: "variations selon les situations", patterns: [/\bselon\b/i, /\bquand\b/i, /\bdans certains cas\b/i, /\bca depend\b/i] },
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

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, length = 140) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > length ? `${normalized.slice(0, length - 3)}...` : normalized;
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

function detectFollowUpSignals(messages: Message[]) {
  return messages.reduce((count, message) => {
    const normalized = message.content.trim();
    const hasSignal = FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(normalized));
    return hasSignal ? count + 1 : count;
  }, 0);
}

function detectWeakMessageSignals(messages: Message[]) {
  return messages.reduce((count, message) => {
    const normalized = normalizeText(message.content);
    const words = countWords(normalized);
    const looksLikeNoise =
      words <= 2 ||
      NOISE_PATTERNS.some((pattern) => pattern.test(normalized)) ||
      /^[a-z]+$/.test(normalized.replace(/\s/g, "")) && normalized.length <= 8;
    return looksLikeNoise ? count + 1 : count;
  }, 0);
}

function detectRepeatedQuestionSignals(messages: Message[]) {
  const seen = new Set<string>();
  let repeated = 0;

  for (const message of messages) {
    const normalized = normalizeText(message.content).replace(/[?.!]/g, "");
    if (!normalized || normalized.length < 12) continue;
    if (seen.has(normalized)) {
      repeated += 1;
    } else {
      seen.add(normalized);
    }
  }

  return repeated;
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

function buildStrengths(quality: MaterialQuality, scores: ScoreBreakdown): string[] {
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

function buildLimits(quality: MaterialQuality, scores: ScoreBreakdown): string[] {
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

function describeQuestionStyle(openQuestionRatioPercent: number, weakMessageSignals: number, interviewerCount: number) {
  if (interviewerCount === 0) return "non evalue";
  if (weakMessageSignals >= Math.max(2, Math.floor(interviewerCount / 2))) return "trop fragile";
  if (openQuestionRatioPercent >= 70) return "plutot ouvert";
  if (openQuestionRatioPercent >= 45) return "mixte";
  return "encore trop ferme";
}

function describeFollowUpQuality(followUpSignals: number, repeatedQuestionSignals: number, interviewerCount: number) {
  if (interviewerCount <= 1) return "encore insuffisante";
  if (followUpSignals >= 2 && repeatedQuestionSignals === 0) return "plutot bonne";
  if (followUpSignals >= 1) return "correcte mais inegale";
  if (repeatedQuestionSignals >= 1) return "trop repetitive";
  return "encore insuffisante";
}

function buildConductTeacherComment(
  questionStyle: string,
  followUpQuality: string,
  noiseDetected: boolean
) {
  if (noiseDetected) {
    return "Plusieurs messages ressemblent a des tests ou a du bruit, ce qui empeche une lecture pedagogique fiable de la conduite d'entretien.";
  }

  if (questionStyle === "plutot ouvert" && followUpQuality === "plutot bonne") {
    return "Les questions ouvrent bien l'echange et les relances permettent deja de creuser le point de vue du persona.";
  }

  if (questionStyle === "encore trop ferme") {
    return "Les questions restent encore trop generales ou trop fermees. Il faut davantage inviter le persona a raconter une situation precise.";
  }

  if (followUpQuality === "trop repetitive") {
    return "Les relances manquent de varietes et risquent de refaire demander la meme chose sans reel approfondissement.";
  }

  return "La conduite d'entretien est engagee, mais les relances doivent encore mieux aider le persona a passer d'un discours general a un recit situe.";
}

function buildMaterialReading(
  quality: MaterialQuality,
  scores: ScoreBreakdown,
  studentMessages: Message[]
): InterviewAnalysis["material_reading"] {
  const normalizedContent = studentMessages.map((message) => normalizeText(message.content));
  const contrastsDetected: string[] = [];

  const hasGainOfTime = normalizedContent.some((text) => text.includes("gagner du temps"));
  const hasCriticalDistance = normalizedContent.some(
    (text) => text.includes("distance critique") || text.includes("verifier") || text.includes("croiser")
  );
  if (hasGainOfTime && hasCriticalDistance) {
    contrastsDetected.push("gain de temps vs distance critique");
  }

  const hasConfidence = normalizedContent.some((text) => text.includes("aide") || text.includes("utile"));
  const hasDoubt = normalizedContent.some((text) => text.includes("doute") || text.includes("hesit") || text.includes("peur"));
  if (hasConfidence && hasDoubt) {
    contrastsDetected.push("utilite percue vs hesitations");
  }

  const density =
    quality === "exploitable" ? "bonne" : quality === "partiel" ? "moyenne" : "faible";
  const concreteLevel =
    scores.concrete_score >= 2 ? "bon" : scores.concrete_score === 1 ? "encore limite" : "trop faible";

  const teacherComment =
    quality === "exploitable"
      ? "Le persona fournit deja des passages mobilisables, avec des pratiques, des situations et au moins quelques tensions analytiques interessantes."
      : quality === "partiel"
        ? "Le materiau devient utile, mais il reste inegal : certains passages sont concrets, d'autres encore trop generaux."
        : "Le materiau reste trop pauvre pour une analyse solide : il manque surtout des situations precises et des reponses plus developpees.";

  return {
    density,
    concrete_level: concreteLevel,
    contrasts_detected: contrastsDetected,
    teacher_comment: teacherComment,
  };
}

function buildThemeCoverage(studentMessages: Message[]): InterviewAnalysis["theme_coverage"] {
  const items = THEME_KEYWORDS.map(({ theme, patterns }) => {
    const evidence = studentMessages
      .filter((message) => patterns.some((pattern) => pattern.test(message.content)))
      .slice(0, 2)
      .map((message) => truncate(message.content, 110));

    return {
      theme,
      coverage_status:
        evidence.length >= 2 ? "couvert" : evidence.length === 1 ? "partiel" : "non_aborde",
      evidence,
    } as const;
  });

  return {
    themes_covered: items.filter((item) => item.coverage_status === "couvert").map((item) => item.theme),
    themes_partial: items.filter((item) => item.coverage_status === "partiel").map((item) => item.theme),
    themes_missing: items.filter((item) => item.coverage_status === "non_aborde").map((item) => item.theme),
    items: items.map((item) => ({
      theme: item.theme,
      coverage_status: item.coverage_status,
      evidence: item.evidence,
    })),
  };
}

function buildExamples(interviewerMessages: Message[], studentMessages: Message[]): InterviewAnalysis["examples"] {
  const goodQuestions = interviewerMessages
    .filter((message) => OPEN_QUESTION_PATTERNS.some((pattern) => pattern.test(message.content)) && countWords(message.content) >= 5)
    .slice(0, 2)
    .map((message) => truncate(message.content, 120));

  const weakQuestions = interviewerMessages
    .filter((message) => {
      const normalized = normalizeText(message.content);
      return countWords(normalized) <= 4 || NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
    })
    .slice(0, 2)
    .map((message) => truncate(message.content, 120));

  const strongVerbatims = studentMessages
    .filter((message) => countWords(message.content) >= 20 && CONCRETE_PATTERNS.some((pattern) => pattern.test(message.content)))
    .slice(0, 2)
    .map((message) => truncate(message.content, 160));

  const weakMaterialExamples = studentMessages
    .filter((message) => countWords(message.content) < 10)
    .slice(0, 2)
    .map((message) => truncate(message.content, 120));

  return {
    good_questions: goodQuestions,
    weak_questions: weakQuestions,
    strong_verbatims: strongVerbatims,
    weak_material_examples: weakMaterialExamples,
  };
}

function buildAlerts(
  weakMessageSignals: number,
  repeatedQuestionSignals: number,
  studentMessages: Message[]
): InterviewAnalysis["alerts"] {
  const alerts: NonNullable<InterviewAnalysis["alerts"]> = [];
  const emptyStudentMaterial = studentMessages.length === 0;

  if (emptyStudentMaterial) {
    alerts.push({
      severity: "blocking",
      type: "no_student_material",
      message: "Le persona n'a pas encore produit de materiau exploitable.",
    });
  }

  if (weakMessageSignals >= 2) {
    alerts.push({
      severity: weakMessageSignals >= 3 ? "blocking" : "warning",
      type: "noise_detected",
      message: "Plusieurs messages ressemblent a des tests, a du bruit, ou a des questions trop faibles.",
    });
  }

  if (repeatedQuestionSignals >= 1) {
    alerts.push({
      severity: "warning",
      type: "repetition",
      message: "Certaines questions se repetent sans reel approfondissement.",
    });
  }

  return alerts;
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
  const followUpSignals = detectFollowUpSignals(interviewerMessages);
  const weakMessageSignals = detectWeakMessageSignals(interviewerMessages);
  const repeatedQuestionSignals = detectRepeatedQuestionSignals(interviewerMessages);
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
  const questionStyle = describeQuestionStyle(
    openQuestionRatioPercent,
    weakMessageSignals,
    interviewerMessages.length
  );
  const followUpQuality = describeFollowUpQuality(
    followUpSignals,
    repeatedQuestionSignals,
    interviewerMessages.length
  );
  const alerts = buildAlerts(weakMessageSignals, repeatedQuestionSignals, studentMessages);

  return {
    material_quality: materialQuality,
    summary_line: feedback.summary_line,
    feedback_title: feedback.feedback_title,
    feedback_text: feedback.feedback_text,
    strengths: buildStrengths(materialQuality, scoreBreakdown),
    limits: buildLimits(materialQuality, scoreBreakdown),
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
    interview_conduct: {
      question_style: questionStyle,
      follow_up_quality: followUpQuality,
      noise_detected: weakMessageSignals >= 2,
      repeated_question_signals: repeatedQuestionSignals,
      weak_message_signals: weakMessageSignals,
      teacher_comment: buildConductTeacherComment(questionStyle, followUpQuality, weakMessageSignals >= 2),
    },
    material_reading: buildMaterialReading(materialQuality, scoreBreakdown, studentMessages),
    theme_coverage: buildThemeCoverage(studentMessages),
    examples: buildExamples(interviewerMessages, studentMessages),
    alerts,
  };
}
