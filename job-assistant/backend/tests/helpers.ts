import crypto from "node:crypto";
import request from "supertest";
import { app } from "../src/app.js";

export function agent() {
  return request.agent(app);
}

export async function signupAndLogin(
  overrides: Partial<{ email: string; password: string; name: string }> = {}
) {
  const email = overrides.email ?? `user-${crypto.randomUUID()}@example.com`;
  const password = overrides.password ?? "password123";
  const name = overrides.name ?? "Test User";

  const client = agent();
  const res = await client.post("/api/auth/signup").send({ email, password, name });

  return { agent: client, user: res.body, email, password };
}
