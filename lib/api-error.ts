import { NextResponse } from "next/server";

type SafeSupabaseError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function getSpecificMessage(fallbackMessage: string, error: SafeSupabaseError) {
  if (error.code === "42P01") {
    return "members 테이블을 찾을 수 없습니다. Supabase에서 supabase/schema.sql을 실행했는지 확인해주세요.";
  }

  if (error.code === "42703") {
    return "members 테이블의 필수 컬럼을 찾을 수 없습니다. schema.sql의 members 컬럼 구성을 확인해주세요.";
  }

  if (error.message?.toLowerCase().includes("relation") && error.message.includes("does not exist")) {
    return "members 테이블을 찾을 수 없습니다. Supabase에서 supabase/schema.sql을 실행했는지 확인해주세요.";
  }

  if (error.message?.toLowerCase().includes("column") && error.message.includes("does not exist")) {
    return "members 테이블의 필수 컬럼을 찾을 수 없습니다. schema.sql의 members 컬럼 구성을 확인해주세요.";
  }

  return fallbackMessage;
}

export function logSupabaseError(context: string, error: SafeSupabaseError) {
  console.error(`[Supabase error] ${context}`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  });
}

export function supabaseErrorResponse(
  context: string,
  fallbackMessage: string,
  error: SafeSupabaseError,
  status = 500
) {
  logSupabaseError(context, error);

  const message = getSpecificMessage(fallbackMessage, error);
  const body: {
    message: string;
    error?: SafeSupabaseError;
  } = { message };

  if (process.env.NODE_ENV === "development") {
    body.error = {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    };
  }

  return NextResponse.json(body, { status });
}
