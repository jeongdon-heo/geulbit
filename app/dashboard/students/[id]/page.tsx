"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Writing {
  id: string;
  round: number;
  title: string | null;
  analyzedAt: string;
  scoreSpelling: number;
  scoreSentence: number;
  scoreStructure: number;
  scoreExpression: number;
  scoreTotal: number;
  feedbackStudent: any;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [student, setStudent] = useState<any>(null);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWriting, setSelectedWriting] = useState<Writing | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/students/${studentId}/writings`);
    if (!res.ok) { router.push("/dashboard"); return; }
    const data = await res.json();
    setStudent(data.student);
    setWritings(data.writings);
    setLoading(false);
  }, [studentId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerateYearend = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/reports/yearend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("학년말 총평이 생성되었습니다!");
        router.push(`/reports/yearend?studentId=${studentId}`);
      } else {
        alert(data.error);
      }
    } catch {
      alert("총평 생성에 실패했습니다.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePrintFeedback = (writing: Writing) => {
    const fb = writing.feedbackStudent;
    if (!fb) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>글쓰기 피드백</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif; color: #333; line-height: 1.8; max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; border-bottom: 3px solid #6C5CE7; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #6C5CE7; margin: 0 0 4px; }
  .header p { font-size: 13px; color: #888; margin: 0; }
  .scores { display: flex; justify-content: center; gap: 12px; margin: 16px 0; }
  .score-box { background: #F4F3FF; border-radius: 12px; padding: 10px 16px; text-align: center; }
  .score-box .num { font-size: 20px; font-weight: 800; color: #6C5CE7; }
  .score-box .label { font-size: 11px; color: #888; }
  .section { background: #FFFDF7; border: 1px solid #F0E6D0; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .section h3 { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
  .section p { font-size: 13px; margin: 0; }
  .sparkle h3 { color: #D97706; }
  .improve h3 { color: #2563EB; }
  .mission h3 { color: #16A34A; }
  .heart h3 { color: #DB2777; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #aaa; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${writing.title || `${writing.round}회차 글쓰기`}</h1>
    <p>${student?.name || ""} · ${writing.round}회차 · ${writing.analyzedAt.slice(0, 10)}</p>
  </div>
  <div class="scores">
    <div class="score-box"><div class="num">${writing.scoreSpelling}</div><div class="label">맞춤법</div></div>
    <div class="score-box"><div class="num">${writing.scoreSentence}</div><div class="label">문장력</div></div>
    <div class="score-box"><div class="num">${writing.scoreStructure}</div><div class="label">구조</div></div>
    <div class="score-box"><div class="num">${writing.scoreExpression}</div><div class="label">표현력</div></div>
  </div>
  <div class="section sparkle"><h3>🌟 반짝이는 점</h3><p>${fb.sparkle || ""}</p></div>
  <div class="section improve"><h3>✍️ 다음엔 이렇게</h3><p>${fb.improve || ""}</p></div>
  <div class="section mission"><h3>🎯 미션</h3><p>${fb.mission || ""}</p></div>
  <div class="section heart"><h3>💬 선생님의 마음</h3><p>${fb.heart || ""}</p></div>
  <div class="footer">글빛 · AI 글쓰기 분석 & 성장 추적</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>;
  }

  const first = writings[0];
  const last = writings[writings.length - 1];
  const growth = first && last ? last.scoreTotal - first.scoreTotal : 0;

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-purple-500 font-semibold text-sm">← 돌아가기</Link>
          <Link
            href={`/dashboard/students/${studentId}/analyze`}
            className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg"
          >
            📷 새 글 분석
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Growth Header */}
        {writings.length > 0 ? (
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl p-6 mb-5 text-white shadow-lg">
            <div className="text-xs opacity-80 mb-1">{student?.name}의 성장 기록</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-extrabold">
                  {growth > 0 ? `+${growth}점 성장!` : `${growth}점 변화`}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {writings.length}회 분석 · {first?.analyzedAt?.slice(5, 10)} ~ {last?.analyzedAt?.slice(5, 10)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-80">현재 종합</div>
                <div className="text-3xl font-extrabold">{last?.scoreTotal}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 mb-5">
            <div className="text-5xl mb-3">📝</div>
            <p className="font-semibold text-gray-600">{student?.name}의 분석 기록이 아직 없어요.</p>
            <Link
              href={`/dashboard/students/${studentId}/analyze`}
              className="inline-block mt-4 px-5 py-2.5 bg-purple-500 text-white text-sm font-bold rounded-xl shadow-md shadow-purple-200"
            >
              첫 글 분석 시작하기
            </Link>
          </div>
        )}

        {/* Score Trend - Simple table */}
        {writings.length > 1 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-bold text-gray-800 mb-3">📈 점수 변화</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left font-semibold text-gray-500">회차</th>
                    <th className="p-2 text-center font-semibold text-gray-500">맞춤법</th>
                    <th className="p-2 text-center font-semibold text-gray-500">문장력</th>
                    <th className="p-2 text-center font-semibold text-gray-500">구조</th>
                    <th className="p-2 text-center font-semibold text-gray-500">표현력</th>
                    <th className="p-2 text-center font-semibold text-purple-500">종합</th>
                  </tr>
                </thead>
                <tbody>
                  {writings.map((w) => (
                    <tr key={w.id} className="border-t border-gray-50 hover:bg-purple-50/30 cursor-pointer" onClick={() => setSelectedWriting(w)}>
                      <td className="p-2">
                        <div className="font-semibold text-gray-700">{w.round}회</div>
                        <div className="text-[10px] text-gray-400">{w.title}</div>
                      </td>
                      <td className="p-2 text-center font-semibold">{w.scoreSpelling}</td>
                      <td className="p-2 text-center font-semibold">{w.scoreSentence}</td>
                      <td className="p-2 text-center font-semibold">{w.scoreStructure}</td>
                      <td className="p-2 text-center font-semibold">{w.scoreExpression}</td>
                      <td className="p-2 text-center font-bold text-purple-600">{w.scoreTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis History */}
        {writings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-800">📋 분석 이력</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[...writings].reverse().map((w, i) => {
                const prev = writings.length > 1 ? writings[writings.length - 2 - i] : null;
                const diff = prev ? w.scoreTotal - prev.scoreTotal : null;
                return (
                  <div
                    key={w.id}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedWriting(w)}
                  >
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{w.title || `${w.round}회차`}</div>
                      <div className="text-xs text-gray-400">
                        {w.analyzedAt.slice(0, 10)} · {w.round}회차
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {diff !== null && (
                        <span className={`text-xs font-bold ${diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      )}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        w.scoreTotal >= 80 ? "bg-green-50 text-green-600 border-green-200" :
                        w.scoreTotal >= 60 ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                        "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {w.scoreTotal}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Yearend Report Button */}
        {writings.length >= 3 && (
          <button
            onClick={handleGenerateYearend}
            disabled={generatingReport}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-sm shadow-lg disabled:opacity-50"
          >
            {generatingReport ? "✨ 총평 생성 중..." : "📊 학년말 종합 보고서 생성"}
          </button>
        )}

        {/* Writing Detail Modal */}
        {selectedWriting && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedWriting(null)}>
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {selectedWriting.title || `${selectedWriting.round}회차`}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedWriting.feedbackStudent && (
                    <button
                      onClick={() => handlePrintFeedback(selectedWriting)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 text-xs font-semibold rounded-lg transition-colors"
                    >
                      🖨️ 인쇄
                    </button>
                  )}
                  <button onClick={() => setSelectedWriting(null)} className="text-gray-400 text-xl">×</button>
                </div>
              </div>

              {/* Student Feedback */}
              {selectedWriting.feedbackStudent && (
                <div className="space-y-3 text-sm">
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                    <div className="font-bold text-yellow-700 mb-1">🌟 반짝이는 점</div>
                    <p className="text-gray-700 leading-relaxed">{selectedWriting.feedbackStudent.sparkle}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="font-bold text-blue-700 mb-1">✍️ 다음엔 이렇게</div>
                    <p className="text-gray-700 leading-relaxed">{selectedWriting.feedbackStudent.improve}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="font-bold text-green-700 mb-1">🎯 미션</div>
                    <p className="text-gray-700 leading-relaxed">{selectedWriting.feedbackStudent.mission}</p>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                    <div className="font-bold text-pink-700 mb-1">💬 선생님의 마음</div>
                    <p className="text-gray-700 leading-relaxed">{selectedWriting.feedbackStudent.heart}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
