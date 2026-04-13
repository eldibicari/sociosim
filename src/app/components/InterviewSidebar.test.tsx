import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { InterviewSidebar } from "./InterviewSidebar";
import { mockRouter } from "@/test/mocks/router";

vi.mock("next/navigation");

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = MockResizeObserver;
}

function renderWithChakra(component: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{component}</ChakraProvider>);
}

describe("InterviewSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts a new interview from the create button", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    global.fetch = vi.fn().mockImplementation((input: RequestInfo) => {
      if (typeof input === "string" && input.startsWith("/docs/guide_entretien_court.md")) {
        return Promise.resolve({
          ok: true,
          text: async () => "Guide court",
        });
      }
      if (input === "/api/sessions") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            interviewId: "interview-456",
            sessionId: "session-789",
            adkSessionId: "adk-session-999",
          }),
        });
      }
      if (typeof input === "string" && input.startsWith("/api/user/interviews")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ interviews: [] }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch"));
    });

    renderWithChakra(
      <InterviewSidebar
        agentDisplayName="Oriane"
        agentId="agent-oriane"
        userId="test-user-123"
        agentDescription="Master 1 EOS"
        userName="Test User"
        dateDisplay="18/01/2026"
        stats={{ answeredQuestions: 2, inputTokens: 10, outputTokens: 20 }}
        historyUserId="test-user-123"
        currentInterviewId="interview-123"
        onExportPdf={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Commencer un nouvel entretien" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sessions",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            userId: "test-user-123",
            agent_id: "agent-oriane",
          }),
        })
      );
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/interview?interviewId=interview-456&sessionId=session-789&adkSessionId=adk-session-999"
    );
  });

  it("shows structured history with generated chat titles", async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo) => {
      if (typeof input === "string" && input.startsWith("/docs/guide_entretien_court.md")) {
        return Promise.resolve({
          ok: true,
          text: async () => "Guide court",
        });
      }
      if (typeof input === "string" && input.startsWith("/api/user/interviews")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            interviews: [
              {
                id: "interview-123",
                agent_id: "agent-oriane",
                updated_at: "2025-12-29T10:30:00Z",
                agents: { agent_name: "oriane" },
                messages: [
                  {
                    role: "user",
                    content: "Pouvez-vous me parler de votre mémoire ?",
                    created_at: "2025-12-29T10:00:00Z",
                  },
                  { role: "assistant", content: "Oui", created_at: "2025-12-29T10:01:00Z" },
                  { role: "assistant", content: "Bien sûr", created_at: "2025-12-29T10:02:00Z" },
                ],
              },
              {
                id: "interview-456",
                agent_id: "agent-oriane",
                updated_at: "2025-12-28T10:30:00Z",
                agents: { agent_name: "oriane" },
                messages: [
                  {
                    role: "user",
                    content: "Comment utilisez-vous ChatGPT ?",
                    created_at: "2025-12-28T10:00:00Z",
                  },
                  { role: "assistant", content: "Je l'utilise", created_at: "2025-12-28T10:01:00Z" },
                ],
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch"));
    });

    renderWithChakra(
      <InterviewSidebar
        agentDisplayName="Oriane"
        agentId="agent-oriane"
        userId="test-user-123"
        agentDescription="Master 1 EOS"
        userName="Test User"
        dateDisplay="18/01/2026"
        stats={{ answeredQuestions: 2, inputTokens: 10, outputTokens: 20 }}
        historyUserId="test-user-123"
        currentInterviewId="interview-123"
        onExportPdf={vi.fn()}
      />
    );

    expect(await screen.findByText("Chat en cours")).toBeInTheDocument();
    expect(await screen.findByText("Récents")).toBeInTheDocument();
    expect(await screen.findByText(/Pouvez-vous me parler de votre mémoire/i)).toBeInTheDocument();
    expect(await screen.findByText(/Comment utilisez-vous ChatGPT/i)).toBeInTheDocument();
    expect(await screen.findByText(/29\/12\/25 · 2 réponses/i)).toBeInTheDocument();
    expect(await screen.findByText(/28\/12\/25 · 1 réponses/i)).toBeInTheDocument();
    expect(screen.getByText("Actuel")).toBeInTheDocument();
  });

  it("deletes a chat from the sidebar", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.stubGlobal("confirm", vi.fn(() => true));

    global.fetch = vi.fn().mockImplementation((input: RequestInfo, init?: RequestInit) => {
      if (typeof input === "string" && input.startsWith("/docs/guide_entretien_court.md")) {
        return Promise.resolve({
          ok: true,
          text: async () => "Guide court",
        });
      }
      if (typeof input === "string" && input.startsWith("/api/user/interviews")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            interviews: [
              {
                id: "interview-123",
                agent_id: "agent-oriane",
                updated_at: "2025-12-29T10:30:00Z",
                agents: { agent_name: "oriane" },
                messages: [
                  { role: "user", content: "Premier chat", created_at: "2025-12-29T10:00:00Z" },
                  { role: "assistant", content: "Réponse", created_at: "2025-12-29T10:01:00Z" },
                ],
              },
              {
                id: "interview-456",
                agent_id: "agent-oriane",
                updated_at: "2025-12-28T10:30:00Z",
                agents: { agent_name: "oriane" },
                messages: [
                  { role: "user", content: "Chat à supprimer", created_at: "2025-12-28T10:00:00Z" },
                  { role: "assistant", content: "Réponse", created_at: "2025-12-28T10:01:00Z" },
                ],
              },
            ],
          }),
        });
      }
      if (typeof input === "string" && input === "/api/interviews/interview-456" && init?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch"));
    });

    renderWithChakra(
      <InterviewSidebar
        agentDisplayName="Oriane"
        agentId="agent-oriane"
        userId="test-user-123"
        agentDescription="Master 1 EOS"
        userName="Test User"
        dateDisplay="18/01/2026"
        stats={{ answeredQuestions: 2, inputTokens: 10, outputTokens: 20 }}
        historyUserId="test-user-123"
        currentInterviewId="interview-123"
        onExportPdf={vi.fn()}
      />
    );

    expect(await screen.findByText(/Chat à supprimer/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Supprimer le chat Chat à supprimer/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/interviews/interview-456", { method: "DELETE" });
    });

    await waitFor(() => {
      expect(screen.queryByText(/Chat à supprimer/i)).not.toBeInTheDocument();
    });
  });

  it("renders export and help actions", async () => {
    const onExportPdf = vi.fn();
    const onExportGoogleDocs = vi.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    global.fetch = vi.fn().mockImplementation((input: RequestInfo) => {
      if (typeof input === "string" && input.startsWith("/docs/guide_entretien_court.md")) {
        return Promise.resolve({
          ok: true,
          text: async () => "Guide court",
        });
      }
      if (typeof input === "string" && input.startsWith("/api/user/interviews")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ interviews: [] }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch"));
    });

    renderWithChakra(
      <InterviewSidebar
        agentDisplayName="Oriane"
        agentId="agent-oriane"
        userId="test-user-123"
        agentDescription="Master 1 EOS"
        userName="Test User"
        dateDisplay="18/01/2026"
        stats={{ answeredQuestions: 2, inputTokens: 10, outputTokens: 20 }}
        historyUserId="test-user-123"
        currentInterviewId="interview-123"
        onExportPdf={onExportPdf}
        onExportGoogleDocs={onExportGoogleDocs}
      />
    );

    await user.click(screen.getByRole("button", { name: "Exporter en PDF" }));
    expect(onExportPdf).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Exporter vers Google docs" }));
    expect(onExportGoogleDocs).toHaveBeenCalled();

    expect(screen.getByRole("button", { name: "Aide pour l'entretien" })).toBeInTheDocument();
  });

  it("shows agent description under the name", async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo) => {
      if (typeof input === "string" && input.startsWith("/docs/guide_entretien_court.md")) {
        return Promise.resolve({
          ok: true,
          text: async () => "Guide court",
        });
      }
      if (typeof input === "string" && input.startsWith("/api/user/interviews")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ interviews: [] }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch"));
    });

    renderWithChakra(
      <InterviewSidebar
        agentDisplayName="Oriane"
        agentId="agent-oriane"
        userId="test-user-123"
        agentDescription="Master 1 EOS"
        userName="Test User"
        dateDisplay="18/01/2026"
        stats={{ answeredQuestions: 2, inputTokens: 10, outputTokens: 20 }}
        historyUserId="test-user-123"
        currentInterviewId="interview-123"
        onExportPdf={vi.fn()}
      />
    );

    expect(await screen.findByText("Master 1 EOS")).toBeInTheDocument();
  });
});
