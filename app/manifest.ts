import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "헬시코기",
    short_name: "헬시코기",
    description: "운동 사진 인증과 출석 확인을 위한 헬시코기 크루 PWA",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#EEF4FF",
    theme_color: "#3182F6",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
