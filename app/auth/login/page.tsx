// 로그인 페이지 (간단한 버전)
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 먼저 회원가입 시도
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (signUpError: any) {
        // 계정이 이미 있으면 로그인 시도
        if (signUpError.code === "auth/email-already-in-use") {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw signUpError;
        }
      }

      // 성공하면 홈페이지로 이동
      router.push("/");
    } catch (err: any) {
      setError(err.message || "처리 중 오류가 발생했습니다.");
    }

    setLoading(false);
  }

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(180,208,255,0.45),transparent_55%),radial-gradient(circle_at_bottom,_rgba(198,230,208,0.35),transparent_60%)]" />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/60 bg-white/95 p-10 shadow-2xl shadow-[#c3d4f0]/45 backdrop-blur">
        {/* 페이지 제목 */}
        <div className="mb-6 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1877f2] shadow-inner shadow-white">
            <span className="text-xl font-bold">V</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#050505]">로그인</h1>
          <p className="text-sm text-[#5d6472]">계정에 로그인하고 대화를 이어가세요.</p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 rounded-2xl border border-[#f28b82] bg-[#fdecea] px-4 py-3 text-sm text-[#b3261e] shadow-inner shadow-white/60">
            {error}
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 입력 */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-[#050505]">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              className="w-full rounded-2xl border border-[#dfe1e6] bg-white/95 px-4 py-3 text-[#050505] shadow-inner shadow-white placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-[#050505]">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full rounded-2xl border border-[#dfe1e6] bg-white/95 px-4 py-3 text-[#050505] shadow-inner shadow-white placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#1877f2] py-3 text-sm font-semibold text-white shadow-lg shadow-[#99b5f7]/60 transition-colors hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#c3dafb]"
          >
            {loading ? "처리 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#dfe3ec] to-transparent" />

        {/* 회원가입 링크 */}
        <p className="mt-8 text-center text-sm text-[#5d6472]">
          아직 계정이 없으신가요?{" "}
          <a href="/auth/signup" className="font-semibold text-[#1877f2] hover:underline">
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}
