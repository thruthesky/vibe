"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 채팅방 정보 인터페이스
interface ChatRoom {
  id: string;
  roomId: string;
  text?: string;
  sentAt?: number;
  senderUid?: string;
  otherName?: string;
  otherNameLowerCase?: string;
  unread?: number;
}

export default function ChatListPage() {
  const t = useTranslations();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 사용자 인증 확인
    const user = getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const myUid = user.uid;

    // chat/joins/{myUid} 경로에서 채팅방 목록 구독
    const chatJoinsRef = ref(rtdb, `vibe/chat/joins/${myUid}`);

    try {
      const unsubscribe = onValue(
        chatJoinsRef,
        (snapshot) => {
          const rooms: ChatRoom[] = [];

          if (snapshot.exists()) {
            snapshot.forEach((child) => {
              rooms.push({
                id: child.key!,
                ...child.val(),
              });
            });

            // sentAt 기준으로 내림차순 정렬 (최신 메시지가 위)
            rooms.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
          }

          setChatRooms(rooms);
          setIsLoading(false);
        },
        (error) => {
          console.error("[ChatListPage] 채팅방 목록 조회 오류:", error);
          setError(t("chat.list.error.load"));
          setIsLoading(false);
        }
      );

      // cleanup: 언마운트 시 구독 해제
      return () => unsubscribe();
    } catch (err) {
      console.error("[ChatListPage] 채팅 리스너 설정 오류:", err);
      setError(t("chat.list.error.fetch"));
      setIsLoading(false);
    }
  }, [router, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("chat.list.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 상단 헤더 */}
      <div className="border-b border-slate-200 p-4 sticky top-0 bg-white">
        <h1 className="text-xl font-semibold text-foreground">{t("chat.list.title")}</h1>
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            <p>{t("chat.list.empty")}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {chatRooms.map((room) => (
              <Link
                key={room.id}
                href={`/chat/room?otherId=${room.id.split("---").find((uid) => {
                  const currentUser = getCurrentUser();
                  return uid !== currentUser?.uid;
                })}`}
              >
                <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    {/* 상대방 이름 및 메시지 내용 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {room.otherName || t("chat.list.unknownUser")}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {room.text || t("chat.list.noMessage")}
                      </p>
                    </div>

                    {/* 읽지 않은 메시지 수 및 시간 */}
                    <div className="flex flex-col items-end gap-1">
                      {room.unread && room.unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-6 h-6 bg-red-500 text-white text-xs font-semibold rounded-full">
                          {room.unread > 99 ? "99+" : room.unread}
                        </span>
                      )}
                      {room.sentAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatTime(room.sentAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 타임스탬프를 사람이 읽을 수 있는 형식으로 변환합니다 (숫자만 반환)
 * @param timestamp Unix timestamp (밀리초)
 * @returns 분/시간/일 숫자
 */
function formatTimeValue(timestamp: number): { value: number; type: 'minutes' | 'hours' | 'days' } {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // 1시간 이내
  if (diffMins < 60) {
    return { value: diffMins, type: 'minutes' };
  }

  // 1일 이내
  if (diffHours < 24) {
    return { value: diffHours, type: 'hours' };
  }

  // 7일 이내
  if (diffDays < 7) {
    return { value: diffDays, type: 'days' };
  }

  // 그 외: -1 반환 (날짜 표시 필요)
  return { value: -1, type: 'days' };
}

function formatTime(timestamp: number): string {
  const { value, type } = formatTimeValue(timestamp);

  if (value === -1) {
    return new Date(timestamp).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  }

  // 클라이언트에서는 하드코딩된 텍스트 사용 (t() 사용 불가)
  // 서버에서 i18n을 통해 번역되지만, 이 부분은 접근성을 위해 기본값 유지
  const typeMap = {
    minutes: '분 전',
    hours: '시간 전',
    days: '일 전'
  };
  return `${value}${typeMap[type]}`;
}
