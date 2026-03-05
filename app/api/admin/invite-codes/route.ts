import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";

// GET: 초대 코드 목록 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { teacher: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ codes });
}

// POST: 초대 코드 일괄 생성
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { count = 10 } = await req.json();
  const limit = Math.min(count, 50); // 최대 50개

  const codes = [];
  for (let i = 0; i < limit; i++) {
    const code = nanoid(8).toUpperCase();
    codes.push({
      code,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후 만료
    });
  }

  const created = await prisma.inviteCode.createMany({ data: codes });

  return NextResponse.json({
    message: `${created.count}개의 초대 코드가 생성되었습니다.`,
    codes: codes.map((c) => c.code),
  });
}
