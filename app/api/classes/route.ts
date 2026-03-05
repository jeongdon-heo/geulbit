import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 내 학급 정보 + 학생 목록
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const teacherId = (session.user as any).id;
  const year = new Date().getFullYear();

  const myClass = await prisma.class.findFirst({
    where: { teacherId, year },
    include: {
      students: {
        orderBy: { number: "asc" },
        include: {
          writings: {
            orderBy: { round: "desc" },
            take: 2,
            select: {
              round: true,
              scoreTotal: true,
              analyzedAt: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ class: myClass });
}

// POST: 학급 생성
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const teacherId = (session.user as any).id;
  const { name } = await req.json();
  const year = new Date().getFullYear();

  // 이미 올해 학급이 있는지 확인
  const existing = await prisma.class.findFirst({ where: { teacherId, year } });
  if (existing) {
    return NextResponse.json({ error: "이미 올해 학급이 생성되어 있습니다." }, { status: 400 });
  }

  const newClass = await prisma.class.create({
    data: { teacherId, name, year },
  });

  return NextResponse.json({ class: newClass });
}
