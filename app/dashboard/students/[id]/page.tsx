"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getApiKeyHeader } from "@/lib/api-keys";

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

interface Note {
  id: string;
  type: string;
  title: string | null;
  content: string;
  writtenAt: string;
  createdAt: string;
  analyzedAt: string | null;
  scoreSpelling: number | null;
  scoreSentence: number | null;
  scoreStructure: number | null;
  scoreExpression: number | null;
  scoreTotal: number | null;
  feedbackTeacher: any;
  feedbackStudent: any;
}

const NOTE_TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  thought:  { label: "생각일지",     emoji: "💭", color: "bg-blue-50 text-blue-600 border-blue-200" },
  pmi:      { label: "PMI 글쓰기",   emoji: "⚖️", color: "bg-teal-50 text-teal-600 border-teal-200" },
  weekend:  { label: "주말 이야기",  emoji: "🌅", color: "bg-orange-50 text-orange-600 border-orange-200" },
  subject:  { label: "교과 글쓰기",  emoji: "📚", color: "bg-purple-50 text-purple-600 border-purple-200" },
  letter:   { label: "편지",         emoji: "✉️", color: "bg-pink-50 text-pink-600 border-pink-200" },
  etc:      { label: "기타",         emoji: "📝", color: "bg-gray-50 text-gray-600 border-gray-200" },
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [student, setStudent] = useState<any>(null);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesFilter, setNotesFilter] = useState<string>("all");
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [analyzingNoteId, setAnalyzingNoteId] = useState<string | null>(null);
  const [noteProvider, setNoteProvider] = useState<"gemini" | "claude">("gemini");
  const [loading, setLoading] = useState(true);
  const [selectedWriting, setSelectedWriting] = useState<Writing | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProvider, setReportProvider] = useState<"gemini" | "claude">("gemini");

  const fetchData = useCallback(async () => {
    const [wRes, nRes] = await Promise.all([
      fetch(`/api/students/${studentId}/writings`),
      fetch(`/api/students/${studentId}/notes`),
    ]);
    if (!wRes.ok) { router.push("/dashboard"); return; }
    const wData = await wRes.json();
    setStudent(wData.student);
    setWritings(wData.writings);
    if (nRes.ok) {
      const nData = await nRes.json();
      setNotes(nData.notes || []);
    }
    setLoading(false);
  }, [studentId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteNote = async (note: Note) => {
    const meta = NOTE_TYPE_META[note.type] || NOTE_TYPE_META.etc;
    const label = note.title || `${meta.label} (${note.writtenAt.slice(0, 10)})`;
    if (!confirm(`'${label}' 노트를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (res.ok) {
      setExpandedNoteId(null);
      fetchData();
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleAnalyzeNote = async (note: Note) => {
    setAnalyzingNoteId(note.id);
    try {
      const res = await fetch(`/api/notes/${note.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiKeyHeader(noteProvider) },
        body: JSON.stringify({ provider: noteProvider }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "분석에 실패했습니다.");
        return;
      }
      await fetchData();
    } finally {
      setAnalyzingNoteId(null);
    }
  };

  const handleGenerateYearend = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/reports/yearend", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiKeyHeader(reportProvider) },
        body: JSON.stringify({ studentId, provider: reportProvider }),
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
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/students/${studentId}/notes/new`}
              className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg hover:bg-purple-100"
            >
              📝 노트
            </Link>
            <Link
              href={`/dashboard/students/${studentId}/analyze`}
              className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg"
            >
              📷 새 글 분석
            </Link>
          </div>
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

        {/* Writing Notes Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <h3 className="font-bold text-gray-800">📝 글쓰기 노트</h3>
            <Link
              href={`/dashboard/students/${studentId}/notes/new`}
              className="px-3 py-1.5 text-xs font-semibold text-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              + 새 노트
            </Link>
          </div>

          {/* Type filter */}
          {notes.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-50 flex gap-1.5 overflow-x-auto">
              <button
                onClick={() => setNotesFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
                  notesFilter === "all"
                    ? "bg-purple-500 text-white border-purple-500"
                    : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                전체 {notes.length}
              </button>
              {Object.entries(NOTE_TYPE_META).map(([key, meta]) => {
                const count = notes.filter((n) => n.type === key).length;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setNotesFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
                      notesFilter === key
                        ? "bg-purple-500 text-white border-purple-500"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {meta.emoji} {meta.label} {count}
                  </button>
                );
              })}
            </div>
          )}

          {notes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm text-gray-400 mb-3">아직 등록된 노트가 없어요.</p>
              <p className="text-xs text-gray-400 mb-4">아침활동·교과·편지 등 일상 글을 누적해보세요.</p>
              <Link
                href={`/dashboard/students/${studentId}/notes/new`}
                className="inline-block px-4 py-2 text-sm font-semibold text-purple-500 bg-purple-50 rounded-lg"
              >
                첫 노트 만들기
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notes
                .filter((n) => notesFilter === "all" || n.type === notesFilter)
                .map((n) => {
                  const meta = NOTE_TYPE_META[n.type] || NOTE_TYPE_META.etc;
                  const isExpanded = expandedNoteId === n.id;
                  const isAnalyzing = analyzingNoteId === n.id;
                  return (
                    <div key={n.id}>
                      <div
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedNoteId(isExpanded ? null : n.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.color} whitespace-nowrap`}>
                            {meta.emoji} {meta.label}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-gray-800 truncate">
                              {n.title || n.content.slice(0, 24) + (n.content.length > 24 ? "…" : "")}
                            </div>
                            <div className="text-xs text-gray-400">
                              {n.writtenAt.slice(0, 10)}
                              {n.scoreTotal !== null && ` · 분석 ${n.scoreTotal}점`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {n.scoreTotal !== null && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                              n.scoreTotal >= 80 ? "bg-green-50 text-green-600 border-green-200" :
                              n.scoreTotal >= 60 ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                              "bg-red-50 text-red-600 border-red-200"
                            }`}>
                              {n.scoreTotal}
                            </div>
                          )}
                          <span className="text-gray-300 text-xs">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-4 bg-gray-50/50 space-y-3">
                          {/* Content */}
                          <div className="bg-white rounded-xl p-4 border border-gray-100">
                            <div className="text-[10px] font-semibold text-gray-400 mb-1">📄 내용</div>
                            <p className="text-sm text-gray-700 leading-7 whitespace-pre-wrap">{n.content}</p>
                          </div>

                          {/* Analysis result (if any) */}
                          {n.feedbackStudent && (
                            <div className="space-y-2">
                              <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                                <div className="text-xs font-bold text-yellow-700 mb-1">🌟 반짝이는 점</div>
                                <p className="text-xs text-gray-700 leading-6">{n.feedbackStudent.sparkle}</p>
                              </div>
                              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                <div className="text-xs font-bold text-blue-700 mb-1">✍️ 다음엔 이렇게</div>
                                <p className="text-xs text-gray-700 leading-6">{n.feedbackStudent.improve}</p>
                              </div>
                              <div className="bg-pink-50 rounded-xl p-3 border border-pink-100">
                                <div className="text-xs font-bold text-pink-700 mb-1">💬 선생님의 마음</div>
                                <p className="text-xs text-gray-700 leading-6">{n.feedbackStudent.heart}</p>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!n.analyzedAt && (
                              <>
                                <select
                                  value={noteProvider}
                                  onChange={(e) => setNoteProvider(e.target.value as "gemini" | "claude")}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white"
                                >
                                  <option value="gemini">✨ Gemini</option>
                                  <option value="claude">🤖 Claude</option>
                                </select>
                                <button
                                  onClick={() => handleAnalyzeNote(n)}
                                  disabled={isAnalyzing}
                                  className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-xs font-bold disabled:bg-purple-300"
                                >
                                  {isAnalyzing ? "✨ 분석 중..." : "🔍 이 글 분석"}
                                </button>
                              </>
                            )}
                            {n.analyzedAt && (
                              <div className="flex-1 text-[11px] text-gray-400">
                                분석 완료: {n.analyzedAt.slice(0, 10)}
                              </div>
                            )}
                            <button
                              onClick={() => handleDeleteNote(n)}
                              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 text-xs"
                            >
                              ✕ 삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Yearend Report Button */}
        {writings.length >= 3 && (
          <div className="space-y-2">
            <div className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 px-1">AI 모델</span>
              <div className="flex gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => setReportProvider("gemini")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    reportProvider === "gemini"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  ✨ Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setReportProvider("claude")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    reportProvider === "claude"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  🤖 Claude
                </button>
              </div>
              <Link href="/dashboard/settings" className="text-xs text-purple-500 hover:underline px-1">
                🔑
              </Link>
            </div>
            <button
              onClick={handleGenerateYearend}
              disabled={generatingReport}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-sm shadow-lg disabled:opacity-50"
            >
              {generatingReport ? "✨ 총평 생성 중..." : "📊 학년말 종합 보고서 생성"}
            </button>
          </div>
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
