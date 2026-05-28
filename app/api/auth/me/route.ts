import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";

export async function GET() {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json({ member: null }, { status: 401 });
  }

  return NextResponse.json({ member });
}
