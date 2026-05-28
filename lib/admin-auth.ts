import "server-only";

import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";

export async function requireAdmin() {
  const member = await getCurrentMember();

  if (!member || member.role !== "admin" || !member.isAdminSession) {
    return {
      member: null,
      response: NextResponse.json({ message: "관리자만 접근할 수 있습니다." }, { status: 403 })
    };
  }

  return { member, response: null };
}
