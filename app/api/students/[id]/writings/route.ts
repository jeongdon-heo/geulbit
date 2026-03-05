import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/students/[id]/writings - 학생의 전체 분석 이력
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const teacherId = (session.user as any).id;
  const studentId = params.id;

  // 학생이 내 학급인지 확인
  const student = await prisma.student.findFirst({
    where: { id: studentId },
    include: { class: true },
  });

  if (!student || student.class.teacherId !== teacherId) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  const writings = await prisma.writing.findMany({
    where: { studentId },
    orderBy: { round: "asc" },
    select: {
      id: true,
      round: true,
      title: true,
      analyzedAt: true,
      scoreSpelling: true,
      scoreSentence: true,
      scoreStructure: true,
      scoreExpression: true,
      scoreTotal: true,
      originalText: true,
      feedbackTeacher: true,
      feedbackStudent: true,
    },
  });

  return NextResponse.json({ student, writings });
}
