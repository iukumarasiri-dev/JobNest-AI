import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { z } from "zod";

const resumeSchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(1),
});

export async function GET() {
  const user = await getOrCreateUser();
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(resumes);
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  const body = await req.json();
  const parsed = resumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const resume = await prisma.resume.create({
    data: { ...parsed.data, userId: user.id },
  });
  return NextResponse.json(resume, { status: 201 });
}