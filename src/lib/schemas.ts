import { z } from "zod";

/**
 * Centralized database schemas using Zod
 * Single source of truth for types and validation
 */

// ============================================================================
// ENUMS
// ============================================================================

export const SessionStatusSchema = z.enum(["active", "ended", "abandoned", "error"]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const InterviewStatusSchema = z.enum(["in_progress", "completed", "abandoned", "error"]);
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;

export const MessageRoleSchema = z.enum(["user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MaterialQualitySchema = z.enum(["insuffisant", "partiel", "exploitable"]);
export type MaterialQuality = z.infer<typeof MaterialQualitySchema>;

// ============================================================================
// TABLE SCHEMAS
// ============================================================================

export const InterviewSchema = z.object({
  id: z.string().uuid(),
  status: InterviewStatusSchema,
  agent_id: z.string().uuid(),
  started_at: z.string().datetime({ offset: true }),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
export type Interview = z.infer<typeof InterviewSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  adk_session_id: z.string(),
  status: SessionStatusSchema,
  started_at: z.string().datetime({ offset: true }),
  ended_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
export type Session = z.infer<typeof SessionSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  input_tokens: z.number().int().nullable(),
  output_tokens: z.number().int().nullable(),
  created_at: z.string().datetime({ offset: true }),
});
export type Message = z.infer<typeof MessageSchema>;

export const InterviewUsageSchema = z.object({
  id: z.string().uuid(),
  interview_id: z.string().uuid(),
  total_input_tokens: z.number().int(),
  total_output_tokens: z.number().int(),
  estimated_cost_usd: z.number().nullable(),
  updated_at: z.string().datetime({ offset: true }),
});
export type InterviewUsage = z.infer<typeof InterviewUsageSchema>;

export const InterviewAnalysisSignalsSchema = z.object({
  interviewer_message_count: z.number().int().nonnegative(),
  student_message_count: z.number().int().nonnegative(),
  total_student_words: z.number().int().nonnegative(),
  average_student_words: z.number().int().nonnegative(),
  long_student_answers: z.number().int().nonnegative(),
  short_student_answers: z.number().int().nonnegative(),
  concrete_example_signals: z.number().int().nonnegative(),
  open_question_signals: z.number().int().nonnegative(),
  open_question_ratio_percent: z.number().int().nonnegative(),
  total_input_tokens: z.number().int().nonnegative(),
  total_output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});
export type InterviewAnalysisSignals = z.infer<typeof InterviewAnalysisSignalsSchema>;

export const InterviewAnalysisMetricsSchema = z.object({
  student_messages: z.number().int().nonnegative(),
  student_words: z.number().int().nonnegative(),
  avg_words_per_answer: z.number().int().nonnegative(),
  long_answers: z.number().int().nonnegative(),
  concrete_examples: z.number().int().nonnegative(),
  open_question_ratio_percent: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});
export type InterviewAnalysisMetrics = z.infer<typeof InterviewAnalysisMetricsSchema>;

export const InterviewAnalysisScoreBreakdownSchema = z.object({
  volume_score: z.number().int().min(0).max(3),
  depth_score: z.number().int().min(0).max(3),
  concrete_score: z.number().int().min(0).max(3),
  openness_score: z.number().int().min(0).max(3),
  total_score: z.number().int().min(0).max(12),
  max_score: z.literal(12),
});
export type InterviewAnalysisScoreBreakdown = z.infer<typeof InterviewAnalysisScoreBreakdownSchema>;

export const ThemeCoverageStatusSchema = z.enum(["non_aborde", "partiel", "couvert"]);
export type ThemeCoverageStatus = z.infer<typeof ThemeCoverageStatusSchema>;

export const InterviewAlertSeveritySchema = z.enum(["info", "warning", "blocking"]);
export type InterviewAlertSeverity = z.infer<typeof InterviewAlertSeveritySchema>;

export const InterviewAnalysisConductSchema = z.object({
  question_style: z.string(),
  follow_up_quality: z.string(),
  noise_detected: z.boolean(),
  repeated_question_signals: z.number().int().nonnegative(),
  weak_message_signals: z.number().int().nonnegative(),
  teacher_comment: z.string(),
});
export type InterviewAnalysisConduct = z.infer<typeof InterviewAnalysisConductSchema>;

export const InterviewAnalysisMaterialReadingSchema = z.object({
  density: z.string(),
  concrete_level: z.string(),
  contrasts_detected: z.array(z.string()),
  teacher_comment: z.string(),
});
export type InterviewAnalysisMaterialReading = z.infer<typeof InterviewAnalysisMaterialReadingSchema>;

export const InterviewAnalysisThemeCoverageItemSchema = z.object({
  theme: z.string(),
  coverage_status: ThemeCoverageStatusSchema,
  evidence: z.array(z.string()),
});
export type InterviewAnalysisThemeCoverageItem = z.infer<typeof InterviewAnalysisThemeCoverageItemSchema>;

export const InterviewAnalysisThemeCoverageSchema = z.object({
  themes_covered: z.array(z.string()),
  themes_partial: z.array(z.string()),
  themes_missing: z.array(z.string()),
  items: z.array(InterviewAnalysisThemeCoverageItemSchema),
});
export type InterviewAnalysisThemeCoverage = z.infer<typeof InterviewAnalysisThemeCoverageSchema>;

export const InterviewAnalysisExamplesSchema = z.object({
  good_questions: z.array(z.string()),
  weak_questions: z.array(z.string()),
  strong_verbatims: z.array(z.string()),
  weak_material_examples: z.array(z.string()),
});
export type InterviewAnalysisExamples = z.infer<typeof InterviewAnalysisExamplesSchema>;

export const InterviewAnalysisAlertSchema = z.object({
  severity: InterviewAlertSeveritySchema,
  type: z.string(),
  message: z.string(),
});
export type InterviewAnalysisAlert = z.infer<typeof InterviewAnalysisAlertSchema>;

export const InterviewAnalysisSchema = z.object({
  material_quality: MaterialQualitySchema,
  summary_line: z.string(),
  feedback_title: z.string(),
  feedback_text: z.string(),
  strengths: z.array(z.string()),
  limits: z.array(z.string()),
  next_steps: z.array(z.string()),
  coaching_tip: z.string(),
  metrics: InterviewAnalysisMetricsSchema,
  score_breakdown: InterviewAnalysisScoreBreakdownSchema,
  signals: InterviewAnalysisSignalsSchema,
  interview_conduct: InterviewAnalysisConductSchema.optional(),
  material_reading: InterviewAnalysisMaterialReadingSchema.optional(),
  theme_coverage: InterviewAnalysisThemeCoverageSchema.optional(),
  examples: InterviewAnalysisExamplesSchema.optional(),
  alerts: z.array(InterviewAnalysisAlertSchema).optional(),
});
export type InterviewAnalysis = z.infer<typeof InterviewAnalysisSchema>;

export const UserInterviewSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  interview_id: z.string().uuid(),
  session_id: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
export type UserInterviewSession = z.infer<typeof UserInterviewSessionSchema>;

// ============================================================================
// INSERT SCHEMAS (for creating new records - omit auto-generated fields)
// ============================================================================

export const InterviewInsertSchema = InterviewSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InterviewInsert = z.infer<typeof InterviewInsertSchema>;

export const SessionInsertSchema = SessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type SessionInsert = z.infer<typeof SessionInsertSchema>;

export const MessageInsertSchema = MessageSchema.omit({
  id: true,
  created_at: true,
});
export type MessageInsert = z.infer<typeof MessageInsertSchema>;

export const UserInterviewSessionInsertSchema = UserInterviewSessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type UserInterviewSessionInsert = z.infer<typeof UserInterviewSessionInsertSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a database response matches our schema
 */
export function validateInterview(data: unknown): Interview {
  return InterviewSchema.parse(data);
}

export function validateSession(data: unknown): Session {
  return SessionSchema.parse(data);
}

export function validateMessage(data: unknown): Message {
  return MessageSchema.parse(data);
}

export function validateInterviewUsage(data: unknown): InterviewUsage {
  return InterviewUsageSchema.parse(data);
}

export function validateUserInterviewSession(data: unknown): UserInterviewSession {
  return UserInterviewSessionSchema.parse(data);
}

/**
 * Validate arrays
 */
export function validateMessages(data: unknown): Message[] {
  return z.array(MessageSchema).parse(data);
}

export function validateInterviews(data: unknown): Interview[] {
  return z.array(InterviewSchema).parse(data);
}
