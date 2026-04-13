import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { fetchInterviewExportData } from "@/lib/interviewExport";
import { analyzeInterviewMessages } from "@/lib/interviewAnalysis";

vi.mock("@/lib/interviewExport", () => ({
  InterviewExportError: class InterviewExportError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  fetchInterviewExportData: vi.fn(),
}));

vi.mock("@/lib/interviewAnalysis", () => ({
  analyzeInterviewMessages: vi.fn(),
}));

vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from("pdf")),
      }),
      close: vi.fn(),
    }),
  },
}));

const mockFetchInterviewExportData = vi.mocked(fetchInterviewExportData);
const mockAnalyzeInterviewMessages = vi.mocked(analyzeInterviewMessages);

describe("GET /api/interviews/analysis/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when interviewId is missing", async () => {
    const response = await GET(new NextRequest("http://localhost/api/interviews/analysis/export"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ error: "Missing 'interviewId' query parameter" });
  });

  it("returns a pdf response", async () => {
    mockFetchInterviewExportData.mockResolvedValue({
      interviewId: "interview-1",
      agentId: "agent-1",
      agentName: "Jade",
      agentDescription: "Persona de test",
      interviewDate: "13/04/2026 10:00",
      userName: "Eldi",
      userEmail: "eldi@example.com",
      primarySessionId: "session-1",
      messages: [],
      promptMarkdown: null,
      totalInputTokens: 120,
      totalOutputTokens: 340,
      totalTokens: 460,
    });

    mockAnalyzeInterviewMessages.mockReturnValue({
      material_quality: "partiel",
      summary_line: "Base encore inegale : 3 reponses etudiantes, 140 mots, 1 exemple concret.",
      feedback_title: "Materiau partiellement exploitable",
      feedback_text: "Le materiau commence a devenir utilisable, mais plusieurs zones restent encore trop generales.",
      strengths: ["Des reponses commencent a se developper."],
      limits: ["Le niveau de concret reste inegal."],
      next_steps: ["Demander un exemple recent et detaille."],
      coaching_tip: "Creuse une situation deja evoquee.",
      metrics: {
        student_messages: 3,
        student_words: 140,
        avg_words_per_answer: 47,
        long_answers: 2,
        concrete_examples: 1,
        open_question_ratio_percent: 67,
        total_tokens: 460,
      },
      score_breakdown: {
        volume_score: 2,
        depth_score: 2,
        concrete_score: 1,
        openness_score: 2,
        total_score: 7,
        max_score: 12,
      },
      signals: {
        interviewer_message_count: 3,
        student_message_count: 3,
        total_student_words: 140,
        average_student_words: 47,
        long_student_answers: 2,
        short_student_answers: 1,
        concrete_example_signals: 1,
        open_question_signals: 2,
        open_question_ratio_percent: 67,
        total_input_tokens: 120,
        total_output_tokens: 340,
        total_tokens: 460,
      },
      interview_conduct: {
        question_style: "plutot ouvert",
        follow_up_quality: "correcte",
        noise_detected: false,
        repeated_question_signals: 0,
        weak_message_signals: 0,
        teacher_comment: "Les questions permettent deja un premier recit.",
      },
      material_reading: {
        density: "moyenne",
        concrete_level: "partiel",
        contrasts_detected: [],
        teacher_comment: "Le materiau demande encore a etre precise.",
      },
      theme_coverage: {
        themes_covered: ["usages concrets de l'IA"],
        themes_partial: ["rapport au travail universitaire"],
        themes_missing: ["doutes et hesitations"],
        items: [],
      },
      examples: {
        good_questions: ["Peux-tu me raconter une situation recente ?"],
        weak_questions: [],
        strong_verbatims: ["J'utilise ChatGPT pour reformuler mes plans."],
        weak_material_examples: [],
      },
      alerts: [],
    });

    const response = await GET(
      new NextRequest("http://localhost/api/interviews/analysis/export?interviewId=interview-1")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });
});
