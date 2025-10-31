// 개발일지 페이지
// 프로젝트의 스터디 로그와 진행 상황을 기록합니다.

"use client";

import { useTranslations } from "next-intl";

export default function DevHistoryPage() {
  const t = useTranslations();

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl space-y-8">
        {/* 페이지 제목 */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#050505]">{t("dev.history.title")}</h1>
          <p className="text-sm text-[#5d6472]">
            {t("dev.history.subtitle")}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-[#1877f2] shadow-sm shadow-[#cfdbf4]/50 backdrop-blur">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#44c46f] shadow-[0_0_6px_rgba(68,196,111,0.45)]" />
            {t("dev.history.updateIndicator")}
          </div>
        </div>

        {/* 2025-10-27 세미나 */}
        <div className="space-y-4">
          {/* 날짜 및 제목 */}
          <div className="border-l-4 border-[#1877f2] bg-white/80 pl-4 shadow-sm shadow-[#bed4ff]/40">
            <h2 className="text-2xl font-semibold text-[#050505]">
              {t("dev.history.seminar1.date")}
            </h2>
          </div>

          {/* 구현 완료 섹션 */}
          <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#ccd9f0]/45 backdrop-blur space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#050505]">
              {t("dev.history.seminar1.completed")}
            </h3>
            <ul className="space-y-2 text-sm text-[#5d6472]">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.item1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.item2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.item3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.item4")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.item5")}</span>
              </li>
            </ul>
          </div>

          {/* 배운 것들 섹션 */}
          <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#ccd9f0]/45 backdrop-blur space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#050505]">
              {t("dev.history.seminar1.learned")}
            </h3>
            <ul className="space-y-2 text-sm text-[#5d6472]">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.learned1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.learned2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.learned3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>{t("dev.history.seminar1.learned4")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-[#dfe1e6]" />

        {/* 향후 추가될 로그를 위한 공간 */}
        <div className="rounded-3xl border border-white/60 bg-white/95 p-8 text-center text-sm text-[#5d6472] shadow-xl shadow-[#ccd9f0]/45 backdrop-blur">
          {t("dev.history.upcoming")}
        </div>
      </div>
    </div>
  );
}
