import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST: 학생 일괄 등록
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { classId, students } = await req.json();
  // students: [{ number: 1, name: "김서연" }, ...]

  // 학급 소유권 확인
  const teacherId = (session.user as any).id;
  const myClass = await prisma.class.findFirst({
    where: { id: classId, teacherId },
  });
  if (!myClass) {
    return NextResponse.json({ error: "학급을 찾을 수 없습니다." }, { status: 404 });
  }

  // 기존 학생 삭제 후 일괄 생성 (덮어쓰기 방식)
  const created = await prisma.$transaction(async (tx) => {
    // 일괄 생성
    const results = [];
    for (const s of students) {
      const student = await tx.student.upsert({
        where: { classId_number: { classId, number: s.number } },
        update: { name: s.name },
        create: { classId, number: s.number, name: s.name },
      });
      results.push(student);
    }
    return results;
  });

  return NextResponse.json({ students: created, count: created.length });
}

// DELETE: 학생 삭제
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { studentId } = await req.json();
  const teacherId = (session.user as any).id;

  // 내 학급 학생인지 확인
  const student = await prisma.student.findFirst({
    where: { id: studentId },
    include: { class: true },
  });
  if (!student || student.class.teacherId !== teacherId) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.student.delete({ where: { id: studentId } });
  return NextResponse.json({ success: true });
}
