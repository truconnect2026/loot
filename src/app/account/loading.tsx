"use client";

import { AccountSkeleton } from "@/components/shared/PageSkeleton";

/**
 * Route-level loading for /account. A held ghost of the Me layout
 * (header · profile card · upgrade card · settings tiles) so the tab
 * arrives already shaped instead of flashing a bare spinner. Content
 * fades in over it; reduced motion shows it static (see PageSkeleton).
 */
export default function AccountLoading() {
  return <AccountSkeleton />;
}
