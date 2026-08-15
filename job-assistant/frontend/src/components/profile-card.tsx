"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/avatar";
import { PostSummaryList } from "@/components/post-summary-list";
import type { Post } from "@/features/feed/types";
import { formatBirthDate, formatJoinedDate, formatRelativeTime } from "@/lib/formatDate";

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
  role: "JOB_SEEKER" | "EMPLOYER";
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

type AppNotification = {
  id: string;
  type: string;
  actor: { id: string; name: string | null; username: string; avatarUrl: string | null; isFollowedByMe: boolean };
  createdAt: string;
  read: boolean;
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

export type ProfileCardHandle = {
  adjustFollowingCount: (delta: number) => void;
};

export const ProfileCard = forwardRef<ProfileCardHandle>(function ProfileCard(_props, ref) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [myPosts, setMyPosts] = useState<Post[] | null>(null);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[] | null>(null);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [notificationActionsFor, setNotificationActionsFor] = useState<AppNotification | null>(null);
  const [followBackSaving, setFollowBackSaving] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);

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

  async function loadNotifications() {
    try {
      setNotifications(await apiFetch("/api/notifications"));
    } catch {
      // keep showing the last known state on failure
    }
  }

  useEffect(() => {
    load();
    loadNotifications();
  }, []);

  // Follower/following counts and notifications change from other sessions
  // (someone else follows you) with no push channel to notify this tab —
  // revalidate on refocus so a tab left open picks up changes without needing
  // a full page reload.
  useEffect(() => {
    async function silentRefresh() {
      try {
        setMe(await apiFetch("/api/auth/me"));
      } catch {
        // keep showing the last known state; the visible load() above already
        // surfaces a retry UI for a hard failure on first mount
      }
      loadNotifications();
    }
    function handleFocus() {
      silentRefresh();
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") silentRefresh();
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
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

  async function markNotificationsRead() {
    if (!notifications.some((n) => !n.read)) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiFetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // best-effort — a later refresh will resync the real state
    }
  }

  function handleSeeProfile(username: string) {
    setNotificationActionsFor(null);
    router.push(`/profile/${username}`);
  }

  async function handleFollowBackFromNotification(actorId: string) {
    setFollowBackSaving(true);
    try {
      const data = await apiFetch(`/api/users/${actorId}/follow`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.actor.id === actorId ? { ...n, actor: { ...n.actor, isFollowedByMe: data.following } } : n))
      );
      setNotificationActionsFor((prev) =>
        prev && prev.actor.id === actorId ? { ...prev, actor: { ...prev.actor, isFollowedByMe: data.following } } : prev
      );
      setMe((prev) =>
        prev ? { ...prev, followingCount: Math.max(0, prev.followingCount + (data.following ? 1 : -1)) } : prev
      );
    } catch {
      // leave state as-is; the button stays in its current state for a retry
    } finally {
      setFollowBackSaving(false);
    }
  }

  async function handleChatFromNotification(actorId: string) {
    if (!me) return;
    setChatStarting(true);
    try {
      const conversation = await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ userId: actorId }),
      });
      setNotificationActionsFor(null);
      router.push(`/${me.role === "EMPLOYER" ? "employer" : "seeker"}/messages?c=${conversation.id}`);
    } catch {
      // panel stays open with the Chat button re-enabled for a retry
    } finally {
      setChatStarting(false);
    }
  }

  useEffect(() => {
    if (activeTab === "posts") loadMyPosts();
    if (activeTab === "saved") loadSavedPosts();
    if (activeTab === "messages") markNotificationsRead();
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
              className={`relative flex-1 py-2.5 border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {tab === "messages" && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {unreadCount}
                </span>
              )}
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
            <div className="space-y-1">
              {notifications.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  No notifications yet — you&apos;ll see updates like new followers here.
                </p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNotificationActionsFor(n)}
                  className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-muted ${
                    n.read ? "" : "bg-primary/5"
                  }`}
                >
                  <Avatar src={n.actor.avatarUrl} name={n.actor.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">{n.actor.name || n.actor.username}</span>{" "}
                      <span className="text-muted-foreground">
                        {n.type === "FOLLOW" ? "followed you" : "sent an update"}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
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

      {notificationActionsFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setNotificationActionsFor(null)}
        >
          <div
            className="w-full max-w-xs rounded-lg border border-border bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Notification</p>
              <button
                type="button"
                onClick={() => setNotificationActionsFor(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2.5">
              <Avatar
                src={notificationActionsFor.actor.avatarUrl}
                name={notificationActionsFor.actor.name}
                size={40}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {notificationActionsFor.actor.name || notificationActionsFor.actor.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{notificationActionsFor.actor.username}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSeeProfile(notificationActionsFor.actor.username)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                See profile
              </button>
              <button
                type="button"
                onClick={() => handleFollowBackFromNotification(notificationActionsFor.actor.id)}
                disabled={followBackSaving}
                className={
                  notificationActionsFor.actor.isFollowedByMe
                    ? "rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground disabled:opacity-50"
                    : "rounded-lg border border-primary px-3 py-2 text-sm text-primary disabled:opacity-50"
                }
              >
                {notificationActionsFor.actor.isFollowedByMe ? "Following" : "Follow back"}
              </button>
              <button
                type="button"
                onClick={() => handleChatFromNotification(notificationActionsFor.actor.id)}
                disabled={chatStarting}
                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {chatStarting ? "Starting chat…" : "Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
