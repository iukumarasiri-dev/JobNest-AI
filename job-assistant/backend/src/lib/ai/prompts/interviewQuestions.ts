export function buildInterviewQuestionsPrompt(params: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeText: string;
}) {
  const { jobTitle, companyName, jobDescription, resumeText } = params;

  return `You are an expert interview coach preparing a candidate for an upcoming job interview.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Generate a set of likely interview questions for this candidate for this specific role, with a short prep tip for each one.

Rules you MUST follow:
- Cover a mix of question types: behavioral, role-specific/technical, and questions probing gaps between the resume and the job description.
- Base each question on the actual job description and the actual resume content — questions should feel specific to this candidate and this role, not generic interview-prep boilerplate.
- For each question, write a one or two sentence tip on how the candidate could answer it well using their own real experience from the resume. Do NOT invent experience they don't have — if the resume shows a gap relevant to the question, the tip should honestly suggest how to address that gap (e.g. transferable experience, willingness to learn) rather than pretending it doesn't exist.
- Produce between 6 and 9 questions.

Respond with ONLY a valid JSON object in this exact shape, no markdown formatting, no code fences:
{
  "questions": [
    { "question": "the interview question", "tip": "short tip on how to answer it well" }
  ]
}`;
}
