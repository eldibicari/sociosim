import { z } from "zod";

export const PersonaDifficultySchema = z.enum(["facile", "intermediaire", "difficile"]);
export type PersonaDifficulty = z.infer<typeof PersonaDifficultySchema>;

export const PersonaSubjectPositionSchema = z.enum([
  "favorable",
  "ambivalent",
  "reticent",
  "conflictuel",
]);
export type PersonaSubjectPosition = z.infer<typeof PersonaSubjectPositionSchema>;

export const PersonaVerbositySchema = z.enum(["concis", "equilibre", "bavard"]);
export const PersonaStanceSchema = z.enum(["direct", "prudent"]);
export const PersonaCooperationSchema = z.enum(["cooperatif", "mefiant"]);
export const PersonaConsistencySchema = z.enum(["stable", "contradictoire"]);
export const PersonaAffectSchema = z.enum(["factuel", "emotionnel"]);

export const PersonaIdentitySchema = z.object({
  firstName: z.string().min(1),
  age: z.string().optional(),
  gender: z.string().optional(),
  role: z.string().optional(),
  socialEnvironment: z.string().optional(),
  livingContext: z.string().optional(),
  educationLevel: z.string().optional(),
});
export type PersonaIdentity = z.infer<typeof PersonaIdentitySchema>;

export const PersonaSubjectRelationSchema = z.object({
  position: PersonaSubjectPositionSchema,
  involvementLevel: z.string().optional(),
  politicizationLevel: z.string().optional(),
  keyTensions: z.array(z.string()).default([]),
});
export type PersonaSubjectRelation = z.infer<typeof PersonaSubjectRelationSchema>;

export const PersonaInteractionStyleSchema = z.object({
  verbosity: PersonaVerbositySchema,
  stance: PersonaStanceSchema,
  cooperation: PersonaCooperationSchema,
  consistency: PersonaConsistencySchema,
  affect: PersonaAffectSchema,
});
export type PersonaInteractionStyle = z.infer<typeof PersonaInteractionStyleSchema>;

export const PersonaLanguageSchema = z.object({
  register: z.string(),
  averageAnswerLength: z.string(),
  tone: z.string(),
  vocabularyLevel: z.string(),
});
export type PersonaLanguage = z.infer<typeof PersonaLanguageSchema>;

export const PersonaConfigSchema = z.object({
  identity: PersonaIdentitySchema,
  subjectRelation: PersonaSubjectRelationSchema,
  interactionStyle: PersonaInteractionStyleSchema,
  difficulty: PersonaDifficultySchema,
  sensitiveZones: z.array(z.string()).default([]),
  language: PersonaLanguageSchema,
  additionalInstructions: z.string().optional(),
});
export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;

export const PersonaPromptBlueprintSchema = z.object({
  identityBlock: z.string(),
  socialContextBlock: z.string(),
  subjectPostureBlock: z.string(),
  conversationBehaviorBlock: z.string(),
  difficultyBlock: z.string(),
  coherenceGuardsBlock: z.string(),
  responseRulesBlock: z.string(),
});
export type PersonaPromptBlueprint = z.infer<typeof PersonaPromptBlueprintSchema>;

export const GridCoverageStatusSchema = z.enum(["non_aborde", "partiel", "couvert"]);
export type GridCoverageStatus = z.infer<typeof GridCoverageStatusSchema>;

export const GridQuestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  intent: z.string().optional(),
  followUps: z.array(z.string()).default([]),
});
export type GridQuestion = z.infer<typeof GridQuestionSchema>;

export const GridThemeSchema = z.object({
  id: z.string(),
  title: z.string(),
  objective: z.string(),
  questions: z.array(GridQuestionSchema).default([]),
});
export type GridTheme = z.infer<typeof GridThemeSchema>;

export const InterviewGridSchema = z.object({
  title: z.string(),
  objective: z.string(),
  themes: z.array(GridThemeSchema).default([]),
  notes: z.string().optional(),
});
export type InterviewGrid = z.infer<typeof InterviewGridSchema>;

export const InterviewGridCoverageSchema = z.object({
  themeId: z.string(),
  status: GridCoverageStatusSchema,
  evidence: z.array(z.string()).default([]),
  suggestedFollowUps: z.array(z.string()).default([]),
});
export type InterviewGridCoverage = z.infer<typeof InterviewGridCoverageSchema>;

export const InterviewSessionMethodStateSchema = z.object({
  gridId: z.string().optional(),
  coverage: z.array(InterviewGridCoverageSchema).default([]),
  suggestedFollowUps: z.array(z.string()).default([]),
});
export type InterviewSessionMethodState = z.infer<typeof InterviewSessionMethodStateSchema>;

export const InterviewMethodAnalysisSchema = z.object({
  syntheticSummary: z.string(),
  methodologicalAnalysis: z.string(),
  salientVerbatims: z.array(
    z.object({
      themeId: z.string().optional(),
      quote: z.string(),
      comment: z.string().optional(),
    })
  ).default([]),
  gridCoverage: z.array(InterviewGridCoverageSchema).default([]),
});
export type InterviewMethodAnalysis = z.infer<typeof InterviewMethodAnalysisSchema>;

export const ExportPayloadSchema = z.object({
  interviewId: z.string(),
  personaConfig: PersonaConfigSchema.optional(),
  interviewGrid: InterviewGridSchema.optional(),
  methodAnalysis: InterviewMethodAnalysisSchema.optional(),
  transcriptMarkdown: z.string().optional(),
});
export type ExportPayload = z.infer<typeof ExportPayloadSchema>;
