import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireEmployer } from "../middleware/requireEmployer.js";
import { requireJobSeeker } from "../middleware/requireJobSeeker.js";
import {
  listPosts,
  listMyPosts,
  listSavedPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
} from "./posts/crud.js";
import { toggleLike, toggleSave, listComments, createComment } from "./posts/interactions.js";
import { applyToPost, listApplicants } from "./posts/apply.js";

export const postsRouter = Router();
postsRouter.use(requireAuth);

// NOTE: /mine and /saved must be registered before /:id, or Express would
// match them as a post id.
postsRouter.get("/mine", listMyPosts);
postsRouter.get("/saved", listSavedPosts);

postsRouter.get("/", listPosts);
postsRouter.post("/", createPost);
postsRouter.get("/:id", getPost);
postsRouter.patch("/:id", updatePost);
postsRouter.delete("/:id", deletePost);

postsRouter.post("/:id/like", toggleLike);
postsRouter.post("/:id/save", toggleSave);
postsRouter.get("/:id/comments", listComments);
postsRouter.post("/:id/comments", createComment);

postsRouter.post("/:id/apply", requireJobSeeker, applyToPost);
postsRouter.get("/:id/applicants", requireEmployer, listApplicants);
