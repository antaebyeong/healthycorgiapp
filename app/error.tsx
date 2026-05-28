"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Client runtime error", {
        message: error.message,
        name: error.name,
        digest: error.digest
      });
    }
  }, [error]);

  return (
    <main className="app-page flex flex-col justify-center">
      <section className="app-card space-y-4 p-6 text-center">
        <p className="text-sm font-black text-[#3182F6]">헬시코기</p>
        <h1 className="text-2xl font-black text-[#111827]">화면을 불러오지 못했습니다</h1>
        <p className="text-sm font-semibold leading-6 text-[#6B7280]">
          브라우저를 새로고침하거나 잠시 후 다시 시도해주세요.
        </p>
        <button className="app-primary-button" onClick={reset} type="button">
          다시 시도
        </button>
      </section>
    </main>
  );
}
