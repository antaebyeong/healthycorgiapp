"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoading(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="app-secondary-button w-full text-sm"
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      {isLoading ? "로그아웃 중" : "로그아웃"}
    </button>
  );
}
