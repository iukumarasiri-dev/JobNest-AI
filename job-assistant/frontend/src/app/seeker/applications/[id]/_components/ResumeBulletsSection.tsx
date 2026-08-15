import type { ResumeBulletsContent } from "../types";

export function ResumeBulletsSection({
  latestBullets,
  generating,
  error,
  copied,
  onGenerate,
  onCopy,
}: {
  latestBullets: ResumeBulletsContent | undefined;
  generating: boolean;
  error: string;
  copied: boolean;
  onGenerate: () => void;
  onCopy: (bullets: string[]) => void;
}) {
  return (
    <div className="border border-border rounded p-4 mb-6">
      <h2 className="font-semibold mb-2">Resume Bullet Points</h2>

      {error && <p className="text-sm text-destructive mb-2">{error}</p>}

      <button
        onClick={onGenerate}
        disabled={generating}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
      >
        {generating ? "Generating..." : latestBullets ? "Regenerate Bullet Points" : "Generate Bullet Points"}
      </button>

      {latestBullets && (
        <>
          <button
            onClick={() => onCopy(latestBullets.content.bullets)}
            className="text-sm border border-border rounded px-3 py-1 mb-4 ml-2"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <ul className="list-disc list-inside text-sm border-t border-border pt-4 space-y-1">
            {latestBullets.content.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
