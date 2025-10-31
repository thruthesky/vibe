// 회원가입 페이지
"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { signUp } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const t = useTranslations();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      setError(t("auth.signup.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.signup.passwordTooShort"));
      return;
    }

    setLoading(true);

    const result = await signUp(email, password, displayName);

    if (result.success) {
      // 회원가입 성공
      router.push("/");
    } else {
      // 회원가입 실패
      setError(result.error || t("auth.signup.signupFailed"));
    }

    setLoading(false);
  }

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(182,209,255,0.45),transparent_55%),radial-gradient(circle_at_bottom,_rgba(206,230,208,0.3),transparent_60%)]" />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/70 bg-white/95 p-10 shadow-2xl shadow-[#c3d4f0]/45 backdrop-blur ring-1 ring-white/60">
        {/* 페이지 제목 */}
        <div className="mb-6 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1877f2] shadow-inner shadow-white">
            <span className="text-xl font-bold">V</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#050505]">{t("auth.signup.title")}</h1>
          <p className="text-sm text-[#5d6472]">{t("auth.signup.subtitle")}</p>
          <p className="text-xs text-[#8d949e]">{t("auth.signup.description")}</p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 rounded-2xl border border-[#f28b82] bg-[#fdecea] px-4 py-3 text-sm text-[#b3261e] shadow-inner shadow-white/60">
            {error}
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-semibold text-[#050505]">
              {t("auth.signup.nameLabe l")}
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("auth.signup.namePlaceholder")}
              required
              className="w-full rounded-2xl border border-[#dfe1e6] bg-white/95 px-4 py-3 text-[#050505] shadow-inner shadow-white placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-[#050505]">
              {t("auth.signup.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.signup.emailPlaceholder")}
              required
              className="w-full rounded-2xl border border-[#dfe1e6] bg-white/95 px-4 py-3 text-[#050505] shadow-inner shadow-white placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-[#050505]">
              {t("auth.signup.passwordLabel")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.signup.passwordPlaceholder")}
              required
              className="w-full rounded-2xl border border-[#dfe1e6] bg-white/95 px-4 py-3 text-[#050505] shadow-inner shadow-white placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="space-y-2">
            <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-[#050505]">
              {t("auth.signup.passwordConfirmLabel")}
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t("auth.signup.passwordConfirmPlaceholder")}
              required
              className="w-full rounded-2xl border border-[#dfe1e6] bg-white/95 px-4 py-3 text-[#050505] shadow-inner shadow-white placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#1877f2] py-3 text-sm font-semibold text-white shadow-lg shadow-[#99b5f7]/60 transition-transform transition-colors hover:-translate-y-[1px] hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#c3dafb]"
          >
            {loading ? t("auth.signup.submitting") : t("auth.signup.submitButton")}
          </button>
        </form>

        <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#dfe3ec] to-transparent" />

        {/* 로그인 링크 */}
        <p className="mt-8 text-center text-sm text-[#5d6472]">
          {t("auth.signup.hasAccount")}{" "}
          <a href="/auth/login" className="font-semibold text-[#1877f2] hover:underline">
            {t("auth.signup.loginLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
