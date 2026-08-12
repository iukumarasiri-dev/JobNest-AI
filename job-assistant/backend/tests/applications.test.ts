import { describe, it, expect, vi, beforeEach } from "vitest";
import dns from "node:dns/promises";
import { agent, signupAndLogin } from "./helpers.js";
import { groq } from "../src/lib/ai/client.js";

vi.mock("../src/lib/mail.js", () => ({
  sendLoginNotificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
}));

vi.mock("../src/lib/ai/client.js", () => ({
  groq: { chat: { completions: { create: vi.fn() } } },
}));

vi.mock("node:dns/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:dns/promises")>();
  return { ...actual, default: { ...actual, lookup: vi.fn(actual.lookup) } };
});

function mockCompletion(json: unknown) {
  vi.mocked(groq.chat.completions.create).mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  } as never);
}

async function createApplication(client: ReturnType<typeof agent>, overrides: Record<string, unknown> = {}) {
  const res = await client.post("/api/applications").send({
    companyName: "Acme Corp",
    jobTitle: "Software Engineer",
    jobDescription: "Build things.",
    ...overrides,
  });
  return res;
}

describe("applications routes require auth", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await agent().get("/api/applications");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/applications", () => {
  it("creates an application owned by the caller", async () => {
    const { agent: client } = await signupAndLogin();
    const res = await createApplication(client);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ companyName: "Acme Corp", jobTitle: "Software Engineer" });
  });

  it("rejects an invalid payload", async () => {
    const { agent: client } = await signupAndLogin();
    const res = await client.post("/api/applications").send({ companyName: "" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/applications", () => {
  it("lists only the caller's own applications", async () => {
    const { agent: clientA } = await signupAndLogin({ email: "a@example.com" });
    const { agent: clientB } = await signupAndLogin({ email: "b@example.com" });

    await createApplication(clientA, { companyName: "A Co" });
    await createApplication(clientB, { companyName: "B Co" });

    const res = await clientA.get("/api/applications");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].companyName).toBe("A Co");
  });

  it("filters by status", async () => {
    const { agent: client } = await signupAndLogin();
    const created = await createApplication(client);
    await client.put(`/api/applications/${created.body.id}`).send({ status: "applied" });
    await createApplication(client, { companyName: "Still Wishlist" });

    const res = await client.get("/api/applications?status=applied");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("applied");
  });
});

describe("GET/PUT/DELETE /api/applications/:id", () => {
  it("404s for another user's application", async () => {
    const { agent: clientA } = await signupAndLogin({ email: "owner@example.com" });
    const { agent: clientB } = await signupAndLogin({ email: "intruder@example.com" });
    const created = await createApplication(clientA);

    const getRes = await clientB.get(`/api/applications/${created.body.id}`);
    expect(getRes.status).toBe(404);

    const putRes = await clientB.put(`/api/applications/${created.body.id}`).send({ status: "applied" });
    expect(putRes.status).toBe(404);

    const deleteRes = await clientB.delete(`/api/applications/${created.body.id}`);
    expect(deleteRes.status).toBe(404);
  });

  it("updates fields for the owner", async () => {
    const { agent: client } = await signupAndLogin();
    const created = await createApplication(client);

    const res = await client.put(`/api/applications/${created.body.id}`).send({ status: "interview" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("interview");
  });

  it("deletes for the owner", async () => {
    const { agent: client } = await signupAndLogin();
    const created = await createApplication(client);

    const delRes = await client.delete(`/api/applications/${created.body.id}`);
    expect(delRes.status).toBe(200);

    const getRes = await client.get(`/api/applications/${created.body.id}`);
    expect(getRes.status).toBe(404);
  });
});

describe("POST /api/applications/extract-job", () => {
  it("rejects a non-http(s) URL", async () => {
    const { agent: client } = await signupAndLogin();
    const res = await client.post("/api/applications/extract-job").send({ url: "ftp://example.com/job" });
    expect(res.status).toBe(400);
  });

  it("rejects a URL that resolves to a private address (SSRF guard)", async () => {
    const { agent: client } = await signupAndLogin();
    vi.mocked(dns.lookup).mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }] as never);

    const res = await client.post("/api/applications/extract-job").send({ url: "http://internal.example.com/job" });
    expect(res.status).toBe(400);
  });

  it("extracts a job posting from a public URL", async () => {
    const { agent: client } = await signupAndLogin();
    vi.mocked(dns.lookup).mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }] as never);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response("<html><body>Senior Engineer at Acme</body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        })
      )
    );
    mockCompletion({
      jobTitle: "Senior Engineer",
      companyName: "Acme",
      jobDescription: "Senior Engineer at Acme",
    });

    const res = await client.post("/api/applications/extract-job").send({ url: "http://jobs.example.com/posting" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ jobTitle: "Senior Engineer", companyName: "Acme" });

    vi.unstubAllGlobals();
  });
});

describe("generation endpoints", () => {
  async function createApplicationWithResume(client: ReturnType<typeof agent>) {
    const resumeRes = await client.post("/api/resumes").send({ title: "My Resume", rawText: "Experienced engineer." });
    const appRes = await createApplication(client, { resumeId: resumeRes.body.id });
    return appRes.body;
  }

  beforeEach(() => {
    vi.mocked(groq.chat.completions.create).mockReset();
  });

  it("generates a cover letter when a resume is attached", async () => {
    const { agent: client } = await signupAndLogin();
    const application = await createApplicationWithResume(client);
    mockCompletion({ coverLetter: "Dear hiring manager...", keyPointsUsed: ["experience"] });

    const res = await client.post(`/api/applications/${application.id}/generate/cover-letter`);
    expect(res.status).toBe(201);
    expect(res.body.content.coverLetter).toContain("Dear hiring manager");
  });

  it("refuses to generate a cover letter without an attached resume", async () => {
    const { agent: client } = await signupAndLogin();
    const created = await createApplication(client);

    const res = await client.post(`/api/applications/${created.body.id}/generate/cover-letter`);
    expect(res.status).toBe(400);
  });

  it("generates resume bullets", async () => {
    const { agent: client } = await signupAndLogin();
    const application = await createApplicationWithResume(client);
    mockCompletion({ bullets: ["Shipped X", "Improved Y"] });

    const res = await client.post(`/api/applications/${application.id}/generate/resume-bullets`);
    expect(res.status).toBe(201);
    expect(res.body.content.bullets).toHaveLength(2);
  });

  it("generates a skills match analysis", async () => {
    const { agent: client } = await signupAndLogin();
    const application = await createApplicationWithResume(client);
    mockCompletion({ matched: ["TypeScript"], partial: [], missing: ["Go"] });

    const res = await client.post(`/api/applications/${application.id}/generate/skills-match`);
    expect(res.status).toBe(201);
    expect(res.body.content.matched).toContain("TypeScript");
  });

  it("generates interview questions", async () => {
    const { agent: client } = await signupAndLogin();
    const application = await createApplicationWithResume(client);
    mockCompletion({ questions: [{ question: "Tell me about yourself", tip: "Be concise" }] });

    const res = await client.post(`/api/applications/${application.id}/generate/interview-questions`);
    expect(res.status).toBe(201);
    expect(res.body.content.questions).toHaveLength(1);
  });

  it("stores generated content and lists it back", async () => {
    const { agent: client } = await signupAndLogin();
    const application = await createApplicationWithResume(client);
    mockCompletion({ bullets: ["Shipped X"] });
    await client.post(`/api/applications/${application.id}/generate/resume-bullets`);

    const res = await client.get(`/api/applications/${application.id}/generated`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("returns a 502 when the model returns malformed output", async () => {
    const { agent: client } = await signupAndLogin();
    const application = await createApplicationWithResume(client);
    mockCompletion({ notTheRightShape: true });

    const res = await client.post(`/api/applications/${application.id}/generate/resume-bullets`);
    expect(res.status).toBe(502);
  });
});
