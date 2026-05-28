import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="app-page">
      <div className="mb-8">
        <Link className="text-sm font-bold text-[#3182F6]" href="/">
          처음으로
        </Link>
      </div>
      <section className="space-y-5">
        <div>
          <h1 className="app-title">로그인</h1>
          <p className="app-subtitle mt-2">승인된 크루 멤버만 이용할 수 있습니다.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
