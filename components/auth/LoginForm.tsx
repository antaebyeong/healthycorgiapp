"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate })
    });

    const result = (await response.json()) as { message?: string };
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "로그인에 실패했습니다.");
      return;
    }

    setMessage(result.message || "로그인되었습니다.");
    router.push("/home");
    router.refresh();
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
      {message ? <p className="text-sm font-semibold text-[#6B7280]">{message}</p> : null}
      <button
        className="app-primary-button w-full"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "확인 중" : "로그인"}
      </button>
    </form>
  );
}
