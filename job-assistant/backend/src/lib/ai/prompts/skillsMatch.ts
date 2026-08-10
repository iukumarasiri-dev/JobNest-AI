export function buildSkillsMatchPrompt(params: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeText: string;
}) {
  const { jobTitle, companyName, jobDescription, resumeText } = params;

  return `You are an expert technical recruiter who compares a candidate's resume against a job description to assess skills alignment.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Identify the skills, technologies, and qualifications mentioned or implied by the job description, and classify each one into exactly one of three buckets based on the resume:

- "matched": skills the job description asks for that the resume clearly demonstrates.
- "partial": skills the job description asks for where the resume shows related or adjacent experience, but not a clear direct match (e.g. a similar technology, or mentioned briefly without depth).
- "missing": skills the job description asks for that the resume does not show any evidence of.

Rules you MUST follow:
- Base every classification strictly on what's actually in the resume text. Do not assume skills that aren't stated or clearly implied.
- Use short, specific skill labels (e.g. "PostgreSQL", "distributed systems", "React"), not full sentences.
- Only include skills that are actually relevant to this job description — do not pad the lists with skills from the resume that the job doesn't care about.
- Each skill should appear in exactly one bucket.

Respond with ONLY a valid JSON object in this exact shape, no markdown formatting, no code fences:
{
  "matched": ["skill 1", "skill 2", "..."],
  "partial": ["skill 1", "skill 2", "..."],
  "missing": ["skill 1", "skill 2", "..."]
}`;
}
