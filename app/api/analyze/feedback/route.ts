import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeWriting } from "@/lib/gemini";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { studentId, text, title } = await req.json();
    const teacherId = (session.user as any).id;

    // 학생 확인 + 내 학급인지 검증
    const student = await prisma.student.findFirst({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student || student.class.teacherId !== teacherId) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    // 회차 계산 (기존 최대 회차 + 1)
    const lastWriting = await prisma.writing.findFirst({
      where: { studentId },
      orderBy: { round: "desc" },
      select: {
        round: true,
        scoreSpelling: true,
        scoreSentence: true,
        scoreStructure: true,
        scoreExpression: true,
      },
    });

    const round = (lastWriting?.round || 0) + 1;
    const previousScores = lastWriting
      ? {
          spelling: lastWriting.scoreSpelling,
          sentence: lastWriting.scoreSentence,
          structure: lastWriting.scoreStructure,
          expression: lastWriting.scoreExpression,
        }
      : null;

    // Gemini 분석 호출
    const analysis = await analyzeWriting(text, student.name, round, previousScores);

    const { scores, feedback_teacher, feedback_student } = analysis;
    const total = Math.round(
      (scores.spelling + scores.sentence + scores.structure + scores.expression) / 4
    );

    // DB 저장
    const writing = await prisma.writing.create({
      data: {
        studentId,
        round,
        title: title || null,
        originalText: text,
        scoreSpelling: scores.spelling,
        scoreSentence: scores.sentence,
        scoreStructure: scores.structure,
        scoreExpression: scores.expression,
        scoreTotal: total,
        feedbackTeacher: feedback_teacher,
        feedbackStudent: feedback_student,
      },
    });

    return NextResponse.json({
      writing: {
        id: writing.id,
        round,
        title,
        scores,
        total,
        feedbackTeacher: feedback_teacher,
        feedbackStudent: feedback_student,
        previousScores,
      },
    });
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json(
      { error: error.message || "분석에 실패했습니다." },
      { status: 500 }
    );
  }
}
