export type AttendancePhoto = {
  id: string;
  image_path: string;
  certified_date: string;
  uploaded_at: string;
  signedUrl: string;
};

export type FeedPhoto = AttendancePhoto & {
  memberName: string;
};

export type AdminCertificationPhoto = AttendancePhoto & {
  memberId: string;
  memberName: string;
  status: "active" | "deleted";
};
