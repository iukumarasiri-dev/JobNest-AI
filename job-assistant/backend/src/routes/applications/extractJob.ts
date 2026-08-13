import type { Request, Response } from "express";
import dns from "node:dns/promises";
import { groq } from "../../lib/ai/client.js";
import { buildExtractJobPostingPrompt } from "../../lib/ai/prompts/extractJobPosting.js";
import { htmlToText } from "../../lib/htmlToText.js";
import { isPrivateAddress } from "../../lib/security/ssrf.js";
import { extractJobSchema } from "./schemas.js";

const MAX_BYTES = 2 * 1024 * 1024;

async function fetchJobPostingHtml(url: URL): Promise<
  { ok: true; html: string } | { ok: false; status: number; error: string }
> {
  const response = await fetch(url.toString(), {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; JobNestAI/1.0)" },
  });

  if (response.status >= 300 && response.status < 400) {
    return {
      ok: false,
      status: 400,
      error: "This URL redirects to another page. Please paste the final job posting URL directly.",
    };
  }

  if (!response.ok) {
    return { ok: false, status: 400, error: `Failed to fetch this URL (status ${response.status}).` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    return { ok: false, status: 400, error: "This URL does not point to a readable web page." };
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  let received = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    chunks.push(value);
    if (received > MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  return { ok: true, html };
}

export async function extractJob(req: Request, res: Response) {
  const parsed = extractJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let url: URL;
  try {
    url = new URL(parsed.data.url);
  } catch {
    return res.status(400).json({ error: "Invalid URL." });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return res.status(400).json({ error: "Only http and https URLs are supported." });
  }

  try {
    const addresses = await dns.lookup(url.hostname, { all: true });
    if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
      return res.status(400).json({ error: "This URL cannot be fetched." });
    }
  } catch {
    return res.status(400).json({ error: "Could not resolve this URL's host." });
  }

  let html: string;
  try {
    const result = await fetchJobPostingHtml(url);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    html = result.html;
  } catch (err) {
    console.error("Job posting fetch failed:", err);
    return res.status(502).json({
      error: "Failed to fetch this URL. Please check the link or paste the job description manually.",
    });
  }

  const pageText = htmlToText(html).slice(0, 15000);
  if (!pageText.trim()) {
    return res.status(422).json({ error: "Couldn't extract any readable text from this page." });
  }

  const prompt = buildExtractJobPostingPrompt({ pageText });

  let parsedJob: { jobTitle: string; companyName: string; jobDescription: string; location?: string };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from model");

    parsedJob = JSON.parse(raw);

    if (typeof parsedJob.jobDescription !== "string") {
      throw new Error("Malformed response: missing jobDescription field");
    }
  } catch (err) {
    console.error("Job posting extraction failed:", err);
    return res.status(502).json({
      error: "Failed to extract job details from this page. Please fill the form manually.",
    });
  }

  if (!parsedJob.jobDescription.trim()) {
    return res.status(422).json({
      error: "Couldn't find a job posting on this page. Please fill the form manually.",
    });
  }

  res.json(parsedJob);
}
