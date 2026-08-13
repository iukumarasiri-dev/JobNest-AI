import type { CoverLetterContent } from "../types";

export function CoverLetterSection({
  latestLetter,
  generating,
  error,
  copied,
  onGenerate,
  onCopy,
}: {
  latestLetter: CoverLetterContent | undefined;
  generating: boolean;
  error: string;
  copied: boolean;
  onGenerate: () => void;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="border border-border rounded p-4 mb-6">
      <h2 className="font-semibold mb-2">Cover Letter</h2>

      {error && <p className="text-sm text-destructive mb-2">{error}</p>}

      <button
        onClick={onGenerate}
        disabled={generating}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
      >
        {generating ? "Generating..." : latestLetter ? "Regenerate Cover Letter" : "Generate Cover Letter"}
      </button>

      {latestLetter && (
        <>
          <button
            onClick={() => onCopy(latestLetter.content.coverLetter)}
            className="text-sm border border-border rounded px-3 py-1 mb-4 ml-2"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <div className="whitespace-pre-wrap text-sm border-t border-border pt-4">
            {latestLetter.content.coverLetter}
          </div>
        </>
      )}
    </div>
  );
}
