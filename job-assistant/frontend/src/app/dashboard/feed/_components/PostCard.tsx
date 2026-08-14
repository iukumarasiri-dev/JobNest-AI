"use client";

import { useState } from "react";
import type { Applicant, Post, PostComment, Resume } from "../types";
import { POST_KIND_BADGE } from "@/lib/postKind";
import { CommentSection } from "./CommentSection";
import { ApplicantsPanel } from "./ApplicantsPanel";

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtube.com" && parsed.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }
    if (host === "vimeo.com") {
      return `https://player.vimeo.com/video/${parsed.pathname.slice(1)}`;
    }
    return null;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PostCard({
  post,
  viewerId,
  viewerRole,
  resumes,
  comments,
  commentsLoading,
  applicants,
  applicantsLoading,
  liking,
  applying,
  onToggleLike,
  onLoadComments,
  onAddComment,
  onLoadApplicants,
  onApply,
  onDelete,
}: {
  post: Post;
  viewerId: string;
  viewerRole: "JOB_SEEKER" | "EMPLOYER";
  resumes: Resume[];
  comments: PostComment[] | undefined;
  commentsLoading: boolean;
  applicants: Applicant[] | undefined;
  applicantsLoading: boolean;
  liking: boolean;
  applying: boolean;
  onToggleLike: () => void;
  onLoadComments: () => void;
  onAddComment: (body: string) => void;
  onLoadApplicants: () => void;
  onApply: (resumeId: string) => void;
  onDelete: () => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [applicantsOpen, setApplicantsOpen] = useState(false);
  const [resumeId, setResumeId] = useState("");

  const isAuthor = viewerId === post.author.id;
  const embedUrl = post.videoUrl ? getEmbedUrl(post.videoUrl) : null;

  function toggleComments() {
    if (!commentsOpen && comments === undefined) onLoadComments();
    setCommentsOpen((v) => !v);
  }

  function toggleApplicants() {
    if (!applicantsOpen && applicants === undefined) onLoadApplicants();
    setApplicantsOpen((v) => !v);
  }

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">
            {post.author.name ?? "Someone"}
            {post.author.companyName && (
              <span className="text-muted-foreground"> · {post.author.companyName}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${POST_KIND_BADGE[post.kind]}`}>
            {post.kind === "JOB" ? "Job posting" : "Update"}
          </span>
          {isAuthor && (
            <button onClick={onDelete} className="text-xs text-destructive underline">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 text-sm">
        {post.kind === "JOB" ? (
          <>
            <p className="font-semibold">{post.title}</p>
            <p className="text-muted-foreground whitespace-pre-wrap mt-1">{post.description}</p>
            {(post.location || post.salaryRange) && (
              <p className="text-xs text-muted-foreground mt-1">
                {[post.location, post.salaryRange].filter(Boolean).join(" · ")}
              </p>
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap">{post.body}</p>
        )}
      </div>

      {post.videoUrl && (
        <div className="mt-3">
          {embedUrl ? (
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full rounded"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a href={post.videoUrl} target="_blank" rel="noreferrer" className="text-sm underline">
              {post.videoUrl}
            </a>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-sm">
        <button
          onClick={onToggleLike}
          disabled={liking}
          className={post.likedByMe ? "text-primary font-medium" : "text-muted-foreground"}
        >
          {post.likedByMe ? "Liked" : "Like"} · {post.likeCount}
        </button>
        <button onClick={toggleComments} className="text-muted-foreground">
          Comments · {post.commentCount}
        </button>

        {post.kind === "JOB" && viewerRole === "JOB_SEEKER" && (
          post.appliedByMe ? (
            <span className="text-primary font-medium ml-auto">Applied</span>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              {resumes.length > 0 && (
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="border border-border rounded p-1 text-xs bg-background"
                >
                  <option value="">No resume</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => onApply(resumeId)}
                disabled={applying}
                className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs disabled:opacity-50"
              >
                {applying ? "Applying..." : "Apply"}
              </button>
            </div>
          )
        )}

        {post.kind === "JOB" && isAuthor && (
          <button onClick={toggleApplicants} className="text-muted-foreground ml-auto">
            Applicants
          </button>
        )}
      </div>

      {commentsOpen && (
        <CommentSection comments={comments} loading={commentsLoading} onAdd={onAddComment} />
      )}
      {applicantsOpen && (
        <ApplicantsPanel applicants={applicants} loading={applicantsLoading} />
      )}
    </div>
  );
}
