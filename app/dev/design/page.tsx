// 디자인 컴포넌트 미리보기 페이지
// 개발 모드에서 프로젝트에 사용된 디자인 컴포넌트들을 확인할 수 있습니다.

"use client";

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
import { Home, User, MessageCircle, FileText, Settings } from "lucide-react";

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        {/* 페이지 제목 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Design Components</h1>
          <p className="text-lg text-muted-foreground">
            프로젝트에서 사용하는 디자인 컴포넌트와 스타일을 미리 확인할 수 있습니다.
          </p>
        </div>

        {/* 색상 팔레트 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">색상 팔레트</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Slate 색상 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Slate</p>
              <div className="space-y-2">
                <div className="rounded-xl border border-[#e4e6eb] bg-white p-3 text-xs font-mono shadow-sm">
                  slate-50
                </div>
                <div className="rounded-xl border border-[#dfe1e6] bg-[#f5f6f7] p-3 text-xs font-mono shadow-sm">
                  slate-100
                </div>
                <div className="bg-slate-200 rounded p-3 text-xs font-mono">
                  slate-200
                </div>
                <div className="bg-slate-600 text-white rounded p-3 text-xs font-mono">
                  slate-600
                </div>
                <div className="bg-slate-700 text-white rounded p-3 text-xs font-mono">
                  slate-700
                </div>
                <div className="bg-slate-800 text-white rounded p-3 text-xs font-mono">
                  slate-800
                </div>
                <div className="bg-slate-900 text-white rounded p-3 text-xs font-mono">
                  slate-900
                </div>
              </div>
            </div>

            {/* Background 색상 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Background</p>
              <div className="space-y-2">
                <div className="rounded-xl border border-[#e4e6eb] bg-white p-3 text-xs font-mono shadow-sm">
                  background
                </div>
                <div className="bg-accent border border-slate-200 rounded p-3 text-xs font-mono">
                  accent
                </div>
              </div>
            </div>

            {/* Text 색상 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Text</p>
              <div className="space-y-2">
                <div className="border border-slate-200 rounded p-3">
                  <p className="text-foreground text-xs font-mono">foreground</p>
                </div>
                <div className="border border-slate-200 rounded p-3">
                  <p className="text-muted-foreground text-xs font-mono">muted-foreground</p>
                </div>
              </div>
            </div>

            {/* 상태 색상 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">상태</p>
              <div className="space-y-2">
                <div className="bg-red-50 border border-red-200 rounded p-3 text-xs font-mono text-red-700">
                  red (error)
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3 text-xs font-mono text-green-700">
                  green (success)
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs font-mono text-yellow-700">
                  yellow (warning)
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs font-mono text-blue-700">
                  blue (info)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 버튼 컴포넌트 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">버튼</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {/* 기본 버튼 */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>

              {/* 크기 변형 */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>

              {/* 아이콘이 있는 버튼 */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button>
                  <Home className="mr-2 h-4 w-4" />
                  홈
                </Button>
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  프로필
                </Button>
                <Button variant="ghost">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  채팅
                </Button>
              </div>

              {/* 커스텀 스타일 버튼 */}
              <div className="flex flex-wrap gap-3 items-center">
                <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors">
                  Slate 900
                </button>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors">
                  Slate 700
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                  Blue 600
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 카드/섹션 레이아웃 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">카드 & 섹션</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slate-50 카드 */}
            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Slate-50 카드</h3>
              <p className="text-muted-foreground">
                가장 많이 사용하는 기본 카드입니다. 밝은 배경과 부드러운 그림자를 사용합니다.
              </p>
            </div>

            {/* Slate-100 카드 */}
            <div className="rounded-2xl border border-[#dfe1e6] bg-[#f5f6f7] p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Slate-100 카드</h3>
              <p className="text-muted-foreground">
                프로젝트 개요 등에 쓰이는 톤 다운된 카드 스타일입니다.
              </p>
            </div>

            {/* White 카드 */}
            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">White 카드</h3>
              <p className="text-muted-foreground">
                깔끔한 흰색 배경 카드로 정보 위계를 강조할 때 활용합니다.
              </p>
            </div>

            {/* Accent 카드 */}
            <div className="rounded-2xl border border-[#d8e8ff] bg-[#e7f3ff] p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Accent 카드</h3>
              <p className="text-muted-foreground">
                통계나 하이라이트 영역에 사용하는 파스텔 톤 카드입니다.
              </p>
            </div>
          </div>
        </section>

        {/* 아바타 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">아바타</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-4 items-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">A</AvatarFallback>
              </Avatar>
              <Avatar className="h-10 w-10">
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <Avatar className="h-12 w-12">
                <AvatarFallback>ABC</AvatarFallback>
              </Avatar>
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">XY</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </section>

        {/* 드롭다운 메뉴 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">드롭다운 메뉴</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  메뉴 열기
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>프로필</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>채팅</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>게시글</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* 입력 필드 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">입력 필드</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-4">
            <input
              type="text"
              placeholder="기본 입력 필드"
              className="w-full rounded-xl border border-[#dfe1e6] bg-white px-4 py-3 text-[#050505] shadow-sm placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
            <input
              type="email"
              placeholder="이메일 입력"
              className="w-full rounded-xl border border-[#dfe1e6] bg-white px-4 py-3 text-[#050505] shadow-sm placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
            <textarea
              placeholder="텍스트 영역"
              rows={4}
              className="w-full resize-none rounded-2xl border border-[#dfe1e6] bg-white px-4 py-3 text-[#050505] shadow-sm placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>
        </section>

        {/* 타이포그래피 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">타이포그래피</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Heading 1 (4xl)</h1>
            <h2 className="text-3xl font-bold text-foreground">Heading 2 (3xl)</h2>
            <h3 className="text-2xl font-semibold text-foreground">Heading 3 (2xl)</h3>
            <h4 className="text-xl font-semibold text-foreground">Heading 4 (xl)</h4>
            <h5 className="text-lg font-semibold text-foreground">Heading 5 (lg)</h5>
            <p className="text-base text-foreground">Body text (base)</p>
            <p className="text-sm text-muted-foreground">Small text (sm)</p>
            <p className="text-xs text-muted-foreground">Extra small text (xs)</p>
            <code className="rounded bg-[#f0f2f5] px-2 py-1 text-xs font-mono text-[#050505] shadow-inner">
              코드 텍스트
            </code>
          </div>
        </section>

        {/* 아이콘 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">아이콘 (Lucide React)</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col items-center gap-2">
                <Home className="h-6 w-6" />
                <span className="text-xs text-muted-foreground">Home</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <User className="h-6 w-6" />
                <span className="text-xs text-muted-foreground">User</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                <span className="text-xs text-muted-foreground">Message</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-xs text-muted-foreground">File</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Settings className="h-6 w-6" />
                <span className="text-xs text-muted-foreground">Settings</span>
              </div>
            </div>
          </div>
        </section>

        {/* 배지/태그 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">배지 & 태그</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                💬 소스 코딩 금지
              </span>
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                🤝 실전 협업
              </span>
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                🎯 실용적 기능
              </span>
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                📚 함께 성장
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
