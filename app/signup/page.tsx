import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="app-page">
      <div className="mb-8">
        <Link className="text-sm font-bold text-[#3182F6]" href="/login">
          로그인으로
        </Link>
      </div>
      <section className="space-y-5">
        <div>
          <h1 className="app-title">가입 신청</h1>
          <p className="app-subtitle mt-2">운영진 승인 후 사용할 수 있습니다.</p>
        </div>
        <SignupForm />
      </section>
    </main>
  );
}
