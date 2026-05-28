import { redirect } from "next/navigation";
import { ProtectedNotice } from "@/components/ProtectedNotice";
import { getCurrentMember } from "@/lib/auth";

export default async function CameraPage() {
  const member = await getCurrentMember();

  if (!member) {
    return <ProtectedNotice />;
  }

  redirect("/certify");
}
