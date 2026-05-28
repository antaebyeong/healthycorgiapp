import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateAuthInput } from "@/lib/validators";

type SignupBody = {
  name?: string;
  birthDate?: string;
  consent?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SignupBody;
  const parsed = validateAuthInput({
    name: body.name || "",
    birthDate: body.birthDate || ""
  });

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  if (!body.consent) {
    return NextResponse.json({ message: "사진 공개 및 보관 안내에 동의해주세요." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("members")
    .select("id")
    .eq("name", parsed.name)
    .eq("birth_date", parsed.birthDate)
    .maybeSingle();

  if (existingError) {
    return supabaseErrorResponse(
      "signup duplicate member lookup",
      "가입 여부 확인 중 오류가 발생했습니다.",
      existingError
    );
  }

  if (existing) {
    return NextResponse.json(
      { message: "이미 같은 이름과 생년월일로 가입 신청 또는 등록된 회원이 있습니다." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("members").insert({
    name: parsed.name,
    birth_date: parsed.birthDate,
    status: "pending",
    role: "member"
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "이미 같은 이름과 생년월일로 가입 신청 또는 등록된 회원이 있습니다." },
        { status: 409 }
      );
    }

    return supabaseErrorResponse("signup member insert", "가입 신청 저장에 실패했습니다.", error);
  }

  return NextResponse.json({
    message: "가입 신청이 완료되었습니다. 운영진 승인 후 로그인할 수 있습니다."
  });
}
