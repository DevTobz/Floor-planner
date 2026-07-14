"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isRecovery =
        window.location.hash.includes("type=recovery") ||
        window.location.hash.includes("recovery") ||
        window.location.search.includes("type=recovery");

      if (isRecovery) {
        router.replace(`/login${window.location.search}${window.location.hash}`);
        return;
      }
    }
    checkSession();
  }, [checkSession, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isRecovery =
        window.location.hash.includes("type=recovery") ||
        window.location.hash.includes("recovery") ||
        window.location.search.includes("type=recovery");

      if (isRecovery) return;
    }

    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[var(--accent-mid)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--text-secondary)] text-sm">Loading BuildAI Studio...</p>
      </div>
    </div>
  );
}
