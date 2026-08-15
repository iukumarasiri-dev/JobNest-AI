export const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

export type Application = {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
  createdAt: string;
  resume: { id: string; title: string } | null;
};

export type Resume = {
  id: string;
  title: string;
};
