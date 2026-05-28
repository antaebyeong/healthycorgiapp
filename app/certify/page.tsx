import Link from "next/link";
import { CertifyCamera } from "@/components/certify/CertifyCamera";
import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

export default async function CertifyPage() {
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
        <p className="text-sm font-bold text-[#3182F6]">운동 인증</p>
        <h1 className="app-title">사진으로 인증하기</h1>
        <p className="app-subtitle">날짜와 시간이 들어간 사진으로 인증합니다.</p>
      </section>
      <CertifyCamera />
    </main>
  );
}
