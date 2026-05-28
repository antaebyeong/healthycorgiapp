import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { HomeWeeklyCard } from "@/components/home/HomeWeeklyCard";
import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

const appMenus = [
  { label: "내 출석 현황", description: "이번 주 목표 확인", href: "/attendance" },
  { label: "크루 인증 피드", description: "멤버 인증 사진 보기", href: "/feed" }
];

const externalMenus = [
  {
    label: "크루 공지",
    description: "운영진 공지 문서",
    href: "https://docs.google.com/document/d/1Z43UZLtqkkKkwM3Vdv3HNpX07GgKhAOL/edit?usp=sharing&ouid=102778260727070631971&rtpof=true&sd=true"
  },
  { label: "내 상벌점 현황", description: "상벌점 페이지", href: "https://antaebyeong.github.io/healthycorgi/" },
  {
    label: "크루 노션",
    description: "운영 정보 확인",
    href: "https://furry-bite-b26.notion.site/19ebfee2d04780d5b40aefa4327fe445?source=copy_link"
  }
];

const adminMenus = [
  { label: "관리자 메뉴", description: "크루 멤버 승인", href: "/admin" },
  { label: "인증 관리", description: "사진 상태와 주간 현황", href: "/admin/certifications" }
];

export default async function HomePage() {
  const member = await getCurrentMember();

  if (!member) {
    return <ProtectedNotice />;
  }

  return (
    <main className="app-page">
      <header className="mb-5 px-1">
        <p className="text-sm font-bold text-[#3182F6]">헬시코기</p>
        <h1 className="mt-1 text-[28px] font-black leading-tight text-[#111827]">
          {member.name}님,
          <br />
          오늘 인증을 확인하세요.
        </h1>
      </header>

      <div className="mb-4">
        <HomeWeeklyCard />
      </div>

      <section className="mb-4">
        <Link
          className="block rounded-[28px] bg-gradient-to-br from-[#3182F6] to-[#1D4ED8] px-6 py-7 text-white shadow-[0_20px_44px_rgba(49,130,246,0.28)]"
          href="/certify"
        >
          <span className="text-sm font-bold text-blue-100">오늘의 메인</span>
          <strong className="mt-2 block text-[26px] font-black">오늘 운동 인증하기</strong>
          <span className="mt-2 block text-sm font-semibold text-blue-100">촬영하고 바로 저장</span>
        </Link>
      </section>

      <nav className="space-y-6">
        <section className="grid gap-3">
          <h2 className="app-section-title px-1">내 인증</h2>
          {appMenus.map((item) => (
            <Link
              className="app-card flex min-h-[78px] items-center justify-between px-5 py-4"
              href={item.href}
              key={item.label}
            >
              <span>
                <span className="block font-black text-[#111827]">{item.label}</span>
                <span className="mt-1 block text-sm font-semibold text-[#6B7280]">{item.description}</span>
              </span>
              <span className="text-xl font-black text-[#3182F6]">›</span>
            </Link>
          ))}
        </section>

        <section className="grid gap-3">
          <h2 className="app-section-title px-1">크루 링크</h2>
          {externalMenus.map((item) => (
            <Link
              className="app-card flex min-h-[74px] items-center justify-between px-5 py-4"
              href={item.href}
              key={item.label}
              rel="noreferrer"
              target="_blank"
            >
              <span>
                <span className="block font-black text-[#111827]">{item.label}</span>
                <span className="mt-1 block text-sm font-semibold text-[#6B7280]">{item.description}</span>
              </span>
              <span className="text-xl font-black text-[#9CA3AF]">↗</span>
            </Link>
          ))}
        </section>

        {member.role === "admin" ? (
          <section className="grid gap-3">
            <h2 className="app-section-title px-1">관리자</h2>
            {adminMenus.map((item) => (
              <Link
                className="app-card flex min-h-[74px] items-center justify-between px-5 py-4"
                href={item.href}
                key={item.label}
              >
                <span>
                  <span className="block font-black text-[#111827]">{item.label}</span>
                  <span className="mt-1 block text-sm font-semibold text-[#6B7280]">{item.description}</span>
                </span>
                <span className="text-xl font-black text-[#3182F6]">›</span>
              </Link>
            ))}
          </section>
        ) : null}

        <LogoutButton />
      </nav>
    </main>
  );
}
