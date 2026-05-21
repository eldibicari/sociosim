import { useCallback, useState } from "react";

type InterviewSummary = {
  agentName: string;
};

type UseInterviewExportsArgs = {
  interviewId: string | null;
  interviewSummary: InterviewSummary | null;
  user: { id?: string | null } | null;
  setSummaryError?: (value: string | null) => void;
};

export function useInterviewExports({
  interviewId,
  interviewSummary,
  user,
  setSummaryError,
}: UseInterviewExportsArgs) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingGoogleDocs, setIsExportingGoogleDocs] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (!interviewId || !interviewSummary || !user) return;
    setIsExportingPdf(true);
    try {
      // Open the printable HTML in a new window; it auto-triggers print dialog
      window.open(
        `/api/interviews/export?interviewId=${interviewId}`,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setIsExportingPdf(false);
    }
  }, [interviewId, interviewSummary, user]);

  const handleExportGoogleDocs = useCallback(async () => {
    if (!interviewId || !interviewSummary || !user) return;
    setIsExportingGoogleDocs(true);
    setSummaryError?.(null);
    try {
      const response = await fetch("/api/interviews/export-google-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });

      if (response.status === 401) {
        const payload = await response.json().catch(() => null);
        if (payload?.requiresAuth) {
          window.location.href = `/api/auth/google/authorize?interviewId=${encodeURIComponent(interviewId)}`;
          return;
        }
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error ?? "Impossible d'exporter vers Google Docs.";
        throw new Error(message);
      }

      const payload = (await response.json().catch(() => null)) as
        | { documentUrl?: string }
        | null;
      if (!payload?.documentUrl) {
        throw new Error("Lien du document Google Docs manquant.");
      }

      window.open(payload.documentUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Interview] Google Docs export error:", message);
      setSummaryError?.("Impossible d'exporter vers Google Docs.");
    } finally {
      setIsExportingGoogleDocs(false);
    }
  }, [interviewId, interviewSummary, setSummaryError, user]);

  return {
    handleExportPdf,
    handleExportGoogleDocs,
    isExportingPdf,
    isExportingGoogleDocs,
  };
}
