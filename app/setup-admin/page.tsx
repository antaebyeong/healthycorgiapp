import { SetupAdminForm } from "@/components/auth/SetupAdminForm";

export default function SetupAdminPage() {
  return (
    <main className="app-page">
      <section className="space-y-5">
        <div>
          <h1 className="app-title">최초 관리자 생성</h1>
          <p className="app-subtitle mt-2">관리자 계정이 없을 때만 사용할 수 있어요.</p>
        </div>
        <SetupAdminForm />
      </section>
    </main>
  );
}
