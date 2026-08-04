import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateUser();

  const application = await prisma.application.findFirst({
    where: { id, userId: user.id },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = await prisma.generatedContent.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(content);
}