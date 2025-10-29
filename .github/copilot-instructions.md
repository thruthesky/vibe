# Vibe Project - AI Coding Agent Instructions

## Project Overview

**Vibe** is a collaborative social web application built entirely through AI-assisted development (no-code philosophy). This Next.js 16 + React 19 + Firebase project demonstrates sustainable AI-driven development with real-world features: authentication, chat, user management, and community boards.

**Core Philosophy**: AI generates code, developers control architecture and requirements. This is a long-term, maintainable project—not a quick prototype.

## Tech Stack & Architecture

### Frontend
- **Next.js 16** with App Router (file-based routing in `/app`)
- **React 19.2** - Use React Compiler for optimization, **never** use `useMemo`, `useCallback`, or `React.memo`
- **TypeScript 5** - Strict typing required
- **Tailwind CSS 4** - All styling via utility classes
- **Radix UI** - Accessible headless components in `/components/ui`

### Backend
- **Firebase Authentication** - Email/password auth (social login planned)
- **Firebase Realtime Database (RTDB)** - Real-time chat, user data at `/vibe/users/<uid>` and `/vibe/chat/*`
- **Firestore** - Future structured data (posts, comments)
- **100% API-based design** - All data access must go through Next.js API routes (in `/app/api/*`) to support future Flutter mobile app

### Layout System
Three-column responsive layout (see `/app/layout.tsx`):
- **Topbar**: Fixed header with auth state, navigation
- **LeftSidebar/RightSidebar**: Desktop only (hidden `lg:block`)
- **Main Content**: Always visible, flex-1
- Max width: 1200px, centered

## Critical Development Rules

### 1. Never Start Dev Server
**NEVER run `npm run dev`** - the local server is always running. Only use:
- ✅ `npm install` for packages
- ✅ `npm run build` for production builds
- ✅ `npm run lint` for linting
- ❌ `npm run dev` - FORBIDDEN

### 2. Always Consult Documentation First
Before any task, **read relevant docs** in `/docs/`:
- **Route changes/links**: `docs/routes.md`
- **User features**: `docs/user.md`
- **Chat features**: `docs/chat.md`
- **Architecture**: `docs/project-overview.md`

### 3. Standard Git Workflow
Every work session MUST follow this sequence:
1. `git status` - Check current state
2. `git commit -a -m "descriptive message"` - Commit existing changes in Korean
3. Perform your work
4. `git commit -a -m "work completed"` - Commit new changes
5. **`git push`** - ALWAYS push (never skip this!)

Commit messages in Korean, e.g., "로그인 기능 검증 완료"

### 4. UTF-8 Encoding Verification
For all file creation/modification:
```bash
file -I <filename>  # Must show charset=utf-8
```

### 5. Design Guidelines
- **Monochromatic & Modern**: Use Slate/Gray tones, avoid gradients
- **No Complexity**: Minimal decoration, clean layouts
- **Consistent Components**:
  - Buttons: `bg-slate-900 hover:bg-slate-800 text-white rounded-lg`
  - Inputs: `border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400`
  - Cards: `bg-slate-50 border border-slate-200 rounded-lg p-6`
- **Korean Comments**: All code comments in Korean

## Key File Patterns

### Firebase Integration
```typescript
// lib/firebase.ts exports: auth, db (Firestore), rtdb (Realtime DB)
import { auth, rtdb } from "@/lib/firebase";
import { ref, set, get, onValue } from "firebase/database";

// Data paths in RTDB:
// /vibe/users/<uid>/{displayName, email, createdAt}
// /vibe/chat/messages/<room-id>/<message-id>
// /vibe/chat/rooms/<room-id>/{roomId, users[], createdAt, lastMessage}
```

### Authentication (`lib/auth.ts`)
```typescript
// Returns: { success: boolean, user?: {...}, error?: string }
await signUp(email, password, displayName);
await signIn(email, password);
await logOut();
const user = getCurrentUser(); // Returns User | null
```

### Chat System (`lib/chat.ts`)
```typescript
// Room ID: Always sorted UIDs, e.g., "user-A-uid-user-B-uid"
const roomId = generateRoomId(uid1, uid2);
await createChatRoom(uid1, uid2);
await sendMessage(roomId, senderUid, senderName, text);

// Real-time subscription (cleanup on unmount!)
const unsubscribe = subscribeToMessages(roomId, (msgs) => setMessages(msgs));
useEffect(() => () => unsubscribe?.(), []);
```

### User Management (`lib/user.ts`)
```typescript
await saveUserDisplayName(uid, displayName);
const name = await getUserDisplayName(uid);
const allUsersData = await getAllUsers(); // Returns { [uid]: {...} }
```

### Client Components Pattern
All interactive pages require `"use client"` directive:
```typescript
"use client";

import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);
  
  // ... rest of component
}
```

## Route Structure

| Path | Purpose | Auth Required |
|------|---------|--------------|
| `/` | Home (TODO list, project intro) | No |
| `/auth/login` | Email/password login | No |
| `/auth/signup` | New user registration | No |
| `/profile` | Edit displayName | Yes |
| `/users` | All users list | No |
| `/chat/room?otherId=<uid>` | 1:1 real-time chat | Yes |
| `/menu` | Unified menu page | No |
| `/dev/history` | Development log | No |

## Common Workflows

### Adding a New Feature
1. Check `/docs/project-overview.md` for existing patterns
2. Create/modify functions in `/lib/*` (pure logic, no UI)
3. Build UI in `/app/*` using `"use client"` and Radix UI components
4. Style with Tailwind (monochromatic theme)
5. Test with real Firebase data (no mocks)
6. Commit in Korean, push immediately

### Chat Room Flow
1. User clicks another user in `/users`
2. Navigate to `/chat/room?otherId=<theirUid>`
3. Page auto-creates room with `createChatRoom(myUid, otherId)`
4. Subscribe to messages with `subscribeToMessages(roomId, callback)`
5. Display messages in chronological order
6. Send with `sendMessage(roomId, myUid, myName, text)`

### Future API Migration
When converting to API routes:
- Move `/lib/chat.ts` functions → `/app/api/chat/route.ts`
- Keep same function signatures
- Update client calls to use `fetch("/api/chat")`
- Support Flutter app with same endpoints

## What NOT to Do

❌ Use `npm run dev` (server already running)  
❌ Skip `git push` after commits  
❌ Use React memo hooks (useMemo/useCallback/React.memo)  
❌ Add gradients or bright colors (monochromatic design only)  
❌ Create files without UTF-8 encoding  
❌ Ignore existing documentation in `/docs/`  
❌ Delete or duplicate existing working code  
❌ Use inline styles (style={}) - Tailwind only  
❌ Forget `"use client"` on interactive components  
❌ Leave real-time listeners without cleanup (memory leaks!)  

## Environment Variables

Required in `.env.local` (all `NEXT_PUBLIC_*` for client-side Firebase):
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## Testing & Verification

When user requests "테스트", "검증", or "디버깅":
- Refer to `@.claude/skills/test/SKILL.md` (if exists)
- Use Playwright MCP or Chrome DevTools MCP
- Verify actual Firebase data, not mocked responses

## Community & Collaboration

- **Korean Vibe Community**: Open-source study project
- Multiple developers contribute via PR workflow
- Respect existing code - refactor/improve, don't replace
- Add Korean comments explaining complex logic
- Update `/docs/` when adding new features

---

**Last Updated**: 2025-10-29  
**Project**: Vibe (한바보 - 한국 바이브 보스)  
**Philosophy**: AI generates code, developers control the vision
