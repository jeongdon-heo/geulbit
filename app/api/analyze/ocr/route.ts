import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recognizeHandwriting } from "@/lib/gemini";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "이미지 데이터가 필요합니다." }, { status: 400 });
    }

    const result = await recognizeHandwriting(imageBase64, mimeType);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json(
      { error: error.message || "글자 인식에 실패했습니다." },
      { status: 500 }
    );
  }
}
