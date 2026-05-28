import { NextResponse } from "next/server";
import { supabaseErrorResponse } from "@/lib/api-error";
import { getCurrentMember } from "@/lib/auth";
import { getKoreaDateString, getMonthRange, getWeekRangeMondayToSunday } from "@/lib/korea-time";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "certification-photos";

export async function GET(request: Request) {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json({ message: "승인된 회원만 출석 현황을 볼 수 있습니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const today = getKoreaDateString();
  const monthParam = searchParams.get("month");
  const selectedDate = searchParams.get("date");
  const monthBase = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? `${monthParam}-01` : today;
  const weekRange = getWeekRangeMondayToSunday(today);
  const monthRange = getMonthRange(monthBase);
  const supabase = createSupabaseAdminClient();

  const { data: monthRecords, error: monthError } = await supabase
    .from("photo_records")
    .select("id, image_path, certified_date, uploaded_at")
    .eq("member_id", member.id)
    .eq("status", "active")
    .gte("certified_date", monthRange.start)
    .lte("certified_date", monthRange.end)
    .order("uploaded_at", { ascending: false });

  if (monthError) {
    return supabaseErrorResponse("attendance month records", "월간 출석 기록을 불러오지 못했습니다.", monthError);
  }

  const { data: weekRecords, error: weekError } = await supabase
    .from("photo_records")
    .select("certified_date")
    .eq("member_id", member.id)
    .eq("status", "active")
    .gte("certified_date", weekRange.start)
    .lte("certified_date", weekRange.end);

  if (weekError) {
    return supabaseErrorResponse("attendance week records", "주간 출석 기록을 불러오지 못했습니다.", weekError);
  }

  const weekCertifiedDates = Array.from(new Set((weekRecords || []).map((record) => record.certified_date)));
  const monthCertifiedDates = Array.from(new Set((monthRecords || []).map((record) => record.certified_date)));
  const selected = selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? selectedDate : today;
  const selectedRecords = (monthRecords || []).filter((record) => record.certified_date === selected);

  const selectedPhotos = await Promise.all(
    selectedRecords.map(async (record) => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(record.image_path, 60 * 10);

      if (error) {
        console.error("[Supabase error] attendance signed url", {
          message: error.message,
          name: error.name
        });
      }

      return {
        ...record,
        signedUrl: data?.signedUrl || ""
      };
    })
  );

  return NextResponse.json({
    today,
    week: {
      start: weekRange.start,
      end: weekRange.end,
      count: weekCertifiedDates.length,
      target: 4,
      success: weekCertifiedDates.length >= 4,
      remaining: Math.max(0, 4 - weekCertifiedDates.length),
      certifiedDates: weekCertifiedDates
    },
    month: {
      year: monthRange.year,
      month: monthRange.month,
      start: monthRange.start,
      end: monthRange.end,
      certifiedDates: monthCertifiedDates
    },
    selectedDate: selected,
    selectedPhotos: selectedPhotos.filter((photo) => Boolean(photo.signedUrl))
  });
}
