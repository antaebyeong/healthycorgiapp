import Link from "next/link";
import { AdminCertificationsPanel } from "@/components/admin/AdminCertificationsPanel";
import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

export default async function AdminCertificationsPage() {
  const member = await getCurrentMember();

  if (!member || member.role !== "admin" || !member.isAdminSession) {
    return <ProtectedNotice />;
  }

  return (
    <main className="app-page">
      <div className="mb-6">
        <Link className="text-sm font-bold text-[#3182F6]" href="/admin">
          관리자 홈으로
        </Link>
      </div>
      <section className="mb-6 space-y-2">
        <p className="text-sm font-bold text-[#3182F6]">운영진 전용</p>
        <h1 className="app-title">인증 관리</h1>
        <p className="app-subtitle">사진 상태와 크루 출석 현황을 확인합니다.</p>
      </section>
      <AdminCertificationsPanel />
    </main>
  );
}
