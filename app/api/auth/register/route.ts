import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name, school, inviteCode } = await req.json();

    // 1. 초대 코드 확인
    const code = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    });

    if (!code) {
      return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 400 });
    }
    if (!code.isActive || code.usedBy) {
      return NextResponse.json({ error: "이미 사용된 초대 코드입니다." }, { status: 400 });
    }
    if (new Date() > code.expiresAt) {
      return NextResponse.json({ error: "만료된 초대 코드입니다." }, { status: 400 });
    }

    // 2. 이메일 중복 확인
    const existing = await prisma.teacher.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 400 });
    }

    // 3. 교사 계정 생성
    const hashedPassword = await bcrypt.hash(password, 12);
    const teacher = await prisma.teacher.create({
      data: { email, password: hashedPassword, name, school },
    });

    // 4. 초대 코드 사용 처리
    await prisma.inviteCode.update({
      where: { id: code.id },
      data: { usedBy: teacher.id, usedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "가입이 완료되었습니다.",
      teacherId: teacher.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "가입 중 오류가 발생했습니다." }, { status: 500 });
  }
}
