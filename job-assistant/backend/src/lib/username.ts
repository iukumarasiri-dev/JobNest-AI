import { prisma } from "./db.js";

function slugifyBase(input: string) {
  const stripped = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return stripped || "user";
}

export async function generateUniqueUsername(seed: string) {
  const base = slugifyBase(seed);
  let candidate = base;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}
