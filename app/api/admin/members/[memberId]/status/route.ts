import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type StatusBody = {
  status?: "approved" | "blocked";
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
  const body = (await request.json()) as StatusBody;

  if (body.status !== "approved" && body.status !== "blocked") {
    return NextResponse.json({ message: "변경할 회원 상태가 올바르지 않습니다." }, { status: 400 });
  }

  if (adminCheck.member?.id === memberId && body.status === "blocked") {
    return NextResponse.json({ message: "자기 자신은 차단할 수 없습니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const updatePayload = {
    status: body.status,
    approved_at: body.status === "approved" ? new Date().toISOString() : null
  };

  const { data, error } = await supabase
    .from("members")
    .update(updatePayload)
    .eq("id", memberId)
    .select("id, name, birth_date, status, role, created_at, approved_at")
    .single();

  if (error) {
    return supabaseErrorResponse("admin member status update", "회원 상태를 변경하지 못했습니다.", error);
  }

  return NextResponse.json({
    message: body.status === "approved" ? "회원을 승인했습니다." : "회원을 차단했습니다.",
    member: data
  });
}
