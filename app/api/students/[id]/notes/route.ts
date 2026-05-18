import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const VALID_TYPES = ["thought", "pmi", "weekend", "subject", "letter", "etc"] as const;
type NoteType = (typeof VALID_TYPES)[number];

async function verifyStudentOwnership(studentId: string, teacherId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId },
    include: { class: true },
  });
  if (!student || student.class.teacherId !== teacherId) return null;
  return student;
}

// GET /api/students/[id]/notes?type=thought&from=...&to=...
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const teacherId = (session.user as any).id;
  const student = await verifyStudentOwnership(params.id, teacherId);
  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const notes = await prisma.note.findMany({
    where: {
      studentId: params.id,
      ...(type && VALID_TYPES.includes(type as NoteType) ? { type } : {}),
      ...(from || to
        ? {
            writtenAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { writtenAt: "desc" },
  });

  return NextResponse.json({ notes });
}

// POST /api/students/[id]/notes - 새 노트 생성
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const teacherId = (session.user as any).id;
  const student = await verifyStudentOwnership(params.id, teacherId);
  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  const { type, title, content, writtenAt } = await req.json();

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "올바른 글 종류를 선택해주세요." }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      studentId: params.id,
      type,
      title: title?.trim() || null,
      content: content.trim(),
      writtenAt: writtenAt ? new Date(writtenAt) : new Date(),
    },
  });

  return NextResponse.json({ note });
}
