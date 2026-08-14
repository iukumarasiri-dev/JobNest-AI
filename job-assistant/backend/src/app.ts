import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";
import { googleAuthRouter } from "./routes/googleAuth.js";
import { applicationsRouter } from "./routes/applications.js";
import { resumesRouter } from "./routes/resumes.js";
import { companyRouter } from "./routes/company.js";
import { postsRouter } from "./routes/posts.js";
import { usersRouter } from "./routes/users.js";

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "8mb" })); // profile avatar/banner uploads are base64-encoded in the JSON body
app.use(cookieParser());

app.get("/health", async (_req, res) => {
  const userCount = await prisma.user.count();
  res.json({ status: "ok", userCount });
});

app.use("/api/auth", authRouter);
app.use("/api/auth/google", googleAuthRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/resumes", resumesRouter);
app.use("/api/company", companyRouter);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);
