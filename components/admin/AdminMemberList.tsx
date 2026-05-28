"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminMember, MemberStatus } from "@/types/member";

type AdminMemberListProps = {
  mode: "pending" | "all";
};

const statusLabels: Record<MemberStatus, string> = {
  pending: "승인 대기",
  approved: "승인됨",
  blocked: "차단됨"
};

const statusClassNames: Record<MemberStatus, string> = {
  pending: "app-pill-blue",
  approved: "app-pill-green",
  blocked: "app-pill-red"
};

const roleClassNames = {
  member: "rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-black text-[#4B5563]",
  admin: "rounded-full bg-[#E8F2FF] px-3 py-1 text-xs font-black text-[#2563EB]"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatBirthDate(value: string) {
  return value.replaceAll("-", ".");
}

export function AdminMemberList({ mode }: AdminMemberListProps) {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    return mode === "pending" ? "/api/admin/members?status=pending" : "/api/admin/members";
  }, [mode]);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    const [response, meResponse] = await Promise.all([
      fetch(endpoint, { cache: "no-store" }),
      fetch("/api/auth/me", { cache: "no-store" })
    ]);
    const result = (await response.json()) as { members?: AdminMember[]; message?: string };

    if (meResponse.ok) {
      const meResult = (await meResponse.json()) as { member?: { id?: string } | null };
      setCurrentMemberId(meResult.member?.id || null);
    }

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "멤버 목록을 불러오지 못했습니다.");
      return;
    }

    setMembers(result.members || []);
  }, [endpoint]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function updateStatus(memberId: string, status: "approved" | "blocked") {
    setBusyMemberId(memberId);
    setMessage("");

    const response = await fetch(`/api/admin/members/${memberId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const result = (await response.json()) as { message?: string };
    setBusyMemberId(null);
    setMessage(result.message || (response.ok ? "변경되었습니다." : "변경에 실패했습니다."));

    if (response.ok) {
      await loadMembers();
    }
  }

  async function updateRole(member: AdminMember, role: "member" | "admin") {
    const confirmMessage =
      role === "admin"
        ? `${member.name}님을 관리자로 지정할까요?`
        : `${member.name}님을 일반 멤버로 변경할까요?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBusyMemberId(member.id);
    setMessage("");

    const response = await fetch(`/api/admin/members/${member.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });

    const result = (await response.json()) as { message?: string };
    setBusyMemberId(null);
    setMessage(result.message || (response.ok ? "역할이 변경되었습니다." : "역할 변경에 실패했습니다."));

    if (response.ok) {
      await loadMembers();
    }
  }

  if (isLoading) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        멤버 목록을 불러오는 중입니다.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {message ? (
        <p className="app-card p-4 text-sm font-semibold text-[#6B7280]">
          {message}
        </p>
      ) : null}

      {members.length === 0 ? (
        <div className="app-card p-5 text-sm leading-6 text-[#6B7280]">
          {mode === "pending" ? "승인 대기 중인 멤버가 없습니다." : "등록된 멤버가 없습니다."}
        </div>
      ) : null}

      <div className="grid gap-3">
        {members.map((member) => (
          <article className="app-card p-5" key={member.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#111827]">{member.name}</h2>
                <p className="mt-1 text-sm font-semibold text-[#6B7280]">생년월일 {formatBirthDate(member.birth_date)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={statusClassNames[member.status]}>{statusLabels[member.status]}</span>
                <span className={roleClassNames[member.role]}>{member.role}</span>
              </div>
            </div>

            <dl className="mt-4 grid gap-2 text-sm text-[#6B7280]">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold">역할</dt>
                <dd className="font-bold text-[#111827]">{member.role === "admin" ? "관리자" : "일반 멤버"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold">가입일</dt>
                <dd className="font-bold text-[#111827]">{formatDate(member.created_at)}</dd>
              </div>
            </dl>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {member.status !== "approved" ? (
                <button
                  className="app-primary-button text-sm"
                  disabled={busyMemberId === member.id}
                  onClick={() => void updateStatus(member.id, "approved")}
                  type="button"
                >
                  승인
                </button>
              ) : null}
              {member.status !== "blocked" ? (
                <button
                  className="app-danger-button text-sm"
                  disabled={busyMemberId === member.id}
                  onClick={() => void updateStatus(member.id, "blocked")}
                  type="button"
                >
                  차단
                </button>
              ) : null}
            </div>

            <div className="mt-2 grid gap-2">
              {member.role === "member" && member.status === "approved" ? (
                <button
                  className="app-secondary-button text-sm"
                  disabled={busyMemberId === member.id}
                  onClick={() => void updateRole(member, "admin")}
                  type="button"
                >
                  관리자 지정
                </button>
              ) : null}
              {member.role === "admin" && member.id !== currentMemberId ? (
                <button
                  className="app-secondary-button text-sm"
                  disabled={busyMemberId === member.id}
                  onClick={() => void updateRole(member, "member")}
                  type="button"
                >
                  일반 멤버로 변경
                </button>
              ) : null}
              {member.role === "member" && member.status === "pending" ? (
                <p className="rounded-[16px] bg-[#F8FAFF] px-4 py-3 text-xs font-bold text-[#6B7280]">
                  승인 후 관리자 지정 가능
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
