import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "헬시코기",
    short_name: "헬시코기",
    description: "운동 사진 인증과 출석 확인을 위한 헬시코기 크루 PWA",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#F2F6FF",
    theme_color: "#3182F6",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
