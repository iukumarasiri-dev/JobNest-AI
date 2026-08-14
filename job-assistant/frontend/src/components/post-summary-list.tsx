import type { Post } from "@/app/dashboard/feed/types";
import { POST_KIND_BADGE } from "@/lib/postKind";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function snippet(post: Post) {
  const text = (post.kind === "JOB" ? post.title : post.body) ?? "";
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

export function PostSummaryList({
  posts,
  loading,
  emptyMessage,
}: {
  posts: Post[];
  loading: boolean;
  emptyMessage: string;
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
        <div key={post.id} className="border border-border rounded p-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${POST_KIND_BADGE[post.kind]}`}>
              {post.kind === "JOB" ? "Job posting" : "Update"}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatDate(post.createdAt)}</span>
          </div>
          <p className="text-xs mt-1">{snippet(post) || "(no content)"}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Like · {post.likeCount} &nbsp; Comments · {post.commentCount}
          </p>
        </div>
      ))}
    </div>
  );
}
