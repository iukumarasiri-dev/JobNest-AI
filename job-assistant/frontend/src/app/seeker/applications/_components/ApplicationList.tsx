import { STATUS_OPTIONS, type Application } from "../types";

export function ApplicationList({
  applications,
  savingStatusId,
  onStatusChange,
  onDelete,
}: {
  applications: Application[];
  savingStatusId: string | null;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {applications.map((a) => (
        <div
          key={a.id}
          className="border border-border rounded p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2"
        >
          <div>
            <h3 className="font-semibold">
              <a href={`/seeker/applications/${a.id}`} className="hover:underline">
                {a.jobTitle} @ {a.companyName}
              </a>
            </h3>
            <select
              className="text-xs border border-border rounded px-2 py-1 bg-background"
              value={a.status}
              disabled={savingStatusId === a.id}
              onChange={(e) => onStatusChange(a.id, e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {a.resume && (
              <span className="text-xs text-muted-foreground ml-2">Resume: {a.resume.title}</span>
            )}
          </div>
          <button onClick={() => onDelete(a.id)} className="text-destructive text-sm self-start">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
