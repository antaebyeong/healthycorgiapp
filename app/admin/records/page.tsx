import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

export default async function AdminRecordsPage() {
  const member = await getCurrentMember();

  if (!member || member.role !== "admin" || !member.isAdminSession) {
    return <ProtectedNotice />;
  }

  return (
    <main className="app-page">
      <h1 className="app-title">인증 기록 관리</h1>
    </main>
  );
}
