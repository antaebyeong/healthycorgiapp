"use client";

import { useEffect, useState } from "react";
import type { AdminCertificationDashboard, AdminCertificationMember } from "@/types/admin-certification";
import type { AdminCertificationPhoto } from "@/types/photo";

function formatDate(dateString: string) {
  return dateString.replaceAll("-", ".");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

function MemberList({
  members,
  emptyText,
  showCertifiedDays = false
}: {
  members: AdminCertificationMember[];
  emptyText: string;
  showCertifiedDays?: boolean;
}) {
  if (members.length === 0) {
    return <p className="text-sm font-semibold text-[#6B7280]">{emptyText}</p>;
  }

  return (
    <ul className="grid gap-2">
      {members.map((member) => (
        <li className="flex items-center justify-between rounded-[16px] bg-[#F8FAFF] px-4 py-3 text-sm" key={member.id}>
          <span className="font-bold text-[#111827]">{member.name}</span>
          <span className="text-xs font-bold text-[#6B7280]">
            {showCertifiedDays ? `${member.certifiedDays || 0}일` : member.birth_date}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AdminCertificationsPanel() {
  const [dashboard, setDashboard] = useState<AdminCertificationDashboard | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);

  async function loadDashboard() {
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/certifications", { cache: "no-store" });
    const result = (await response.json()) as AdminCertificationDashboard & { message?: string };

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "관리자 인증 현황을 불러오지 못했습니다.");
      return;
    }

    setDashboard(result);
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function updatePhotoStatus(photo: AdminCertificationPhoto) {
    const nextStatus = photo.status === "active" ? "deleted" : "active";
    setBusyRecordId(photo.id);
    setMessage("");

    const response = await fetch(`/api/admin/certifications/${photo.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    const result = (await response.json()) as { message?: string };

    setBusyRecordId(null);
    setMessage(result.message || (response.ok ? "상태가 변경되었습니다." : "상태 변경에 실패했습니다."));

    if (response.ok) {
      await loadDashboard();
    }
  }

  if (isLoading && !dashboard) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        인증 관리 데이터를 불러오는 중입니다.
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        {message || "인증 관리 데이터를 표시할 수 없습니다."}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {message ? (
        <p className="app-card p-4 text-sm font-semibold text-[#6B7280]">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <section className="app-card p-4">
          <p className="text-xs font-bold text-[#6B7280]">오늘 인증</p>
          <p className="mt-1 text-2xl font-black text-[#111827]">{dashboard.todayCertifiedMembers.length}</p>
        </section>
        <section className="app-card p-4">
          <p className="text-xs font-bold text-[#6B7280]">오늘 미인증</p>
          <p className="mt-1 text-2xl font-black text-[#111827]">{dashboard.todayMissingMembers.length}</p>
        </section>
        <section className="app-card p-4">
          <p className="text-xs font-bold text-[#6B7280]">주 4회 이상</p>
          <p className="mt-1 text-2xl font-black text-[#111827]">{dashboard.weeklySuccessMembers.length}</p>
        </section>
        <section className="app-card p-4">
          <p className="text-xs font-bold text-[#6B7280]">주 4회 미만</p>
          <p className="mt-1 text-2xl font-black text-[#111827]">{dashboard.weeklyMissingMembers.length}</p>
        </section>
      </div>

      <section className="app-card p-5">
        <h2 className="text-lg font-black text-[#111827]">오늘 인증한 멤버</h2>
        <p className="mb-3 mt-1 text-xs font-semibold text-[#6B7280]">{formatDate(dashboard.today)} 기준</p>
        <MemberList members={dashboard.todayCertifiedMembers} emptyText="오늘 인증한 멤버가 없습니다." />
      </section>

      <section className="app-card p-5">
        <h2 className="text-lg font-black text-[#111827]">오늘 미인증 멤버</h2>
        <p className="mb-3 mt-1 text-xs font-semibold text-[#6B7280]">{formatDate(dashboard.today)} 기준</p>
        <MemberList members={dashboard.todayMissingMembers} emptyText="오늘 미인증 멤버가 없습니다." />
      </section>

      <section className="app-card p-5">
        <h2 className="text-lg font-black text-[#111827]">이번 주 4회 이상</h2>
        <p className="mb-3 mt-1 text-xs font-semibold text-[#6B7280]">
          {formatDate(dashboard.week.start)} - {formatDate(dashboard.week.end)}
        </p>
        <MemberList members={dashboard.weeklySuccessMembers} emptyText="이번 주 4회 이상 인증한 멤버가 없습니다." showCertifiedDays />
      </section>

      <section className="app-card p-5">
        <h2 className="text-lg font-black text-[#111827]">이번 주 4회 미만</h2>
        <p className="mb-3 mt-1 text-xs font-semibold text-[#6B7280]">
          {formatDate(dashboard.week.start)} - {formatDate(dashboard.week.end)}
        </p>
        <MemberList members={dashboard.weeklyMissingMembers} emptyText="이번 주 4회 미만 멤버가 없습니다." showCertifiedDays />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-[#111827]">전체 인증 사진</h2>
        {dashboard.photos.length === 0 ? (
          <div className="app-card p-5 text-sm text-[#6B7280]">
            등록된 인증 사진이 없습니다.
          </div>
        ) : null}
        {dashboard.photos.map((photo) => (
          <article className="app-card overflow-hidden" key={photo.id}>
            <div className="grid gap-2 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[#111827]">{photo.memberName}</h3>
                  <p className="mt-1 font-semibold text-[#6B7280]">인증일 {formatDate(photo.certified_date)}</p>
                  <p className="text-xs font-semibold text-[#9CA3AF]">업로드 {formatDateTime(photo.uploaded_at)}</p>
                </div>
                <span
                  className={photo.status === "active" ? "app-pill-green" : "app-pill-red"}
                >
                  {photo.status}
                </span>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={`${photo.memberName} 인증 사진`} className="w-full bg-[#F8FAFF] object-cover" src={photo.signedUrl} />
            <div className="p-4">
              <button
                className={`${photo.status === "active" ? "app-danger-button" : "app-primary-button"} w-full text-sm`}
                disabled={busyRecordId === photo.id}
                onClick={() => void updatePhotoStatus(photo)}
                type="button"
              >
                {photo.status === "active" ? "deleted 상태로 변경" : "active로 복구"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
