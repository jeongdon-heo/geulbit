"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  isActive: boolean;
  usedAt: string | null;
  teacher: { name: string; email: string } | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      fetchCodes();
    }
  }, [status, session, router]);

  const fetchCodes = async () => {
    const res = await fetch("/api/admin/invite-codes");
    if (res.ok) {
      const data = await res.json();
      setCodes(data.codes);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    if (res.ok) fetchCodes();
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const unusedCodes = codes.filter((c) => c.isActive && !c.usedAt);
  const usedCodes = codes.filter((c) => c.usedAt);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>;

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-400 rounded-xl flex items-center justify-center text-lg">🔑</div>
            <div>
              <div className="font-extrabold text-gray-800 text-sm">관리자 페이지</div>
              <div className="text-xs text-gray-400">초대 코드 관리</div>
            </div>
          </div>
          <Link href="/dashboard" className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 rounded-lg">
            대시보드
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">전체 코드</div>
            <div className="text-2xl font-extrabold text-gray-800">{codes.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">미사용</div>
            <div className="text-2xl font-extrabold text-green-500">{unusedCodes.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">사용됨</div>
            <div className="text-2xl font-extrabold text-purple-500">{usedCodes.length}</div>
          </div>
        </div>

        {/* Generate */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <h3 className="font-bold text-gray-800 mb-3">📝 초대 코드 생성</h3>
          <div className="flex gap-2">
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}개</option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold disabled:bg-purple-300 shadow-md shadow-purple-200"
            >
              {generating ? "생성 중..." : "코드 생성"}
            </button>
          </div>
        </div>

        {/* Unused Codes */}
        {unusedCodes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
            <div className="px-5 py-3 bg-green-50 border-b border-green-100">
              <h3 className="font-bold text-green-700 text-sm">✅ 사용 가능한 코드 ({unusedCodes.length}개)</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {unusedCodes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => copyCode(c.code)}
                    className="px-3 py-2 bg-green-50 text-green-700 rounded-lg font-mono text-sm font-bold border border-green-200 hover:bg-green-100 transition-colors"
                    title="클릭하여 복사"
                  >
                    {c.code}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">💡 코드를 클릭하면 클립보드에 복사됩니다.</p>
            </div>
          </div>
        )}

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-500 text-sm">사용된 코드 ({usedCodes.length}개)</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {usedCodes.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm text-gray-400 line-through">{c.code}</span>
                    <span className="ml-2 text-xs text-gray-400">→ {c.teacher?.name} ({c.teacher?.email})</span>
                  </div>
                  <span className="text-xs text-gray-300">{c.usedAt?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
