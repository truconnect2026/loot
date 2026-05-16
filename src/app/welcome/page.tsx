import { Suspense } from "react";
import WelcomeClient from "./welcome-client";

export const metadata = {
  title: "Welcome to Pro",
  description: "You're in.",
};

export default function WelcomePage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[var(--bg-page)]" />}
    >
      <WelcomeClient />
    </Suspense>
  );
}
