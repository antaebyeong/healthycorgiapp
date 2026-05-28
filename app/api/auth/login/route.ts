import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { getSessionCookieName } from "@/lib/env";
import { createSession, setSessionCookie } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateAuthInput } from "@/lib/validators";

type LoginBody = {
  name?: string;
  birthDate?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const parsed = validateAuthInput({
    name: body.name || "",
    birthDate: body.birthDate || ""
  });

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: member, error } = await supabase
    .from("members")
    .select("id, name, status, role")
    .eq("name", parsed.name)
    .eq("birth_date", parsed.birthDate)
    .maybeSingle();

  if (error) {
    return supabaseErrorResponse("login member lookup", "회원 정보를 확인하는 중 오류가 발생했습니다.", error);
  }

  if (!member) {
    return NextResponse.json({ message: "일치하는 회원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (member.status === "pending") {
    return NextResponse.json({ message: "아직 운영진 승인 대기 중입니다." }, { status: 403 });
  }

  if (member.status === "blocked") {
    return NextResponse.json({ message: "차단된 회원은 접근할 수 없습니다." }, { status: 403 });
  }

  if (member.status !== "approved") {
    return NextResponse.json({ message: "로그인할 수 없는 회원 상태입니다." }, { status: 403 });
  }

  const isAdminSession = member.role === "admin";
  const { sessionId, expiresAt } = await createSession(member.id, isAdminSession);
  const response = NextResponse.json(
    {
      message: "로그인되었습니다.",
      member: {
        id: member.id,
        name: member.name,
        role: member.role,
        isAdminSession
      },
      ...(process.env.NODE_ENV === "development"
        ? {
            sessionCreated: true,
            cookieName: getSessionCookieName()
          }
        : {})
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );

  setSessionCookie(response, sessionId, expiresAt);
  return response;
}
