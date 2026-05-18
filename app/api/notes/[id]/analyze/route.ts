import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAI, getProvider } from "@/lib/ai";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const teacherId = (session.user as any).id;
    const body = await req.json().catch(() => ({}));
    const provider = getProvider(body.provider);
    const apiKey =
      (provider === "claude"
        ? req.headers.get("x-anthropic-api-key")
        : req.headers.get("x-gemini-api-key")) || undefined;

    // 노트 + 학생 소유권 확인
    const note = await prisma.note.findFirst({
      where: { id: params.id },
      include: { student: { include: { class: true } } },
    });
    if (!note || note.student.class.teacherId !== teacherId) {
      return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
    }

    // 이전 노트 분석 결과를 기준점으로 사용
    const lastAnalyzed = await prisma.note.findFirst({
      where: {
        studentId: note.studentId,
        analyzedAt: { not: null },
        id: { not: note.id },
      },
      orderBy: { analyzedAt: "desc" },
      select: {
        scoreSpelling: true,
        scoreSentence: true,
        scoreStructure: true,
        scoreExpression: true,
      },
    });

    const previousScores = lastAnalyzed
      ? {
          spelling: lastAnalyzed.scoreSpelling!,
          sentence: lastAnalyzed.scoreSentence!,
          structure: lastAnalyzed.scoreStructure!,
          expression: lastAnalyzed.scoreExpression!,
        }
      : null;

    // round 자리에는 1을 넘김 (노트는 회차 개념 없음)
    const analysis = await getAI(provider).analyzeWriting(
      note.content,
      note.student.name,
      1,
      previousScores,
      apiKey
    );

    const { scores, feedback_teacher, feedback_student } = analysis;
    const total = Math.round(
      (scores.spelling + scores.sentence + scores.structure + scores.expression) / 4
    );

    const updated = await prisma.note.update({
      where: { id: params.id },
      data: {
        analyzedAt: new Date(),
        scoreSpelling: scores.spelling,
        scoreSentence: scores.sentence,
        scoreStructure: scores.structure,
        scoreExpression: scores.expression,
        scoreTotal: total,
        feedbackTeacher: feedback_teacher,
        feedbackStudent: feedback_student,
      },
    });

    return NextResponse.json({ note: updated });
  } catch (error: any) {
    console.error("Note Analysis API Error:", error);
    return NextResponse.json(
      { error: error.message || "분석에 실패했습니다." },
      { status: 500 }
    );
  }
}
