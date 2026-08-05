// Auth gate for /projects/**. Layout-level protect() replaces middleware-level route matching (Clerk 7.6.5 guidance).

import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";

export default async function ProjectsLayout({ children }: { children: ReactNode }) {
  await auth.protect();
  return <>{children}</>;
}
