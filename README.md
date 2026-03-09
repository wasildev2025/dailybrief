# Daily Work Update System

A production-ready internal web application for managing daily work updates across a software team. Team members submit daily tasks, and an admin reviews, edits, compiles, and exports a formatted daily brief for management.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** NextAuth v5 (credentials-based with role-based access)

## Features

- Role-based authentication (Admin & Member)
- Member dashboard with date picker, dynamic task form, draft/submit workflow
- Admin dashboard with overview stats, date-based review, inline editing
- Report generator with preview, edit, copy, TXT/PDF export
- User management (create, edit, activate/deactivate, reset passwords)
- Configurable report template (greeting, header, footer, member prefix)
- Date locking to prevent edits after finalization
- Copy previous day's tasks as draft
- Admin notes/feedback on member updates
- WhatsApp-friendly report format
- Responsive sidebar navigation

## Prerequisites

- Node.js 20.19+ or 22.12+
- PostgreSQL 14+
- npm

## Setup

### 1. Clone and install dependencies

```bash
cd dailybrief
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dailybrief?schema=public"
AUTH_SECRET="generate-a-random-secret-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Create the database

```bash
createdb dailybrief
# or via psql:
# psql -U postgres -c "CREATE DATABASE dailybrief"
```

### 4. Push schema and seed data

```bash
npx prisma db push
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Credentials

| Role   | Email              | Password    |
|--------|--------------------|-------------|
| Admin  | admin@oasdev.com   | password123 |
| Member | akmal@oasdev.com   | password123 |
| Member | usama@oasdev.com   | password123 |
| Member | rehan@oasdev.com   | password123 |
| Member | sarim@oasdev.com   | password123 |

## Pages

| Path                        | Description                    |
|-----------------------------|--------------------------------|
| `/login`                    | Authentication page            |
| `/dashboard/member`         | Member task submission          |
| `/dashboard/admin`          | Admin overview + date review   |
| `/dashboard/admin/reports`  | Report generator               |
| `/dashboard/admin/users`    | User management                |
| `/dashboard/admin/settings` | Report template settings       |

## Database Commands

```bash
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Create and run migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
```

## Sample Report Output

```
Assalam o Alikum Sir!
OAS Dev - Update
09-Mar-26

Tasks

🔸 Mr. Akmal.
1. Working on Full Independent Containerization of Wasil MVP
2. AWS/Third-Party Emulation: MinIO with auto-created buckets, Carbone for PDF generation.
3. Auth bypass enabled, local AI routes debugged for stable LLM testing.
4. Removed dependency over AWS.

🔸 Mr. Usama.
1. Working on Admin module - 2 x MRs (Merge Requests) created - currently under review

🔸 Mr. Rehan.
1. Infra Review with DevOps Engineer (IBS) - Held a session to review the current infrastructure setup and workflows.
2. Stack Analysis - Gained a thorough understanding of the technologies, services, and architecture used in the existing infrastructure.

🔸 Mr. Sarim.
1. React JS Tutorial for developing Frontend - undergoing
2. Practical implementation of React components in local environment

FIP
```

## Project Structure

```
dailybrief/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── src/
│   ├── actions/           # Server actions
│   │   ├── auth-actions.ts
│   │   ├── update-actions.ts
│   │   ├── user-actions.ts
│   │   └── settings-actions.ts
│   ├── app/
│   │   ├── api/auth/      # NextAuth route handler
│   │   ├── dashboard/
│   │   │   ├── admin/     # Admin pages
│   │   │   └── member/    # Member pages
│   │   ├── login/         # Login page
│   │   └── layout.tsx     # Root layout
│   ├── components/
│   │   ├── admin/         # Admin-specific components
│   │   ├── member/        # Member-specific components
│   │   ├── shared/        # Shared components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── prisma.ts      # Prisma client
│   │   ├── date-utils.ts  # Date formatting utilities
│   │   ├── report-generator.ts  # Report generation logic
│   │   └── utils.ts       # General utilities
│   ├── middleware.ts       # Auth middleware
│   └── types/             # Type definitions
├── .env.example
├── package.json
└── README.md
```
