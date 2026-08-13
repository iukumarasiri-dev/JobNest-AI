export const STATUS_OPTIONS = ["wishlist", "applied", "interview", "offer", "rejected", "withdrawn"];

export const STATUS_COLORS: Record<string, { dot: string; badge: string }> = {
  wishlist: { dot: "bg-slate-400", badge: "bg-slate-500/10 text-slate-600 dark:text-slate-300" },
  applied: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  interview: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  offer: { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  rejected: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-600 dark:text-red-400" },
  withdrawn: { dot: "bg-zinc-400", badge: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
};
