import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockAuth, mockSignIn, mockSignOut } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  mockAuth: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
  signIn: mockSignIn,
  signOut: mockSignOut,
}));

import { register, login, logout, promoteToAdmin } from "../auth-actions";

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("register", () => {
  it("returns error when email is missing", async () => {
    const result = await register(undefined, makeFormData({ password: "pass" }));
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("returns error when password is missing", async () => {
    const result = await register(undefined, makeFormData({ email: "a@b.com" }));
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("returns error when email already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "1", email: "a@b.com" });
    const result = await register(
      undefined,
      makeFormData({ email: "a@b.com", password: "pass123" })
    );
    expect(result).toEqual({
      error: "An account with this email already exists",
    });
  });

  it("assigns ADMIN role to first user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.user.create.mockResolvedValue({});
    mockSignIn.mockResolvedValue(undefined);

    await expect(
      register(undefined, makeFormData({ email: "a@b.com", password: "pass123", name: "Alice" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "a@b.com",
        name: "Alice",
        hashedPassword: "hashed_password",
        role: "ADMIN",
      },
    });
  });

  it("assigns MEMBER role to subsequent users", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.count.mockResolvedValue(3);
    mockPrisma.user.create.mockResolvedValue({});
    mockSignIn.mockResolvedValue(undefined);

    await expect(
      register(undefined, makeFormData({ email: "b@b.com", password: "pass123" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "b@b.com",
        name: null,
        hashedPassword: "hashed_password",
        role: "MEMBER",
      },
    });
  });

  it("calls signIn after creating user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.user.create.mockResolvedValue({});
    mockSignIn.mockResolvedValue(undefined);

    await expect(
      register(undefined, makeFormData({ email: "a@b.com", password: "pass123" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "a@b.com",
      password: "pass123",
      redirect: false,
    });
  });
});

describe("login", () => {
  it("returns error when email is missing", async () => {
    const result = await login(undefined, makeFormData({ password: "pass" }));
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("returns error when password is missing", async () => {
    const result = await login(undefined, makeFormData({ email: "a@b.com" }));
    expect(result).toEqual({ error: "Email and password are required" });
  });

  it("returns error when signIn throws", async () => {
    mockSignIn.mockRejectedValue(new Error("CredentialsSignin"));
    const result = await login(
      undefined,
      makeFormData({ email: "a@b.com", password: "wrong" })
    );
    expect(result).toEqual({ error: "Invalid email or password" });
  });

  it("redirects to dashboard on success", async () => {
    mockSignIn.mockResolvedValue(undefined);
    await expect(
      login(undefined, makeFormData({ email: "a@b.com", password: "pass123" }))
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });
});

describe("logout", () => {
  it("calls signOut and redirects to login", async () => {
    mockSignOut.mockResolvedValue(undefined);
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
  });
});

describe("promoteToAdmin", () => {
  it("throws when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(promoteToAdmin("user-1")).rejects.toThrow("Unauthorized");
  });

  it("throws when user is not ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1", role: "MEMBER" } });
    await expect(promoteToAdmin("user-2")).rejects.toThrow("Unauthorized");
  });

  it("throws when target user not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(promoteToAdmin("nonexistent")).rejects.toThrow("User not found");
  });

  it("updates user role to ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-2", role: "MEMBER" });
    mockPrisma.user.update.mockResolvedValue({});

    await promoteToAdmin("user-2");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { role: "ADMIN" },
    });
  });
});
