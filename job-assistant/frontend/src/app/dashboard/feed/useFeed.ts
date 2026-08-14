import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Applicant, Post, PostComment, Resume } from "./types";

type Me = { id: string; role: "JOB_SEEKER" | "EMPLOYER" };

export function useFeed() {
  const [me, setMe] = useState<Me | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [kind, setKind] = useState<"TEXT" | "JOB">("TEXT");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [applyingPostId, setApplyingPostId] = useState<string | null>(null);
  const [followingAuthorId, setFollowingAuthorId] = useState<string | null>(null);

  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [commentsLoadingIds, setCommentsLoadingIds] = useState<Record<string, boolean>>({});

  const [applicants, setApplicants] = useState<Record<string, Applicant[]>>({});
  const [applicantsLoadingIds, setApplicantsLoadingIds] = useState<Record<string, boolean>>({});

  async function loadAll() {
    setPageLoading(true);
    setLoadError("");
    try {
      const [meData, postsData, resumesData] = await Promise.all([
        apiFetch("/api/auth/me"),
        apiFetch("/api/posts"),
        apiFetch("/api/resumes").catch(() => []), // 403 for employers — don't fail the whole page
      ]);
      setMe(meData);
      setPosts(postsData);
      setResumes(resumesData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load the feed.");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const payload =
        kind === "JOB"
          ? {
              kind,
              title,
              description,
              location: location || undefined,
              salaryRange: salaryRange || undefined,
              videoUrl: videoUrl || undefined,
            }
          : { kind, body, videoUrl: videoUrl || undefined };

      const created = await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setPosts((prev) => [created, ...prev]);
      setBody("");
      setTitle("");
      setDescription("");
      setLocation("");
      setSalaryRange("");
      setVideoUrl("");
      setKind("TEXT");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePost(id: string) {
    setActionError("");
    const previous = posts;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
    } catch (err) {
      setPosts(previous);
      setActionError(err instanceof Error ? err.message : "Failed to delete post.");
    }
  }

  async function handleToggleLike(id: string) {
    setActionError("");
    setLikingPostId(id);
    const previous = posts;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p
      )
    );
    try {
      const data = await apiFetch(`/api/posts/${id}/like`, { method: "POST" });
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likedByMe: data.liked, likeCount: data.likeCount } : p))
      );
    } catch (err) {
      setPosts(previous);
      setActionError(err instanceof Error ? err.message : "Failed to update like.");
    } finally {
      setLikingPostId(null);
    }
  }

  async function handleToggleSave(id: string) {
    setActionError("");
    setSavingPostId(id);
    const previous = posts;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, savedByMe: !p.savedByMe } : p)));
    try {
      const data = await apiFetch(`/api/posts/${id}/save`, { method: "POST" });
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, savedByMe: data.saved } : p)));
    } catch (err) {
      setPosts(previous);
      setActionError(err instanceof Error ? err.message : "Failed to update saved post.");
    } finally {
      setSavingPostId(null);
    }
  }

  async function handleApply(id: string, resumeId: string) {
    setActionError("");
    setApplyingPostId(id);
    const previous = posts;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, appliedByMe: true } : p)));
    try {
      await apiFetch(`/api/posts/${id}/apply`, {
        method: "POST",
        body: JSON.stringify({ resumeId: resumeId || undefined }),
      });
    } catch (err) {
      setPosts(previous);
      setActionError(err instanceof Error ? err.message : "Failed to apply.");
    } finally {
      setApplyingPostId(null);
    }
  }

  async function handleToggleFollow(authorId: string) {
    setActionError("");
    setFollowingAuthorId(authorId);
    const previous = posts;
    setPosts((prev) =>
      prev.map((p) =>
        p.author.id === authorId
          ? { ...p, author: { ...p.author, isFollowedByMe: !p.author.isFollowedByMe } }
          : p
      )
    );
    try {
      const data = await apiFetch(`/api/users/${authorId}/follow`, { method: "POST" });
      setPosts((prev) =>
        prev.map((p) =>
          p.author.id === authorId
            ? { ...p, author: { ...p.author, isFollowedByMe: data.following } }
            : p
        )
      );
    } catch (err) {
      setPosts(previous);
      setActionError(err instanceof Error ? err.message : "Failed to update follow.");
    } finally {
      setFollowingAuthorId(null);
    }
  }

  async function loadComments(postId: string) {
    setCommentsLoadingIds((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await apiFetch(`/api/posts/${postId}/comments`);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load comments.");
    } finally {
      setCommentsLoadingIds((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleAddComment(postId: string, commentBody: string) {
    try {
      const created = await apiFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentBody }),
      });
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), created] }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add comment.");
    }
  }

  async function loadApplicants(postId: string) {
    setApplicantsLoadingIds((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await apiFetch(`/api/posts/${postId}/applicants`);
      setApplicants((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load applicants.");
    } finally {
      setApplicantsLoadingIds((prev) => ({ ...prev, [postId]: false }));
    }
  }

  return {
    me,
    posts,
    resumes,
    pageLoading,
    loadError,
    actionError,
    kind,
    setKind,
    body,
    setBody,
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    salaryRange,
    setSalaryRange,
    videoUrl,
    setVideoUrl,
    submitting,
    formError,
    likingPostId,
    savingPostId,
    applyingPostId,
    followingAuthorId,
    comments,
    commentsLoadingIds,
    applicants,
    applicantsLoadingIds,
    loadAll,
    handleCreatePost,
    handleDeletePost,
    handleToggleLike,
    handleToggleSave,
    handleApply,
    handleToggleFollow,
    loadComments,
    handleAddComment,
    loadApplicants,
  };
}
