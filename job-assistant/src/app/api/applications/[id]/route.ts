import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { z } from "zod";

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  jobTitle: z.string().min(1).optional(),
  jobDescription: z.string().min(1).optional(),
  status: z.enum(["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"]).optional(),
  notes: z.string().optional(),
  appliedDate: z.string().datetime().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateUser();
  const application = await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: { resume: true, generatedContent: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(application);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateUser();
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.application.update({
    where: { id },
    data: {
      ...parsed.data,
      appliedDate: parsed.data.appliedDate ? new Date(parsed.data.appliedDate) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateUser();

  const existing = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ success: true });
}