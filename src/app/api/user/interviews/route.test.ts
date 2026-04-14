import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { interviews } from "@/lib/data";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

vi.mock("@/lib/data", () => ({
  interviews: {
    getUserInterviewsWithMessages: vi.fn(),
    getAllInterviewsWithMessages: vi.fn(),
  },
}));
vi.mock("@/lib/supabaseServiceClient", () => ({
  createServiceSupabaseClient: vi.fn(),
}));
vi.mock("@/lib/supabaseAuthServer", () => ({
  getAuthenticatedUser: vi.fn(),
}));

const mockGetUserInterviewsWithMessages = vi.mocked(
  interviews.getUserInterviewsWithMessages
);
const mockGetAllInterviewsWithMessages = vi.mocked(
  interviews.getAllInterviewsWithMessages
);
const mockCreateServiceSupabaseClient = vi.mocked(createServiceSupabaseClient);
const mockGetAuthenticatedUser = vi.mocked(getAuthenticatedUser);

describe("GET /api/user/interviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123" } as never,
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ user: null, error: null });

    const response = await GET(new NextRequest("http://localhost/api/user/interviews"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ error: "Unauthorized" });
  });

  it("returns interviews for the user", async () => {
    mockGetUserInterviewsWithMessages.mockResolvedValue([
      { id: "interview-1", messages: [] },
    ]);
    mockCreateServiceSupabaseClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServiceSupabaseClient>);

    const response = await GET(new NextRequest("http://localhost/api/user/interviews"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetUserInterviewsWithMessages).toHaveBeenCalledWith("test-user-123");
    expect(body).toMatchObject({
      success: true,
      interviews: [{ id: "interview-1", messages: [] }],
    });
  });

  it("returns all interviews for admin users", async () => {
    mockGetAllInterviewsWithMessages.mockResolvedValue([
      { id: "interview-2", messages: [] },
    ]);
    mockCreateServiceSupabaseClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServiceSupabaseClient>);

    const response = await GET(new NextRequest("http://localhost/api/user/interviews?userId=admin-123"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetAllInterviewsWithMessages).toHaveBeenCalledWith();
    expect(body).toMatchObject({
      success: true,
      interviews: [{ id: "interview-2", messages: [] }],
    });
  });
});
