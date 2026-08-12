import { describe, it, expect, vi } from "vitest";
import { agent, signupAndLogin } from "./helpers.js";

vi.mock("../src/lib/mail.js", () => ({
  sendLoginNotificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
}));

async function createResume(client: ReturnType<typeof agent>, overrides: Record<string, unknown> = {}) {
  return client.post("/api/resumes").send({ title: "My Resume", rawText: "Experienced engineer.", ...overrides });
}

describe("resumes routes require auth", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await agent().get("/api/resumes");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/resumes", () => {
  it("creates a resume owned by the caller", async () => {
    const { agent: client } = await signupAndLogin();
    const res = await createResume(client);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "My Resume", rawText: "Experienced engineer." });
  });

  it("rejects an invalid payload", async () => {
    const { agent: client } = await signupAndLogin();
    const res = await client.post("/api/resumes").send({ title: "" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/resumes", () => {
  it("lists only the caller's own resumes", async () => {
    const { agent: clientA } = await signupAndLogin({ email: "a@example.com" });
    const { agent: clientB } = await signupAndLogin({ email: "b@example.com" });

    await createResume(clientA, { title: "A's Resume" });
    await createResume(clientB, { title: "B's Resume" });

    const res = await clientA.get("/api/resumes");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("A's Resume");
  });
});

describe("GET/PUT/DELETE /api/resumes/:id", () => {
  it("404s for another user's resume", async () => {
    const { agent: clientA } = await signupAndLogin({ email: "owner@example.com" });
    const { agent: clientB } = await signupAndLogin({ email: "intruder@example.com" });
    const created = await createResume(clientA);

    const getRes = await clientB.get(`/api/resumes/${created.body.id}`);
    expect(getRes.status).toBe(404);

    const putRes = await clientB.put(`/api/resumes/${created.body.id}`).send({ title: "Hijacked" });
    expect(putRes.status).toBe(404);

    const deleteRes = await clientB.delete(`/api/resumes/${created.body.id}`);
    expect(deleteRes.status).toBe(404);
  });

  it("updates fields for the owner", async () => {
    const { agent: client } = await signupAndLogin();
    const created = await createResume(client);

    const res = await client.put(`/api/resumes/${created.body.id}`).send({ title: "Updated Title" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
  });

  it("deletes for the owner", async () => {
    const { agent: client } = await signupAndLogin();
    const created = await createResume(client);

    const delRes = await client.delete(`/api/resumes/${created.body.id}`);
    expect(delRes.status).toBe(200);

    const getRes = await client.get(`/api/resumes/${created.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it("unsets isPrimary on other resumes when one is marked primary", async () => {
    const { agent: client } = await signupAndLogin();
    const first = await createResume(client, { title: "First" });
    const second = await createResume(client, { title: "Second" });

    await client.put(`/api/resumes/${first.body.id}`).send({ isPrimary: true });
    const promoteSecond = await client.put(`/api/resumes/${second.body.id}`).send({ isPrimary: true });
    expect(promoteSecond.status).toBe(200);
    expect(promoteSecond.body.isPrimary).toBe(true);

    const firstAfter = await client.get(`/api/resumes/${first.body.id}`);
    expect(firstAfter.body.isPrimary).toBe(false);
  });
});
