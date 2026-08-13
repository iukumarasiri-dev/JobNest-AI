import type { Resume } from "../types";

export function NewApplicationForm({
  companyName,
  onCompanyNameChange,
  jobTitle,
  onJobTitleChange,
  jobDescription,
  onJobDescriptionChange,
  jobUrl,
  onJobUrlChange,
  resumeId,
  onResumeIdChange,
  resumes,
  loading,
  formError,
  extracting,
  extractError,
  extractNotice,
  onExtract,
  onSubmit,
}: {
  companyName: string;
  onCompanyNameChange: (value: string) => void;
  jobTitle: string;
  onJobTitleChange: (value: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  jobUrl: string;
  onJobUrlChange: (value: string) => void;
  resumeId: string;
  onResumeIdChange: (value: string) => void;
  resumes: Resume[];
  loading: boolean;
  formError: string;
  extracting: boolean;
  extractError: string;
  extractNotice: string;
  onExtract: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 mb-8 border border-border p-4 rounded-lg">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Job posting URL (optional)</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 border border-border rounded p-2 bg-background"
            placeholder="https://company.com/careers/job-123"
            value={jobUrl}
            onChange={(e) => onJobUrlChange(e.target.value)}
            type="url"
          />
          <button
            type="button"
            onClick={onExtract}
            disabled={extracting}
            className="border border-border rounded px-4 py-2 text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {extracting ? "Fetching..." : "Fetch from URL"}
          </button>
        </div>
        {extractError && <p className="text-sm text-destructive mt-1">{extractError}</p>}
        {extractNotice && !extractError && (
          <p className="text-sm text-muted-foreground mt-1">{extractNotice}</p>
        )}
      </div>
      <input
        className="w-full border border-border rounded p-2 bg-background"
        placeholder="Company name"
        value={companyName}
        onChange={(e) => onCompanyNameChange(e.target.value)}
        required
      />
      <input
        className="w-full border border-border rounded p-2 bg-background"
        placeholder="Job title"
        value={jobTitle}
        onChange={(e) => onJobTitleChange(e.target.value)}
        required
      />
      <textarea
        className="w-full border border-border rounded p-2 h-40 bg-background"
        placeholder="Paste job description here"
        value={jobDescription}
        onChange={(e) => onJobDescriptionChange(e.target.value)}
        required
      />
      <select
        className="w-full border border-border rounded p-2 bg-background"
        value={resumeId}
        onChange={(e) => onResumeIdChange(e.target.value)}
      >
        <option value="">No resume attached</option>
        {resumes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title}
          </option>
        ))}
      </select>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add Application"}
      </button>
    </form>
  );
}
