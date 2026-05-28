import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "certification-photos";
const FEED_LIMIT = 50;

type FeedRecord = {
  id: string;
  image_path: string;
  certified_date: string;
  uploaded_at: string;
  members:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export async function GET() {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json({ message: "승인된 회원만 전체 인증 피드를 볼 수 있습니다." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: records, error } = await supabase
    .from("photo_records")
    .select("id, image_path, certified_date, uploaded_at, members(name)")
    .eq("status", "active")
    .order("uploaded_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error) {
    return supabaseErrorResponse("photo feed records", "전체 인증 피드를 불러오지 못했습니다.", error);
  }

  const photos = await Promise.all(
    ((records || []) as FeedRecord[]).map(async (record) => {
      const { data, error: signedUrlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(record.image_path, 60 * 10);

      if (signedUrlError) {
        console.error("[Supabase error] feed signed url", {
          message: signedUrlError.message,
          name: signedUrlError.name
        });
      }

      const joinedMember = Array.isArray(record.members) ? record.members[0] : record.members;

      return {
        id: record.id,
        image_path: record.image_path,
        certified_date: record.certified_date,
        uploaded_at: record.uploaded_at,
        memberName: joinedMember?.name || "헬시코기 회원",
        signedUrl: data?.signedUrl || ""
      };
    })
  );

  return NextResponse.json({
    photos: photos.filter((photo) => Boolean(photo.signedUrl))
  });
}
