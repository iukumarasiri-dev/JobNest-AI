import type { Applicant, Post, PostComment, Resume } from "../types";
import { PostCard } from "./PostCard";

export function PostList({
  posts,
  viewerId,
  viewerRole,
  resumes,
  comments,
  commentsLoadingIds,
  applicants,
  applicantsLoadingIds,
  likingPostId,
  savingPostId,
  applyingPostId,
  followingAuthorId,
  onToggleLike,
  onToggleSave,
  onLoadComments,
  onAddComment,
  onLoadApplicants,
  onApply,
  onDelete,
  onToggleFollow,
}: {
  posts: Post[];
  viewerId: string;
  viewerRole: "JOB_SEEKER" | "EMPLOYER";
  resumes: Resume[];
  comments: Record<string, PostComment[]>;
  commentsLoadingIds: Record<string, boolean>;
  applicants: Record<string, Applicant[]>;
  applicantsLoadingIds: Record<string, boolean>;
  likingPostId: string | null;
  savingPostId: string | null;
  applyingPostId: string | null;
  followingAuthorId: string | null;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  onLoadComments: (id: string) => void;
  onAddComment: (id: string, body: string) => void;
  onLoadApplicants: (id: string) => void;
  onApply: (id: string, resumeId: string) => void;
  onDelete: (id: string) => void;
  onToggleFollow: (authorId: string) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
        No posts yet — be the first to share something.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          viewerId={viewerId}
          viewerRole={viewerRole}
          resumes={resumes}
          comments={comments[post.id]}
          commentsLoading={!!commentsLoadingIds[post.id]}
          applicants={applicants[post.id]}
          applicantsLoading={!!applicantsLoadingIds[post.id]}
          liking={likingPostId === post.id}
          saving={savingPostId === post.id}
          applying={applyingPostId === post.id}
          followingAuthor={followingAuthorId === post.author.id}
          onToggleLike={() => onToggleLike(post.id)}
          onToggleSave={() => onToggleSave(post.id)}
          onLoadComments={() => onLoadComments(post.id)}
          onAddComment={(body) => onAddComment(post.id, body)}
          onLoadApplicants={() => onLoadApplicants(post.id)}
          onApply={(resumeId) => onApply(post.id, resumeId)}
          onDelete={() => onDelete(post.id)}
          onToggleFollow={() => onToggleFollow(post.author.id)}
        />
      ))}
    </div>
  );
}
