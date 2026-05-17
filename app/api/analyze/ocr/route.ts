import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAI, getProvider } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const imageBase64 = body.imageBase64 || body.base64;
    const mimeType = body.mimeType;
    const provider = getProvider(body.provider);
    const apiKey =
      (provider === "claude"
        ? req.headers.get("x-anthropic-api-key")
        : req.headers.get("x-gemini-api-key")) || undefined;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "이미지 데이터가 필요합니다." }, { status: 400 });
    }

    const result = await getAI(provider).recognizeHandwriting(imageBase64, mimeType, apiKey);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json(
      { error: error.message || "글자 인식에 실패했습니다." },
      { status: 500 }
    );
  }
}
