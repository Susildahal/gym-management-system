# YinYang Wushu Sanda Center — Management System

A modern, secure, role-based management system for a martial arts training
center, built with Next.js (App Router), TypeScript, MongoDB Atlas, and
Auth.js.

> **Status: full CRUD implemented.** All 12 modules — Students, Instructors,
> Classes, Attendance, Memberships, Payments, Notices, Coach Feedback,
> Reports, Notifications, Settings, and Profile — have working Server
> Actions, forms, tables, and pages wired to MongoDB, with role-based access
> enforced server-side throughout. See [Roadmap](#roadmap) for polish items
> that are still worth adding (file uploads, deeper reporting, etc).

## Features

- Role-based access control for **Admin**, **Instructor**, and **Student**,
  enforced server-side via `proxy.ts` (Next.js 16's middleware convention)
  and `lib/permissions.ts` — never just hidden buttons.
- Credentials-based auth (Auth.js v5) with hashed passwords (bcrypt), JWT
  sessions, and a typed `session.user.role`.
- Full Mongoose data layer for every collection described in the spec:
  users, students, instructors, classes, attendance, membership plans,
  memberships, payments, notices, coach feedback, notifications, settings.
- Zod validation schemas for every form/module, ready to plug into Server
  Actions or Route Handlers.
- A hand-built shadcn/ui-style component library (button, input, card,
  table, dialog, sheet, dropdown-menu, select, checkbox, popover, tooltip,
  tabs, badge, avatar, skeleton, alert, toast, separator) using Radix
  primitives + Tailwind CSS v4 — `components.json` is present so the
  official `shadcn` CLI can add more components later.
- Responsive shell: collapsible sidebar on desktop, sheet-based nav on
  mobile, role-filtered navigation items.

## Technology Stack

| Layer          | Choice                                   |
| -------------- | ----------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack)        |
| Language       | TypeScript                                |
| UI             | Tailwind CSS v4, shadcn/ui-style components, Lucide icons |
| Auth           | Auth.js / NextAuth v5 (Credentials + JWT) |
| Database       | MongoDB Atlas + Mongoose                  |
| Validation     | Zod                                       |
| Forms          | react-hook-form + @hookform/resolvers     |

## Requirements

- Node.js 20+
- A MongoDB Atlas cluster (or any MongoDB instance) and its connection string

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/yinyang-wushu?retryWrites=true&w=majority
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

**Never commit `.env.local`.** It's already listed in `.gitignore`.

### 3. MongoDB Atlas setup

1. Create a free/shared cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a user with read/write permissions.
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for development only).
4. Copy the connection string from **Connect → Drivers** into `MONGODB_URI`.

Indexes are declared directly on the Mongoose schemas in `models/` (e.g.
`email`, `username`, `studentId`, `instructorId`, `receiptNumber`, attendance
`date`) and are created automatically the first time each model connects.

### 4. Seed sample data (optional but recommended)

```bash
npm run seed
```

This clears and repopulates the collections with a sample admin, one
instructor, one student, a class, attendance record, membership, payment,
notice, and coach feedback entry.

Seeded logins:

| Role       | Username     | Password    |
| ---------- | ------------ | ----------- |
| Admin      | `admin`      | `admin123`  |
| Instructor | `coach.hari` | `coach123`  |
| Student    | `ram.sharma` | `student123`|

**Change these before production deployment.**

If you'd rather start from a completely empty database, skip this step —
`app/page.tsx` will simply redirect unauthenticated visitors to `/login`
with no accounts to sign in with, so you'll want to insert at least one
admin user manually (hash the password with bcrypt, 10+ salt rounds).

### 5. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 6. Production build

```bash
npm run build
npm start
```

## Development Commands

| Command         | Description                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the dev server (Turbopack)      |
| `npm run build` | Production build                      |
| `npm start`     | Run the production build              |
| `npm run lint`  | Run ESLint                            |
| `npm run seed`  | Seed sample data into MongoDB         |

## User Roles

- **ADMIN** — full access to every module: students, instructors, classes,
  attendance, memberships, payments, notices, coach feedback, reports,
  settings, notifications.
- **INSTRUCTOR** — assigned classes/schedules/students, marks attendance,
  adds coach feedback, views notices and reports.
- **STUDENT** — read-only access to their own profile, attendance,
  membership, payment history, class schedule, notices, and feedback.

Route-level access is defined once in `lib/permissions.ts` (`ROUTE_ROLES`)
and enforced in `proxy.ts` on every request — not just in the UI.

## Project Structure

```
yinyang-wushu/
├── app/
│   ├── (auth)/           # login, unauthorized, forbidden — public
│   ├── (portal)/         # every authenticated module, shares one layout
│   │   ├── dashboard/
│   │   ├── students/ ... settings/, profile/
│   └── api/auth/[...nextauth]/
├── components/
│   ├── ui/                # hand-built shadcn/ui-style primitives
│   ├── layout/             # sidebar, topnav, mobile-nav, page-header
│   └── dashboard/
├── lib/
│   ├── mongodb.ts          # connection singleton
│   ├── auth.ts              # Auth.js config
│   ├── permissions.ts       # role/permission tables
│   ├── nav-config.ts
│   └── validations/          # zod schema per module
├── models/                   # one Mongoose model per collection
├── types/
├── scripts/seed.ts
├── proxy.ts                  # Next.js 16's middleware convention — auth + RBAC
├── .env.example
└── README.md
```

## Security Notes

- **Every Student and Instructor gets a login automatically.** When an admin
  uses "Add student" or "Add instructor," the system also creates a linked
  `User` account (matching role, unique username, one-time random password)
  and shows the credentials once in a dialog — share them with that person
  directly, since the plaintext password is never stored or shown again.
  Records created before this existed (or via the seed script with a
  different flow) can get a login retroactively from their row's "⋯" menu →
  **Create login**.
- Passwords are hashed with bcrypt (10 salt rounds) and never stored or
  returned in plain text; `passwordHash` has `select: false` on the schema.
- `MONGODB_URI`, `AUTH_SECRET`, and `passwordHash` are never sent to the
  client.
- Every protected route is checked in `proxy.ts` against
  `lib/permissions.ts` — extend the same table when adding Server Actions
  or Route Handlers, and call `assertPermission()` at the top of each one.
- Sessions are JWT-based with an 8-hour expiry (`lib/auth.ts`); adjust
  `session.maxAge` as needed.
- The default seeded credentials **must** be changed or removed before
  any production deployment.

## Roadmap

What's built:

- [x] Folder architecture, models, auth, middleware/proxy, permissions, nav
- [x] Login flow, forbidden/unauthorized pages, role-aware dashboard shell
- [x] UI component library, responsive sidebar/topnav
- [x] Zod schemas for every module
- [x] **Students** — CRUD, search, activate/deactivate, delete, detail page with attendance/membership/payments/feedback tabs
- [x] **Instructors** — CRUD, search, activate/deactivate, delete
- [x] **Classes** — CRUD, instructor assignment, training-day picker, schedule-conflict detection, capacity tracking
- [x] **Attendance** — class/date roster marking (admin/instructor), personal history + stats (student)
- [x] **Memberships** — plan CRUD, student assignment with auto-filled dates/amount, status management, expiry auto-sync
- [x] **Payments** — CRUD, auto-generated receipt numbers, print, role-scoped visibility
- [x] **Notices** — CRUD, publish/unpublish, priority, audience targeting, expiry-aware feed
- [x] **Coach Feedback** — CRUD scoped by role (instructor's own + assigned students, student's own, admin all)
- [x] **Reports** — student/attendance/payment/membership/class report tabs, CSV export, print
- [x] **Notifications** — feed, mark read / mark all read, live unread badge in the top nav
- [x] **Settings** — admin-editable academy configuration (singleton document)
- [x] **Profile** — edit own info, change password (role field locked)

Polish that's still worth adding:

- [ ] File uploads for profile photos (Cloudinary/S3/R2) — schema fields exist, upload flow doesn't yet
- [ ] Notification-generating background jobs (membership expiring, payment due, class reminders) — `createNotification()` helper exists in `lib/actions/notifications.ts`, just needs a scheduler/cron to call it
- [ ] Weekly timetable / calendar view for Classes (current view is a list)
- [ ] Richer charts on the Admin dashboard (student growth, payment trends) — currently placeholder panels
- [ ] Automated tests (Vitest/Playwright) covering the scenarios listed in the original spec's Testing section
#   g y m - m a n a g e m e n t - s y s t e m  
 