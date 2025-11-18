---
title: database.rules.json
type: config
path: firebase/database.rules.json
status: active
version: 2.0.0
last_updated: 2025-11-18
---

## 개요

이 파일은 Firebase Realtime Database Security Rules를 정의하는 설정 파일입니다.

## 🔥🔥🔥 중요 규칙 🔥🔥🔥

Firebase Database Rules는 **JSONC (JSON with Comments)** 형식을 사용하며, **여러 줄 문자열을 완전히 지원**합니다.

### 필수 작성 규칙

1. **여러 줄 문자열 사용 (필수)**
   - 모든 `.read`, `.write`, `.validate` 조건식은 반드시 여러 줄로 작성합니다
   - IDE의 JSON 린터가 에러를 표시해도 무시하세요 (Firebase는 정상 작동)
   - 단일 줄 논리식은 절대 허용되지 않습니다

2. **조건 분리 (필수)**
   - `&&` 또는 `||` 연산자가 등장하면 각 조건을 새 줄에 작성
   - 각 조건은 괄호 `()`로 묶어서 우선순위를 명확히 표현

3. **주석 작성 (필수)**
   - 각 조건 블록 앞에 세부 의도를 설명하는 주석 작성
   - 주석 없는 규칙은 허용되지 않습니다

### 올바른 예시

```json
".write": "
  (
    // 조건 1: 로그인한 사용자
    auth != null
  )
  &&
  (
    // 조건 2: 본인만 수정 가능
    auth.uid == $uid
  )
"
```

### 잘못된 예시 (절대 금지)

```json
// ❌ 단일 줄 (금지)
".write": "auth != null && auth.uid == $uid"

// ❌ 주석 없음 (금지)
".write": "
  auth != null
  &&
  auth.uid == $uid
"
```

## 소스 코드

```json
{
  "rules": {
    "users": {
      // 자신만 읽기 가능. 모든 사용자가 읽기 불가능
      ".read": true,
      // 하위 모든 경로 쓰기 삭제: 단, shallower 경로에서 개별 규칙 설정 가능
      ".write": false,
      "$uid": {
        // 2025-12-12 까지는 무조건 쓰기 통과 (테스트 데이터 생성용)
        // 그 이후는 본인만 쓰기 가능
        ".write": "now < 1765555200000 ||
          auth.uid == $uid"
      },
      ".indexOn": [
        "createdAt",
        "displayNameLowerCase",
        "sort_recentWithPhoto",
        "sort_recentFemaleWithPhoto",
        "sort_recentMaleWithPhoto"
      ]
    },
    "system": {
      "settings": {
        "admins": {
          // 로그인한 모든 사용자가 읽기 가능 (메뉴에서 사용)
          ".read": "auth != null",
          // 관리자만 쓰기 가능 (배열에 있는 사용자만)
          ".write": "root.child('system/settings/admins').val().contains(auth.uid)"
        }
      }
    },
    "stats": {
      ".read": true,
      ".write": false,
      "counters": {
        ".read": true,
        ".write": false
      }
    },
    "chat-rooms": {
      // 채팅방 메타데이터
      // createdAt과 owner 필드는 Cloud Functions에서만 설정됨
      ".read": true,
      "$roomId": {
        "owner": {
          // 채팅방이 존재하지 않으면 본인 UID로 설정 가능, 존재하면 수정 불가
          ".write": "!root.child('chat-rooms').child($roomId).exists() &&
            newData.val() === auth.uid",".validate": "newData.isString()"
        },
        "createdAt": {
          // Cloud Functions에서만 설정 가능 (클라이언트는 쓰기 불가)
          ".write": false,
          ".validate": "newData.isNumber()"
        },
        "name": {
          // 채팅방이 존재하지 않으면 누구나 쓰기 가능, 존재하면 owner만 수정 가능
          ".write": "!root.child('chat-rooms').child($roomId).exists() ||
            root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid",".validate": "newData.isString() &&
            newData.val().length > 0 &&
            newData.val().length <= 50"
        },
        "description": {
          // 채팅방이 존재하지 않으면 누구나 쓰기 가능, 존재하면 owner만 수정 가능
          ".write": "!root.child('chat-rooms').child($roomId).exists() ||
            root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid",".validate": "newData.isString() &&
            newData.val().length <= 200"
        },
        "type": {
          ".write": "!data.exists()",
          ".validate": "newData.val() === 'group' ||
            newData.val() === 'open' ||
            newData.val() === 'single'"
        },
        "open": {
          ".write": "!data.exists()",
          ".validate": "newData.isBoolean()"
        },
        "password": {
          ".write": "root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid",
          ".validate": "newData.isBoolean()"
        },
        "groupListOrder": {
          ".write": "!data.exists()",
          ".validate": "newData.isNumber()"
        },
        "openListOrder": {
          ".write": "!data.exists()",
          ".validate": "newData.isNumber()"
        },
        "memberCount": {
          // Cloud Functions에서만 설정 가능 (자동 생성/증감)
          ".write": false,
          ".validate": "newData.isNumber() &&
            newData.val() >= 0"
        },
        "members": {
          "$uid": {
            // 쓰기 권한: 본인만 ($uid === auth.uid)
            // 허용 조건 (OR):
            //   1. data.exists(): 이미 멤버 → 퇴장/알림 설정 변경 가능
            //   2. !password.exists(): 비밀번호 미설정 → 자유롭게 가입 가능
            //   3. owner === auth.uid: Owner → 비밀번호 설정 시에도 가입 가능
            // 비밀번호 설정 시: 일반 사용자는 Cloud Functions를 통해서만 가입 가능
            ".write": "auth != null &&
              $uid === auth.uid &&
              (
                data.exists() ||
                !root.child('chat-rooms').child($roomId).child('password').exists() ||
                root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid
              )",".validate": "newData.isBoolean() ||
              newData.val() === null"
          }
        },
        "$other": {
          ".validate": false
        }
      },
      ".indexOn": [
        "openListOrder"
      ]
    },
    "chat-joins": {
      "$uid": {
        ".indexOn": [
          "allChatListOrder",
          "singleChatListOrder",
          "groupChatListOrder",
          "openChatListOrder",
          "openAndGroupChatListOrder"
        ],
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "chat-messages": {
      ".read": "auth != null",
      "$messageId": {
        ".read": "auth != null &&
          (
            data.child('roomId').val().contains(auth.uid) ||
            root.child('chat-rooms').child(data.child('roomId').val()).child('type').val() == 'open' ||
            root.child('chat-rooms').child(data.child('roomId').val()).child('members').child(auth.uid).exists()
          )",".write": "auth != null &&
          (
            newData.child('roomId').val().contains(auth.uid) ||
            root.child('chat-rooms').child(newData.child('roomId').val()).child('members').child(auth.uid).exists()
          )"
      },
      ".indexOn": [
        "roomOrder"
      ]
    },
    "chat-invitations": {
      // 채팅 초대 관리
      // 구조: /chat-invitations/{inviteeUid}/{roomId}
      "$uid": {
        // 본인만 자신의 초대 목록을 읽을 수 있음
        ".read": "$uid === auth.uid",
        "$roomId": {
          // 쓰기 규칙: 본인이 삭제하거나, 채팅방 멤버가 초대 생성 가능
          ".write": "auth != null &&
            (
              ($uid === auth.uid && newData.val() === null) ||
              (newData.val() !== null && root.child('chat-rooms').child($roomId).child('members').child(auth.uid).exists())
            )"
        },
        ".indexOn": [
          "invitationOrder"
        ]
      }
    },
    "chat-favorites": {
      // 즐겨찾기 폴더 관리
      // 사용자별로 채팅방을 폴더로 분류하여 관리
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "$favoriteId": {
          "name": {
            // 폴더 이름: 필수, 1-30자
            ".validate": "newData.isString() &&
              newData.val().length > 0 &&
              newData.val().length <= 30"
          },
          "description": {
            // 폴더 설명: 선택, 최대 100자
            ".validate": "newData.isString() &&
              newData.val().length <= 100"
          },
          "createdAt": {
            // 생성 시간: 필수, 숫자 (timestamp)
            ".validate": "newData.isNumber()"
          },
          "folderOrder": {
            // 정렬 순서: 필수, 문자열 (500 prefix = 상단 고정)
            ".validate": "newData.isString()"
          },
          "roomList": {
            // 폴더에 포함된 채팅방 목록 (roomId -> true)
            "$roomId": {
              ".validate": "newData.isBoolean()"
            }
          }
        },
        ".indexOn": [
          "folderOrder"
        ]
      }
    },
    "fcm-tokens": {
      ".read": true,
      ".write": true,
      ".indexOn": [
        "uid"
      ]
    },
    "chat-room-passwords": {
      "$roomId": {
        "password": {
          ".read": "root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid",
          ".write": "root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid"
        },
        "try": {
          "$uid": {
            ".write": "auth != null &&
              $uid === auth.uid"
          }
        }
      }
    },
    "test": {
      "data": {
        // QA 전용 테스트 데이터 노드 - 누구나 읽고 쓰기 가능
        ".read": true,
        ".write": true,
        ".indexOn": [
          "order",
          "createdAt",
          "qnaCreatedAt",
          "reminderCreatedAt",
          "newsCreatedAt"
        ]
      }
    }
  }
}
```

