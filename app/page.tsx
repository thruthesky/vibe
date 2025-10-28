// 홈페이지 컴포넌트
"use client";

import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase 인증 상태 확인
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>헬로 바이브 🚀</h1>
      <p>바이브 웹/앱 개발 스터디 프로젝트에 오신 것을 환영합니다!</p>

      {/* TODO 목록 */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.3rem", marginBottom: "1rem", color: "#856404" }}>
          📋 해야할 일 (TODO)
        </h2>
        <ol style={{ margin: 0, paddingLeft: "1.5rem", lineHeight: "2", color: "#856404" }}>
          <li>
            <strong>디자인:</strong> 탑바에 로그인 사용자 업로드.
          </li>
          <li>
            <strong>대화방 참여 목록:</strong> vibe/chat/joins 에 저장해서, 채팅방 목록을 표시하고, 클릭하여 입장.
          </li>
          <li>
            <strong>게시판</strong>
          </li>
        </ol>
      </div>

      {/* 프로젝트 개요 */}
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.5rem", marginBottom: "1rem" }}>
          💬 AI와 함께하는 협업 개발 경험
        </h2>
        <p style={{ lineHeight: "1.8", fontSize: "1rem", margin: 0 }}>
          <strong>한바보</strong>(한국 바이버 보스)는 AI 기반 바이브 코딩으로 실전 소셜 웹 애플리케이션을 만드는
          오픈소스 스터디 커뮤니티입니다. 코드는 AI에게 맡기고, 설계와 기획에 집중하며,
          Git을 통한 협업과 실제 배포까지 경험합니다. 인증, 게시판, 채팅, 알림 등 실용적인 기능을 구현하며,
          지속 가능한 개발 능력과 AI 컨트롤 역량을 기릅니다.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "20px",
            fontSize: "0.9rem"
          }}>
            💬 소스 코딩 금지
          </span>
          <span style={{
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "20px",
            fontSize: "0.9rem"
          }}>
            🤝 실전 협업
          </span>
          <span style={{
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "20px",
            fontSize: "0.9rem"
          }}>
            🎯 실용적 기능
          </span>
          <span style={{
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "20px",
            fontSize: "0.9rem"
          }}>
            📚 함께 성장
          </span>
        </div>
      </div>

      {!loading && (
        <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
          {userId ? (
            <div>
              <h2>로그인 성공!</h2>
              <p>
                <strong>사용자 ID:</strong> <code>{userId}</code>
              </p>
              {/* 로그인한 사용자를 위한 메뉴 */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                {/* 회원 정보 수정 링크 */}
                <a
                  href="/profile"
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    textDecoration: "none",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  회원 정보 수정
                </a>
                {/* 로그아웃 버튼 */}
                <button
                  onClick={async () => {
                    await auth.signOut();
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2>시작하기</h2>
              {/* 로그인 및 회원가입 링크 */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <a
                  href="/auth/login"
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#007bff",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    display: "inline-block",
                  }}
                >
                  로그인
                </a>
                {/* 회원가입 페이지로 이동하는 링크 */}
                <a
                  href="/auth/signup"
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#28a745",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    display: "inline-block",
                  }}
                >
                  회원가입
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 모든 사용자가 접근 가능한 메뉴 */}
      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
        <h2>메뉴</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {/* 회원 목록 페이지 링크 */}
          <a
            href="/users"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#6c757d",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              display: "inline-block",
            }}
          >
            회원 목록
          </a>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>프로젝트 목표</h2>
        <ul>
          <li>사용자 인증</li>
          <li>게시판 CRUD 기능</li>
          <li>채팅 기능</li>
          <li>알림 기능</li>
        </ul>
      </div>
    </div>
  );
}
