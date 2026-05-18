import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const VALID_TYPES = ["thought", "pmi", "weekend", "subject", "letter", "etc"] as const;
type NoteType = (typeof VALID_TYPES)[number];

async function verifyNoteOwnership(noteId: string, teacherId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId },
    include: { student: { include: { class: true } } },
  });
  if (!note || note.student.class.teacherId !== teacherId) return null;
  return note;
}

// PATCH /api/notes/[id] - 노트 수정 (type/title/content/writtenAt)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const teacherId = (session.user as any).id;
  const existing = await verifyNoteOwnership(params.id, teacherId);
  if (!existing) {
    return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
  }

  const { type, title, content, writtenAt } = await req.json();

  if (type !== undefined && !VALID_TYPES.includes(type as NoteType)) {
    return NextResponse.json({ error: "올바른 글 종류를 선택해주세요." }, { status: 400 });
  }
  if (content !== undefined && !content?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const note = await prisma.note.update({
    where: { id: params.id },
    data: {
      ...(type !== undefined ? { type } : {}),
      ...(title !== undefined ? { title: title?.trim() || null } : {}),
      ...(content !== undefined ? { content: content.trim() } : {}),
      ...(writtenAt !== undefined ? { writtenAt: new Date(writtenAt) } : {}),
    },
  });

  return NextResponse.json({ note });
}

// DELETE /api/notes/[id] - 노트 삭제
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const teacherId = (session.user as any).id;
  const existing = await verifyNoteOwnership(params.id, teacherId);
  if (!existing) {
    return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
