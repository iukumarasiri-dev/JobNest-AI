import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireEmployer } from "../middleware/requireEmployer.js";
import { requireJobSeeker } from "../middleware/requireJobSeeker.js";
import { listPosts, createPost, getPost, deletePost } from "./posts/crud.js";
import { toggleLike, listComments, createComment } from "./posts/interactions.js";
import { applyToPost, listApplicants } from "./posts/apply.js";

export const postsRouter = Router();
postsRouter.use(requireAuth);

postsRouter.get("/", listPosts);
postsRouter.post("/", createPost);
postsRouter.get("/:id", getPost);
postsRouter.delete("/:id", deletePost);

postsRouter.post("/:id/like", toggleLike);
postsRouter.get("/:id/comments", listComments);
postsRouter.post("/:id/comments", createComment);

postsRouter.post("/:id/apply", requireJobSeeker, applyToPost);
postsRouter.get("/:id/applicants", requireEmployer, listApplicants);
