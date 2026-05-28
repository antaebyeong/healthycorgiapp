export type MemberStatus = "pending" | "approved" | "blocked";
export type MemberRole = "member" | "admin";

export type AdminMember = {
  id: string;
  name: string;
  birth_date: string;
  status: MemberStatus;
  role: MemberRole;
  created_at: string;
  approved_at: string | null;
};
