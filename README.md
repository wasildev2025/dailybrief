# Daily Brief — Team Work Update Platform

An enterprise-grade internal web application for managing daily work updates, attendance tracking, and performance analytics across a software team. Team members submit daily tasks, and an admin reviews, edits, compiles, and exports a formatted daily brief for management.

## Tech Stack

- **Framework:** Next.js 16+ (App Router, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **ORM:** Prisma
- **Database:** PostgreSQL (Neon compatible)
- **Auth:** NextAuth v5 (credentials-based, role-based access)
- **AI:** Google Gemini (KPI insights)
- **Rich Text:** Tiptap editor
- **Export:** PDF (jsPDF), Excel (xlsx), TXT

## Features

### Core
- Role-based authentication (Admin & Team Member)
- Daily task submission with subtasks, draft/submit workflow
- Admin review with inline editing, notes, and multi-step finalization (Reviewed → Finalized)
- Configurable task statuses (admin-managed lookup: To Do, In Progress, Under Dev, Under Review, Completed)
- Report generator with rich text editor, preview, copy, TXT/PDF/Excel export
- Date locking to freeze entire days after brief is sent

### Attendance
- Bulk attendance marking with one-click "Mark All Present"
- Status options: Present, Absent, Leave, Half Day, Remote
- Reason tracking for non-present statuses
- Attendance included in daily brief reports

### KPI & Analytics
- AI-powered KPI insights per team member via Google Gemini
- Attendance rate, task submission rate, completion rate metrics
- Per-member progress bars and expandable detail panels
- Team-wide AI performance summary

### Calendar
- Monthly calendar view for both admin and members
- Color-coded attendance and task submission indicators
- Day-click detail panels

### Admin Tools
- Admin can create/add tasks on behalf of any member for any date
- User management (create, edit, activate/deactivate, reset passwords)
- Configurable report template (greeting, header, footer, prefix)
- Task status management (add, edit, color, reorder, activate/deactivate)

### UI/UX
- Professional dashboard with quick actions and team status grid
- Mobile responsive with hamburger navigation
- Skeleton loaders and smooth transitions
- Collapsible sidebar with active route indicators

## Prerequisites

- Node.js 20.19+ or 22.13+
- PostgreSQL 14+ (or Neon serverless)
- npm

## Setup

### 1. Install dependencies

```bash
cd dailybrief
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
DATABASE_URL="postgresql://user:password@host:5432/dailybrief?sslmode=require"
AUTH_SECRET="generate-a-random-secret-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-google-generative-ai-api-key"
```

### 3. Push schema and seed data

```bash
npx prisma db push
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Admin Account

| Role  | Email            | Password    |
|-------|------------------|-------------|
| Admin | admin@oasdev.com | password123 |

> After login, use the **Users** page to create team member accounts and set their passwords.

## Pages

| Path                          | Description                          |
|-------------------------------|--------------------------------------|
| `/login`                      | Authentication                       |
| `/dashboard/admin`            | Admin dashboard with stats & actions |
| `/dashboard/admin/calendar`   | Team calendar (monthly view)         |
| `/dashboard/admin/reports`    | Report generator & export            |
| `/dashboard/admin/kpi`        | KPI analytics with AI insights       |
| `/dashboard/admin/users`      | User management                      |
| `/dashboard/admin/settings`   | Report template & task statuses      |
| `/dashboard/member`           | Member task submission               |
| `/dashboard/member/calendar`  | Personal calendar view               |

## Database Commands

```bash
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema changes to DB
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

## Deployment (Railway / Neon)

1. Set environment variables in your hosting platform
2. Ensure `AUTH_TRUST_HOST=true` is set for production
3. The build script automatically runs `prisma generate`
4. Run `npx prisma db push` after first deploy to sync schema

## Project Structure

```
dailybrief/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── actions/               # Server actions
│   │   ├── auth-actions.ts
│   │   ├── attendance-actions.ts
│   │   ├── calendar-actions.ts
│   │   ├── kpi-actions.ts
│   │   ├── settings-actions.ts
│   │   ├── task-status-actions.ts
│   │   ├── update-actions.ts
│   │   └── user-actions.ts
│   ├── app/
│   │   ├── api/auth/          # NextAuth route handler
│   │   ├── dashboard/
│   │   │   ├── admin/         # Admin pages (dashboard, calendar, reports, kpi, users, settings)
│   │   │   └── member/        # Member pages (updates, calendar)
│   │   ├── login/             # Login page
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── admin/             # Admin-specific components
│   │   ├── member/            # Member-specific components
│   │   ├── shared/            # Shared components (sidebar, calendar, rich-text-editor, skeleton, etc.)
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── gemini.ts          # Google Generative AI client
│   │   ├── date-utils.ts      # Date formatting utilities
│   │   ├── report-generator.ts # Report generation logic
│   │   └── utils.ts           # General utilities
│   └── middleware.ts           # Auth & route protection
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Sample Report Output

```
Assalam o Alikum Sir!
OAS Dev - Update
09-Mar-26

Tasks

🔸 Mr. Akmal.
1. Working on Full Independent Containerization of Wasil MVP - Completed
2. AWS/Third-Party Emulation: MinIO with auto-created buckets - In Progress
   2.1. Carbone for PDF generation
   2.2. S3 bucket auto-provisioning

🔸 Mr. Usama.
1. Working on Admin module - 2 x MRs created - Under Review

Attendance
🔸 Mr. Akmal - Present
🔸 Mr. Usama - Absent - Sick leave
🔸 Mr. Rehan - Remote
🔸 Mr. Sarim - Leave - Personal work

FIP
```

## License

Internal use only — OAS Development Team.
