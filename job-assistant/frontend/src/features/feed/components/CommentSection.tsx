"use client";

import { useState } from "react";
import type { PostComment } from "../types";

export function CommentSection({
  comments,
  loading,
  onAdd,
}: {
  comments: PostComment[] | undefined;
  loading: boolean;
  onAdd: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(draft.trim());
      setDraft("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {loading && <p className="text-xs text-muted-foreground">Loading comments...</p>}
      {!loading && comments?.length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}
      {comments?.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="font-medium">{c.user.name ?? "Someone"}</span>{" "}
          <span className="text-muted-foreground">{c.body}</span>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border border-border rounded p-1.5 text-sm bg-background"
        />
        <button
          type="submit"
          disabled={submitting || !draft.trim()}
          className="border border-border rounded px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
