import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { config, parse } from "dotenv";
import { readFileSync } from "node:fs";

export default function globalSetup() {
  if (!existsSync(".env.test")) {
    throw new Error(
      "backend/.env.test is missing. Tests must run against a dedicated test database, separate " +
        "from your dev database (e.g. a second Neon branch) — create .env.test with DATABASE_URL " +
        "and DIRECT_URL pointing at it before running `npm test`."
    );
  }

  const { parsed } = config({ path: ".env.test" });
  if (!parsed?.DATABASE_URL) {
    throw new Error("backend/.env.test has no DATABASE_URL set.");
  }

  if (existsSync(".env")) {
    const devEnv = parse(readFileSync(".env"));
    if (devEnv.DATABASE_URL && devEnv.DATABASE_URL === parsed.DATABASE_URL) {
      throw new Error(
        "backend/.env.test has the same DATABASE_URL as backend/.env. Refusing to run — tests " +
          "truncate tables between runs and would destroy your dev data. Point .env.test at a " +
          "separate database."
      );
    }
  }

  const env = { ...process.env, ...parsed };

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
}
