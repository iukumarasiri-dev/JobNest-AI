export type PostAuthor = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  role: "JOB_SEEKER" | "EMPLOYER";
  companyName: string | null;
  isFollowedByMe: boolean;
};

export type Post = {
  id: string;
  kind: "TEXT" | "JOB";
  body: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  salaryRange: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  appliedByMe?: boolean;
};

export type PostComment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; role: "JOB_SEEKER" | "EMPLOYER" };
};

export type Applicant = {
  id: string;
  appliedDate: string | null;
  createdAt: string;
  applicant: { id: string; name: string | null; email: string };
  resume: { id: string; title: string; rawText: string | null } | null;
};

export type Resume = { id: string; title: string };
