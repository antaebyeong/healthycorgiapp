import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { getKoreaDateString, getWeekRangeMondayToSunday } from "@/lib/korea-time";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "certification-photos";
const PHOTO_LIMIT = 100;

type MemberRow = {
  id: string;
  name: string;
  birth_date: string;
};

type PhotoRecordRow = {
  id: string;
  member_id: string;
  image_path: string;
  certified_date: string;
  uploaded_at: string;
  status: "active" | "deleted";
  members:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type WeekRecordRow = {
  member_id: string;
  certified_date: string;
};

export async function GET() {
  const adminCheck = await requireAdmin();

  if (adminCheck.response) {
    return adminCheck.response;
  }

  const today = getKoreaDateString();
  const week = getWeekRangeMondayToSunday(today);
  const supabase = createSupabaseAdminClient();

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, name, birth_date")
    .eq("status", "approved")
    .order("name", { ascending: true });

  if (membersError) {
    return supabaseErrorResponse("admin certification approved members", "승인 회원 목록을 불러오지 못했습니다.", membersError);
  }

  const { data: photoRecords, error: photosError } = await supabase
    .from("photo_records")
    .select("id, member_id, image_path, certified_date, uploaded_at, status, members(name)")
    .order("uploaded_at", { ascending: false })
    .limit(PHOTO_LIMIT);

  if (photosError) {
    return supabaseErrorResponse("admin certification photos", "인증 사진 목록을 불러오지 못했습니다.", photosError);
  }

  const { data: todayRecords, error: todayError } = await supabase
    .from("photo_records")
    .select("member_id, certified_date")
    .eq("status", "active")
    .eq("certified_date", today);

  if (todayError) {
    return supabaseErrorResponse("admin certification today records", "오늘 인증 현황을 불러오지 못했습니다.", todayError);
  }

  const { data: weekRecords, error: weekError } = await supabase
    .from("photo_records")
    .select("member_id, certified_date")
    .eq("status", "active")
    .gte("certified_date", week.start)
    .lte("certified_date", week.end);

  if (weekError) {
    return supabaseErrorResponse("admin certification week records", "이번 주 인증 현황을 불러오지 못했습니다.", weekError);
  }

  const approvedMembers = (members || []) as MemberRow[];
  const todayCertifiedIds = new Set(((todayRecords || []) as WeekRecordRow[]).map((record) => record.member_id));
  const weeklyDateMap = new Map<string, Set<string>>();

  ((weekRecords || []) as WeekRecordRow[]).forEach((record) => {
    if (!weeklyDateMap.has(record.member_id)) {
      weeklyDateMap.set(record.member_id, new Set());
    }

    weeklyDateMap.get(record.member_id)?.add(record.certified_date);
  });

  const todayCertifiedMembers = approvedMembers.filter((member) => todayCertifiedIds.has(member.id));
  const todayMissingMembers = approvedMembers.filter((member) => !todayCertifiedIds.has(member.id));
  const weeklyMembers = approvedMembers.map((member) => ({
    ...member,
    certifiedDays: weeklyDateMap.get(member.id)?.size || 0
  }));
  const weeklySuccessMembers = weeklyMembers.filter((member) => member.certifiedDays >= 4);
  const weeklyMissingMembers = weeklyMembers.filter((member) => member.certifiedDays < 4);

  const photos = await Promise.all(
    ((photoRecords || []) as PhotoRecordRow[]).map(async (record) => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(record.image_path, 60 * 10);

      if (error) {
        console.error("[Supabase error] admin certification signed url", {
          message: error.message,
          name: error.name
        });
      }

      const joinedMember = Array.isArray(record.members) ? record.members[0] : record.members;

      return {
        id: record.id,
        memberId: record.member_id,
        memberName: joinedMember?.name || "헬시코기 회원",
        image_path: record.image_path,
        certified_date: record.certified_date,
        uploaded_at: record.uploaded_at,
        status: record.status,
        signedUrl: data?.signedUrl || ""
      };
    })
  );

  return NextResponse.json({
    today,
    week,
    photos: photos.filter((photo) => Boolean(photo.signedUrl)),
    todayCertifiedMembers,
    todayMissingMembers,
    weeklySuccessMembers,
    weeklyMissingMembers
  });
}
