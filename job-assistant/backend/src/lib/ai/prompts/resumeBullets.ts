export function buildResumeBulletsPrompt(params: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeText: string;
}) {
  const { jobTitle, companyName, jobDescription, resumeText } = params;

  return `You are an expert resume writer and technical recruiter who rewrites resume bullet points to be tailored for a specific job.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Rewrite the candidate's experience as a set of tailored resume bullet points for this specific role.

Rules you MUST follow:
- Do NOT invent experience, skills, achievements, or metrics that are not present in the resume. Only rephrase and reprioritize what's actually there.
- Emphasize the experience most relevant to the job description, using its terminology where it honestly matches the resume.
- Start each bullet with a strong action verb.
- Keep each bullet to a single concise line (roughly 15-25 words).
- Produce between 5 and 8 bullet points.
- If the resume lacks strong alignment with the JD, do not fabricate alignment — instead surface the closest relevant transferable experience honestly.

Respond with ONLY a valid JSON object in this exact shape, no markdown formatting, no code fences:
{
  "bullets": ["tailored bullet point 1", "tailored bullet point 2", "..."]
}`;
}
