import Link from "next/link";
import { AttendanceDashboard } from "@/components/attendance/AttendanceDashboard";
import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

export default async function AttendancePage() {
  const member = await getCurrentMember();

  if (!member) {
    return <ProtectedNotice />;
  }

  return (
    <main className="app-page">
      <div className="mb-6">
        <Link className="text-sm font-bold text-[#3182F6]" href="/home">
          홈으로
        </Link>
      </div>
      <section className="mb-6 space-y-2">
        <p className="text-sm font-bold text-[#3182F6]">내 기록</p>
        <h1 className="app-title">내 출석 현황</h1>
        <p className="app-subtitle">같은 날짜는 하루 1회로 계산됩니다.</p>
      </section>
      <AttendanceDashboard />
    </main>
  );
}
