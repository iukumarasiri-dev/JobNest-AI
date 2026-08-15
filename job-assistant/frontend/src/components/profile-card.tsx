"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/avatar";
import { PostSummaryList } from "@/components/post-summary-list";
import type { Post } from "@/app/dashboard/feed/types";

type Tab = "posts" | "messages" | "saved";

type Me = {
  id: string;
  email: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  jobRole: string | null;
  location: string | null;
  birthDate: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
};

type FollowListType = "following" | "followers";

type FollowUser = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  role: "JOB_SEEKER" | "EMPLOYER";
  isFollowedByMe: boolean;
};

type FollowModalState = {
  type: FollowListType;
  users: FollowUser[];
  loading: boolean;
  error: string;
};

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024; // stays comfortably under the backend's ~2MB decoded cap

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBirthDate(iso: string) {
  return `Born ${new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatJoinedDate(iso: string) {
  return `Joined ${new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}

export type ProfileCardHandle = {
  adjustFollowingCount: (delta: number) => void;
};

export const ProfileCard = forwardRef<ProfileCardHandle>(function ProfileCard(_props, ref) {
  const [me, setMe] = useState<Me | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [myPosts, setMyPosts] = useState<Post[] | null>(null);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[] | null>(null);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerError, setBannerError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [followModal, setFollowModal] = useState<FollowModalState | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  async function openFollowModal(type: FollowListType) {
    setFollowModal({ type, users: [], loading: true, error: "" });
    try {
      const users = await apiFetch(`/api/users/me/${type}`);
      setFollowModal({ type, users, loading: false, error: "" });
    } catch (err) {
      setFollowModal({
        type,
        users: [],
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load.",
      });
    }
  }

  async function handleToggleFollowInModal(userId: string) {
    setTogglingUserId(userId);
    setFollowModal((prev) =>
      prev
        ? { ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, isFollowedByMe: !u.isFollowedByMe } : u)) }
        : prev
    );
    try {
      const data = await apiFetch(`/api/users/${userId}/follow`, { method: "POST" });
      setFollowModal((prev) =>
        prev
          ? { ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, isFollowedByMe: data.following } : u)) }
          : prev
      );
      setMe((prev) =>
        prev ? { ...prev, followingCount: Math.max(0, prev.followingCount + (data.following ? 1 : -1)) } : prev
      );
    } catch {
      setFollowModal((prev) =>
        prev
          ? { ...prev, users: prev.users.map((u) => (u.id === userId ? { ...u, isFollowedByMe: !u.isFollowedByMe } : u)) }
          : prev
      );
    } finally {
      setTogglingUserId(null);
    }
  }

  async function load() {
    setPageLoading(true);
    setLoadError("");
    try {
      const data = await apiFetch("/api/auth/me");
      setMe(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load your profile.");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useImperativeHandle(ref, () => ({
    adjustFollowingCount(delta: number) {
      setMe((prev) => (prev ? { ...prev, followingCount: Math.max(0, prev.followingCount + delta) } : prev));
    },
  }));

  async function loadMyPosts() {
    setMyPostsLoading(true);
    try {
      setMyPosts(await apiFetch("/api/posts/mine"));
    } catch {
      setMyPosts([]);
    } finally {
      setMyPostsLoading(false);
    }
  }

  async function loadSavedPosts() {
    setSavedPostsLoading(true);
    try {
      setSavedPosts(await apiFetch("/api/posts/saved"));
    } catch {
      setSavedPosts([]);
    } finally {
      setSavedPostsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "posts") loadMyPosts();
    if (activeTab === "saved") loadSavedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function handleDeleteMyPost(id: string) {
    const previous = myPosts;
    setMyPosts((prev) => (prev ?? []).filter((p) => p.id !== id));
    try {
      await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
    } catch {
      setMyPosts(previous);
    }
  }

  async function handleUpdateMyPost(id: string, updates: Record<string, unknown>) {
    const updated = await apiFetch(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    setMyPosts((prev) => (prev ?? []).map((p) => (p.id === id ? updated : p)));
  }

  async function handleImageChange(field: "avatarUrl" | "bannerUrl", file: File | undefined) {
    if (!file) return;
    const setSaving = field === "avatarUrl" ? setAvatarSaving : setBannerSaving;
    const setError = field === "avatarUrl" ? setAvatarError : setBannerError;

    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large (max 1.5MB).");
      return;
    }

    setSaving(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const data = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ [field]: dataUrl }),
      });
      setMe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden animate-pulse">
        <div className="h-28 bg-muted" />
        <div className="p-4 space-y-3">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-9 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
        <p className="mb-2">{loadError}</p>
        <button onClick={load} className="underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border border-border rounded-lg overflow-hidden">
        <div
          className="h-28 bg-muted relative bg-cover bg-center"
          style={me?.bannerUrl ? { backgroundImage: `url(${me.bannerUrl})` } : undefined}
        >
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageChange("bannerUrl", e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerSaving}
            className="absolute bottom-2 right-2 size-6 rounded-full bg-background/90 border border-border text-xs disabled:opacity-50"
            title="Change banner"
          >
            {bannerSaving ? "…" : "✎"}
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="-mt-8 flex items-end justify-between">
            <div className="relative">
              <Avatar
                src={me?.avatarUrl}
                name={me?.name}
                size={72}
                className="border-4 border-background bg-background"
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange("avatarUrl", e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarSaving}
                className="absolute -bottom-1 -right-1 size-6 rounded-full bg-background border border-border text-xs disabled:opacity-50"
                title="Change photo"
              >
                {avatarSaving ? "…" : "✎"}
              </button>
            </div>
          </div>

          {(avatarError || bannerError) && (
            <p className="text-xs text-destructive mt-2">{avatarError || bannerError}</p>
          )}

          <div className="mt-2">
            <p className="font-semibold">{me?.name || "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">@{me?.username}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>💼 {me?.jobRole || "Not set"}</span>
            <span>📌 {me?.location || "Not set"}</span>
            <span>🎂 {me?.birthDate ? formatBirthDate(me.birthDate) : "Not set"}</span>
          </div>

          {me?.createdAt && (
            <div className="mt-1 text-xs text-muted-foreground">📅 {formatJoinedDate(me.createdAt)}</div>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <button type="button" onClick={() => openFollowModal("following")} className="hover:underline">
              <span className="font-semibold">{me?.followingCount ?? 0}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button type="button" onClick={() => openFollowModal("followers")} className="hover:underline">
              <span className="font-semibold">{me?.followerCount ?? 0}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex text-sm">
          {(
            [
              ["posts", "Posts"],
              ["messages", "Messages"],
              ["saved", "Saved"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-3">
          {activeTab === "posts" && (
            <PostSummaryList
              posts={myPosts ?? []}
              loading={myPostsLoading}
              emptyMessage="You haven't posted anything yet."
              editable
              onDelete={handleDeleteMyPost}
              onUpdate={handleUpdateMyPost}
            />
          )}
          {activeTab === "messages" && (
            <p className="text-xs text-muted-foreground py-2">
              Messaging is coming soon — you'll be able to message other users here.
            </p>
          )}
          {activeTab === "saved" && (
            <PostSummaryList
              posts={savedPosts ?? []}
              loading={savedPostsLoading}
              emptyMessage="You haven't saved any posts yet."
            />
          )}
        </div>
      </div>

      {followModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFollowModal(null)}
        >
          <div
            className="flex w-full max-w-sm max-h-[70vh] flex-col rounded-lg border border-border bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <p className="text-sm font-medium">
                {followModal.type === "following" ? "Following" : "Followers"}
              </p>
              <button
                type="button"
                onClick={() => setFollowModal(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-2">
              {followModal.loading && <p className="p-3 text-sm text-muted-foreground">Loading…</p>}

              {!followModal.loading && followModal.error && (
                <p className="p-3 text-sm text-destructive">{followModal.error}</p>
              )}

              {!followModal.loading && !followModal.error && followModal.users.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">
                  {followModal.type === "following" ? "Not following anyone yet." : "No followers yet."}
                </p>
              )}

              {!followModal.loading &&
                !followModal.error &&
                followModal.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-muted">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar src={user.avatarUrl} name={user.name} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.name || "Unnamed"}</p>
                        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    {user.id !== me?.id && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollowInModal(user.id)}
                        disabled={togglingUserId === user.id}
                        className={
                          user.isFollowedByMe
                            ? "shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground disabled:opacity-50"
                            : "shrink-0 rounded-full border border-primary px-2.5 py-1 text-xs text-primary disabled:opacity-50"
                        }
                      >
                        {user.isFollowedByMe ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
