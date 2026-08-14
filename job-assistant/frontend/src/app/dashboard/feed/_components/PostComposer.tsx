"use client";

import { useRef, useState } from "react";
import { Video, Briefcase, Upload } from "lucide-react";
import { Avatar } from "@/components/avatar";

const MAX_VIDEO_BYTES = 12 * 1024 * 1024; // 12MB — base64-encoded and stored directly in the database

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PostComposer({
  meName,
  meAvatarUrl,
  isEmployer,
  kind,
  onKindChange,
  body,
  onBodyChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  location,
  onLocationChange,
  salaryRange,
  onSalaryRangeChange,
  videoUrl,
  onVideoUrlChange,
  submitting,
  formError,
  onSubmit,
}: {
  meName: string | null;
  meAvatarUrl: string | null;
  isEmployer: boolean;
  kind: "TEXT" | "JOB";
  onKindChange: (value: "TEXT" | "JOB") => void;
  body: string;
  onBodyChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  salaryRange: string;
  onSalaryRangeChange: (value: string) => void;
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  submitting: boolean;
  formError: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showVideoField, setShowVideoField] = useState(false);
  const [videoFileError, setVideoFileError] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    onSubmit(e);
    setExpanded(false);
    setShowVideoField(false);
  }

  async function handleVideoFileChange(file: File | undefined) {
    if (!file) return;
    setVideoFileError("");
    if (!file.type.startsWith("video/")) {
      setVideoFileError("Please choose a video file.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoFileError("Video is too large (max 12MB).");
      return;
    }
    setVideoUploading(true);
    try {
      onVideoUrlChange(await readFileAsDataUrl(file));
    } catch {
      setVideoFileError("Failed to read video file.");
    } finally {
      setVideoUploading(false);
    }
  }

  const isUploadedVideo = videoUrl.startsWith("data:video/");

  return (
    <div className="mb-4 border border-border rounded-xl bg-background p-4">
      <div className="flex items-center gap-3">
        <Avatar src={meAvatarUrl} name={meName} size={48} />
        {expanded ? (
          <p className="font-medium text-sm">{meName ?? "You"}</p>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex-1 text-left rounded-full border border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Start a post
          </button>
        )}
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {isEmployer && (
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => onKindChange("TEXT")}
                className={`px-3 py-1.5 rounded-full border ${
                  kind === "TEXT" ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >
                Text update
              </button>
              <button
                type="button"
                onClick={() => onKindChange("JOB")}
                className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                  kind === "JOB" ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >
                <Briefcase className="size-3.5" /> Job posting
              </button>
            </div>
          )}

          {kind === "TEXT" || !isEmployer ? (
            <textarea
              autoFocus
              className="w-full border-none outline-none resize-none bg-transparent text-base placeholder:text-muted-foreground h-28"
              placeholder="What do you want to talk about?"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              required
            />
          ) : (
            <>
              <input
                className="w-full border border-border rounded p-2 bg-background"
                placeholder="Job title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                required
              />
              <textarea
                className="w-full border border-border rounded p-2 h-32 bg-background"
                placeholder="Job description"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="w-full border border-border rounded p-2 bg-background"
                  placeholder="Location (optional)"
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                />
                <input
                  className="w-full border border-border rounded p-2 bg-background"
                  placeholder="Salary range (optional)"
                  value={salaryRange}
                  onChange={(e) => onSalaryRangeChange(e.target.value)}
                />
              </div>
            </>
          )}

          {showVideoField && (
            <div className="space-y-2">
              {isUploadedVideo ? (
                <div className="flex items-center justify-between gap-2 border border-border rounded p-2 bg-background text-sm">
                  <span className="text-muted-foreground">Video file attached</span>
                  <button
                    type="button"
                    onClick={() => onVideoUrlChange("")}
                    className="text-xs text-destructive underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  className="w-full border border-border rounded p-2 bg-background text-sm"
                  placeholder="Video link — YouTube, Vimeo, etc."
                  value={videoUrl}
                  onChange={(e) => onVideoUrlChange(e.target.value)}
                  type="url"
                  autoFocus
                />
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVideoFileChange(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  disabled={videoUploading}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded px-2 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Upload className="size-3.5" />
                  {videoUploading ? "Uploading..." : "Upload from device (max 12MB)"}
                </button>
              </div>

              {videoFileError && <p className="text-xs text-destructive">{videoFileError}</p>}
            </div>
          )}

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => setShowVideoField((v) => !v)}
              className={`flex items-center gap-1.5 text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors ${
                showVideoField ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Video className="size-4" /> Video
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setShowVideoField(false);
                }}
                className="text-sm text-muted-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
