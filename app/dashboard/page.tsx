"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Student {
  id: string;
  number: number;
  name: string;
  writings: { round: number; scoreTotal: number; analyzedAt: string }[];
}

interface ClassData {
  id: string;
  name: string;
  year: number;
  students: Student[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [className, setClassName] = useState("");
  const [studentInput, setStudentInput] = useState("");

  const fetchClass = useCallback(async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClassData(data.class);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchClass();
  }, [status, router, fetchClass]);

  const handleCreateClass = async () => {
    if (!className.trim()) return;
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: className }),
    });
    if (res.ok) {
      setShowCreateClass(false);
      fetchClass();
    }
  };

  const handleAddStudents = async () => {
    if (!classData || !studentInput.trim()) return;
    const lines = studentInput.trim().split("\n").filter(Boolean);
    const students = lines.map((line, i) => {
      const parts = line.split(/[\t,]/).map((s) => s.trim());
      if (parts.length >= 2) {
        return { number: parseInt(parts[0]) || i + 1, name: parts[1] };
      }
      return { number: i + 1, name: parts[0] };
    });

    await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: classData.id, students }),
    });

    setShowAddStudents(false);
    setStudentInput("");
    fetchClass();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">✏️</div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center text-lg shadow-sm">
              ✏️
            </div>
            <div>
              <div className="font-extrabold text-gray-800 text-sm">글빛</div>
              <div className="text-xs text-gray-400">
                {user?.name} 선생님 {classData ? `· ${classData.name}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="px-3 py-1.5 text-xs font-semibold text-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                관리자
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* No class yet */}
        {!classData && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">🏫</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">학급을 만들어주세요</h2>
            <p className="text-sm text-gray-400 mb-6">학급을 생성하면 학생을 등록하고 글쓰기 분석을 시작할 수 있어요.</p>

            {showCreateClass ? (
              <div className="max-w-xs mx-auto space-y-3">
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="예: 4학년 1반"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm text-center"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowCreateClass(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">
                    취소
                  </button>
                  <button onClick={handleCreateClass} className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200">
                    생성
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateClass(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 hover:bg-purple-600"
              >
                학급 만들기
              </button>
            )}
          </div>
        )}

        {/* Class exists */}
        {classData && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatCard label="전체 학생" value={`${classData.students.length}명`} />
              <StatCard
                label="반 평균"
                value={(() => {
                  const scores = classData.students
                    .map((s) => s.writings[0]?.scoreTotal)
                    .filter(Boolean);
                  return scores.length
                    ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}점`
                    : "—";
                })()}
                color="text-teal-500"
              />
              <StatCard
                label="총 분석"
                value={`${classData.students.reduce((sum, s) => sum + s.writings.length, 0)}회`}
                color="text-purple-500"
              />
            </div>

            {/* Student List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <h3 className="font-bold text-gray-800">👨‍🎓 학생 목록</h3>
                <button
                  onClick={() => setShowAddStudents(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100"
                >
                  + 학생 등록
                </button>
              </div>

              {classData.students.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-sm text-gray-400">아직 등록된 학생이 없어요.</p>
                  <button
                    onClick={() => setShowAddStudents(true)}
                    className="mt-3 px-4 py-2 text-sm font-semibold text-purple-500 bg-purple-50 rounded-lg"
                  >
                    학생 등록하기
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {classData.students.map((s) => {
                    const latest = s.writings[0];
                    const prev = s.writings[1];
                    const diff = latest && prev ? latest.scoreTotal - prev.scoreTotal : null;

                    return (
                      <div
                        key={s.id}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <Link href={`/dashboard/students/${s.id}`} className="flex items-center gap-3 flex-1">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background: `hsl(${s.number * 25}, 70%, 92%)`,
                              color: `hsl(${s.number * 25}, 50%, 40%)`,
                            }}
                          >
                            {s.number}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{s.name}</div>
                            <div className="text-xs text-gray-400">
                              {s.writings.length > 0 ? `${s.writings.length}회 분석` : "분석 없음"}
                            </div>
                          </div>
                        </Link>

                        <div className="flex items-center gap-3">
                          {diff !== null && (
                            <span className={`text-xs font-bold ${diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                              {diff > 0 ? `▲+${diff}` : diff < 0 ? `▼${diff}` : "—"}
                            </span>
                          )}
                          {latest && (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              latest.scoreTotal >= 80 ? "bg-green-50 text-green-600 border-green-200" :
                              latest.scoreTotal >= 60 ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                              "bg-red-50 text-red-600 border-red-200"
                            }`}>
                              {latest.scoreTotal}
                            </div>
                          )}
                          <Link
                            href={`/dashboard/students/${s.id}/analyze`}
                            className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 shadow-sm"
                          >
                            📷 분석
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Students Modal */}
        {showAddStudents && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-2">학생 등록</h3>
              <p className="text-xs text-gray-400 mb-4">
                한 줄에 한 명씩. "번호, 이름" 또는 "이름"만 입력하세요.
              </p>
              <textarea
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder={`1, 김서연\n2, 박지호\n3, 이하은\n...\n\n또는 이름만:\n김서연\n박지호\n이하은`}
                rows={10}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm font-mono resize-none"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setShowAddStudents(false); setStudentInput(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={handleAddStudents}
                  className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color = "text-gray-800" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
