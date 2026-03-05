"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    inviteCode: "",
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    school: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (form.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: form.inviteCode.toUpperCase().trim(),
          email: form.email,
          password: form.password,
          name: form.name,
          school: form.school || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "가입에 실패했습니다.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">가입이 완료되었습니다!</h2>
          <p className="text-gray-500 text-sm">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
            ✏️
          </div>
          <h1 className="text-xl font-extrabold text-gray-800">교사 가입</h1>
          <p className="text-sm text-gray-400 mt-1">초대 코드가 필요합니다</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">초대 코드 *</label>
              <input
                value={form.inviteCode}
                onChange={(e) => updateField("inviteCode", e.target.value)}
                placeholder="ABC12345"
                required
                maxLength={8}
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-mono tracking-widest text-center uppercase"
              />
            </div>

            <div className="border-t border-gray-100 pt-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">이름 *</label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="홍길동"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">학교 (선택)</label>
              <input
                value={form.school}
                onChange={(e) => updateField("school", e.target.value)}
                placeholder="○○초등학교"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">이메일 *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="teacher@school.kr"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">비밀번호 * (6자 이상)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">비밀번호 확인 *</label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => updateField("passwordConfirm", e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-purple-200 mt-2"
            >
              {loading ? "가입 중..." : "가입하기"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="text-purple-500 font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
