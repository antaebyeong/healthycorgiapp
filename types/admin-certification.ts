import type { AdminCertificationPhoto } from "@/types/photo";

export type AdminCertificationMember = {
  id: string;
  name: string;
  birth_date: string;
  certifiedDays?: number;
};

export type AdminCertificationDashboard = {
  today: string;
  week: {
    start: string;
    end: string;
  };
  photos: AdminCertificationPhoto[];
  todayCertifiedMembers: AdminCertificationMember[];
  todayMissingMembers: AdminCertificationMember[];
  weeklySuccessMembers: AdminCertificationMember[];
  weeklyMissingMembers: AdminCertificationMember[];
};
