// Clerk userId gate for server actions. Throws UNAUTHENTICATED for the shared error normalizer.

import "server-only";
import { auth } from "@clerk/nextjs/server";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}
