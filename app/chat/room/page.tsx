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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>채팅방을 불러오는 중...</p>
      </div>
    );
  }

  // 오류 상태
  if (error && !roomId) {
    return (
      <div style={{ padding: "2rem" }}>
        <div
          style={{
            color: "white",
            backgroundColor: "#dc3545",
            padding: "1rem",
            borderRadius: "4px",
          }}
        >
          오류: {error}
        </div>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* 채팅방 헤더 */}
      <div
        style={{
          backgroundColor: "#007bff",
          color: "white",
          padding: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{otherUserName}</h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
            {otherId}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          ← 돌아가기
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fff3cd",
            color: "#856404",
            borderBottom: "1px solid #ffc107",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* 메시지 영역 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#999",
              marginTop: "2rem",
            }}
          >
            <p>아직 메시지가 없습니다.</p>
            <p style={{ fontSize: "0.9rem" }}>
              {otherUserName}님과의 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.messageId}
              style={{
                display: "flex",
                justifyContent:
                  message.sender === currentUserId ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  backgroundColor:
                    message.sender === currentUserId ? "#007bff" : "#e9ecef",
                  color:
                    message.sender === currentUserId ? "white" : "#000",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  wordWrap: "break-word",
                }}
              >
                {message.sender !== currentUserId && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      marginBottom: "0.25rem",
                      opacity: 0.8,
                    }}
                  >
                    {message.senderName}
                  </div>
                )}
                <p style={{ margin: 0 }}>{message.text}</p>
                <div
                  style={{
                    fontSize: "0.75rem",
                    marginTop: "0.25rem",
                    opacity: 0.7,
                  }}
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
      <div
        style={{
          backgroundColor: "white",
          borderTop: "1px solid #ddd",
          padding: "1rem",
          boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={isSending}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: isSending ? "#f5f5f5" : "white",
            }}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: !messageText.trim() || isSending ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: !messageText.trim() || isSending ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
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
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>채팅방을 불러오는 중...</p>
        </div>
      }
    >
      <ChatRoomContent />
    </Suspense>
  );
}
