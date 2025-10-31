// 1:1 채팅방 페이지
// 두 사용자 간의 실시간 채팅을 제공합니다.
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import { getUserDisplayName } from "@/lib/user";
import {
  joinChatRoom,
  sendMessage,
  getMessages,
  subscribeToMessages,
  ChatMessage,
} from "@/lib/chat";

// useSearchParams()를 사용하는 실제 채팅 컴포넌트
function ChatRoomContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null); // 메시지 입력 필드 ref

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>(t("common.loading"));
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [authLoading, setAuthLoading] = useState(true); // Firebase 인증 상태 확인 중
  const [loading, setLoading] = useState(false); // 채팅방 데이터 로딩 상태
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ⚠️ 1단계: Firebase 인증 상태 확인 (이것이 완료될 때까지 기다립니다)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // 로그인한 사용자
        setCurrentUserId(user.uid);
      } else {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        router.push("/auth/login");
      }
      // ⚠️ 가장 중요: 인증 상태 확인 완료
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 채팅 대상 사용자 정보 로드
  useEffect(() => {
    const otherUserIdParam = searchParams.get("otherId");

    if (!otherUserIdParam) {
      setError(t("chat.room.error.noOtherId"));
      setLoading(false);
      return;
    }

    if (currentUserId === otherUserIdParam) {
      setError(t("chat.room.error.selfChat"));
      setLoading(false);
      return;
    }

    setOtherId(otherUserIdParam);
  }, [searchParams, currentUserId]);

  // 채팅 대상 사용자 이름 조회
  useEffect(() => {
    if (!otherId) return;

    async function fetchOtherUserName() {
      try {
        // otherId는 이미 위에서 null 체크를 했으므로 타입 단언 사용
        const displayName = await getUserDisplayName(otherId!);
        if (displayName) {
          setOtherUserName(displayName);
        } else {
          setOtherUserName(t("chat.room.defaultUser"));
        }
      } catch (err) {
        console.error("사용자 정보 조회 실패:", err);
        setOtherUserName(t("chat.room.defaultUser"));
      }
    }

    fetchOtherUserName();
  }, [otherId]);

  // 채팅방 입장 및 메시지 로드
  useEffect(() => {
    if (!currentUserId || !otherId || !otherUserName) return;

    async function initializeChat() {
      try {
        setError("");
        setLoading(true); // 채팅방 데이터 로딩 시작

        // 채팅방 입장 (본인의 chat/joins에만 저장)
        const joinResult = await joinChatRoom(currentUserId!, otherId!, otherUserName);
        if (!joinResult.success || !joinResult.roomId) {
          throw new Error(t("chat.room.error.join"));
        }

        const newRoomId = joinResult.roomId;
        setRoomId(newRoomId);

        // 기존 메시지 로드
        const existingMessages = await getMessages(newRoomId);
        setMessages(existingMessages);

        // 메시지 실시간 구독
        const unsubscribe = subscribeToMessages(newRoomId, (updatedMessages) => {
          setMessages(updatedMessages);
        });

        setLoading(false); // 채팅방 데이터 로딩 완료

        // 정리 함수
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      } catch (err: any) {
        console.error("채팅방 초기화 실패:", err);
        setError(err.message || t("chat.room.error.load"));
        setLoading(false);
      }
    }

    initializeChat();
  }, [currentUserId, otherId, otherUserName, t]);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메시지 전송 후 입력 필드에 포커스 유지
  // isSending이 false로 변경되고 messageText가 비어있으면 포커스 설정
  useEffect(() => {
    if (!isSending && messageText === "" && messageInputRef.current) {
      // 마이크로태스크 큐를 사용하여 포커스 설정
      // 이렇게 하면 DOM 렌더링 직후 즉시 포커스 설정됨
      Promise.resolve().then(() => {
        messageInputRef.current?.focus();
      });
    }
  }, [isSending, messageText]);

  // 메시지 전송 핸들러
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!messageText.trim() || !roomId || !currentUserId) {
      return;
    }

    setIsSending(true);

    try {
      // text와 senderUid 전송, sentAt은 Firebase Cloud Functions가 자동 추가
      const result = await sendMessage(roomId, currentUserId, messageText);

      if (result.success) {
        setMessageText("");
        // 마이크로태스크 큐에서 포커스를 즉시 설정하여 사용자가 계속 입력할 수 있도록 함
        Promise.resolve().then(() => {
          messageInputRef.current?.focus();
        });
      } else {
        setError(result.error || t("chat.room.error.send"));
      }
    } catch (err: any) {
      console.error("메시지 전송 실패:", err);
      setError(err.message || t("chat.room.error.send"));
    } finally {
      setIsSending(false);
    }
  }

  // ⚠️ 2단계: Firebase 인증 상태 확인 중일 때는 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f2f5]">
        <p className="text-sm text-[#65676b]">{t("chat.room.loading.auth")}</p>
      </div>
    );
  }

  // 채팅방 데이터 로딩 중
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f2f5]">
        <p className="text-sm text-[#65676b]">{t("chat.room.loading.room")}</p>
      </div>
    );
  }

  // 오류 상태
  if (error && !roomId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f2f5] p-6">
        <div className="max-w-sm space-y-4">
          <div className="rounded-2xl border border-[#f28b82] bg-[#fdecea] px-4 py-3 text-sm text-[#b3261e] shadow-sm">
            오류: {error}
          </div>
          <button
            onClick={() => router.back()}
            className="w-full rounded-xl border border-[#dfe1e6] bg-white py-3 text-sm font-semibold text-[#1877f2] shadow-sm transition-colors hover:bg-[#e7f3ff]"
          >
            {t("chat.room.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-[#f0f2f5]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.3),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.25),transparent_60%)]" />
      <div className="relative flex h-full flex-col">
        {/* 채팅방 헤더 */}
        <div className="flex items-center justify-between border-b border-[#dfe1e6] bg-white/90 px-6 py-4 shadow-lg shadow-[#d8e4f8]/50 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold text-[#050505]">{otherUserName}</h2>
            <p className="mt-1 text-xs text-[#8d949e]">
              {otherId?.substring(0, 8)}...
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#6f7682]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#4cc46b] shadow-[0_0_6px_rgba(76,196,107,0.45)]" />
              <span>{t("chat.room.realtime")}</span>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-[#dfe1e6] bg-white px-4 py-2 text-sm font-semibold text-[#1877f2] shadow-sm transition-colors hover:bg-[#e7f3ff]"
          >
            ← {t("common.back")}
          </button>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="border-b border-[#f7b928]/40 bg-[#fff8e6]/90 px-6 py-3 text-sm text-[#a15c00]">
            ⚠️ {error}
          </div>
        )}

        {/* 메시지 영역 */}
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 lg:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#dfe1e6] bg-white/70 p-6 text-center text-sm text-[#5d6472] shadow-inner">
              <p className="font-semibold text-[#050505]">{t("chat.room.empty")}</p>
              <p className="mt-1 text-sm">
                {t("chat.room.emptyInvite", { name: otherUserName })}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.messageId}
                className={`flex ${message.sender === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] break-words rounded-3xl px-5 py-3 shadow-md ${
                    message.sender === currentUserId
                      ? "bg-gradient-to-r from-[#1877f2] to-[#1660d8] text-white shadow-[#99b5f7]/50"
                      : "bg-white/95 text-[#050505] shadow-[#ccd9f0]/40 ring-1 ring-inset ring-white/40 backdrop-blur"
                  }`}
                >
                  {message.sender !== currentUserId && (
                    <div className="mb-1 text-xs font-semibold text-[#5d6472]">
                      {message.senderName}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <div
                    className={`mt-1 text-[11px] ${
                      message.sender === currentUserId ? "text-white/80" : "text-[#8d949e]"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 영역 */}
        <div className="border-t border-[#dfe1e6] bg-white/90 px-4 py-4 shadow-[0_-8px_24px_rgba(205,215,240,0.35)] backdrop-blur lg:px-6">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={messageInputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t("chat.room.inputPlaceholder")}
              disabled={isSending}
              className="flex-1 rounded-full border border-[#dfe1e6] bg-white/90 px-5 py-3 text-sm text-[#050505] shadow-inner shadow-white/70 placeholder:text-[#8d949e] focus:border-[#1877f2] focus:outline-none focus:ring-2 focus:ring-[#99c2ff] disabled:cursor-not-allowed disabled:text-[#8d949e]"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="rounded-full bg-[#1877f2] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#99b5f7]/60 transition-colors hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#c3dafb]"
            >
              {isSending ? t("chat.room.sending") : t("chat.room.send")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Suspense 경계로 감싼 메인 페이지 컴포넌트
export default function ChatRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f0f2f5]">
          <p className="text-sm text-[#5d6472]">로딩 중...</p>
        </div>
      }
    >
      <ChatRoomContent />
    </Suspense>
  );
}
