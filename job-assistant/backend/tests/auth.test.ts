import { describe, it, expect, vi } from "vitest";
import { agent, signupAndLogin } from "./helpers.js";
import { sendPasswordResetEmail } from "../src/lib/mail.js";

vi.mock("../src/lib/mail.js", () => ({
  sendLoginNotificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
}));

describe("POST /api/auth/signup", () => {
  it("creates a user, sets a session cookie, and returns the user", async () => {
    const client = agent();
    const res = await client
      .post("/api/auth/signup")
      .send({ email: "new-user@example.com", password: "password123", name: "New User" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "new-user@example.com", name: "New User" });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/session_id=/);
  });

  it("rejects a duplicate email", async () => {
    await signupAndLogin({ email: "dupe@example.com" });

    const client = agent();
    const res = await client
      .post("/api/auth/signup")
      .send({ email: "dupe@example.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("rejects an invalid payload", async () => {
    const client = agent();
    const res = await client.post("/api/auth/signup").send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await signupAndLogin({ email: "login-user@example.com", password: "password123" });

    const client = agent();
    const res = await client
      .post("/api/auth/login")
      .send({ email: "login-user@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("login-user@example.com");
  });

  it("rejects an unknown email", async () => {
    const client = agent();
    const res = await client
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("rejects the wrong password", async () => {
    await signupAndLogin({ email: "wrongpass@example.com", password: "password123" });

    const client = agent();
    const res = await client
      .post("/api/auth/login")
      .send({ email: "wrongpass@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user when authenticated", async () => {
    const { agent: client, email } = await signupAndLogin();

    const res = await client.get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await agent().get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session so /me becomes unauthenticated", async () => {
    const { agent: client } = await signupAndLogin();

    const logoutRes = await client.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const meRes = await client.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});

describe("POST /api/auth/forgot-password + reset-password", () => {
  it("issues a reset token and allows resetting the password with it", async () => {
    const { email } = await signupAndLogin({ email: "reset-user@example.com", password: "oldpassword1" });

    const forgotRes = await agent().post("/api/auth/forgot-password").send({ email });
    expect(forgotRes.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalled();

    const resetUrl = vi.mocked(sendPasswordResetEmail).mock.calls.at(-1)![1];
    const token = new URL(resetUrl).searchParams.get("token")!;

    const resetRes = await agent().post("/api/auth/reset-password").send({ token, password: "newpassword1" });
    expect(resetRes.status).toBe(200);

    const loginRes = await agent().post("/api/auth/login").send({ email, password: "newpassword1" });
    expect(loginRes.status).toBe(200);
  });

  it("responds the same way for an unregistered email (no user enumeration)", async () => {
    const res = await agent().post("/api/auth/forgot-password").send({ email: "ghost@example.com" });
    expect(res.status).toBe(200);
  });

  it("rejects an invalid or expired reset token", async () => {
    const res = await agent()
      .post("/api/auth/reset-password")
      .send({ token: "not-a-real-token", password: "newpassword1" });
    expect(res.status).toBe(400);
  });
});
