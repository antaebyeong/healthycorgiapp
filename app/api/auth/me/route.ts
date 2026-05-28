import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/env";
import { getCurrentMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getCurrentMember();
  const debug = process.env.NODE_ENV === "development" ? { cookieName: getSessionCookieName() } : {};

  if (!member) {
    return NextResponse.json(
      {
        isAuthenticated: false,
        member: null,
        ...debug
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  return NextResponse.json(
    {
      isAuthenticated: true,
      member,
      ...debug
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
