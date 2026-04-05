import { describe, it, expect } from "vitest";
import { authConfig } from "../auth.config";

describe("authConfig callbacks", () => {
  describe("jwt callback", () => {
    it("adds id and role to token when user is present", async () => {
      const token = { sub: "abc" } as Record<string, unknown>;
      const user = { id: "user-1", role: "ADMIN" } as Record<string, unknown>;

      const result = await authConfig.callbacks.jwt({
        token,
        user,
        account: null,
        trigger: "signIn",
      } as Parameters<typeof authConfig.callbacks.jwt>[0]);

      expect(result.id).toBe("user-1");
      expect(result.role).toBe("ADMIN");
    });

    it("preserves token when no user is present", async () => {
      const token = { sub: "abc", id: "user-1", role: "MEMBER" } as Record<
        string,
        unknown
      >;

      const result = await authConfig.callbacks.jwt({
        token,
        user: undefined,
        account: null,
        trigger: "update",
      } as Parameters<typeof authConfig.callbacks.jwt>[0]);

      expect(result.id).toBe("user-1");
      expect(result.role).toBe("MEMBER");
    });
  });

  describe("session callback", () => {
    it("adds id and role from token to session user", async () => {
      const session = {
        user: { id: "", email: "a@b.com", name: "Alice", role: "" },
        expires: "2099-01-01",
      } as Parameters<typeof authConfig.callbacks.session>[0]["session"];
      const token = {
        id: "user-1",
        role: "ADMIN",
      } as Parameters<typeof authConfig.callbacks.session>[0]["token"];

      const result = await authConfig.callbacks.session({
        session,
        token,
      } as Parameters<typeof authConfig.callbacks.session>[0]);

      expect(result.user.id).toBe("user-1");
      expect(result.user.role).toBe("ADMIN");
    });
  });
});
