import { ProtectedNotice } from "@/components/ProtectedNotice";
import { AdminMemberList } from "@/components/admin/AdminMemberList";
import { getCurrentMember } from "@/lib/auth";

export default async function AdminPendingPage() {
  const member = await getCurrentMember();

  if (!member || member.role !== "admin" || !member.isAdminSession) {
    return <ProtectedNotice />;
  }

  return (
    <main className="app-page">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-bold text-[#3182F6]">관리자</p>
        <h1 className="app-title">크루 멤버 승인</h1>
        <p className="app-subtitle">신규 신청을 승인하거나 차단합니다.</p>
      </div>
      <AdminMemberList mode="pending" />
    </main>
  );
}
