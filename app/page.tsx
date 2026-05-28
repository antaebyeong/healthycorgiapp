"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
  member?: {
    status?: string;
  } | null;
  isAuthenticated?: boolean;
};

const SESSION_CHECK_TIMEOUT_MS = 3000;

export default function SplashPage() {
  const router = useRouter();
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [timerReady, setTimerReady] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  const hasNavigatedRef = useRef(false);

  const navigateWhenReady = useCallback(
    (path: string | null, canNavigate: boolean) => {
      if (!path || !canNavigate || hasNavigatedRef.current) {
        return;
      }

      hasNavigatedRef.current = true;
      router.replace(path);
    },
    [router]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTimerReady(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function checkSession() {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => {
        controller.abort();
      }, SESSION_CHECK_TIMEOUT_MS);

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal
        });

        if (!response.ok) {
          setTargetPath("/login");
          return;
        }

        const result = (await response.json()) as MeResponse;
        setTargetPath(result.isAuthenticated && result.member?.status === "approved" ? "/home" : "/login");
      } catch {
        setTargetPath("/login");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkSession();
  }, []);

  useEffect(() => {
    navigateWhenReady(targetPath, timerReady || skipRequested);
  }, [navigateWhenReady, skipRequested, targetPath, timerReady]);

  function handleSkip() {
    setSkipRequested(true);
  }

  return (
    <main
      aria-label="헬시코기 시작 화면"
      className="fixed inset-0 h-screen w-full cursor-pointer overflow-hidden bg-[#111827]"
      onClick={handleSkip}
      onTouchStart={handleSkip}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Healthy Corgi Crew"
        className="h-full w-full object-cover object-center"
        draggable={false}
        src="/images/splash-healthy-corgi.png"
      />
      <p className="absolute inset-x-0 bottom-6 text-center text-xs font-semibold text-white/70">
        탭해서 시작
      </p>
    </main>
  );
}
