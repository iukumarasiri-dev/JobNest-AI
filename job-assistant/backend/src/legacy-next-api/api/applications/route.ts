import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { z } from "zod";

const applicationSchema = z.object({
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  jobDescription: z.string().min(1),
  resumeId: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getOrCreateUser();
  const status = req.nextUrl.searchParams.get("status");

  const applications = await prisma.application.findMany({
    where: { userId: user.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { resume: true },
  });
  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  const body = await req.json();
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const application = await prisma.application.create({
    data: { ...parsed.data, userId: user.id },
  });
  return NextResponse.json(application, { status: 201 });
}