"use client";

import { useRef } from "react";
import { RefreshCw } from "lucide-react";
import { ProfileCard, type ProfileCardHandle } from "@/components/profile-card";
import { useFeed } from "./useFeed";
import { PostComposer } from "./components/PostComposer";
import { PostList } from "./components/PostList";

export default function FeedPage() {
  const profileCardRef = useRef<ProfileCardHandle>(null);
  const {
    me,
    posts,
    resumes,
    pageLoading,
    loadError,
    actionError,
    refreshing,
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
    attachmentUrl,
    setAttachmentUrl,
    attachmentName,
    setAttachmentName,
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
    refreshFeed,
    handleCreatePost,
    handleToggleLike,
    handleToggleSave,
    handleApply,
    handleToggleFollow,
    loadComments,
    handleAddComment,
    loadApplicants,
  } = useFeed({
    onFollowChange: (delta) => profileCardRef.current?.adjustFollowingCount(delta),
  });

  if (pageLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="border border-border rounded-xl p-4 animate-pulse space-y-3">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-9 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{loadError}</p>
          <button onClick={loadAll} className="underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      <div className="lg:col-span-2">
        <PostComposer
          meName={me.name}
          meAvatarUrl={me.avatarUrl}
          isEmployer={me.role === "EMPLOYER"}
          kind={kind}
          onKindChange={setKind}
          body={body}
          onBodyChange={setBody}
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          location={location}
          onLocationChange={setLocation}
          salaryRange={salaryRange}
          onSalaryRangeChange={setSalaryRange}
          videoUrl={videoUrl}
          onVideoUrlChange={setVideoUrl}
          attachmentUrl={attachmentUrl}
          onAttachmentUrlChange={setAttachmentUrl}
          attachmentName={attachmentName}
          onAttachmentNameChange={setAttachmentName}
          submitting={submitting}
          formError={formError}
          onSubmit={handleCreatePost}
        />

        {actionError && <p className="text-sm text-destructive mb-3">{actionError}</p>}

        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={refreshFeed}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-full px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh feed"}
          </button>
        </div>

        <PostList
          posts={posts}
          viewerId={me.id}
          viewerRole={me.role}
          resumes={resumes}
          comments={comments}
          commentsLoadingIds={commentsLoadingIds}
          applicants={applicants}
          applicantsLoadingIds={applicantsLoadingIds}
          likingPostId={likingPostId}
          savingPostId={savingPostId}
          applyingPostId={applyingPostId}
          followingAuthorId={followingAuthorId}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
          onLoadComments={loadComments}
          onAddComment={handleAddComment}
          onLoadApplicants={loadApplicants}
          onApply={handleApply}
          onToggleFollow={handleToggleFollow}
        />
      </div>

      <div className="lg:col-span-1">
        <ProfileCard ref={profileCardRef} />
      </div>
    </div>
  );
}
