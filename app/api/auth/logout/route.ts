import { NextResponse } from "next/server";
import { clearSessionCookie, deleteCurrentSession } from "@/lib/session";

export async function POST() {
  await deleteCurrentSession();

  const response = NextResponse.json({ message: "로그아웃되었습니다." });
  clearSessionCookie(response);
  return response;
}
