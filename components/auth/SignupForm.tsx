"use client";

import { FormEvent, useState } from "react";

export function SignupForm() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate, consent })
    });

    const result = (await response.json()) as { message?: string };
    setIsLoading(false);
    setMessage(result.message || (response.ok ? "가입 신청이 완료되었습니다." : "가입 신청에 실패했습니다."));

    if (response.ok) {
      setName("");
      setBirthDate("");
      setConsent(false);
    }
  }

  return (
    <form className="app-card space-y-4 p-5" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6B7280]">이름</span>
        <input
          className="app-field"
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#6B7280]">생년월일</span>
        <input
          className="app-field"
          name="birthDate"
          onChange={(event) => setBirthDate(event.target.value)}
          required
          type="date"
          value={birthDate}
        />
      </label>
      <label className="flex gap-3 rounded-[18px] bg-[#F8FAFF] p-4 text-sm font-semibold leading-6 text-[#6B7280]">
        <input
          checked={consent}
          className="mt-1 h-4 w-4"
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
        />
        <span>
          운동 인증 사진은 헬시코기 승인 멤버 및 운영진에게 공개될 수 있습니다.
          <br />
          사진은 시즌 종료까지 보관되며, 운영진이 필요 시 삭제할 수 있습니다.
        </span>
      </label>
      {message ? <p className="text-sm font-semibold text-[#6B7280]">{message}</p> : null}
      <button
        className="app-primary-button w-full"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "신청 중" : "가입 신청"}
      </button>
    </form>
  );
}
