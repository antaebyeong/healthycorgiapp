import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { getAdminCode } from "@/lib/env";
import { createSession, setSessionCookie } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateAuthInput } from "@/lib/validators";

type SetupAdminBody = {
  name?: string;
  birthDate?: string;
  adminCode?: string;
};

async function getAdminCount() {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) {
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
}

export async function GET() {
  const { count, error } = await getAdminCount();

  if (error) {
    return supabaseErrorResponse(
      "setup-admin admin count lookup",
      "최초 관리자 생성 가능 여부 확인 중 오류가 발생했습니다.",
      error
    );
  }

  return NextResponse.json({ available: count === 0 });
}

export async function POST(request: Request) {
  const body = (await request.json()) as SetupAdminBody;
  const parsed = validateAuthInput({
    name: body.name || "",
    birthDate: body.birthDate || ""
  });

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  if (!body.adminCode || body.adminCode !== getAdminCode()) {
    return NextResponse.json({ message: "관리자 코드가 올바르지 않습니다." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { count: adminCount, error: adminCountError } = await getAdminCount();

  if (adminCountError) {
    return supabaseErrorResponse(
      "setup-admin admin count lookup",
      "최초 관리자 생성 가능 여부 확인 중 오류가 발생했습니다.",
      adminCountError
    );
  }

  if (adminCount > 0) {
    return NextResponse.json(
      { message: "이미 관리자 계정이 있어 최초 관리자 생성 기능을 사용할 수 없습니다." },
      { status: 403 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("members")
    .select("id")
    .eq("name", parsed.name)
    .eq("birth_date", parsed.birthDate)
    .maybeSingle();

  if (existingError) {
    return supabaseErrorResponse(
      "setup-admin duplicate member lookup",
      "회원 중복 확인 중 오류가 발생했습니다.",
      existingError
    );
  }

  if (existing) {
    return NextResponse.json(
      { message: "이미 같은 이름과 생년월일로 등록된 회원이 있습니다." },
      { status: 409 }
    );
  }

  const { data: member, error } = await supabase
    .from("members")
    .insert({
      name: parsed.name,
      birth_date: parsed.birthDate,
      status: "approved",
      role: "admin",
      approved_at: new Date().toISOString()
    })
    .select("id, name, role")
    .single();

  if (error || !member) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { message: "이미 같은 이름과 생년월일로 등록된 회원이 있습니다." },
        { status: 409 }
      );
    }

    if (error) {
      return supabaseErrorResponse("setup-admin member insert", "최초 관리자 생성에 실패했습니다.", error);
    }

    return NextResponse.json({ message: "최초 관리자 생성 결과를 확인하지 못했습니다." }, { status: 500 });
  }

  const { sessionId, expiresAt } = await createSession(member.id, true);
  const response = NextResponse.json({
    message: "최초 관리자가 생성되었습니다.",
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      isAdminSession: true
    }
  });

  setSessionCookie(response, sessionId, expiresAt);
  return response;
}
