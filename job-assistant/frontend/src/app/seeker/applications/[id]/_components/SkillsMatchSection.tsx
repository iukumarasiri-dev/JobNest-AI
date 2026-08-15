import type { SkillsMatchContent } from "../types";

function SkillBadgeGroup({
  title,
  skills,
  colorClass,
}: {
  title: string;
  skills: string[];
  colorClass: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded ${colorClass}`}>
            {skill}
          </span>
        ))}
        {skills.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
      </div>
    </div>
  );
}

export function SkillsMatchSection({
  latestSkills,
  generating,
  error,
  onGenerate,
}: {
  latestSkills: SkillsMatchContent | undefined;
  generating: boolean;
  error: string;
  onGenerate: () => void;
}) {
  return (
    <div className="border border-border rounded p-4 mb-6">
      <h2 className="font-semibold mb-2">Skills Match</h2>

      {error && <p className="text-sm text-destructive mb-2">{error}</p>}

      <button
        onClick={onGenerate}
        disabled={generating}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
      >
        {generating ? "Generating..." : latestSkills ? "Regenerate Skills Match" : "Generate Skills Match"}
      </button>

      {latestSkills && (
        <div className="border-t border-border pt-4 space-y-4">
          <SkillBadgeGroup
            title="Matched"
            skills={latestSkills.content.matched}
            colorClass="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
          />
          <SkillBadgeGroup
            title="Partial"
            skills={latestSkills.content.partial}
            colorClass="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
          />
          <SkillBadgeGroup
            title="Missing"
            skills={latestSkills.content.missing}
            colorClass="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
          />
        </div>
      )}
    </div>
  );
}
