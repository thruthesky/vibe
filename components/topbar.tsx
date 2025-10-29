"use client";

// 탑바 컴포넌트
// 모든 페이지 상단에 고정되어 표시되는 네비게이션 바입니다.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { logOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Users,
  Menu,
  LogOut,
  User as UserIcon,
} from "lucide-react";

export function Topbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Firebase Auth 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 구독 해제
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

  // 사용자 이름의 첫 글자를 가져옴 (아바타 표시용)
  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* 왼쪽: 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-xl font-bold">KVB 한바보</div>
        </Link>

        {/* 오른쪽: 네비게이션 */}
        <nav className="flex items-center gap-1">
          {!loading && user && (
            <>
              {/* 데스크톱 메뉴 */}
              <div className="hidden md:flex items-center gap-2">
                {/* 채팅 버튼 */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/chat/room">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    채팅
                  </Link>
                </Button>

                {/* 사용자 찾기 버튼 */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/users">
                    <Users className="h-4 w-4 mr-2" />
                    사용자찾기
                  </Link>
                </Button>

                {/* 프로필 드롭다운 메뉴 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{getUserInitial()}</AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline-block">
                        {user.displayName || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        프로필 수정
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 메뉴 아이콘 - 맨 오른쪽 */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/menu">
                    <Menu className="h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* 모바일 메뉴 아이콘 */}
              <div className="md:hidden flex items-center gap-2">
                {/* 프로필 아이콘 */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {getUserInitial()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </Button>

                {/* 메뉴 아이콘 - /menu 페이지로 이동 */}
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/menu">
                    <Menu className="h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* 로그인하지 않은 경우 */}
          {!loading && !user && (
            <div className="flex items-center gap-1">
              {/* 데스크톱 메뉴 */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">로그인</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">회원가입</Link>
                </Button>
                {/* 메뉴 아이콘 */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/menu">
                    <Menu className="h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* 모바일 메뉴 */}
              <div className="md:hidden flex items-center gap-2">
                {/* 프로필 아이콘 (로그인 페이지로) */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">?</AvatarFallback>
                    </Avatar>
                  </Link>
                </Button>

                {/* 메뉴 아이콘 - /menu 페이지로 이동 */}
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/menu">
                    <Menu className="h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
