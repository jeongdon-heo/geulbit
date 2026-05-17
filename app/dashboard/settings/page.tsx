"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredKey, setStoredKey } from "@/lib/api-keys";

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showClaude, setShowClaude] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGeminiKey(getStoredKey("gemini"));
    setClaudeKey(getStoredKey("claude"));
  }, []);

  const handleSave = () => {
    setStoredKey("gemini", geminiKey.trim());
    setStoredKey("claude", claudeKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = (provider: "gemini" | "claude") => {
    if (provider === "gemini") {
      setGeminiKey("");
      setStoredKey("gemini", "");
    } else {
      setClaudeKey("");
      setStoredKey("claude", "");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3FF]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-purple-500 font-semibold text-sm">
            ← 돌아가기
          </Link>
          <div className="text-xs text-gray-400">API 키 설정</div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5">
        <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
          <div className="text-sm font-bold text-blue-800 mb-1">🔒 안전하게 보관됩니다</div>
          <p className="text-xs text-blue-700 leading-relaxed">
            입력한 키는 <strong>이 브라우저에만 저장</strong>되고, 서버 DB에 저장되지 않습니다.
            다른 기기에서는 다시 입력해야 합니다.
          </p>
        </div>

        {/* Gemini Key */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">✨ Gemini API 키</h2>
            {geminiKey && (
              <button
                onClick={() => handleClear("gemini")}
                className="text-xs text-red-500 hover:underline"
              >
                삭제
              </button>
            )}
          </div>
          <div className="relative mb-2">
            <input
              type={showGemini ? "text" : "password"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 pr-16 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowGemini(!showGemini)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              {showGemini ? "숨기기" : "보기"}
            </button>
          </div>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-500 hover:underline"
          >
            → Google AI Studio에서 키 발급
          </a>
        </div>

        {/* Claude Key */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">🤖 Claude API 키</h2>
            {claudeKey && (
              <button
                onClick={() => handleClear("claude")}
                className="text-xs text-red-500 hover:underline"
              >
                삭제
              </button>
            )}
          </div>
          <div className="relative mb-2">
            <input
              type={showClaude ? "text" : "password"}
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-2.5 pr-16 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowClaude(!showClaude)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              {showClaude ? "숨기기" : "보기"}
            </button>
          </div>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-500 hover:underline"
          >
            → Anthropic Console에서 키 발급
          </a>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-purple-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-purple-200"
        >
          {saved ? "✅ 저장됨" : "💾 저장하기"}
        </button>
      </main>
    </div>
  );
}
