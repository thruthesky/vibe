// 메뉴 페이지
// 로그인/회원가입, 회원 목록 메뉴를 제공합니다.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logOut } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function MenuPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const result = await logOut();
    if (result.success) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] pt-24 pb-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
      <div className="relative mx-auto max-w-2xl px-6">
        {/* 페이지 제목 */}
        <div className="mb-10 space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-[#050505]">메뉴</h1>
          <p className="text-sm text-[#5d6472]">
            빠르게 이동하고 싶은 기능을 선택하세요.
          </p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#dfe3ec] to-transparent" />
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="rounded-3xl border border-white/60 bg-white/90 py-12 text-center text-sm text-[#5d6472] shadow-xl shadow-[#ccd9f0]/45 backdrop-blur">
            로딩 중...
          </div>
        )}

        {/* 로그인한 경우 */}
        {!loading && user && (
          <div className="space-y-6">
            {/* 사용자 정보 섹션 */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#cbd8f2]/45 backdrop-blur">
              <h2 className="text-lg font-semibold text-[#050505]">
                현재 로그인 사용자
              </h2>
              <p className="mt-2 text-sm text-[#5d6472]">
                <strong className="text-[#050505]">{user.displayName || user.email}</strong>
              </p>
            </div>

            {/* 사용자 메뉴 */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#cbd8f2]/45 backdrop-blur space-y-3">
              <h2 className="text-lg font-semibold text-[#050505]">
                회원 메뉴
              </h2>

              <Button
                asChild
                className="w-full justify-start rounded-2xl bg-[#1877f2] py-3 text-sm font-semibold shadow-lg shadow-[#99b5f7]/60 hover:bg-[#166fe5]"
              >
                <Link href="/profile">
                  <span>회원 정보 수정</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full justify-start rounded-2xl border border-transparent bg-[#e7f3ff] py-3 text-sm font-semibold text-[#1877f2] hover:bg-[#d8e8ff]"
              >
                <Link href="/users">
                  <span>회원 목록</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full justify-start rounded-2xl border border-transparent bg-[#f5f6f7] py-3 text-sm font-semibold text-[#050505] hover:bg-[#e9ebee]"
              >
                <Link href="/chat/room">
                  <span>채팅</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full justify-start rounded-2xl border border-transparent bg-[#fff4e6] py-3 text-sm font-semibold text-[#c24a00] hover:bg-[#ffe8d1]"
              >
                <Link href="/admin">
                  <span>관리자 페이지</span>
                </Link>
              </Button>
            </div>

            {/* 로그아웃 버튼 */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#cbd8f2]/45 backdrop-blur">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-center gap-2 rounded-2xl border border-[#dfe1e6] bg-white py-3 text-sm font-semibold text-[#1877f2] hover:bg-[#e7f3ff]"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        )}

        {/* 로그인하지 않은 경우 */}
        {!loading && !user && (
          <div className="space-y-6">
            {/* 로그인/회원가입 섹션 */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#cbd8f2]/45 backdrop-blur space-y-3">
              <h2 className="text-lg font-semibold text-[#050505]">
                인증
              </h2>

              <Button
                asChild
                className="w-full justify-start rounded-2xl bg-[#1877f2] py-3 text-sm font-semibold shadow-lg shadow-[#99b5f7]/60 hover:bg-[#166fe5]"
              >
                <Link href="/auth/login">
                  <span>로그인</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full justify-start rounded-2xl border border-[#dfe1e6] bg-white py-3 text-sm font-semibold text-[#1877f2] hover:bg-[#e7f3ff]"
              >
                <Link href="/auth/signup">
                  <span>회원가입</span>
                </Link>
              </Button>
            </div>

            {/* 회원 목록 섹션 */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#cbd8f2]/45 backdrop-blur">
              <h2 className="text-lg font-semibold text-[#050505]">
                회원
              </h2>

              <Button
                asChild
                variant="ghost"
                className="w-full justify-start rounded-2xl border border-transparent bg-[#f5f6f7] py-3 text-sm font-semibold text-[#050505] hover:bg-[#e9ebee]"
              >
                <Link href="/users">
                  <span>회원 목록</span>
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* 언어 설정 섹션 */}
        <div className="mt-6 rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#cbd8f2]/45 backdrop-blur">
          <h2 className="text-lg font-semibold text-[#050505] mb-4">
            언어 설정
          </h2>
          <p className="text-sm text-[#5d6472] mb-4">
            원하는 언어를 선택하세요.
          </p>
          <LanguageSwitcher />
        </div>

        {/* 뒤로가기 버튼 */}
        <div className="mt-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-full justify-center rounded-2xl border border-[#dfe1e6] bg-white py-3 text-sm font-semibold text-[#050505] shadow-lg shadow-[#d5deef]/50 hover:bg-[#f5f6f7]"
          >
            뒤로가기
          </Button>
        </div>
      </div>
    </div>
  );
}
