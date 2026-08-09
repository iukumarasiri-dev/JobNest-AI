# JobNest AI

An AI-powered job application assistant. Track job applications and generate tailored cover letters (with resume bullets and skills-match analysis planned) using an LLM, based on a pasted job description and your resume.

## Project structure

```
job-assistant/
├── frontend/   Next.js app (UI)
└── backend/    Express + TypeScript + Prisma API
```

The two are separate apps with their own `package.json`, `node_modules`, and `.env` — the frontend talks to the backend over HTTP, not to the database directly.

## Tech stack

| Layer      | Choice                                  |
| ---------- | ---------------------------------------- |
| Frontend   | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Backend    | Express, TypeScript                      |
| Database   | PostgreSQL (Neon)                        |
| ORM        | Prisma                                   |
| Validation | Zod                                      |
| LLM        | Groq (Llama 3.3 70B, OpenAI-compatible SDK) |

## Getting started

Each app is run and installed independently.

### Backend

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Runs on [http://localhost:4000](http://localhost:4000). Requires a `.env` file with `DATABASE_URL`, `DIRECT_URL`, `GROQ_API_KEY`, `PORT`, and `FRONTEND_URL`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000). Requires a `.env` file with `NEXT_PUBLIC_API_URL` pointing at the backend.

## Auth

Custom-built, no third-party auth provider. Passwords are hashed with bcrypt; sessions are opaque IDs stored in a `Session` table and set as an httpOnly cookie (`session_id`) by the backend. Routes: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (see `backend/src/routes/auth.ts`).

The frontend's `proxy.ts` does an optimistic cookie-presence check to redirect unauthenticated visitors away from `/dashboard`; real authorization happens in the backend on every request via `requireAuth` middleware. This relies on the frontend and backend sharing the `localhost` host in dev (cookies ignore port) — deploying to different domains later will need either a shared parent domain or moving the auth check to a server-side call to `/api/auth/me`.

## Status

- Auth (signup/login/logout/sessions) is fully migrated off Clerk and working end-to-end.
- Resume and application CRUD, and cover letter generation, have been ported from the old Next.js API routes into the Express backend (`backend/src/routes/applications.ts`, `backend/src/routes/resumes.ts`), protected by `requireAuth`. The frontend dashboard pages now call these via `apiFetch` against the backend.
