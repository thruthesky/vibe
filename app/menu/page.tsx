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
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">메뉴</h1>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center text-muted-foreground py-12">
            <p>로딩 중...</p>
          </div>
        )}

        {/* 로그인한 경우 */}
        {!loading && user && (
          <div className="space-y-6">
            {/* 사용자 정보 섹션 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                현재 로그인 사용자
              </h2>
              <p className="text-muted-foreground">
                <strong>{user.displayName || user.email}</strong>
              </p>
            </div>

            {/* 사용자 메뉴 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                회원 메뉴
              </h2>

              <Button asChild className="w-full justify-start h-auto py-3">
                <Link href="/profile">
                  <span>회원 정보 수정</span>
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start h-auto py-3">
                <Link href="/users">
                  <span>회원 목록</span>
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start h-auto py-3">
                <Link href="/chat/room">
                  <span>채팅</span>
                </Link>
              </Button>
            </div>

            {/* 로그아웃 버튼 */}
            <div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        )}

        {/* 로그인하지 않은 경우 */}
        {!loading && !user && (
          <div className="space-y-6">
            {/* 로그인/회원가입 섹션 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                인증
              </h2>

              <Button asChild className="w-full justify-start h-auto py-3">
                <Link href="/auth/login">
                  <span>로그인</span>
                </Link>
              </Button>

              <Button asChild className="w-full justify-start h-auto py-3">
                <Link href="/auth/signup">
                  <span>회원가입</span>
                </Link>
              </Button>
            </div>

            {/* 회원 목록 섹션 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                회원
              </h2>

              <Button asChild variant="ghost" className="w-full justify-start h-auto py-3">
                <Link href="/users">
                  <span>회원 목록</span>
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* 뒤로가기 버튼 */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            뒤로가기
          </Button>
        </div>
      </div>
    </div>
  );
}
