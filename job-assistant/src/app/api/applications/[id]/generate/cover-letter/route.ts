import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { groq } from "@/lib/ai/client";
import { buildCoverLetterPrompt } from "@/lib/ai/prompts/coverLetter";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateUser();

  const application = await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: { resume: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (!application.resume?.rawText) {
    return NextResponse.json(
      { error: "This application has no resume attached. Attach a resume first." },
      { status: 400 }
    );
  }

  const prompt = buildCoverLetterPrompt({
    jobTitle: application.jobTitle,
    companyName: application.companyName,
    jobDescription: application.jobDescription,
    resumeText: application.resume.rawText,
  });

  let parsed: { coverLetter: string; keyPointsUsed: string[] };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from model");

    parsed = JSON.parse(raw);

    if (!parsed.coverLetter || typeof parsed.coverLetter !== "string") {
      throw new Error("Malformed response: missing coverLetter field");
    }
  } catch (err) {
    console.error("Cover letter generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate cover letter. Please try again." },
      { status: 502 }
    );
  }

  const saved = await prisma.generatedContent.create({
    data: {
      applicationId: application.id,
      type: "cover_letter",
      content: parsed,
      modelUsed: "llama-3.3-70b-versatile",
      promptVersion: "v1",
    },
  });

  return NextResponse.json(saved, { status: 201 });
}