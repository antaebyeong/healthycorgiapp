import Link from "next/link";

export function ProtectedNotice() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center overflow-x-hidden px-5 py-10">
      <section className="app-card space-y-5 p-6">
        <h1 className="text-2xl font-black text-[#111827]">로그인이 필요합니다</h1>
        <p className="text-sm font-semibold leading-6 text-[#6B7280]">승인된 크루 멤버만 볼 수 있습니다.</p>
        <Link className="app-primary-button" href="/login">
          로그인하기
        </Link>
      </section>
    </main>
  );
}
