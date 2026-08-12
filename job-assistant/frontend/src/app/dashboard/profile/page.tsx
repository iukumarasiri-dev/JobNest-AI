"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Me = {
  id: string;
  email: string;
  name: string | null;
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  async function load() {
    setPageLoading(true);
    setLoadError("");
    try {
      const data = await apiFetch("/api/auth/me");
      setMe(data);
      setName(data.name ?? "");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load your profile.");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileNotice("");
    try {
      const data = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setMe(data);
      setProfileNotice("Profile updated.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordNotice("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice("Password changed.");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (pageLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        <div className="border border-border rounded-lg p-4 animate-pulse space-y-3 max-w-md">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-9 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{loadError}</p>
          <button onClick={load} className="underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="space-y-8 max-w-md">
        <form onSubmit={handleProfileSubmit} className="border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold text-sm">Account details</h2>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input
              value={me?.email ?? ""}
              disabled
              className="w-full border border-border rounded p-2 bg-muted text-muted-foreground text-sm"
            />
          </div>

          <div>
            <label htmlFor="name" className="text-xs text-muted-foreground mb-1 block">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded p-2 bg-background text-sm"
            />
          </div>

          {profileError && <p className="text-sm text-destructive">{profileError}</p>}
          {profileNotice && <p className="text-sm text-primary">{profileNotice}</p>}

          <button
            type="submit"
            disabled={savingProfile}
            className="border border-border rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save changes"}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold text-sm">Change password</h2>

          <div>
            <label htmlFor="currentPassword" className="text-xs text-muted-foreground mb-1 block">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-border rounded p-2 bg-background text-sm"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="text-xs text-muted-foreground mb-1 block">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-border rounded p-2 bg-background text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-xs text-muted-foreground mb-1 block">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-border rounded p-2 bg-background text-sm"
            />
          </div>

          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordNotice && <p className="text-sm text-primary">{passwordNotice}</p>}

          <button
            type="submit"
            disabled={savingPassword}
            className="border border-border rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {savingPassword ? "Saving..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
