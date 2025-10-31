// 회원 정보 수정 페이지
// 사용자의 displayName을 수정하고 프로필 사진을 업로드합니다.
"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import { saveUserDisplayName, getUserDisplayName, uploadProfilePhoto, getUserPhotoUrl } from "@/lib/user";

export default function ProfilePage() {
  const t = useTranslations();
  const [displayName, setDisplayName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Firebase 인증 상태 확인 및 현재 displayName, 사진 URL 조회
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);

        // 현재 displayName 조회
        // 1. Firebase Authentication 프로필에서 조회
        if (user.displayName) {
          setDisplayName(user.displayName);
        } else {
          // 2. RTDB에서 조회
          const rtdbDisplayName = await getUserDisplayName(user.uid);
          if (rtdbDisplayName) {
            setDisplayName(rtdbDisplayName);
          }
        }

        // 현재 프로필 사진 URL 조회
        const currentPhotoUrl = await getUserPhotoUrl(user.uid);
        if (currentPhotoUrl) {
          setPhotoUrl(currentPhotoUrl);
        }
      } else {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        router.push("/auth/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 사진 파일 선택 핸들러
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setError("");
    setSuccess("");
    setPhotoLoading(true);

    try {
      // 사진 업로드 및 URL 저장
      const result = await uploadProfilePhoto(userId, file);

      if (result.success && result.photoUrl) {
        setPhotoUrl(result.photoUrl);
        setSuccess(t("profile.photo.success"));
      } else {
        setError(result.error || t("profile.photo.error"));
      }
    } catch (err: any) {
      setError(err.message || t("profile.photo.error"));
    }

    setPhotoLoading(false);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // 회원 정보 수정 폼 제출 핸들러
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!displayName.trim()) {
      setError(t("profile.error.empty"));
      return;
    }

    setLoading(true);

    try {
      if (!userId) {
        throw new Error(t("profile.error.noUserId"));
      }

      // RTDB에 displayName 저장
      // 경로: /vibe/users/<uid>/displayName
      const result = await saveUserDisplayName(userId, displayName.trim());

      if (result.success) {
        setSuccess(t("profile.success"));

        // 3초 후 홈페이지로 이동
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(result.error || t("profile.error.failed"));
      }
    } catch (err: any) {
      setError(err.message || t("profile.error.failed"));
    }

    setLoading(false);
  }

  // 인증 상태 확인 중
  if (authLoading) {
    return (
      <div className="relative min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(206,230,208,0.25),transparent_65%)]" />
        <p className="relative text-sm text-[#5d6472]">{t("profile.loading")}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.4),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/60 bg-white/95 p-10 shadow-2xl shadow-[#c3d4f0]/45 backdrop-blur">
        {/* 페이지 제목 */}
        <div className="mb-6 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1877f2] shadow-inner shadow-white">
            <span className="text-xl font-bold">V</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#050505]">{t("profile.title")}</h1>
          <p className="text-sm text-[#5d6472]">{t("profile.subtitle")}</p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 rounded-2xl border border-[#f28b82] bg-[#fdecea] px-4 py-3 text-sm text-[#b3261e] shadow-inner shadow-white/60">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="mb-6 rounded-2xl border border-[#8dd17c] bg-[#e6f4ea] px-4 py-3 text-sm text-[#1b5e20] shadow-inner shadow-white/60">
            {success}
          </div>
        )}

        {/* 프로필 사진 섹션 */}
        <div className="mb-6 space-y-3 text-center">
          <label className="block text-sm font-semibold text-[#050505]">{t("profile.photo.label")}</label>

          {/* 현재 사진 미리보기 */}
          {photoUrl ? (
            <div className="flex justify-center">
              <img
                src={photoUrl}
                alt={t("profile.photo.label")}
                className="h-32 w-32 rounded-full border-2 border-[#1877f2] object-cover shadow-md"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#dfe1e6] bg-slate-300 text-slate-700 font-semibold">
                <span className="text-sm">{t("profile.photo.noPhoto")}</span>
              </div>
            </div>
          )}

          {/* 사진 업로드 버튼 */}
          <button
            type="button"
            disabled={photoLoading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border border-[#dfe1e6] bg-white px-4 py-2 text-sm font-semibold text-[#050505] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:text-[#8d949e]"
          >
            {photoLoading ? t("profile.photo.uploading") : t("profile.photo.change")}
          </button>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={photoLoading}
            className="hidden"
          />
        </div>

        {/* 회원 정보 수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 입력 */}
          <div className="space-y-2 text-left">
            <label htmlFor="displayName" className="block text-sm font-semibold text-[#050505]">
              {t("profile.displayName.label")}
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("profile.displayName.placeholder")}
              disabled={loading}
              required
              className="w-full rounded-2xl border border-[#dfe1e6] bg-white px-4 py-3 text-[#050505] shadow-inner shadow-white placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff] disabled:cursor-not-allowed disabled:bg-[#f0f2f5] disabled:text-[#8d949e]"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            {/* 저장 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-[#1877f2] py-3 text-sm font-semibold text-white shadow-lg shadow-[#99b5f7]/60 transition-colors hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#c3dafb]"
            >
              {loading ? t("profile.submitting") : t("profile.submit")}
            </button>

            {/* 취소 버튼 */}
            <button
              type="button"
              onClick={() => router.push("/")}
              disabled={loading}
              className="flex-1 rounded-2xl border border-[#dfe1e6] bg-white py-3 text-sm font-semibold text-[#1877f2] transition-colors hover:bg-[#e7f3ff] disabled:cursor-not-allowed disabled:text-[#8d949e]"
            >
              {t("profile.cancel")}
            </button>
          </div>
        </form>

        {/* 정보 텍스트 */}
        <p className="mt-8 text-center text-xs text-[#5d6472]">
          {t("profile.dataLocation", { path: "/vibe/users/<uid>/displayName" })}
        </p>
      </div>
    </div>
  );
}
