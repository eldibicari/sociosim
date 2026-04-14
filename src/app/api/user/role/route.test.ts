import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

vi.mock("@/lib/supabaseServiceClient", () => ({
  createServiceSupabaseClient: vi.fn(),
}));
vi.mock("@/lib/supabaseAuthServer", () => ({
  getAuthenticatedUser: vi.fn(),
}));

const mockCreateServiceSupabaseClient = vi.mocked(createServiceSupabaseClient);
const mockGetAuthenticatedUser = vi.mocked(getAuthenticatedUser);

describe("GET /api/user/role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "user-123" } as never,
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ user: null, error: null });

    const response = await GET(new NextRequest("http://localhost/api/user/role"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ error: "Unauthorized" });
  });

  it("returns role for authenticated user", async () => {
    mockCreateServiceSupabaseClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof mockCreateServiceSupabaseClient>);

    const response = await GET(new NextRequest("http://localhost/api/user/role"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ role: "student" });
  });
});
