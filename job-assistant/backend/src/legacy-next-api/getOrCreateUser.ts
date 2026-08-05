import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    const clerkUser = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser?.fullName ?? undefined,
      },
    });
  }
  return user;
}