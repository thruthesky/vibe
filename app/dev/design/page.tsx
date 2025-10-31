// 디자인 컴포넌트 미리보기 페이지
// 개발 모드에서 프로젝트에 사용된 디자인 컴포넌트들을 확인할 수 있습니다.

"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();

  return (
    <div className="relative min-h-screen bg-[#f0f2f5]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
      <div className="relative max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* 페이지 제목 */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">{t("dev.design.title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("dev.design.subtitle")}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-[#1877f2] shadow-sm shadow-[#cfdbf4]/50 backdrop-blur">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#44c46f] shadow-[0_0_6px_rgba(68,196,111,0.45)]" />
            {t("dev.design.updateIndicator")}
          </div>
        </div>

        {/* 색상 팔레트 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.colorPalette")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Slate 색상 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("dev.design.colorSlate")}</p>
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
              <p className="text-sm font-medium">{t("dev.design.colorBackground")}</p>
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
              <p className="text-sm font-medium">{t("dev.design.colorText")}</p>
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
              <p className="text-sm font-medium">{t("dev.design.colorState")}</p>
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
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.buttons")}</h2>
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
                  {t("navigation.home")}
                </Button>
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  {t("navigation.profile")}
                </Button>
                <Button variant="ghost">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("navigation.chat")}
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
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.cards")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slate-50 카드 */}
            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{t("dev.design.card1.title")}</h3>
              <p className="text-muted-foreground">
                {t("dev.design.card1.description")}
              </p>
            </div>

            {/* Slate-100 카드 */}
            <div className="rounded-2xl border border-[#dfe1e6] bg-[#f5f6f7] p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{t("dev.design.card2.title")}</h3>
              <p className="text-muted-foreground">
                {t("dev.design.card2.description")}
              </p>
            </div>

            {/* White 카드 */}
            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{t("dev.design.card3.title")}</h3>
              <p className="text-muted-foreground">
                {t("dev.design.card3.description")}
              </p>
            </div>

            {/* Accent 카드 */}
            <div className="rounded-2xl border border-[#d8e8ff] bg-[#e7f3ff] p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{t("dev.design.card4.title")}</h3>
              <p className="text-muted-foreground">
                {t("dev.design.card4.description")}
              </p>
            </div>
          </div>
        </section>

        {/* 아바타 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.avatars")}</h2>
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
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.dropdown")}</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("dev.design.dropdownOpen")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{t("menu.currentUser")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("navigation.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>{t("navigation.chat")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{t("forum.posts")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* 입력 필드 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.input")}</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-4">
            <input
              type="text"
              placeholder={t("dev.design.inputPlaceholder1")}
              className="w-full rounded-xl border border-[#dfe1e6] bg-white px-4 py-3 text-[#050505] shadow-sm placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
            <input
              type="email"
              placeholder={t("dev.design.inputPlaceholder2")}
              className="w-full rounded-xl border border-[#dfe1e6] bg-white px-4 py-3 text-[#050505] shadow-sm placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
            <textarea
              placeholder={t("dev.design.inputPlaceholder3")}
              rows={4}
              className="w-full resize-none rounded-2xl border border-[#dfe1e6] bg-white px-4 py-3 text-[#050505] shadow-sm placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff]"
            />
          </div>
        </section>

        {/* 타이포그래피 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.typography")}</h2>
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
              {t("dev.design.codeText")}
            </code>
          </div>
        </section>

        {/* 아이콘 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.icons")}</h2>
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
          <h2 className="text-2xl font-semibold text-foreground">{t("dev.design.badges")}</h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                {t("home.overview.tag1")}
              </span>
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                {t("home.overview.tag2")}
              </span>
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                {t("home.overview.tag3")}
              </span>
              <span className="inline-block rounded-full border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#65676b]">
                {t("home.overview.tag4")}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
