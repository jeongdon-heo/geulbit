"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getApiKeyHeader } from "@/lib/api-keys";

const NOTE_TYPES = [
  { value: "thought", label: "생각일지", emoji: "💭" },
  { value: "pmi", label: "PMI 글쓰기", emoji: "⚖️" },
  { value: "weekend", label: "주말 이야기", emoji: "🌅" },
  { value: "subject", label: "교과 글쓰기", emoji: "📚" },
  { value: "letter", label: "편지", emoji: "✉️" },
  { value: "etc", label: "기타", emoji: "📝" },
] as const;

type InputMode = "photo" | "text";

export default function NewNotePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>("photo");
  const [type, setType] = useState<string>("thought");
  const [title, setTitle] = useState("");
  const [writtenAt, setWrittenAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");
  const [provider, setProvider] = useState<"gemini" | "claude">("gemini");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageData({ base64: dataUrl.split(",")[1], mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleOcr = async () => {
    if (!imageData) return;
    setError("");
    setOcrLoading(true);
    try {
      const res = await fetch("/api/analyze/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiKeyHeader(provider) },
        body: JSON.stringify({ ...imageData, provider }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const result = await res.json();
      setContent(result.fullText || "");
    } catch (err: any) {
      setError(err.message || "글자 인식에 실패했습니다.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title || null,
          content,
          writtenAt: new Date(writtenAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push(`/dashboard/students/${studentId}`);
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/dashboard/students/${studentId}`} className="text-purple-500 font-semibold text-sm">
            ← 돌아가기
          </Link>
          <div className="text-xs text-gray-400">📝 글쓰기 노트</div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100">
            {error}
          </div>
        )}

        {/* Meta */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">글 종류</label>
            <div className="grid grid-cols-3 gap-2">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    type === t.value
                      ? "bg-purple-500 text-white border-purple-500 shadow-sm shadow-purple-200"
                      : "bg-white text-gray-500 border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <div className="text-base">{t.emoji}</div>
                  <div>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">작성일</label>
              <input
                type="date"
                value={writtenAt}
                onChange={(e) => setWrittenAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">제목 (선택)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 가족 여행"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Input mode tabs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setInputMode("photo")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                inputMode === "photo"
                  ? "bg-purple-50 text-purple-600 border-purple-300"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              📷 사진으로
            </button>
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                inputMode === "text"
                  ? "bg-purple-50 text-purple-600 border-purple-300"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              ⌨️ 직접 입력
            </button>
          </div>

          {inputMode === "photo" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-500">AI 모델</label>
                  <Link href="/dashboard/settings" className="text-xs text-purple-500 hover:underline">
                    🔑 키 설정
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                      provider === "gemini"
                        ? "bg-purple-500 text-white border-purple-500"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    ✨ Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("claude")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                      provider === "claude"
                        ? "bg-purple-500 text-white border-purple-500"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    🤖 Claude
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all"
                >
                  <div className="text-4xl mb-2">📸</div>
                  <div className="font-semibold text-gray-500 text-sm">사진을 촬영하거나 올려주세요</div>
                </div>
              ) : (
                <>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setImagePreview(null); setImageData(null); }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500"
                    >
                      다시 선택
                    </button>
                    <button
                      onClick={handleOcr}
                      disabled={ocrLoading}
                      className="flex-[2] py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200 disabled:bg-purple-300"
                    >
                      {ocrLoading ? "✨ 인식 중..." : "🔍 글자 인식"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={inputMode === "photo" ? "사진을 인식하면 여기에 자동으로 채워집니다. 수정도 가능해요." : "글 내용을 입력해주세요."}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm leading-7 resize-y"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/students/${studentId}`}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 text-center font-semibold"
          >
            취소
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex-[2] py-3 rounded-xl bg-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200 disabled:bg-purple-300"
          >
            {saving ? "저장 중..." : "💾 노트 저장"}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          저장 후 학생 상세 페이지에서 "이 글 분석" 버튼으로 AI 분석을 받을 수 있어요.
        </p>
      </main>
    </div>
  );
}
