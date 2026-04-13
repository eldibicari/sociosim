import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

function buildSidebarProps() {
  return {
    agentDisplayName: "Oriane",
    agentId: "agent-oriane",
    userId: "test-user-123",
    agentDescription: "Master 1 EOS",
    userName: "Test User",
    dateDisplay: "18/01/2026",
    stats: { answeredQuestions: 2, inputTokens: 10, outputTokens: 20 },
    historyUserId: "test-user-123",
    currentInterviewId: "interview-123",
    onExportPdf: vi.fn(),
  };
}

function mockBaseFetch(interviews: unknown[] = []) {
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
        json: async () => ({ interviews }),
      });
    }

    if (typeof input === "string" && input === "/api/sessions" && init?.method === "POST") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          interviewId: "interview-456",
          sessionId: "session-789",
          adkSessionId: "adk-session-999",
        }),
      });
    }

    if (typeof input === "string" && input === "/api/interviews/interview-456" && init?.method === "DELETE") {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    }

    return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`));
  });
}

const historyFixtures = [
  {
    id: "interview-123",
    agent_id: "agent-oriane",
    updated_at: "2025-12-29T10:30:00Z",
    agents: { agent_name: "oriane" },
    messages: [
      {
        role: "user",
        content: "Pouvez-vous me parler de votre memoire ?",
        created_at: "2025-12-29T10:00:00Z",
      },
      { role: "assistant", content: "Oui", created_at: "2025-12-29T10:01:00Z" },
      { role: "assistant", content: "Bien sur", created_at: "2025-12-29T10:02:00Z" },
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
];

describe("InterviewSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(useRouter).mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts a new interview from the create button", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockBaseFetch();

    renderWithChakra(<InterviewSidebar {...buildSidebarProps()} />);

    await user.click(screen.getByRole("button", { name: "Nouvel entretien" }));

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

  it("shows the current chat and recents with generated titles", async () => {
    mockBaseFetch(historyFixtures);

    renderWithChakra(<InterviewSidebar {...buildSidebarProps()} />);

    expect(await screen.findByText("Chat en cours")).toBeInTheDocument();
    expect(await screen.findByText("Recents")).toBeInTheDocument();
    expect(await screen.findByText(/Pouvez-vous me parler de votre memoire/i)).toBeInTheDocument();
    expect(await screen.findByText(/Comment utilisez-vous ChatGPT/i)).toBeInTheDocument();
    expect(screen.getByText("Actuel")).toBeInTheDocument();
  });

  it("renames and pins a chat from its menu", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.stubGlobal("prompt", vi.fn(() => "Chat these memo"));
    mockBaseFetch(historyFixtures);

    renderWithChakra(<InterviewSidebar {...buildSidebarProps()} />);

    expect(await screen.findByText(/Comment utilisez-vous ChatGPT/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actions du chat Comment utilisez-vous ChatGPT/i }));
    await user.click(screen.getByText("Renommer"));

    expect(await screen.findByText("Chat these memo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actions du chat Chat these memo/i }));
    await user.click(screen.getByText("Epingler"));

    expect(await screen.findByText("Epingles")).toBeInTheDocument();
    expect(screen.getAllByText("Chat these memo").length).toBeGreaterThan(0);
  });

  it("deletes a chat from its menu", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.stubGlobal("confirm", vi.fn(() => true));
    mockBaseFetch(historyFixtures);

    renderWithChakra(<InterviewSidebar {...buildSidebarProps()} />);

    expect(await screen.findByText(/Comment utilisez-vous ChatGPT/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actions du chat Comment utilisez-vous ChatGPT/i }));
    await user.click(screen.getByText("Supprimer"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/interviews/interview-456", { method: "DELETE" });
    });

    await waitFor(() => {
      expect(screen.queryByText(/Comment utilisez-vous ChatGPT/i)).not.toBeInTheDocument();
    });
  });

  it("renders export and help actions", async () => {
    const onExportPdf = vi.fn();
    const onExportGoogleDocs = vi.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockBaseFetch();

    renderWithChakra(
      <InterviewSidebar
        {...buildSidebarProps()}
        onExportPdf={onExportPdf}
        onExportGoogleDocs={onExportGoogleDocs}
      />
    );

    await user.click(screen.getByRole("button", { name: /PDF/i }));
    expect(onExportPdf).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Google Docs/i }));
    expect(onExportGoogleDocs).toHaveBeenCalled();

    expect(screen.getByRole("button", { name: "Aide pour l'entretien" })).toBeInTheDocument();
  });
});
