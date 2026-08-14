"use client";

import { ProfileCard } from "@/components/profile-card";
import { useFeed } from "./useFeed";
import { PostComposer } from "./_components/PostComposer";
import { PostList } from "./_components/PostList";

export default function FeedPage() {
  const {
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
    applyingPostId,
    comments,
    commentsLoadingIds,
    applicants,
    applicantsLoadingIds,
    loadAll,
    handleCreatePost,
    handleDeletePost,
    handleToggleLike,
    handleApply,
    loadComments,
    handleAddComment,
    loadApplicants,
  } = useFeed();

  if (pageLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Feed</h1>
        <div className="border border-border rounded-lg p-4 animate-pulse space-y-3 max-w-lg">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-9 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Feed</h1>
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Feed</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PostComposer
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
            submitting={submitting}
            formError={formError}
            onSubmit={handleCreatePost}
          />

          {actionError && <p className="text-sm text-destructive mb-3">{actionError}</p>}

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
            applyingPostId={applyingPostId}
            onToggleLike={handleToggleLike}
            onLoadComments={loadComments}
            onAddComment={handleAddComment}
            onLoadApplicants={loadApplicants}
            onApply={handleApply}
            onDelete={handleDeletePost}
          />
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}
