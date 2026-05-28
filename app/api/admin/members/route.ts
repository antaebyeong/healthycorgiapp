import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const adminCheck = await requireAdmin();

  if (adminCheck.response) {
    return adminCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("members")
    .select("id, name, birth_date, status, role, created_at, approved_at")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return supabaseErrorResponse("admin members list", "회원 목록을 불러오지 못했습니다.", error);
  }

  return NextResponse.json({ members: data || [] });
}
