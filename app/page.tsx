// 홈페이지 컴포넌트
// shadcn/ui Accordion 컴포넌트 임포트
"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function Home() {
  const t = useTranslations();
  return (
    <div className="relative min-h-screen bg-[#f0f2f5]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[-10%] h-64 w-64 rounded-full bg-[#d9e7ff] opacity-70 blur-3xl" />
        <div className="absolute top-1/2 right-[-15%] h-72 w-72 rounded-full bg-[#e6f4ea] opacity-60 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[25%] h-80 w-80 rounded-full bg-[#efe6ff] opacity-60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-12 space-y-12">
        {/* 바이브 코딩 배너 */}
        <div className="rounded-3xl border border-white/40 bg-white/95 px-6 py-5 text-center shadow-lg shadow-[#d2dbe6]/50 backdrop-blur">
          <p className="text-sm font-semibold text-[#1877f2]">
            🤖 {t("home.vibeBanner")}
          </p>
        </div>

        {/* AI 시대의 진실 - 아코디언 형식 */}
        <div className="rounded-3xl border border-white/60 bg-white/95 p-8 shadow-xl shadow-[#cfdaf2]/45 backdrop-blur space-y-5">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#050505]">
            💡 {t("home.aiTruth.title")}
          </h2>

          {/* 아코디언 컴포넌트 */}
          <Accordion type="single" collapsible className="space-y-3">
            {/* 아코디언 항목 1 - AI 시대에 변하지 않는 것은 당신 */}
            <AccordionItem
              value="item-1"
              className="overflow-hidden rounded-2xl border border-transparent bg-[#f5f6f7] shadow-inner transition-transform duration-200 data-[state=open]:scale-[1.01]"
            >
              <AccordionTrigger className="px-4 py-3 text-left transition-colors hover:bg-[#ebedf0] data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:shadow-[#dce3f3]/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ff] text-sm font-bold text-[#1877f2] shadow-inner shadow-[#bdd4fd]/70">
                    1
                  </div>
                  <span className="text-sm font-semibold text-[#050505] sm:text-base">
                    {t("home.aiTruth.item1.title")}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white/95 px-4 pb-4 text-sm leading-relaxed text-[#5d6472]">
                {t("home.aiTruth.item1.content")}
              </AccordionContent>
            </AccordionItem>

            {/* 아코디언 항목 2 - AI 만으로 할 수 있는 것은 없다 */}
            <AccordionItem
              value="item-2"
              className="overflow-hidden rounded-2xl border border-transparent bg-[#f5f6f7] shadow-inner transition-transform duration-200 data-[state=open]:scale-[1.01]"
            >
              <AccordionTrigger className="px-4 py-3 text-left transition-colors hover:bg-[#ebedf0] data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:shadow-[#dce3f3]/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f4ea] text-sm font-bold text-[#1b5e20] shadow-inner shadow-[#b2deb9]/70">
                    2
                  </div>
                  <span className="text-sm font-semibold text-[#050505] sm:text-base">
                    {t("home.aiTruth.item2.title")}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 bg-white/95 px-4 pb-4 text-sm leading-relaxed text-[#5d6472]">
                <p>
                  {t("home.aiTruth.item2.content")}
                </p>
                <p className="text-xs text-[#8d949e]">
                  {t("home.aiTruth.item2.hint")}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 아코디언 항목 3 - 저작권 문제 */}
            <AccordionItem
              value="item-3"
              className="overflow-hidden rounded-2xl border border-transparent bg-[#f5f6f7] shadow-inner transition-transform duration-200 data-[state=open]:scale-[1.01]"
            >
              <AccordionTrigger className="px-4 py-3 text-left transition-colors hover:bg-[#ebedf0] data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:shadow-[#e3d5fb]/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4e8ff] text-sm font-bold text-[#7f35c9] shadow-inner shadow-[#d3b6ff]/70">
                    3
                  </div>
                  <span className="text-sm font-semibold text-[#050505] sm:text-base">
                    {t("home.aiTruth.item3.title")}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 bg-white/95 px-4 pb-4 text-sm leading-relaxed text-[#5d6472]">
                <p>
                  {t("home.aiTruth.item3.content")}
                </p>
                <p className="font-medium text-[#b43a3a]">
                  {t("home.aiTruth.item3.gpl")}
                </p>
                <p className="italic">
                  {t("home.aiTruth.item3.hint")}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* 페이지 제목 및 소개 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-[#050505] sm:text-[2.75rem]">
            {t("home.title")}
          </h1>
          <p className="text-lg leading-relaxed text-[#5d6472]">
            {t("home.description.part1")}{" "}
            <a
              href="https://open.kakao.com/o/gn2qMetf "
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1877f2] hover:underline"
            >
              {t("home.description.linkText")}
            </a>{" "}
            {t("home.description.part2")}
          </p>
        </div>

        {/* TODO 목록 */}
        <div className="rounded-3xl border border-white/55 bg-white/95 p-8 shadow-lg shadow-[#c9d7f0]/45 backdrop-blur space-y-5">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#050505]">
            📋 {t("home.todo.title")}
          </h2>
          <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed text-[#505766] marker:text-[#1877f2]">
            <li className="rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3 shadow-sm shadow-[#dbe3f3]/40">
              <strong className="text-[#050505]">{t("home.todo.item1.label")}:</strong> {t("home.todo.item1.description")}
            </li>
            <li className="rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3 shadow-sm shadow-[#dbe3f3]/40">
              <strong className="text-[#050505]">{t("home.todo.item2.label")}:</strong> {t("home.todo.item2.description")}
            </li>
            <li className="rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3 shadow-sm shadow-[#dbe3f3]/40">
              <strong className="text-[#050505]">{t("home.todo.item3.label")}:</strong> {t("home.todo.item3.description")}
              <ol className="ml-8 mt-3 list-decimal space-y-2 text-[#505766] marker:text-[#8da2ff]">
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item3.subitem1")}
                </li>
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item3.subitem2")}
                </li>
              </ol>
            </li>
            <li className="rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3 shadow-sm shadow-[#dbe3f3]/40">
              <strong className="text-[#050505]">{t("home.todo.item4.label")}</strong>
            </li>
            <li className="rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3 shadow-sm shadow-[#dbe3f3]/40">
              <strong className="text-[#050505]">{t("home.todo.item5.label")}</strong>
              <ol className="ml-8 mt-3 list-decimal space-y-2 text-[#505766] marker:text-[#8da2ff]">
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item5.subitem1")}
                </li>
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item5.subitem2")}
                </li>
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item5.subitem3")}
                </li>
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item5.subitem4")}
                </li>
              </ol>
            </li>
            <li className="rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3 shadow-sm shadow-[#dbe3f3]/40">
              <strong className="text-[#050505]">{t("home.todo.item6.label")}</strong>
              <ol className="ml-8 mt-3 list-decimal space-y-2 text-[#505766] marker:text-[#8da2ff]">
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item6.subitem1")}
                </li>
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item6.subitem2")}
                </li>
              </ol>
            </li>
            <li className="rounded-2xl border border-[#dfe3ec] bg-white/85 px-4 py-3 shadow-sm shadow-[#dbe3f3]/40">
              <strong className="text-[#050505]">{t("home.todo.item7.label")}</strong>
              <ol className="ml-8 mt-3 list-decimal space-y-2 text-[#505766] marker:text-[#8da2ff]">
                <li className="rounded-xl border border-[#e6eaf5] bg-white/90 px-3 py-2 shadow-inner shadow-white/70">
                  {t("home.todo.item7.subitem1")}
                </li>
              </ol>
            </li>
          </ol>
        </div>

        {/* 프로젝트 개요 */}
        <div className="rounded-3xl border border-white/65 bg-white/90 p-6 shadow-xl shadow-[#cad6ea]/45 backdrop-blur space-y-4">
          <h2 className="text-2xl font-semibold text-[#050505]">
            {t("home.overview.title")}
          </h2>
          <p className="leading-relaxed text-[#5d6472]">
            <strong className="text-[#050505]">{t("home.overview.brand")}</strong>{t("home.overview.description")}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              💬 {t("home.overview.badge1")}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              🤝 {t("home.overview.badge2")}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              🎯 {t("home.overview.badge3")}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              📚 {t("home.overview.badge4")}
            </span>
          </div>
        </div>

        {/* AI 시대의 변화와 성장 */}
        <div className="rounded-3xl border border-[#ccd9f6]/80 bg-gradient-to-r from-[#e6f0ff] via-[#f3f4ff] to-[#f6f7fb] p-8 shadow-xl shadow-[#c3d2f1]/40 space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#050505]">
            🚀 {t("home.aiChange.title")}
          </h2>
          <p className="leading-relaxed text-[#5d6472]">
            {t("home.aiChange.description")}
          </p>
          <p className="font-medium leading-relaxed text-[#050505]">
            {t("home.aiChange.emphasis")}{" "}
            <strong className="text-[#1877f2]">{t("home.aiChange.highlight")}</strong>
            {t("home.aiChange.conclusio")}
          </p>
          <div className="rounded-2xl border border-[#d8e8ff] bg-white/80 p-5 shadow-inner shadow-white/70">
            <p className="text-sm italic text-[#5d6472]">
              💡 {t("home.aiChange.hint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
