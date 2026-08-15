import { STATUS_OPTIONS, type Application } from "../types";

export function ApplicationInfoPanel({
  application,
  savingStatus,
  statusError,
  onStatusChange,
  notesDraft,
  onNotesDraftChange,
  followUpDraft,
  onFollowUpDraftChange,
  notesError,
  savingNotes,
  onSaveNotes,
}: {
  application: Application;
  savingStatus: boolean;
  statusError: string;
  onStatusChange: (status: string) => void;
  notesDraft: string;
  onNotesDraftChange: (value: string) => void;
  followUpDraft: string;
  onFollowUpDraftChange: (value: string) => void;
  notesError: string;
  savingNotes: boolean;
  onSaveNotes: () => void;
}) {
  return (
    <div className="border border-border rounded p-4 mb-6 space-y-4">
      <div>
        <h2 className="font-semibold mb-2">Status</h2>
        <select
          className="border border-border rounded p-2 bg-background"
          value={application.status}
          disabled={savingStatus}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {statusError && <p className="text-sm text-destructive mt-2">{statusError}</p>}
      </div>

      <div>
        <h2 className="font-semibold mb-2">Resume attached</h2>
        <p className="text-sm text-foreground">
          {application.resume ? application.resume.title : "No resume attached"}
        </p>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Job description</h2>
        <p className="text-sm text-foreground whitespace-pre-wrap">{application.jobDescription}</p>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Notes</h2>
        <textarea
          className="w-full border border-border rounded p-2 h-28 text-sm bg-background"
          placeholder="Add notes about this application..."
          value={notesDraft}
          onChange={(e) => onNotesDraftChange(e.target.value)}
        />
      </div>

      <div>
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          Follow-up date
          {followUpDraft && new Date(followUpDraft) < new Date(new Date().toDateString()) && (
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
              Overdue
            </span>
          )}
        </h2>
        <input
          type="date"
          className="border border-border rounded p-2 text-sm bg-background"
          value={followUpDraft}
          onChange={(e) => onFollowUpDraftChange(e.target.value)}
        />
      </div>

      {notesError && <p className="text-sm text-destructive">{notesError}</p>}

      <button
        onClick={onSaveNotes}
        disabled={savingNotes}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50"
      >
        {savingNotes ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
