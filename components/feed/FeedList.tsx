"use client";

import { useEffect, useState } from "react";
import { CorgiMark } from "@/components/brand/CorgiMark";
import type { FeedPhoto } from "@/types/photo";

function formatCertifiedDate(dateString: string) {
  return dateString.replaceAll("-", ".");
}

function formatUploadedTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function FeedList() {
  const [photos, setPhotos] = useState<FeedPhoto[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true);
      setMessage("");

      const response = await fetch("/api/photos/feed", { cache: "no-store" });
      const result = (await response.json()) as { photos?: FeedPhoto[]; message?: string };

      setIsLoading(false);

      if (!response.ok) {
        setMessage(result.message || "전체 인증 피드를 불러오지 못했습니다.");
        return;
      }

      setPhotos(result.photos || []);
    }

    void loadFeed();
  }, []);

  if (isLoading) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        인증 피드를 불러오는 중입니다.
      </div>
    );
  }

  if (message) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        {message}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="app-card p-6 text-center text-sm leading-6 text-[#6B7280]">
        <div className="mx-auto flex justify-center">
          <CorgiMark size="sm" />
        </div>
        <p className="mt-3 font-semibold">아직 올라온 인증 사진이 없습니다.</p>
      </div>
    );
  }

  return (
    <section className="grid gap-4">
      {photos.map((photo) => (
        <article className="app-card overflow-hidden" key={photo.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={`${photo.memberName} 인증 사진`} className="w-full bg-[#F8FAFF] object-cover" src={photo.signedUrl} />
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#111827]">{photo.memberName}</h2>
                <p className="mt-1 text-sm font-semibold text-[#6B7280]">{formatCertifiedDate(photo.certified_date)}</p>
              </div>
              <span className="app-pill-blue">{formatUploadedTime(photo.uploaded_at)}</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
