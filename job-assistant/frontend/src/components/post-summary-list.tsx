"use client";

import { useState } from "react";
import type { Post } from "@/app/dashboard/feed/types";
import { POST_KIND_BADGE } from "@/lib/postKind";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function snippet(post: Post) {
  const text = (post.kind === "JOB" ? post.title : post.body) ?? "";
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

type PostUpdates = {
  body?: string;
  title?: string;
  description?: string;
  location?: string;
  salaryRange?: string;
};

function PostSummaryItem({
  post,
  editable,
  onDelete,
  onUpdate,
}: {
  post: Post;
  editable?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: PostUpdates) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [body, setBody] = useState(post.body ?? "");
  const [title, setTitle] = useState(post.title ?? "");
  const [description, setDescription] = useState(post.description ?? "");
  const [location, setLocation] = useState(post.location ?? "");
  const [salaryRange, setSalaryRange] = useState(post.salaryRange ?? "");

  function startEditing() {
    setBody(post.body ?? "");
    setTitle(post.title ?? "");
    setDescription(post.description ?? "");
    setLocation(post.location ?? "");
    setSalaryRange(post.salaryRange ?? "");
    setError("");
    setIsEditing(true);
  }

  async function handleSave() {
    if (!onUpdate) return;
    setSaving(true);
    setError("");
    try {
      const updates =
        post.kind === "JOB"
          ? { title, description, location: location || undefined, salaryRange: salaryRange || undefined }
          : { body };
      await onUpdate(post.id, updates);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post.");
    } finally {
      setSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="border border-border rounded p-2 space-y-2">
        {post.kind === "JOB" ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full border border-border rounded p-1.5 text-xs bg-background"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full border border-border rounded p-1.5 text-xs bg-background"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full border border-border rounded p-1.5 text-xs bg-background"
            />
            <input
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              placeholder="Salary range"
              className="w-full border border-border rounded p-1.5 text-xs bg-background"
            />
          </>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full border border-border rounded p-1.5 text-xs bg-background"
          />
        )}
        {error && <p className="text-[10px] text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-primary text-primary-foreground rounded px-2 py-1 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={saving}
            className="text-xs text-muted-foreground underline disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded p-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${POST_KIND_BADGE[post.kind]}`}>
          {post.kind === "JOB" ? "Job posting" : "Update"}
        </span>
        <span className="text-[10px] text-muted-foreground">{formatDate(post.createdAt)}</span>
      </div>
      <p className="text-xs mt-1">{snippet(post) || "(no content)"}</p>
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="text-[10px] text-muted-foreground">
          Like · {post.likeCount} &nbsp; Comments · {post.commentCount}
        </p>
        {editable && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={startEditing} className="text-[10px] underline text-muted-foreground">
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(post.id)}
              className="text-[10px] underline text-destructive"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PostSummaryList({
  posts,
  loading,
  emptyMessage,
  editable,
  onDelete,
  onUpdate,
}: {
  posts: Post[];
  loading: boolean;
  emptyMessage: string;
  editable?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: PostUpdates) => Promise<void>;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <PostSummaryItem key={post.id} post={post} editable={editable} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
