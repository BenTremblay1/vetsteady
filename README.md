# VetSteady — App

Scheduling + SMS reminders for small veterinary practices.

> "Keep your practice running. Every appointment counts."

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — brand palette in `tailwind.config.ts`
- **Supabase** — Postgres + RLS + Auth (magic link)
- **Twilio** — SMS reminders
- **pg-boss** — background job queue (Sprint 1 Week 2)
- **Vercel** — hosting + cron

## Getting Started

### 1. Clone & Install

```bash
cd app
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep secret)
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`

### 3. Apply Database Schema

In your Supabase SQL editor, run:
```
supabase/migrations/001_initial_schema.sql
```

Or using the Supabase CLI:
```bash
supabase db push
```

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── appointments/ # GET/POST appointments
│   │   │   ├── clients/      # GET/POST clients
│   │   │   ├── auth/         # Sign out
│   │   │   └── webhooks/     # Twilio SMS webhook
│   │   ├── auth/callback/    # Supabase auth redirect
│   │   ├── confirm/[token]/  # One-tap SMS confirm page
│   │   ├── dashboard/        # Staff portal
│   │   ├── login/            # Magic link login
│   │   └── onboarding/       # Practice setup (coming soon)
│   ├── components/
│   │   ├── auth/             # LoginForm
│   │   ├── layout/           # Sidebar
│   │   ├── calendar/         # FullCalendar wrapper (Sprint 1 W2)
│   │   ├── clients/          # Client CRUD forms
│   │   └── appointments/     # Booking modal
│   ├── lib/
│   │   ├── supabase/         # client.ts, server.ts, service.ts
│   │   ├── twilio/           # sms.ts — reminder builder + sender
│   │   └── utils/            # cn, dates, tokens
│   ├── types/                # TypeScript types (mirrors DB schema)
│   └── middleware.ts          # Auth protection
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Auth Flow

1. Staff enters email → receives magic link via Supabase
2. Click link → `/auth/callback` exchanges code for session
3. Middleware protects all `/dashboard/*` routes
4. Supabase RLS ensures practice isolation at DB level

## Reminder Flow (Sprint 1 Week 2)

```
Appointment booked
  → pg-boss schedules jobs (booking_confirm, 2_day)
  → Cron picks up due jobs every 5 min
  → Twilio sends SMS with confirm link
  → Client taps /confirm/:token
  → Status updated to 'confirmed'
```

## Sprint Status

| Sprint | Status |
|--------|--------|
| Scaffold + Config | ✅ Done |
| Supabase Auth | ✅ Wired |
| API Routes (appointments, clients) | ✅ Done |
| Confirm/Cancel page | ✅ Done |
| Calendar UI (FullCalendar) | ⬜ Week 2 |
| Client + Pet CRUD forms | ⬜ Week 2 |
| pg-boss reminder engine | ⬜ Week 2 |
| SMS dispatch (Twilio) | ⬜ Week 2 |
| Vercel deploy | ⬜ Week 2 |
