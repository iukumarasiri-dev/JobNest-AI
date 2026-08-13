import type { InterviewQuestionsContent } from "../types";

export function InterviewQuestionsSection({
  latestQuestions,
  generating,
  error,
  copied,
  onGenerate,
  onCopy,
}: {
  latestQuestions: InterviewQuestionsContent | undefined;
  generating: boolean;
  error: string;
  copied: boolean;
  onGenerate: () => void;
  onCopy: (questions: { question: string; tip: string }[]) => void;
}) {
  return (
    <div className="border border-border rounded p-4 mb-6">
      <h2 className="font-semibold mb-2">Interview Questions</h2>

      {error && <p className="text-sm text-destructive mb-2">{error}</p>}

      <button
        onClick={onGenerate}
        disabled={generating}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50 mb-4"
      >
        {generating
          ? "Generating..."
          : latestQuestions
          ? "Regenerate Interview Questions"
          : "Generate Interview Questions"}
      </button>

      {latestQuestions && (
        <>
          <button
            onClick={() => onCopy(latestQuestions.content.questions)}
            className="text-sm border border-border rounded px-3 py-1 mb-4 ml-2"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <ul className="text-sm border-t border-border pt-4 space-y-4">
            {latestQuestions.content.questions.map((q, i) => (
              <li key={i}>
                <p className="font-medium">{q.question}</p>
                <p className="text-muted-foreground mt-1">{q.tip}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
