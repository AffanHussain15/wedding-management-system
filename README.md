<div align="center">

# Ek — Smart Wedding Management System

**Do Baati, Ek Roshni** · One app for your whole wedding.

A full-stack, multi-user wedding planner for South Asian weddings — vendors, guests, budget,
functions and tasks, shared across the whole family with role-based permissions.

[![CI](https://github.com/Chuck672991/WMS_backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Chuck672991/WMS_backend/actions/workflows/ci.yml)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%20%2F%205.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.3-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-relational-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-cache%20%2B%20queues-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)](#-license)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Data Model](#-data-model)
- [Request Lifecycle](#-request-lifecycle)
- [Frontend Composition](#-frontend-composition)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Roles & Permissions](#-roles--permissions)
- [Project Stats](#-project-stats)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🪔 Overview

Planning a South Asian wedding means coordinating half a dozen functions, dozens of vendors,
hundreds of guests and a budget that everyone in the family has an opinion about. **Ek** puts
all of it behind one shared workspace.

The system is split into two independently deployable applications:

| App | Path | Role |
|---|---|---|
| **Mobile client** | [`WMS/`](WMS/) | React Native app (Android + iOS) |
| **REST API** | [`WMS_backend/backend/`](WMS_backend/backend/) | NestJS + Prisma + PostgreSQL |

A **wedding** is the unit of collaboration. Every domain route is scoped to `:weddingId`, and
users join a wedding as `OWNER`, `CO_OWNER`, `FAMILY_MEMBER` or `VIEWER` — the role decides what
they can change. A single user can belong to multiple weddings and switch between them.

**Design decisions worth knowing up front:**

- **The API is the source of truth.** The client keeps no offline mirror; it loads a full
  snapshot per wedding and refetches only the slices a write can invalidate.
- **Screens never see wire types.** `services/mappers.ts` converts between the API's
  `SCREAMING_CASE` enums and human-readable labels in both directions.
- **Membership leaks nothing.** Requesting a wedding you don't belong to returns `404`, never
  `403`, so the API can't be used to probe for wedding IDs.
- **Two features are device-local by design** — the seating planner and reminders have no backend
  counterpart yet and use `local-` prefixed IDs.

---

## ✨ Features

### 🔐 Authentication & Workspace
- Email/password registration and login, plus **Google OAuth** (`passport-google-oauth20`)
- **Rotating refresh tokens** — 15-minute access tokens, 30-day refresh tokens, hashed at rest
- Multi-device session list, single-device logout, and **logout-all**
- Password reset over single-use, expiring, hashed tokens
- Email-invite flow to bring family members into a wedding workspace
- Multi-wedding membership with an in-app wedding switcher

### 🤝 Vendor Management
- 11 vendor categories with a free-text `Other` escape hatch
- **Payment ledger per vendor** — status (`Paid` / `Advance` / `Pending`) is derived server-side
  from recorded payments against the agreed price, never stored as a mutable field
- Recording a vendor payment **auto-creates a matching budget item**, so the two can't drift
- Optional link from a vendor to the specific function it's booked for

### 👰 Guest & RSVP Management
- Group-aware guest list (`groupSize`) with bride/groom/both side and Mardana/Zanana/Mixed gathering
- **Public RSVP links** — each guest gets a unique `rsvpToken` for an unauthenticated RSVP page
- Bulk import from **CSV/XLSX**, plus device-contact import with country-code-agnostic
  duplicate detection
- Invite dispatch with a 24-hour resend rate limit (`lastInvitedAt`)

### 💰 Budget Tracking
- 12 spend categories with per-category and overall rollups
- Live totals: total budget, spent, remaining, percent used
- Budget items created from a vendor payment are **read-only from the budget screen**
  (`LINKED_TO_VENDOR_PAYMENT`) — they're edited via the vendor that owns them

### 📅 Functions & Tasks
- Free-text functions (Dholki, Mayun, Mehndi, Baraat, Walima suggested, not enforced)
- Status auto-derives from the date, with an optional manual override
- Tasks with priority, due date, assignee and optional function link
- A `FAMILY_MEMBER` may flip the status of a task assigned to them — and nothing else

### 📊 Dashboard
- Countdown to the wedding day
- **Weighted progress score** — the mean of four completion rates (tasks, vendors booked,
  RSVPs received, budget set)
- Redis-cached with a 60-second TTL

### 🎨 Mobile Experience
- Custom animated floating tab bar with 5 primary tabs
- Full design system: maroon + gold palette, Playfair Display / Inter type scale, spacing,
  radius and elevation tokens
- Every icon is hand-drawn **SVG** — no icon font dependency
- Animated splash screen with an indeterminate progress sweep on the native driver
- Generated launcher icons for both platforms, including Android adaptive icons

---

## 🧰 Tech Stack

### Mobile — [`WMS/`](WMS/)

| Concern | Choice |
|---|---|
| Framework | React Native `0.86.0`, React `19.2.3` |
| Language | TypeScript `5.8.3` |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) |
| State | React Context + `useReducer` (no Redux) |
| Networking | `fetch` wrapped in a custom typed client |
| Persistence | `@react-native-async-storage/async-storage` |
| Graphics | `react-native-svg` |
| Device | `react-native-contacts`, `react-native-safe-area-context`, `react-native-screens` |
| Config | `react-native-dotenv` (`@env`) |
| Tooling | ESLint (`@react-native`), Prettier, Jest, `babel-plugin-module-resolver` |

### API — [`WMS_backend/backend/`](WMS_backend/backend/)

| Concern | Choice |
|---|---|
| Framework | NestJS `11` on Express |
| Language | TypeScript `5.7.3` |
| Database | PostgreSQL via Prisma `6.3` |
| Cache | Redis (`ioredis`) |
| Queues | BullMQ (`@nestjs/bullmq`) |
| Auth | `@nestjs/jwt`, Passport (JWT + Google OAuth 2.0), `bcrypt` |
| Validation | `class-validator` + `class-transformer` |
| Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Rate limiting | `@nestjs/throttler` — 100 requests / 60 s |
| Imports | `xlsx`, `csv-parse` |
| Deployment | Vercel serverless (`api/index.ts`) or any Node host (`main.ts`) |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph mobile["📱 React Native Client"]
        direction TB
        SCR["Screens<br/><i>28 screens · 5 tabs</i>"]
        CTX["AuthContext + WeddingContext<br/><i>useReducer domain store</i>"]
        MAP["mappers.ts<br/><i>wire types ⇄ view models</i>"]
        CLI["client.ts<br/><i>envelope · refresh · replay</i>"]
        SCR --> CTX --> MAP --> CLI
    end

    CLI -->|"HTTPS · Bearer JWT"| GW

    subgraph api["🛠️ NestJS API — global prefix /v1"]
        direction TB
        GW["create-app.ts"]
        PIPE["AppValidationPipe"]
        GUARD["JwtAuthGuard → WeddingAccessGuard → RolesGuard"]
        MOD["9 feature modules<br/><i>Controller → Service → Repository</i>"]
        INT["ResponseInterceptor + HttpExceptionFilter"]
        GW --> PIPE --> GUARD --> MOD --> INT
    end

    MOD --> PRISMA["Prisma Client"]
    MOD --> REDIS[("Redis<br/><i>cache · 60s dashboard TTL</i>")]
    MOD --> BULL["BullMQ workers<br/><i>invites · notifications · reminders</i>"]
    PRISMA --> PG[("PostgreSQL<br/><i>13 models · soft deletes</i>")]
    BULL --> REDIS

    classDef store fill:#6D0F2B,stroke:#D4AF37,color:#FDF6E9
    classDef svc fill:#8A2142,stroke:#D4AF37,color:#FDF6E9
    class PG,REDIS store
    class GW,MOD svc
```

### Layering rules

| Layer | Responsibility | May not |
|---|---|---|
| **Controller** | HTTP shape, route params, role decorators | Touch Prisma |
| **Service** | Business rules, cross-module orchestration | Know about HTTP |
| **Repository** | All Prisma access, soft-delete filtering | Contain business rules |
| **Guards** | Identity → membership → role, in that order | Be bypassed per-route |

Controllers return a plain payload — or `{ data, pagination }` for lists — and
`ResponseInterceptor` wraps everything in the standard envelope. No controller builds
an envelope by hand.

---

## 🗄️ Data Model

```mermaid
erDiagram
    User ||--o{ RefreshToken : "sessions"
    User ||--o{ PasswordReset : "reset tokens"
    User ||--o{ WeddingMember : "memberships"
    Wedding ||--o{ WeddingMember : "team"
    Wedding ||--o{ WeddingInvite : "pending invites"
    Wedding ||--o{ Vendor : ""
    Wedding ||--o{ Guest : ""
    Wedding ||--o{ BudgetItem : ""
    Wedding ||--o{ Event : ""
    Wedding ||--o{ Task : ""
    Vendor ||--o{ VendorPayment : "ledger"
    Vendor ||--o{ BudgetItem : "auto-synced"
    Event ||--o{ Vendor : "booked for"
    Event ||--o{ Task : ""
    Event ||--o{ GuestEventInvite : ""
    Guest ||--o{ GuestEventInvite : "invited to"

    User {
        uuid id PK
        string email UK
        string passwordHash "null for Google-only"
        string googleId UK
        enum authProvider "EMAIL | GOOGLE"
        datetime deletedAt "soft delete"
    }
    Wedding {
        uuid id PK
        string name "couple, joined by ' & '"
        datetime weddingDate
        decimal totalBudget
        int estimatedGuests
    }
    WeddingMember {
        uuid id PK
        enum role "OWNER | CO_OWNER | FAMILY_MEMBER | VIEWER"
        datetime joinedAt
    }
    Vendor {
        uuid id PK
        enum category "11 values"
        decimal totalPrice
        uuid eventId FK "nullable"
    }
    VendorPayment {
        uuid id PK
        decimal amount
        enum method "CASH | BANK_TRANSFER | CARD | OTHER"
    }
    Guest {
        uuid id PK
        int groupSize
        enum side "BRIDE | GROOM | BOTH"
        enum gathering "MARDANA | ZANANA | MIXED"
        enum rsvpStatus "PENDING | CONFIRMED | DECLINED"
        string rsvpToken UK "public RSVP link"
        datetime lastInvitedAt "24h resend limit"
    }
    BudgetItem {
        uuid id PK
        enum category "12 values"
        decimal amount
        uuid vendorPaymentId UK "set when auto-created"
    }
    Event {
        uuid id PK
        string name "free text"
        datetime eventDate
        enum manualStatus "null = derive from date"
    }
    Task {
        uuid id PK
        enum status "PENDING | IN_PROGRESS | DONE"
        enum priority "LOW | MEDIUM | HIGH"
        uuid assignedTo FK
    }
```

> **13 models · 12 enums.** Every domain table carries `deletedAt` for soft deletes and cascades
> from `Wedding`, so removing a wedding cleanly removes everything under it.

---

## 🔄 Request Lifecycle

The client's most load-bearing behaviour is transparent token rotation. A `401` triggers exactly
one refresh, all concurrent `401`s share that single in-flight refresh, and the original requests
are replayed — so an expiring token never surfaces to the user.

```mermaid
sequenceDiagram
    autonumber
    participant UI as Screen
    participant ST as WeddingContext
    participant CL as client.ts
    participant API as NestJS /v1
    participant DB as PostgreSQL

    UI->>ST: actions.addVendor(input)
    ST->>CL: POST /weddings/:id/vendors
    CL->>API: + Authorization: Bearer <access>

    API-->>CL: 401 UNAUTHORIZED

    Note over CL: single-flight refresh —<br/>concurrent 401s await the same promise
    CL->>API: POST /auth/refresh
    alt Token rejected (4xx)
        API-->>CL: 401
        CL->>CL: clearSession() → sign out
    else Server unreachable (5xx / timeout)
        API-->>CL: 503
        CL-->>ST: NETWORK_ERROR (session kept)
    else Rotated
        API-->>CL: 200 { accessToken, refreshToken }
        CL->>API: replay original request
        API->>API: Validate → Guards → RolesGuard
        API->>DB: prisma.vendor.create()
        DB-->>API: row
        API-->>CL: { success, data, meta }
        CL-->>ST: unwrapped data
        ST->>ST: refetch only invalidated slices
        ST-->>UI: { ok: true }
    end
```

> Writes return `Promise<ActionResult>` rather than throwing, so an `onPress` can `await` a
> mutation and surface an error without a `try/catch` — and ignoring the result still cannot
> produce an unhandled rejection.

---

## 🧩 Frontend Composition

```mermaid
flowchart TD
    App["App.tsx"] --> SAP["SafeAreaProvider"]
    SAP --> AP["AuthProvider<br/><i>session · active wedding</i>"]
    AP --> WP["WeddingProvider<br/><i>keyed on activeWeddingId</i>"]
    WP --> NC["NavigationContainer<br/><i>keyed on auth tree</i>"]
    NC --> RN["RootNavigator"]

    RN -->|"loading"| SPL["SplashScreen"]
    RN -->|"guest"| GUEST["Onboarding · Login · Signup<br/>Forgot / Reset Password"]
    RN -->|"setup"| SETUP["SelectWedding · Setup wizard<br/>FamilyLink"]
    RN -->|"app"| MAIN["MainTabNavigator"]
    RN -->|"app"| STACK["Detail stack<br/><i>13 screens</i>"]

    MAIN --> T1["🏠 Home"]
    MAIN --> T2["🛍️ Vendors"]
    MAIN --> T3["👥 Guests"]
    MAIN --> T4["💰 Budget"]
    MAIN --> T5["📅 Timeline"]

    classDef tree fill:#8A2142,stroke:#D4AF37,color:#FDF6E9
    class GUEST,SETUP,MAIN,STACK tree
```

`RootNavigator` mounts **exactly one of four trees** at a time. Because the signed-out routes
don't exist while authenticated (and vice versa), logging in or out swaps the whole tree — there
are no `reset()` calls, and no way to reach an app screen without a session.

---

## ⚙️ Installation & Setup

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | `>= 20` (mobile `package.json` pins `>= 22.11.0`) |
| npm | `>= 10` |
| PostgreSQL | `>= 14` |
| Redis | `>= 6` |
| JDK | `17` (Android) |
| Xcode + CocoaPods | latest stable (iOS, macOS only) |

---

### 1️⃣ Backend

```bash
cd WMS_backend/backend
npm install

cp .env.example .env
```

Fill in `.env`:

```ini
NODE_ENV=development
PORT=3000
API_PREFIX=v1

DATABASE_URL=postgresql://user:password@localhost:5432/smart_wedding
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=<generate-a-strong-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=<generate-a-different-secret>
JWT_REFRESH_EXPIRY=30d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

Create the schema and start:

```bash
npm run prisma:generate     # generate the Prisma client
npm run prisma:migrate      # apply migrations
npm run prisma:seed         # optional: seed reference data

npm run start:dev           # http://localhost:3000/v1
```

Swagger UI is served at **`http://localhost:3000/docs`**.

<details>
<summary><b>All backend scripts</b></summary>

| Script | Purpose |
|---|---|
| `npm run start:dev` | Watch mode |
| `npm run start:debug` | Watch + inspector |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled build |
| `npm run lint` | ESLint with `--fix` |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | End-to-end suite |
| `npm run test:cov` | Coverage report |
| `npm run prisma:studio` | Prisma Studio GUI |

</details>

---

### 2️⃣ Mobile App

```bash
cd WMS
npm install

cp .env.example .env
```

`API_HOST` is the one setting that matters, and it is **platform-specific**:

| Target | `API_HOST` |
|---|---|
| Android emulator | `http://10.0.2.2:3000` (host loopback alias) |
| iOS simulator | `http://localhost:3000` |
| Physical device | `http://192.168.x.x:3000` (your machine's LAN IP) |
| Deployed backend | `https://wms-backend-61pc.onrender.com` |

```ini
API_HOST=http://10.0.2.2:3000
API_PREFIX=v1
REQUEST_TIMEOUT_MS=60000
```

> ⚠️ **`.env` is inlined by Babel at build time.** After editing it, restart Metro with
> `npm start -- --reset-cache`, or your change simply won't be picked up.

Run it:

```bash
npm start                   # Metro

npm run android             # Android device/emulator
npm run ios                 # iOS simulator (macOS)
```

For iOS, install pods first:

```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

<details>
<summary><b>All mobile scripts</b></summary>

| Script | Purpose |
|---|---|
| `npm start` | Metro bundler |
| `npm run android` / `npm run ios` | Build and launch |
| `npm run icons` | Regenerate launcher icons from `src/assets/images/logo.png` |
| `npm run lint` | ESLint |
| `npm test` | Jest |

</details>

---

## 💡 Usage

### Calling the API from a screen

Every route is reachable through the single `api` object. Endpoints throw a typed `ApiError`,
never a bare string, so callers can branch on `code` / `status` and read `fieldErrors` for
inline form validation.

```ts
import { api, ApiError, errorMessage } from '@services';

try {
  const { items, pagination } = await api.vendors.list(weddingId, {
    status: 'PENDING',
    limit: 100,
  });
  console.log(`${items.length} of ${pagination?.totalItems}`);
} catch (error) {
  if (error instanceof ApiError && error.status === 403) {
    // Not permitted for this role
  }
  showToast(errorMessage(error));
}
```

### Mutating through the domain store

Screens never call the API directly for writes. `WeddingContext` exposes action creators that
call the API, refetch only the affected slices, and resolve to a uniform result:

```tsx
import { useWedding } from '@store';

function AddVendorButton() {
  const { actions } = useWedding();

  const onSubmit = async () => {
    const result = await actions.addVendor({
      name: 'Al-Habib Caterers',
      category: 'Catering',
      phone: '+923001234567',
      cost: 450_000,
      advance: 100_000,   // recorded as the vendor's first payment
    });

    if (!result.ok) return setError(result.message);
    if (result.warning) showToast(result.warning);
    navigation.goBack();
  };
}
```

### Reading state with permission gating

```tsx
const { state, loading, error, refresh } = useWedding();
const mayEdit = state.wedding.role === 'OWNER' || state.wedding.role === 'CO_OWNER';

return (
  <ScreenContainer scroll onRefresh={refresh} refreshing={loading}>
    {state.vendors.map(v => (
      <VendorRow key={v.id} vendor={v} editable={mayEdit} />
    ))}
  </ScreenContainer>
);
```

### Consuming the API directly

```bash
# Register
curl -X POST http://localhost:3000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ayesha@example.com","password":"S3cure!pass","fullName":"Ayesha Khan"}'

# Create a wedding
curl -X POST http://localhost:3000/v1/weddings \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ayesha & Bilal","weddingDate":"2026-12-14","venueCity":"Lahore"}'

# Dashboard summary
curl http://localhost:3000/v1/weddings/$WEDDING_ID/dashboard \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Every successful response uses the same envelope:**

```jsonc
{
  "success": true,
  "data": [ /* payload */ ],
  "meta": {
    "timestamp": "2026-08-01T10:22:31.145Z",
    "requestId": "5f2c…",
    "pagination": { "page": 1, "limit": 100, "totalItems": 248, "totalPages": 3 }
  }
}
```

**And every failure:**

```jsonc
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [{ "field": "phone", "message": "phone must be a valid E.164 number" }]
  },
  "meta": { "timestamp": "…", "requestId": "…" }
}
```

---

## 📁 Project Structure

```
WMS-WorkPlace/
├── WMS/                              # 📱 React Native client
│   ├── android/  ios/                # native projects (+ generated launcher icons)
│   ├── scripts/
│   │   └── generate-app-icon.js      # dependency-free PNG codec + resampler
│   ├── src/
│   │   ├── assets/                   # fonts (Inter, Playfair), images, logo
│   │   ├── components/common/        # 31 presentational components
│   │   ├── constants/                # domain option lists — source of truth for unions
│   │   ├── hooks/                    # useQuery, useMutation, useDebouncedValue, …
│   │   ├── navigation/               # RootNavigator, MainTabNavigator, typed routes
│   │   ├── screens/
│   │   │   ├── onboarding/           # 10 — splash, auth, setup wizard
│   │   │   ├── main/                 #  5 — the bottom tabs
│   │   │   ├── detail/               # 13 — stack + modal screens
│   │   │   └── _shared/
│   │   ├── services/
│   │   │   ├── client.ts             # envelope, refresh, replay, timeouts
│   │   │   ├── endpoints/            # one module per API resource
│   │   │   ├── mappers.ts            # wire types ⇄ view models
│   │   │   ├── session.ts            # persisted token store
│   │   │   └── contacts.ts           # device contact access
│   │   ├── store/                    # AuthContext, WeddingContext, reducer, selectors
│   │   ├── theme/                    # colors, typography, spacing, radius, shadows
│   │   ├── types/                    # view models
│   │   └── utils/                    # format, phone, status, colour, id
│   └── App.tsx
│
└── WMS_backend/
    ├── .github/workflows/ci.yml      # lint → build → test
    └── backend/
        ├── api/index.ts              # Vercel serverless entrypoint
        ├── src/
        │   ├── cache/                # RedisService, CacheInvalidationService
        │   ├── common/
        │   │   ├── constants/        # ErrorCode, WeddingRole
        │   │   ├── decorators/       # @CurrentUser, @Roles, @CurrentWeddingRole
        │   │   ├── filters/          # HttpExceptionFilter
        │   │   ├── guards/           # Jwt → WeddingAccess → Roles
        │   │   ├── interceptors/     # Response envelope, logging
        │   │   ├── middleware/       # request-id
        │   │   └── pipes/            # AppValidationPipe
        │   ├── config/               # app, database, redis, jwt, s3
        │   ├── database/
        │   │   └── prisma/           # schema.prisma, seed.ts
        │   ├── jobs/                 # BullMQ queue + processors
        │   ├── modules/              # auth · users · weddings · vendors · guests
        │   │                         # budget · events · tasks · dashboard
        │   ├── app.module.ts
        │   ├── create-app.ts         # shared assembly — server + serverless
        │   └── main.ts
        └── postman/                  # Wedding-Management-API collection
```

### Path aliases

The mobile app resolves these via `babel-plugin-module-resolver` and `tsconfig.json`:

```
@components  @screens  @navigation  @services  @store
@theme       @hooks    @utils       @constants @types  @assets
```

---

## 📡 API Documentation

Base URL: **`{API_HOST}/v1`** · Interactive docs: **`/docs`** (Swagger) ·
Postman collection: [`WMS_backend/backend/postman/`](WMS_backend/backend/postman/)

All routes require `Authorization: Bearer <accessToken>` **except** `/auth/*` and `/public/rsvp/*`.

### 🔑 Authentication — `/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Email + password |
| `POST` | `/auth/google` | Google ID-token exchange |
| `POST` | `/auth/forgot-password` | Send a reset token |
| `POST` | `/auth/reset-password` | Consume a reset token |
| `POST` | `/auth/refresh` | Rotate the token pair |
| `POST` | `/auth/logout` | Revoke the current session |
| `POST` | `/auth/logout-all` | Revoke every session |
| `GET` | `/auth/sessions` | List active devices |

### 👤 Users & Weddings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/me` | Profile **+ wedding memberships** |
| `PATCH` | `/users/me` | Update profile |
| `POST` | `/weddings` | Create a wedding workspace |
| `GET` | `/weddings/:weddingId` | Wedding detail |
| `PATCH` | `/weddings/:weddingId` | Update wedding |
| `DELETE` | `/weddings/:weddingId` | Soft-delete (OWNER only) |
| `GET` | `/weddings/:weddingId/members` | List members |
| `POST` | `/weddings/:weddingId/invites` | Invite by email |
| `DELETE` | `/weddings/:weddingId/invites/:inviteId` | Revoke an invite |
| `PATCH` | `/weddings/:weddingId/members/:userId` | Change a role (OWNER only) |
| `DELETE` | `/weddings/:weddingId/members/:userId` | Remove a member |
| `POST` | `/invites/accept` | Accept an invite token |

> There is **no `GET /weddings` list endpoint** — wedding discovery goes through `GET /users/me`.

### 🛍️ Vendors

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vendors/categories` | Reference enum list |
| `GET` | `/weddings/:weddingId/vendors` | List (filter, search, paginate) |
| `GET` | `/weddings/:weddingId/vendors/:vendorId` | Detail + payment history |
| `POST` | `/weddings/:weddingId/vendors` | Create |
| `PATCH` | `/weddings/:weddingId/vendors/:vendorId` | Update |
| `DELETE` | `/weddings/:weddingId/vendors/:vendorId` | Soft-delete |
| `POST` | `/weddings/:weddingId/vendors/:vendorId/payments` | Record a payment |
| `DELETE` | `/weddings/:weddingId/vendors/:vendorId/payments/:paymentId` | Reverse a payment |

### 👥 Guests & RSVP

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/weddings/:weddingId/guests` | List |
| `GET` | `/weddings/:weddingId/guests/summary` | Head counts by RSVP status |
| `POST` | `/weddings/:weddingId/guests` | Create |
| `POST` | `/weddings/:weddingId/guests/bulk-import` | CSV / XLSX upload |
| `POST` | `/weddings/:weddingId/guests/bulk-send-invites` | Batch dispatch |
| `PATCH` | `/weddings/:weddingId/guests/:guestId` | Update |
| `PATCH` | `/weddings/:weddingId/guests/:guestId/rsvp` | Set RSVP internally |
| `POST` | `/weddings/:weddingId/guests/:guestId/send-invite` | Send one invite |
| `DELETE` | `/weddings/:weddingId/guests/:guestId` | Soft-delete |
| `GET` | `/public/rsvp/:rsvpToken` | 🌐 Public — fetch invite |
| `POST` | `/public/rsvp/:rsvpToken` | 🌐 Public — submit RSVP |

### 💰 Budget · 📅 Events · ✅ Tasks · 📊 Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/budget/categories` | Reference enum list |
| `GET` | `/weddings/:weddingId/budget/summary` | Totals + per-category rollup |
| `GET` | `/weddings/:weddingId/budget/items` | List expenses |
| `GET` | `/weddings/:weddingId/budget/items/:itemId` | Expense detail |
| `POST` | `/weddings/:weddingId/budget/items` | Add expense |
| `PATCH` | `/weddings/:weddingId/budget/items/:itemId` | Update expense |
| `DELETE` | `/weddings/:weddingId/budget/items/:itemId` | Delete expense |
| `GET` | `/weddings/:weddingId/events` | List functions |
| `GET` | `/weddings/:weddingId/events/:eventId` | Function detail |
| `POST` | `/weddings/:weddingId/events` | Create function |
| `PATCH` | `/weddings/:weddingId/events/:eventId` | Update function |
| `DELETE` | `/weddings/:weddingId/events/:eventId` | Delete function |
| `GET` | `/weddings/:weddingId/tasks` | List tasks |
| `POST` | `/weddings/:weddingId/tasks` | Create task |
| `PATCH` | `/weddings/:weddingId/tasks/:taskId` | Update task / status |
| `DELETE` | `/weddings/:weddingId/tasks/:taskId` | Delete task |
| `GET` | `/weddings/:weddingId/dashboard` | Aggregated summary (cached 60 s) |

### Error codes

`VALIDATION_ERROR` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `DUPLICATE_RESOURCE` ·
`TOKEN_EXPIRED` · `TOKEN_INVALID` · `RATE_LIMITED` · `INTERNAL_ERROR` ·
`WEDDING_ACCESS_DENIED` · `LINKED_TO_VENDOR_PAYMENT`

---

## 🛡️ Roles & Permissions

Guards run in a fixed order — **identity → membership → role**. `WeddingAccessGuard` resolves the
caller's role for the `:weddingId` in the path and attaches it to the request; `RolesGuard` then
enforces the route's `@Roles(...)` decorator.

| Capability | OWNER | CO_OWNER | FAMILY_MEMBER | VIEWER |
|---|:---:|:---:|:---:|:---:|
| Read everything in the wedding | ✅ | ✅ | ✅ | ✅ |
| Create / edit / delete vendors | ✅ | ✅ | ❌ | ❌ |
| Record & reverse vendor payments | ✅ | ✅ | ❌ | ❌ |
| Create / edit / delete guests | ✅ | ✅ | ✅ | ❌ |
| Bulk-send guest invites | ✅ | ✅ | ❌ | ❌ |
| Create / edit / delete budget items | ✅ | ✅ | ❌ | ❌ |
| Create functions | ✅ | ✅ | ✅ | ❌ |
| Edit / delete functions | ✅ | ✅ | ❌ | ❌ |
| Create tasks & update status | ✅ | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ | ❌ |
| Update wedding details | ✅ | ✅ | ❌ | ❌ |
| Invite / remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ | ❌ |
| Delete the wedding | ✅ | ❌ | ❌ | ❌ |

> Non-members receive **`404 NOT_FOUND`**, not `403` — the API never confirms that a wedding ID
> exists to someone outside it.

---

## 📈 Project Stats

| Metric | Count |
|---|---:|
| REST endpoints | **57** |
| Backend feature modules (registered) | **9** |
| Prisma models | **13** |
| Prisma enums | **12** |
| Mobile screens | **28** |
| Shared UI components | **31** |
| TypeScript source files | **231** (113 mobile · 112 API · 6 other) |

```mermaid
pie showData title REST endpoints by module
    "Auth" : 9
    "Guests + Public RSVP" : 11
    "Weddings + Invites" : 10
    "Vendors" : 8
    "Budget" : 7
    "Events" : 5
    "Tasks" : 4
    "Users" : 2
    "Dashboard" : 1
```

```mermaid
pie showData title Mobile screens by area
    "Detail / modal" : 13
    "Onboarding + auth" : 10
    "Main tabs" : 5
```

### 🚧 Scaffolded, not yet built

Three module directories exist under `src/modules/` but are **empty and unregistered** in
`app.module.ts` — they mark planned work rather than shipped features:

| Directory | Intended for | Client-side status |
|---|---|---|
| `ai/` | AI planning assistant | UI shell exists — `AiAssistantScreen`, reachable from the FAB |
| `notifications/` | Push / in-app notifications | `RemindersScreen` is device-local only |
| `uploads/` | S3 image uploads | `s3.config.ts` is wired; no controller yet |

Likewise, the **seating planner** (`SeatingScreen`) stores tables on-device with `local-` prefixed
IDs — there is no seating model in the schema, so arrangements don't sync or survive a reinstall.

---

## 🤝 Contributing

### Workflow

1. Branch from `main` — `feat/…`, `fix/…`, `refactor/…`
2. Make the change, keeping frontend and backend types in sync
3. Run the checks below — **CI runs lint, build and test on every PR**
4. Open a PR describing *why*, not just *what*

### Before you push

```bash
# Backend
cd WMS_backend/backend
npm run lint && npm run build && npm test

# Mobile
cd WMS
npx tsc --noEmit && npm run lint && npm test
```

### Conventions

| Area | Rule |
|---|---|
| **Comments** | Explain *why*, not *what*. Non-obvious trade-offs get a note; obvious code gets none. |
| **Enums** | Add to the Prisma enum **and** the matching list in `WMS/src/constants/index.ts` — the TS unions derive from it. |
| **Mapping** | Never leak `SCREAMING_CASE` into a screen. Extend `services/mappers.ts`. |
| **New endpoint** | Controller → Service → Repository. Controllers never touch Prisma. |
| **New route** | Register in `RootStackParamList` so `useNavigation` stays typed. |
| **Styling** | Use `@theme` tokens. No hard-coded hex outside `theme/colors.ts`. |
| **Writes** | Return `ActionResult` from store actions — never throw at a screen. |
| **Migrations** | Commit the generated SQL alongside the schema change. |

### Adding a domain field, end to end

```
schema.prisma  →  prisma:migrate  →  DTO + validation  →  repository  →  controller
      →  apiTypes.ts  →  mappers.ts  →  models.ts  →  store action  →  screen
```

---

## 📄 License

This project is currently **UNLICENSED** and marked `private` in both `package.json` files —
all rights reserved by the authors. No permission is granted to use, copy, modify or distribute
it without written consent.

> 📌 If you intend to open-source this, add a `LICENSE` file at the repository root and update the
> `license` field in `WMS/package.json` and `WMS_backend/backend/package.json` to match.

---

<div align="center">

**Ek** — *Do Baati, Ek Roshni*

Built with React Native and NestJS.

</div>
