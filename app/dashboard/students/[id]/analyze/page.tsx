"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Step = "upload" | "ocr" | "review" | "analyzing" | "result";

interface OcrResult {
  fullText: string;
  segments: { text: string; confidence: number }[];
  overallConfidence: number;
}

interface AnalysisResult {
  round: number;
  title: string;
  scores: { spelling: number; sentence: number; structure: number; expression: number };
  total: number;
  feedbackTeacher: any;
  feedbackStudent: any;
  previousScores: any;
}

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [title, setTitle] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editedText, setEditedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);

      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type;
      setImageData({ base64: base64, mimeType });
    };
    reader.readAsDataURL(file);
  };

  // OCR 실행
  const handleOcr = async () => {
    if (!imageData) return;
    setError("");
    setOcrLoading(true);

    try {
      const res = await fetch("/api/analyze/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageData),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      const result = await res.json();
      setOcrResult(result);
      setEditedText(result.fullText);
      setStep("review");
    } catch (err: any) {
      setError(err.message || "글자 인식에 실패했습니다.");
    } finally {
      setOcrLoading(false);
    }
  };

  // 분석 실행
  const handleAnalyze = async () => {
    const textToAnalyze = isEditing ? editedText : ocrResult?.fullText;
    if (!textToAnalyze?.trim()) return;

    setError("");
    setAnalyzeLoading(true);
    setStep("analyzing");

    try {
      const res = await fetch("/api/analyze/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          text: textToAnalyze,
          title: title || null,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      const data = await res.json();
      setAnalysis(data.writing);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "분석에 실패했습니다.");
      setStep("review");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const getConfidenceStyle = (conf: number) => {
    if (conf >= 0.85) return "";
    if (conf >= 0.7) return "bg-yellow-100 text-yellow-800 px-1 rounded";
    return "bg-red-100 text-red-800 px-1 rounded";
  };

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-purple-500 font-semibold text-sm">← 돌아가기</Link>
          </div>
          <div className="text-xs text-gray-400">글 분석</div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5">
        {/* Step Progress */}
        <div className="flex items-center gap-0 mb-6 px-4">
          {["사진 업로드", "인식 확인", "AI 분석"].map((label, i) => {
            const stepNum = i + 1;
            const stepMap: Step[] = ["upload", "review", "result"];
            const currentIdx = ["upload", "review", "analyzing", "result"].indexOf(step);
            const isActive = currentIdx >= i;
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>{currentIdx > i ? "✓" : stepNum}</div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${isActive ? "bg-purple-500" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4 border border-red-100">
            {error}
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📷 사진 업로드</h2>
            <p className="text-xs text-gray-400 mb-5">학생이 쓴 글을 사진으로 찍어 올려주세요</p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">글 제목 (선택)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 과학관 체험학습"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all"
              >
                <div className="text-5xl mb-3">📸</div>
                <div className="font-semibold text-gray-500 mb-1">사진을 촬영하거나 올려주세요</div>
                <div className="text-xs text-gray-400">JPG, PNG, HEIC 지원</div>
              </div>
            ) : (
              <div>
                <div className="rounded-xl overflow-hidden border border-gray-200 mb-4">
                  <img src={imagePreview} alt="Preview" className="w-full" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setImagePreview(null); setImageData(null); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500"
                  >
                    다시 선택
                  </button>
                  <button
                    onClick={handleOcr}
                    disabled={ocrLoading}
                    className="flex-[2] py-3 rounded-xl bg-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200 disabled:bg-purple-300"
                  >
                    {ocrLoading ? "✨ 글자 인식 중..." : "🔍 AI 글자 인식 시작"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 bg-blue-50 rounded-xl p-3 flex items-start gap-2">
              <span className="text-sm">💡</span>
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>인식률 팁:</strong> 밝은 곳에서, 그림자 없이, 글이 화면의 80% 이상 차지하도록 찍어주세요.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: OCR Review */}
        {step === "review" && ocrResult && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">👩‍🏫 인식 결과 확인</h2>
            <p className="text-xs text-gray-400 mb-4">AI가 인식한 텍스트를 확인하고 수정해주세요</p>

            {/* Confidence stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className={`text-xl font-extrabold ${ocrResult.overallConfidence >= 0.8 ? "text-green-500" : "text-yellow-500"}`}>
                  {Math.round(ocrResult.overallConfidence * 100)}%
                </div>
                <div className="text-[10px] text-gray-400">전체 인식률</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-extrabold text-yellow-500">
                  {ocrResult.segments.filter((s) => s.confidence >= 0.7 && s.confidence < 0.85).length}
                </div>
                <div className="text-[10px] text-gray-400">확인 필요</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-extrabold text-red-500">
                  {ocrResult.segments.filter((s) => s.confidence < 0.7 && s.text.trim()).length}
                </div>
                <div className="text-[10px] text-gray-400">인식 불확실</div>
              </div>
            </div>

            {/* OCR Text with confidence highlights */}
            {!isEditing ? (
              <div className="bg-amber-50/50 rounded-xl p-4 mb-4 border border-amber-100 text-sm leading-8 whitespace-pre-wrap">
                {ocrResult.segments.map((seg, i) => (
                  <span key={i} className={getConfidenceStyle(seg.confidence)}>
                    {seg.text}
                  </span>
                ))}
              </div>
            ) : (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full min-h-[200px] p-4 rounded-xl border-2 border-purple-300 bg-purple-50/30 text-sm leading-8 outline-none resize-y mb-4"
                autoFocus
              />
            )}

            {/* Warning for low confidence */}
            {ocrResult.segments.some((s) => s.confidence < 0.85 && s.text.trim()) && !isEditing && (
              <div className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
                <div className="text-xs font-bold text-yellow-700 mb-2">⚠️ 다시 확인해 주세요</div>
                <div className="flex flex-wrap gap-1">
                  {ocrResult.segments
                    .filter((s) => s.confidence < 0.85 && s.text.trim())
                    .map((seg, i) => (
                      <span key={i} className="bg-white text-xs font-semibold px-2 py-1 rounded-md border border-yellow-200">
                        &quot;{seg.text.trim()}&quot;
                        <span className="text-gray-400 ml-1">{Math.round(seg.confidence * 100)}%</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="flex-1 py-3 rounded-xl border border-purple-200 text-sm font-semibold text-purple-500">
                    ✏️ 직접 수정
                  </button>
                  <button onClick={handleAnalyze} className="flex-[1.5] py-3 rounded-xl bg-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200">
                    ✅ 이대로 분석 진행
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500">
                    취소
                  </button>
                  <button onClick={handleAnalyze} className="flex-[1.5] py-3 rounded-xl bg-green-500 text-white text-sm font-bold shadow-md shadow-green-200">
                    ✅ 수정 완료, 분석 진행
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Analyzing */}
        {step === "analyzing" && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-5xl mb-4 animate-bounce">✨</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Gemini가 분석 중...</h2>
            <p className="text-xs text-gray-400 mb-6">맞춤법, 문장력, 구조, 표현력을 분석하고 있어요</p>
            <div className="w-48 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === "result" && analysis && (
          <div>
            {/* Score Card */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-400 rounded-2xl p-6 mb-4 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs opacity-80 mb-1">{analysis.round}회차 분석 완료</div>
                  <div className="text-xl font-extrabold">{analysis.title || "글쓰기 분석"}</div>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-extrabold">
                  {analysis.total}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[
                  { label: "맞춤법", score: analysis.scores.spelling },
                  { label: "문장력", score: analysis.scores.sentence },
                  { label: "구조", score: analysis.scores.structure },
                  { label: "표현력", score: analysis.scores.expression },
                ].map((item) => (
                  <div key={item.label} className="bg-white/15 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{item.score}</div>
                    <div className="text-[10px] opacity-80">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Feedback Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <h3 className="font-bold text-gray-800 mb-3">📊 교사용 분석 요약</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {analysis.feedbackTeacher?.overall || "분석이 완료되었습니다."}
              </p>
            </div>

            {/* Student Card Preview */}
            <div className="bg-yellow-50 rounded-2xl p-5 shadow-sm border border-yellow-200 mb-4">
              <h3 className="font-bold text-yellow-800 mb-3">💌 학생용 피드백</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <span className="font-bold text-yellow-600">🌟 반짝이는 점: </span>
                  {analysis.feedbackStudent?.sparkle}
                </div>
                <div>
                  <span className="font-bold text-blue-600">✍️ 다음엔 이렇게: </span>
                  {analysis.feedbackStudent?.improve}
                </div>
                <div>
                  <span className="font-bold text-green-600">🎯 미션: </span>
                  {analysis.feedbackStudent?.mission}
                </div>
                <div>
                  <span className="font-bold text-pink-600">💬 선생님 마음: </span>
                  {analysis.feedbackStudent?.heart}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/dashboard/students/${studentId}`)}
                className="flex-1 py-3 rounded-xl bg-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200"
              >
                📈 성장 기록 보기
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500"
              >
                대시보드로
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
