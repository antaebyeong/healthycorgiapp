import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { getCurrentMember } from "@/lib/auth";
import { getKoreaDateString, getKoreaTimestampString } from "@/lib/korea-time";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "certification-photos";
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json({ message: "승인된 회원만 사진을 업로드할 수 있습니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ message: "업로드할 사진을 찾을 수 없습니다." }, { status: 400 });
  }

  if (image.type !== "image/jpeg") {
    return NextResponse.json({ message: "JPG 형식의 인증 사진만 업로드할 수 있습니다." }, { status: 400 });
  }

  if (image.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ message: "사진 용량이 너무 큽니다. 다시 촬영해주세요." }, { status: 400 });
  }

  const now = new Date();
  const certifiedDate = getKoreaDateString(now);
  const timestamp = `${getKoreaTimestampString(now)}-${crypto.randomUUID()}`;
  const imagePath = `${member.id}/${certifiedDate}/${timestamp}.jpg`;
  const arrayBuffer = await image.arrayBuffer();
  const supabase = createSupabaseAdminClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(imagePath, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: false
    });

  if (uploadError) {
    return supabaseErrorResponse(
      "photo upload storage",
      "사진 저장소 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
      uploadError
    );
  }

  const { data: record, error: recordError } = await supabase
    .from("photo_records")
    .insert({
      member_id: member.id,
      image_path: imagePath,
      certified_date: certifiedDate,
      uploaded_at: now.toISOString(),
      status: "active"
    })
    .select("id, image_path, certified_date, uploaded_at, status")
    .single();

  if (recordError) {
    await supabase.storage.from(BUCKET_NAME).remove([imagePath]);
    return supabaseErrorResponse(
      "photo upload record insert",
      "사진 기록 저장에 실패했습니다. 다시 시도해주세요.",
      recordError
    );
  }

  return NextResponse.json({
    message: "사진 인증이 저장되었습니다.",
    record
  });
}
