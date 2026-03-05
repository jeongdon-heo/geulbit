import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "글빛 - AI 글쓰기 분석 & 성장 추적",
    short_name: "글빛",
    description: "초등학생의 글쓰기를 AI로 분석하고 성장을 추적하는 교육 도구",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F3FF",
    theme_color: "#6C5CE7",
    orientation: "portrait",
    lang: "ko",
    categories: ["education"],
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
