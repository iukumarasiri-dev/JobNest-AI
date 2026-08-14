export function PostComposer({
  isEmployer,
  kind,
  onKindChange,
  body,
  onBodyChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  location,
  onLocationChange,
  salaryRange,
  onSalaryRangeChange,
  videoUrl,
  onVideoUrlChange,
  submitting,
  formError,
  onSubmit,
}: {
  isEmployer: boolean;
  kind: "TEXT" | "JOB";
  onKindChange: (value: "TEXT" | "JOB") => void;
  body: string;
  onBodyChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  salaryRange: string;
  onSalaryRangeChange: (value: string) => void;
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  submitting: boolean;
  formError: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 mb-6 border border-border p-4 rounded-lg">
      {isEmployer && (
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => onKindChange("TEXT")}
            className={`px-3 py-1.5 rounded-full border ${
              kind === "TEXT" ? "bg-primary text-primary-foreground border-primary" : "border-border"
            }`}
          >
            Text update
          </button>
          <button
            type="button"
            onClick={() => onKindChange("JOB")}
            className={`px-3 py-1.5 rounded-full border ${
              kind === "JOB" ? "bg-primary text-primary-foreground border-primary" : "border-border"
            }`}
          >
            Job posting
          </button>
        </div>
      )}

      {kind === "TEXT" || !isEmployer ? (
        <textarea
          className="w-full border border-border rounded p-2 h-24 bg-background"
          placeholder="Share an update..."
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          required
        />
      ) : (
        <>
          <input
            className="w-full border border-border rounded p-2 bg-background"
            placeholder="Job title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
          />
          <textarea
            className="w-full border border-border rounded p-2 h-32 bg-background"
            placeholder="Job description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full border border-border rounded p-2 bg-background"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
            />
            <input
              className="w-full border border-border rounded p-2 bg-background"
              placeholder="Salary range (optional)"
              value={salaryRange}
              onChange={(e) => onSalaryRangeChange(e.target.value)}
            />
          </div>
        </>
      )}

      <input
        className="w-full border border-border rounded p-2 bg-background"
        placeholder="Video link (optional) — YouTube, Vimeo, etc."
        value={videoUrl}
        onChange={(e) => onVideoUrlChange(e.target.value)}
        type="url"
      />

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
      >
        {submitting ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}
