export function buildExtractJobPostingPrompt(params: { pageText: string }) {
  const { pageText } = params;

  return `You are an assistant that extracts structured job posting details from raw scraped web page text.

RAW PAGE TEXT (may include navigation, ads, and other page clutter — ignore anything that is not part of the actual job posting):
${pageText}

Extract the job posting details from this page.

Rules you MUST follow:
- "jobDescription" should be the full job posting content: responsibilities, requirements, qualifications, etc. Clean it up into readable plain text (simple line breaks are fine), but do not summarize or shorten it — keep the substantive content.
- "jobTitle" and "companyName" should be extracted as they appear on the page. If you cannot confidently determine one, use an empty string for that field.
- "location" is optional — include it only if clearly stated (e.g. "San Francisco, CA" or "Remote"). Use an empty string if not found.
- If this page does not appear to contain a job posting at all, still fill in whatever fields you can find, and leave jobDescription as an empty string.

Respond with ONLY a valid JSON object in this exact shape, no markdown formatting, no code fences:
{
  "jobTitle": "extracted job title",
  "companyName": "extracted company name",
  "jobDescription": "extracted full job description text",
  "location": "extracted location or empty string"
}`;
}
