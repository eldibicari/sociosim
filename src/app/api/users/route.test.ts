import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
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

const adminProfileClient = {
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
      }),
    }),
  }),
} as unknown as ReturnType<typeof createServiceSupabaseClient>;

describe("GET /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "admin-1" } as Awaited<ReturnType<typeof getAuthenticatedUser>>["user"],
      error: null,
    });
  });

  it("returns users list", async () => {
    mockCreateServiceSupabaseClient.mockReturnValueOnce(adminProfileClient).mockReturnValueOnce({
      from: () => ({
        select: () => ({
          data: [
            {
              id: "user-1",
              name: "Admin User",
              email: "admin@example.com",
              role: "admin",
              is_banned: false,
            },
          ],
          error: null,
        }),
      }),
    } as unknown as ReturnType<typeof mockCreateServiceSupabaseClient>);

    const response = await GET(new NextRequest("http://localhost/api/users"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      users: [
        {
          id: "user-1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          is_banned: false,
        },
      ],
    });
  });

  it("returns 500 when profile query fails", async () => {
    mockCreateServiceSupabaseClient.mockReturnValueOnce(adminProfileClient).mockReturnValueOnce({
      from: () => ({
        select: () => ({
          data: null,
          error: { message: "boom" },
        }),
      }),
    } as unknown as ReturnType<typeof mockCreateServiceSupabaseClient>);

    const response = await GET(new NextRequest("http://localhost/api/users"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ error: "Impossible de charger les utilisateurs." });
  });

  it("invites a user", async () => {
    const inviteUserByEmail = vi.fn().mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });

    mockCreateServiceSupabaseClient.mockReturnValueOnce(adminProfileClient).mockReturnValueOnce({
      auth: {
        admin: {
          inviteUserByEmail,
        },
      },
      from: () => ({
        upsert,
      }),
    } as unknown as ReturnType<typeof mockCreateServiceSupabaseClient>);

    const request = new NextRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", name: "New User", isAdmin: true }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(inviteUserByEmail).toHaveBeenCalledWith("new@example.com", expect.any(Object));
    expect(upsert).toHaveBeenCalled();
    expect(body).toMatchObject({
      user: {
        id: "user-2",
        name: "New User",
        email: "new@example.com",
        role: "admin",
        is_banned: false,
      },
    });
  });
});
