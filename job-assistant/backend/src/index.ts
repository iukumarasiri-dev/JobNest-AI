import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", async (_req, res) => {
  const userCount = await prisma.user.count();
  res.json({ status: "ok", userCount });
});

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
