import Link from "next/link";
import { FeedList } from "@/components/feed/FeedList";
import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

export default async function FeedPage() {
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
        <p className="text-sm font-bold text-[#3182F6]">함께 인증</p>
        <h1 className="app-title">크루 인증 피드</h1>
        <p className="app-subtitle">멤버 인증 사진을 최신순으로 확인합니다.</p>
      </section>
      <FeedList />
    </main>
  );
}
