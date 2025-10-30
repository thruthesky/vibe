// 1:1 채팅방 페이지
// 두 사용자 간의 실시간 채팅을 제공합니다.
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getUserDisplayName } from "@/lib/user";
import {
  generateRoomId,
  createChatRoom,
  sendMessage,
  getMessages,
  subscribeToMessages,
  ChatMessage,
} from "@/lib/chat";

// useSearchParams()를 사용하는 실제 채팅 컴포넌트
function ChatRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null); // 메시지 입력 필드 ref

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [otherId, setOtherId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>("로딩 중...");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  // 현재 사용자 정보 확인 및 초기화
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUserId(user.uid);

        // 현재 사용자 이름 조회
        const displayName = await getUserDisplayName(user.uid);
        if (displayName) {
          setCurrentUserName(displayName);
        } else if (user.displayName) {
          setCurrentUserName(user.displayName);
        } else {
          setCurrentUserName(user.email?.split("@")[0] || "사용자");
        }
      } else {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 채팅 대상 사용자 정보 로드
  useEffect(() => {
    const otherUserIdParam = searchParams.get("otherId");

    if (!otherUserIdParam) {
      setError("채팅 대상을 지정해주세요.");
      setLoading(false);
      return;
    }

    if (currentUserId === otherUserIdParam) {
      setError("자신과 채팅할 수 없습니다.");
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
          setOtherUserName("사용자");
        }
      } catch (err) {
        console.error("사용자 정보 조회 실패:", err);
        setOtherUserName("사용자");
      }
    }

    fetchOtherUserName();
  }, [otherId]);

  // 채팅방 생성 및 메시지 로드
  useEffect(() => {
    if (!currentUserId || !otherId) return;

    async function initializeChat() {
      try {
        setError("");

        // 채팅방 생성 (이미 위에서 null 체크를 했으므로 타입 단언 사용)
        const createResult = await createChatRoom(currentUserId!, otherId!);
        if (!createResult.success || !createResult.roomId) {
          throw new Error("채팅방 생성에 실패했습니다.");
        }

        const newRoomId = createResult.roomId;
        setRoomId(newRoomId);

        // 기존 메시지 로드
        const existingMessages = await getMessages(newRoomId);
        setMessages(existingMessages);

        // 메시지 실시간 구독
        const unsubscribe = subscribeToMessages(newRoomId, (updatedMessages) => {
          setMessages(updatedMessages);
        });

        setLoading(false);

        // 정리 함수
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      } catch (err: any) {
        console.error("채팅방 초기화 실패:", err);
        setError(err.message || "채팅방을 불러올 수 없습니다.");
        setLoading(false);
      }
    }

    initializeChat();
  }, [currentUserId, otherId]);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메시지 전송 핸들러
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!messageText.trim() || !roomId || !currentUserId) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendMessage(
        roomId,
        currentUserId,
        currentUserName || "사용자",
        messageText
      );

      if (result.success) {
        setMessageText("");
        // 메시지 전송 후 입력 필드에 포커스 유지
        messageInputRef.current?.focus();
      } else {
        setError(result.error || "메시지 전송에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("메시지 전송 실패:", err);
      setError(err.message || "메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">채팅방을 불러오는 중...</p>
      </div>
    );
  }

  // 오류 상태
  if (error && !roomId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-6">
        <div className="space-y-4 max-w-sm">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            오류: {error}
          </div>
          <button
            onClick={() => router.back()}
            className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 채팅방 헤더 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{otherUserName}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {otherId?.substring(0, 8)}...
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-foreground rounded-lg transition-colors"
        >
          ← 돌아가기
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 text-yellow-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="font-medium">아직 메시지가 없습니다.</p>
            <p className="text-sm mt-1">
              {otherUserName}님과의 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.messageId}
              className={`flex ${message.sender === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 break-words ${
                  message.sender === currentUserId
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-foreground"
                }`}
              >
                {message.sender !== currentUserId && (
                  <div
                    className={`text-xs font-semibold mb-1 ${
                      message.sender === currentUserId
                        ? "text-white"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.senderName}
                  </div>
                )}
                <p className="text-sm">{message.text}</p>
                <div
                  className={`text-xs mt-1 ${
                    message.sender === currentUserId
                      ? "text-white opacity-75"
                      : "text-muted-foreground"
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
      <div className="bg-white border-t border-slate-200 p-6">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={messageInputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={isSending}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-foreground placeholder-muted-foreground disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
          >
            {isSending ? "전송 중..." : "전송"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Suspense 경계로 감싼 메인 페이지 컴포넌트
export default function ChatRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-background">
          <p className="text-muted-foreground">채팅방을 불러오는 중...</p>
        </div>
      }
    >
      <ChatRoomContent />
    </Suspense>
  );
}
