import "server-only";

import { getSessionIdFromCookie } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CurrentMember = {
  id: string;
  name: string;
  status: "pending" | "approved" | "blocked";
  role: "member" | "admin";
  isAdminSession: boolean;
};

type SessionRow = {
  id: string;
  is_admin: boolean;
  expires_at: string;
  members:
    | {
        id: string;
        name: string;
        status: "pending" | "approved" | "blocked";
        role: "member" | "admin";
      }
    | {
        id: string;
        name: string;
        status: "pending" | "approved" | "blocked";
        role: "member" | "admin";
      }[]
    | null;
};

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const sessionId = await getSessionIdFromCookie();

  if (!sessionId) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, is_admin, expires_at, members(id, name, status, role)")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const session = data as SessionRow;

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await supabase.from("sessions").delete().eq("id", sessionId);
    return null;
  }

  const member = Array.isArray(session.members) ? session.members[0] : session.members;

  if (!member || member.status !== "approved") {
    return null;
  }

  return {
    id: member.id,
    name: member.name,
    status: member.status,
    role: member.role,
    isAdminSession: session.is_admin
  };
}
