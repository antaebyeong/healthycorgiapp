import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type StatusBody = {
  status?: "active" | "deleted";
};

type RouteContext = {
  params: Promise<{
    recordId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const adminCheck = await requireAdmin();

  if (adminCheck.response) {
    return adminCheck.response;
  }

  const { recordId } = await context.params;
  const body = (await request.json()) as StatusBody;

  if (body.status !== "active" && body.status !== "deleted") {
    return NextResponse.json({ message: "변경할 사진 상태가 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("photo_records")
    .update({ status: body.status })
    .eq("id", recordId)
    .select("id, status")
    .single();

  if (error) {
    return supabaseErrorResponse("admin certification status update", "인증 사진 상태를 변경하지 못했습니다.", error);
  }

  return NextResponse.json({
    message: body.status === "active" ? "인증 사진을 복구했습니다." : "인증 사진을 삭제 상태로 변경했습니다.",
    record: data
  });
}
