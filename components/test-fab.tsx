"use client";

// 테스트용 Floating Action Button 컴포넌트
// 개발 및 테스트 환경에서 빠른 로그인과 서버 정보 확인을 위한 도구입니다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, Server, Palette } from "lucide-react";

// 테스트 계정 데이터
const TEST_ACCOUNTS = [
  { label: "A", name: "apple", email: "apple@test.com" },
  { label: "B", name: "banana", email: "banana@test.com" },
  { label: "C", name: "cherry", email: "cherry@test.com" },
  { label: "D", name: "durian", email: "durian@test.com" },
  { label: "E", name: "elderberry", email: "elderberry@test.com" },
  { label: "F", name: "fig", email: "fig@test.com" },
  { label: "G", name: "grape", email: "grape@test.com" },
  { label: "H", name: "honeydew", email: "honeydew@test.com" },
];

const TEST_PASSWORD = "12345a,*";

export function TestFab() {
  const [isLoading, setIsLoading] = useState(false);
  const [showServerInfo, setShowServerInfo] = useState(false);
  const router = useRouter();

  // 테스트 계정 로그인 또는 회원가입 핸들러
  const handleTestLogin = async (account: typeof TEST_ACCOUNTS[0]) => {
    setIsLoading(true);

    try {
      // 먼저 로그인 시도
      let result = await signIn(account.email, TEST_PASSWORD);

      // 로그인 실패 시 회원가입 후 다시 로그인
      if (!result.success) {
        console.log(`${account.name} 계정이 없습니다. 회원가입을 진행합니다...`);

        const signUpResult = await signUp(
          account.email,
          TEST_PASSWORD,
          account.name
        );

        if (signUpResult.success) {
          console.log(`${account.name} 계정 회원가입 성공!`);
          // 회원가입 성공 후 다시 로그인
          result = await signIn(account.email, TEST_PASSWORD);
        } else {
          console.error(`회원가입 실패: ${signUpResult.error}`);
          alert(`회원가입 실패: ${signUpResult.error}`);
          setIsLoading(false);
          return;
        }
      }

      if (result.success) {
        console.log(`${account.name} 계정으로 로그인 성공!`);
        alert(`${account.name} (${account.label}) 계정으로 로그인되었습니다.`);
        router.push("/");
        router.refresh();
      } else {
        console.error(`로그인 실패: ${result.error}`);
        alert(`로그인 실패: ${result.error}`);
      }
    } catch (error: any) {
      console.error("로그인 처리 중 오류:", error);
      alert(`오류 발생: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 서버 정보 표시 토글
  const handleServerInfo = () => {
    setShowServerInfo(!showServerInfo);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              disabled={isLoading}
            >
              <Settings className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>테스트 도구</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* 테스트 계정 로그인 서브메뉴 */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <User className="mr-2 h-4 w-4" />
                <span>테스트 계정 로그인</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {TEST_ACCOUNTS.map((account) => (
                  <DropdownMenuItem
                    key={account.label}
                    onClick={() => handleTestLogin(account)}
                    disabled={isLoading}
                  >
                    <span className="font-mono font-bold mr-2">
                      {account.label}
                    </span>
                    <span className="text-muted-foreground">
                      {account.name}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* 서버 정보 보기 */}
            <DropdownMenuItem onClick={handleServerInfo}>
              <Server className="mr-2 h-4 w-4" />
              <span>서버 정보 보기</span>
            </DropdownMenuItem>

            {/* 디자인 컴포넌트 */}
            <DropdownMenuItem asChild>
              <Link href="/dev/design">
                <Palette className="mr-2 h-4 w-4" />
                <span>Design Components</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 서버 정보 모달 (간단한 오버레이) */}
      {showServerInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={handleServerInfo}
        >
          <div
            className="bg-background border rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">서버 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">환경:</span>
                <span className="font-mono">
                  {process.env.NODE_ENV || "development"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next.js:</span>
                <span className="font-mono">16.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">React:</span>
                <span className="font-mono">19.2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firebase:</span>
                <span className="font-mono">설정됨</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">프로젝트 ID:</span>
                <span className="font-mono text-xs">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "N/A"}
                </span>
              </div>
            </div>
            <Button
              onClick={handleServerInfo}
              className="w-full mt-6"
              variant="outline"
            >
              닫기
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
