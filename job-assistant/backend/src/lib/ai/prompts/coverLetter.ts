export function buildCoverLetterPrompt(params: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeText: string;
}) {
  const { jobTitle, companyName, jobDescription, resumeText } = params;

  return `You are an expert career coach and technical recruiter who writes highly tailored, professional cover letters.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Write a tailored cover letter for this candidate applying to this role.

Rules you MUST follow:
- Do NOT invent experience, skills, or achievements that are not present in the resume. Only use what's actually there.
- Reference specific, concrete details from the job description (not generic phrases like "I am a hard worker").
- Keep the tone professional but human — avoid corporate cliches like "I am writing to express my interest" or "I believe I would be a great fit."
- Keep it to 3-4 short paragraphs, no more than 300 words total.
- Do not include a letterhead, date, or "Dear Hiring Manager" salutation — just the body content, starting directly with an engaging opening line.
- If the resume lacks strong alignment with the JD, do not fabricate alignment — instead focus honestly on the closest relevant transferable experience.

Respond with ONLY a valid JSON object in this exact shape, no markdown formatting, no code fences:
{
  "coverLetter": "the full cover letter text as a single string, paragraphs separated by \\n\\n",
  "keyPointsUsed": ["short phrase describing point 1 used from resume", "point 2", "..."]
}`;
}