import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/env";
import { clearSessionCookie, deleteCurrentSession } from "@/lib/session";

export async function POST() {
  await deleteCurrentSession();

  const response = NextResponse.json(
    {
      message: "로그아웃되었습니다.",
      ...(process.env.NODE_ENV === "development" ? { cookieName: getSessionCookieName() } : {})
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
  clearSessionCookie(response);
  return response;
}
