"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SetupAdminForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup-admin")
      .then((response) => response.json())
      .then((result: { available?: boolean }) => setIsAvailable(Boolean(result.available)))
      .catch(() => {
        setIsAvailable(false);
        setMessage("최초 관리자 생성 가능 여부를 확인하지 못했습니다.");
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/setup-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate, adminCode })
    });

    const result = (await response.json()) as { message?: string };
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "최초 관리자 생성에 실패했습니다.");
      if (response.status === 403) {
        setIsAvailable(false);
      }
      return;
    }

    setMessage(result.message || "최초 관리자가 생성되었습니다.");
    router.push("/home");
    router.refresh();
  }

  if (isAvailable === null) {
    return (
      <div className="app-card p-5 text-sm font-semibold text-[#6B7280]">
        최초 관리자 생성 가능 여부를 확인 중입니다.
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="app-card p-5 text-sm font-semibold leading-6 text-[#6B7280]">
        이미 관리자 계정이 있거나 환경 설정이 완료되지 않아 이 화면을 사용할 수 없습니다.
        {message ? <p className="mt-3 font-semibold">{message}</p> : null}
      </div>
    );
  }

  return (
    <form className="app-card space-y-4 p-5" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6B7280]">이름</span>
        <input
          className="app-field"
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6B7280]">생년월일</span>
        <input
          className="app-field"
          onChange={(event) => setBirthDate(event.target.value)}
          required
          type="date"
          value={birthDate}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6B7280]">관리자 코드</span>
        <input
          className="app-field"
          onChange={(event) => setAdminCode(event.target.value)}
          required
          type="password"
          value={adminCode}
        />
      </label>
      {message ? <p className="text-sm font-semibold text-[#6B7280]">{message}</p> : null}
      <button
        className="app-primary-button w-full"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "생성 중" : "최초 관리자 생성"}
      </button>
    </form>
  );
}
