import { useEffect, useState } from "react";
import type { InterviewAnalysis } from "@/lib/schemas";

type UseInterviewAnalysisArgs = {
  interviewId: string | null;
  enabled?: boolean;
  refreshKey?: number;
};

export function useInterviewAnalysis({
  interviewId,
  enabled = true,
  refreshKey = 0,
}: UseInterviewAnalysisArgs) {
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  useEffect(() => {
    async function loadAnalysis() {
      if (!enabled || !interviewId) {
        setAnalysis(null);
        setAnalysisError(null);
        setIsAnalysisLoading(false);
        return;
      }

      try {
        setIsAnalysisLoading(true);
        setAnalysisError(null);

        const response = await fetch(`/api/interviews/analysis?interviewId=${interviewId}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = payload?.error ?? response.statusText;
          throw new Error(message);
        }

        const payload = (await response.json().catch(() => null)) as
          | { analysis?: InterviewAnalysis }
          | null;

        if (!payload?.analysis) {
          throw new Error("Interview analysis missing from response");
        }

        setAnalysis(payload.analysis);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Interview] Failed to load analysis:", message);
        setAnalysisError(`Failed to load interview analysis: ${message}`);
      } finally {
        setIsAnalysisLoading(false);
      }
    }

    loadAnalysis();
  }, [enabled, interviewId, refreshKey]);

  return {
    analysis,
    analysisError,
    isAnalysisLoading,
  };
}
