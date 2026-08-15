"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/avatar";
import { formatBirthDate, formatJoinedDate } from "@/lib/formatDate";

type Profile = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  jobRole: string | null;
  location: string | null;
  birthDate: string | null;
  createdAt: string;
  role: "JOB_SEEKER" | "EMPLOYER";
  companyName: string | null;
  followerCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
  isMe: boolean;
};

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const [viewerRole, setViewerRole] = useState<"JOB_SEEKER" | "EMPLOYER" | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [followSaving, setFollowSaving] = useState(false);
  const [chatSaving, setChatSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  async function load() {
    setPageLoading(true);
    setLoadError("");
    try {
      const [me, data] = await Promise.all([
        apiFetch("/api/auth/me"),
        apiFetch(`/api/users/by-username/${params.username}`),
      ]);
      setViewerRole(me.role === "EMPLOYER" ? "EMPLOYER" : "JOB_SEEKER");
      setProfile(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load this profile.");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username]);

  async function handleToggleFollow() {
    if (!profile) return;
    setActionError("");
    setFollowSaving(true);
    const previous = profile;
    setProfile({
      ...profile,
      isFollowedByMe: !profile.isFollowedByMe,
      followerCount: profile.followerCount + (profile.isFollowedByMe ? -1 : 1),
    });
    try {
      const data = await apiFetch(`/api/users/${profile.id}/follow`, { method: "POST" });
      setProfile((prev) => (prev ? { ...prev, isFollowedByMe: data.following, followerCount: data.followerCount } : prev));
    } catch (err) {
      setProfile(previous);
      setActionError(err instanceof Error ? err.message : "Failed to update follow.");
    } finally {
      setFollowSaving(false);
    }
  }

  async function handleChat() {
    if (!profile || !viewerRole) return;
    setActionError("");
    setChatSaving(true);
    try {
      const conversation = await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ userId: profile.id }),
      });
      const prefix = viewerRole === "EMPLOYER" ? "employer" : "seeker";
      router.push(`/${prefix}/messages?c=${conversation.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to start chat.");
    } finally {
      setChatSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-border rounded-lg overflow-hidden animate-pulse">
          <div className="h-28 bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-9 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{loadError || "This profile could not be found."}</p>
          <button onClick={load} className="underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border border-border rounded-lg overflow-hidden">
        <div
          className="h-28 bg-muted bg-cover bg-center"
          style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined}
        />

        <div className="px-4 pb-4">
          <div className="-mt-8 flex items-end justify-between">
            <Avatar
              src={profile.avatarUrl}
              name={profile.name}
              size={72}
              className="border-4 border-background bg-background"
            />

            {!profile.isMe && (
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followSaving}
                  className={
                    profile.isFollowedByMe
                      ? "text-sm border border-border rounded-full px-3 py-1.5 text-muted-foreground disabled:opacity-50"
                      : "text-sm border border-primary text-primary rounded-full px-3 py-1.5 disabled:opacity-50"
                  }
                >
                  {profile.isFollowedByMe ? "Following" : "Follow back"}
                </button>
                <button
                  type="button"
                  onClick={handleChat}
                  disabled={chatSaving}
                  className="text-sm bg-primary text-primary-foreground rounded-full px-3 py-1.5 disabled:opacity-50"
                >
                  {chatSaving ? "…" : "Chat"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-2">
            <p className="font-semibold">{profile.name || "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>💼 {profile.jobRole || (profile.companyName ? profile.companyName : "Not set")}</span>
            <span>📌 {profile.location || "Not set"}</span>
            {profile.birthDate && <span>🎂 {formatBirthDate(profile.birthDate)}</span>}
          </div>

          <div className="mt-1 text-xs text-muted-foreground">📅 {formatJoinedDate(profile.createdAt)}</div>

          <div className="mt-3 flex gap-4 text-sm">
            <span>
              <span className="font-semibold">{profile.followingCount}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span>
              <span className="font-semibold">{profile.followerCount}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </span>
          </div>

          {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}
        </div>
      </div>
    </div>
  );
}
