import Link from "next/link";
import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

export default async function AdminPage() {
  const member = await getCurrentMember();

  if (!member || member.role !== "admin" || !member.isAdminSession) {
    return <ProtectedNotice />;
  }

  return (
    <main className="app-page">
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#3182F6]">운영진 전용</p>
        <h1 className="app-title">관리자</h1>
        <p className="app-subtitle">크루 멤버와 인증 사진을 관리합니다.</p>
      </div>
      <div className="mt-6 grid gap-3">
        <Link
          className="app-card flex min-h-[82px] items-center justify-between px-5 py-4"
          href="/admin/pending"
        >
          <span>
            <span className="block font-black text-[#111827]">승인 대기</span>
            <span className="mt-1 block text-sm font-semibold text-[#6B7280]">신청 멤버 승인/차단</span>
          </span>
          <span className="text-xl font-black text-[#3182F6]">›</span>
        </Link>
        <Link
          className="app-card flex min-h-[82px] items-center justify-between px-5 py-4"
          href="/admin/members"
        >
          <span>
            <span className="block font-black text-[#111827]">전체 멤버</span>
            <span className="mt-1 block text-sm font-semibold text-[#6B7280]">상태와 역할 확인</span>
          </span>
          <span className="text-xl font-black text-[#3182F6]">›</span>
        </Link>
        <Link
          className="app-card flex min-h-[82px] items-center justify-between px-5 py-4"
          href="/admin/certifications"
        >
          <span>
            <span className="block font-black text-[#111827]">인증 관리</span>
            <span className="mt-1 block text-sm font-semibold text-[#6B7280]">사진 상태와 출석 현황</span>
          </span>
          <span className="text-xl font-black text-[#3182F6]">›</span>
        </Link>
      </div>
    </main>
  );
}
