"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F3FF]">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-400 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg">
          ✏️
        </div>
        <h1 className="text-xl font-extrabold text-gray-800 mb-2">
          오프라인 상태입니다
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          인터넷에 연결되어 있지 않아요.
          <br />
          네트워크 연결을 확인한 후 다시 시도해주세요.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 hover:bg-purple-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
