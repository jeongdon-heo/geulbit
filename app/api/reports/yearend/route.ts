import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAI, getProvider } from "@/lib/ai";
import prisma from "@/lib/prisma";

// POST: 학년말 총평 생성
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { studentId } = body;
    const provider = getProvider(body.provider);
    const apiKey =
      (provider === "claude"
        ? req.headers.get("x-anthropic-api-key")
        : req.headers.get("x-gemini-api-key")) || undefined;
    const teacherId = (session.user as any).id;

    // 학생 + 학급 확인
    const student = await prisma.student.findFirst({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student || student.class.teacherId !== teacherId) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    // 1년치 글쓰기 데이터 조회
    const writings = await prisma.writing.findMany({
      where: { studentId },
      orderBy: { round: "asc" },
    });

    if (writings.length < 3) {
      return NextResponse.json(
        { error: "총평을 생성하려면 최소 3회 이상의 분석 기록이 필요합니다." },
        { status: 400 }
      );
    }

    // AI 총평 생성
    const result = await getAI(provider).generateYearendReport(
      student.name,
      student.class.name,
      writings,
      apiKey
    );

    // DB 저장 (upsert)
    const year = student.class.year;
    const report = await prisma.yearendReport.upsert({
      where: { studentId_year: { studentId, year } },
      update: {
        reportTeacher: result.report_teacher,
        reportStudent: result.report_student,
        generatedAt: new Date(),
      },
      create: {
        studentId,
        classId: student.classId,
        year,
        reportTeacher: result.report_teacher,
        reportStudent: result.report_student,
      },
    });

    return NextResponse.json({
      report: {
        id: report.id,
        reportTeacher: result.report_teacher,
        reportStudent: result.report_student,
        writings: writings.map((w) => ({
          round: w.round,
          title: w.title,
          date: w.analyzedAt,
          scores: {
            spelling: w.scoreSpelling,
            sentence: w.scoreSentence,
            structure: w.scoreStructure,
            expression: w.scoreExpression,
            total: w.scoreTotal,
          },
        })),
      },
    });
  } catch (error: any) {
    console.error("Yearend Report Error:", error);
    return NextResponse.json(
      { error: error.message || "총평 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
