import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SESSION_DAYS = 14;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt
  };
}

export async function createSession(memberId: string, isAdmin: boolean) {
  const supabase = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      member_id: memberId,
      is_admin: isAdmin,
      expires_at: expiresAt.toISOString()
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "세션 생성에 실패했습니다.");
  }

  return {
    sessionId: data.id as string,
    expiresAt
  };
}

export function setSessionCookie(response: NextResponse, sessionId: string, expiresAt: Date) {
  response.cookies.set(getSessionCookieName(), sessionId, getSessionCookieOptions(expiresAt));
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0)
  });
}

export async function getSessionIdFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(getSessionCookieName())?.value;
}

export async function deleteCurrentSession() {
  const sessionId = await getSessionIdFromCookie();

  if (!sessionId) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("sessions").delete().eq("id", sessionId);
}
