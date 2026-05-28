"use client";

import { useEffect, useMemo, useState } from "react";
import type { AttendancePhoto } from "@/types/photo";

type AttendanceResponse = {
  today: string;
  week: {
    start: string;
    end: string;
    count: number;
    target: number;
    success: boolean;
    remaining: number;
    certifiedDates: string[];
  };
  month: {
    year: number;
    month: number;
    start: string;
    end: string;
    certifiedDates: string[];
  };
  selectedDate: string;
  selectedPhotos: AttendancePhoto[];
};

function formatMonthInput(dateString: string) {
  return dateString.slice(0, 7);
}

function formatShortDate(dateString: string) {
  return dateString.replaceAll("-", ".");
}

function formatDateString(year: number, month: number, day: number) {
  return [year, month, day].map((value) => String(value).padStart(2, "0")).join("-");
}

function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function getDaysInMonth(year: number, month: number) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function getFirstDayOfMonth(year: number, month: number) {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjustedYear = month < 3 ? year - 1 : year;
  return (adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400) + offsets[month - 1] + 1) % 7;
}

function buildCalendarDays(year: number, month: number) {
  const leading = getFirstDayOfMonth(year, month);
  const lastDay = getDaysInMonth(year, month);
  const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

  for (let i = 0; i < leading; i += 1) {
    days.push({ date: `empty-${i}`, day: 0, isCurrentMonth: false });
  }

  for (let day = 1; day <= lastDay; day += 1) {
    days.push({
      date: formatDateString(year, month, day),
      day,
      isCurrentMonth: true
    });
  }

  return days;
}

export function AttendanceDashboard() {
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [month, setMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadAttendance(nextMonth?: string, nextDate?: string) {
    setIsLoading(true);
    setMessage("");

    const params = new URLSearchParams();

    if (nextMonth) {
      params.set("month", nextMonth);
    }

    if (nextDate) {
      params.set("date", nextDate);
    }

    const response = await fetch(`/api/attendance/me?${params.toString()}`, { cache: "no-store" });
    const result = (await response.json()) as AttendanceResponse & { message?: string };

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "출석 현황을 불러오지 못했습니다.");
      return;
    }

    setData(result);
    setMonth(formatMonthInput(result.month.start));
    setSelectedDate(result.selectedDate);
  }

  useEffect(() => {
    void loadAttendance();
  }, []);

  const certifiedDateSet = useMemo(() => {
    return new Set(data?.month.certifiedDates || []);
  }, [data?.month.certifiedDates]);

  const calendarDays = useMemo(() => {
    if (!data) {
      return [];
    }

    return buildCalendarDays(data.month.year, data.month.month);
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        출석 현황을 불러오는 중입니다.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        {message || "출석 현황을 표시할 수 없습니다."}
      </div>
    );
  }

  const progress = Math.min(100, (data.week.count / data.week.target) * 100);

  return (
    <section className="space-y-5">
      <div className="app-card p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="app-section-title">이번 주</p>
          <span className={data.week.success ? "app-pill-green" : "app-pill-blue"}>
            {data.week.success ? "성공" : "진행 중"}
          </span>
        </div>
        <p className="mt-3 text-[44px] font-black leading-none text-[#111827]">
          {data.week.count} / {data.week.target}회
        </p>
        <p className="mt-2 text-sm font-semibold text-[#6B7280]">
          {data.week.success ? "이번 주 목표 달성" : `${data.week.remaining}회 더 인증하면 목표 달성`}
        </p>
        <div className="mt-5 h-3 rounded-full bg-[#E5E7EB]">
          <div className="h-3 rounded-full bg-[#3182F6]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs font-semibold text-[#9CA3AF]">
          {formatShortDate(data.week.start)} - {formatShortDate(data.week.end)}
        </p>
      </div>

      <div className="app-card p-5">
        <div className="mb-4 grid gap-3">
          <div className="min-w-0">
            <p className="app-section-title">월간 캘린더</p>
            <p className="mt-1 text-xl font-black text-[#111827]">
              {data.month.year}년 {data.month.month}월
            </p>
          </div>
          <input
            className="w-full rounded-[14px] bg-[#F8FAFF] px-3 py-2 text-sm font-semibold text-[#111827] ring-1 ring-[#E5E7EB]"
            onChange={(event) => {
              setMonth(event.target.value);
              void loadAttendance(event.target.value, `${event.target.value}-01`);
            }}
            type="month"
            value={month}
          />
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-black text-[#9CA3AF]">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) =>
            day.isCurrentMonth ? (
              <button
                className={`aspect-square rounded-lg border text-sm font-black ${
                  selectedDate === day.date
                    ? "border-[#3182F6] bg-[#3182F6] text-white"
                    : certifiedDateSet.has(day.date)
                      ? "border-[#DBEAFE] bg-[#E8F2FF] text-[#2563EB]"
                      : "border-transparent bg-[#F8FAFF] text-[#6B7280]"
                }`}
                key={day.date}
                onClick={() => {
                  setSelectedDate(day.date);
                  void loadAttendance(month, day.date);
                }}
                type="button"
              >
                <span>{day.day}</span>
                {certifiedDateSet.has(day.date) ? <span className="block text-xs">✓</span> : null}
              </button>
            ) : (
              <div className="aspect-square" key={day.date} />
            )
          )}
        </div>
      </div>

      <div className="app-card p-5">
        <h2 className="text-lg font-black text-[#111827]">{formatShortDate(data.selectedDate)} 인증 사진</h2>
        {data.selectedPhotos.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">이 날짜에는 인증 사진이 없습니다.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {data.selectedPhotos.map((photo) => (
              <figure className="overflow-hidden rounded-[20px] bg-[#F8FAFF]" key={photo.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${photo.certified_date} 인증 사진`} className="w-full object-cover" src={photo.signedUrl} />
                <figcaption className="px-4 py-3 text-xs font-semibold text-[#6B7280]">
                  업로드 {new Date(photo.uploaded_at).toLocaleString("ko-KR")}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
