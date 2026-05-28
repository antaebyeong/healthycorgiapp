import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RoleBody = {
  role?: "member" | "admin";
};

type RouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const adminCheck = await requireAdmin();

  if (adminCheck.response) {
    return adminCheck.response;
  }

  const { memberId } = await context.params;
  const body = (await request.json()) as RoleBody;

  if (body.role !== "member" && body.role !== "admin") {
    return NextResponse.json({ message: "변경할 역할이 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: target, error: targetError } = await supabase
    .from("members")
    .select("id, name, status, role")
    .eq("id", memberId)
    .single();

  if (targetError) {
    return supabaseErrorResponse("admin member role target lookup", "멤버 정보를 확인하지 못했습니다.", targetError);
  }

  if (body.role === "admin" && target.status !== "approved") {
    return NextResponse.json(
      { message: "approved 상태의 멤버만 관리자로 지정할 수 있습니다." },
      { status: 400 }
    );
  }

  if (body.role === "member" && adminCheck.member?.id === memberId) {
    return NextResponse.json({ message: "자기 자신의 관리자 권한은 해제할 수 없습니다." }, { status: 400 });
  }

  if (body.role === "member" && target.role === "admin") {
    const { count, error: countError } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) {
      return supabaseErrorResponse("admin member role admin count", "관리자 수를 확인하지 못했습니다.", countError);
    }

    if ((count || 0) <= 1) {
      return NextResponse.json({ message: "마지막 관리자는 일반 멤버로 변경할 수 없습니다." }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("members")
    .update({ role: body.role })
    .eq("id", memberId)
    .select("id, name, birth_date, status, role, created_at, approved_at")
    .single();

  if (error) {
    return supabaseErrorResponse("admin member role update", "멤버 역할을 변경하지 못했습니다.", error);
  }

  return NextResponse.json({
    message: body.role === "admin" ? "관리자로 지정했습니다." : "일반 멤버로 변경했습니다.",
    member: data
  });
}
