"use client";

import { useEffect, useState } from "react";
import { CorgiMark } from "@/components/brand/CorgiMark";

type WeeklyData = {
  week?: {
    count: number;
    target: number;
    success: boolean;
    remaining: number;
  };
  message?: string;
};

export function HomeWeeklyCard() {
  const [data, setData] = useState<WeeklyData | null>(null);

  useEffect(() => {
    async function loadWeek() {
      const response = await fetch("/api/attendance/me", { cache: "no-store" });
      const result = (await response.json()) as WeeklyData;

      if (response.ok) {
        setData(result);
      }
    }

    void loadWeek();
  }, []);

  if (!data?.week) {
    return (
      <section className="app-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="app-section-title">이번 주 인증</p>
            <p className="mt-3 text-2xl font-black text-[#111827]">기록 확인 중</p>
            <p className="mt-2 text-sm font-semibold text-[#6B7280]">오늘 인증하면 바로 반영됩니다.</p>
          </div>
          <CorgiMark size="sm" />
        </div>
      </section>
    );
  }

  const progress = Math.min(100, (data.week.count / data.week.target) * 100);

  return (
    <section className="app-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="app-section-title">이번 주 인증</p>
          <p className="mt-3 text-[38px] font-black leading-none text-[#111827]">
            {data.week.count} / {data.week.target}회
          </p>
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">
            {data.week.success ? "이번 주 목표 달성" : `${data.week.remaining}회 더 인증하면 목표 달성`}
          </p>
        </div>
        <CorgiMark size="sm" />
      </div>
      <div className="mt-5 h-3 rounded-full bg-[#E5E7EB]">
        <div className="h-3 rounded-full bg-[#3182F6]" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
