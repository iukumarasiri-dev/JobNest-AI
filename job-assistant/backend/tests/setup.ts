import { afterAll, afterEach, beforeAll } from "vitest";
import { prisma } from "../src/lib/db.js";

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.generatedContent.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
