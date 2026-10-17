# Khwaja Quran Majeed Academy — Parts 1 + 2

Next.js 15 + TypeScript + Tailwind + Supabase (Postgres, Auth, private Storage). Deploys to Vercel.

**Built in Part 1:** bilingual (Urdu RTL / English) public site, three-dot menu, light/dark theme, admin-managed marquee, course catalog, student registration → pending application, admin panel (dashboard, applications review/approve/reject/request-info, create student account + activation email, courses, fee cards, payment accounts, payment verification + receipts, manual payments, contact settings, audit log), student login by Student ID or email, student dashboard and fee cards with proof upload.

**NOT built yet:** see HANDOFF.md (teacher side, Quran reader, video, chat, email templates, etc.).

> Status: written without network access, so `npm install`, type-check and `next build` have **not** been run. Run them first and fix any small errors.

## Setup
1. `npm install` (creates the lockfile — commit it).
2. Create a Supabase project. In SQL Editor run `supabase/migrations/001_init.sql`. Optional dev data: `supabase/seed_dev.sql` (courses are created *unpublished*).
3. Copy `.env.example` → `.env.local`, fill values (Supabase → Project Settings → API). Never commit `.env.local`.
4. Auth → URL Configuration: Site URL = your site; add `<site>/auth/set-password` to Redirect URLs. Auth → Email: for production configure custom SMTP (Resend/Brevo etc.) and verify your sender domain (SPF/DKIM DNS records).
5. Create the first admin: set `ADMIN_EMAIL`/`ADMIN_PASSWORD` (12+ chars) in `.env.local`, run `npm run create-admin`, then delete the password from the file. Login at `/admin/login`.
6. `npm run dev`.

## Vercel
Push to GitHub → Import in Vercel → add the 5 env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the real https URL) → Deploy. `SUPABASE_SERVICE_ROLE_KEY` must stay server-side (it is only imported in `lib/supabase/admin.ts`, marked `server-only`).

## First-use checklist (admin)
Settings → contact details · Marquee → add Bismillah etc. · Courses → fill details, tick Published · Payments → add your JazzCash/Easypaisa/bank accounts · then applications will arrive at Applications.

## Payment flow
Admin creates a **fee card** for a student → student sees total/paid/balance + the academy's payment accounts (with Copy buttons) → student sends money outside the app, submits transaction number + screenshot → admin opens Payments, views proof, **Verify** (receipt number issued) or **Reject**. Manual cash entries are labelled "manual"; no online gateway is connected, so nothing is ever labelled "gateway-verified".

## Security notes
Roles live in `profiles` and can only be changed with the service role. Students read only their own rows (RLS). Proofs are in a private bucket (own folder / admin only). Login errors are generic. Applications use a honeypot + duplicate-email check; add Vercel/Upstash rate limiting before launch (see HANDOFF).


---
# Part 2 (added)

**Status: written without network access.** `npm install`, `tsc`, `next build` and Vitest were **not** run in the build environment. Only a syntax-level TypeScript pass and the pure-logic checks (Quran metadata, fee maths, CSV safety) were run and passed. Run `npm install && npm run typecheck && npm run lint && npm run build && npm test` first and fix small type errors.

## New setup steps
1. Supabase SQL editor: run `supabase/migrations/002_part2.sql` (after 001). It creates teachers, scheduling (with DB-level overlap prevention), LMS tables, chat, Quran tables, email tables, policy pages, rate limiter, RLS and two more private buckets.
2. Add the new env vars from `.env.example` (Resend, CRON_SECRET, LiveKit, ADMIN_REQUIRE_MFA). Add `https://<site>/auth/set-password` redirect (already from Part 1).
3. **Quran data**: download the Tanzil *Uthmani* plain-text file yourself from https://tanzil.net/download/ then `npm run import-quran -- path/to/quran-uthmani.txt`. The script refuses to import unless it finds exactly 6236 ayahs matching the 114-surah structure, stores the text unchanged, and only derives a diacritic-free search column. **Licence:** Tanzil's text licence (see https://tanzil.net/docs/text_license — please read the current terms) allows verbatim copying with attribution to tanzil.net and forbids modification; keep the attribution line in the reader. No Quran text is typed or generated anywhere in this code. No translation/tafsir is included (add one only with a named, licensed source).
4. Email: create a Resend account, verify your domain, set `RESEND_API_KEY` and `EMAIL_FROM`. Templates are editable at Admin → Emails (Urdu + English, defaults in `lib/email-defaults.ts`). Failed sends are logged and retried by the daily cron (`vercel.json`) or the “Retry” button.
5. Live classes: create a LiveKit project, set the 3 env vars. The token route only serves the assigned teacher/student of that session, from 10 min before to 30 min after. Recording is not enabled.
6. Admin 2FA: log in → Admin → Security → set up authenticator → then set `ADMIN_REQUIRE_MFA=true`.
7. Policies: Admin → Policies, write your approved text, tick Published; footer links appear only for published pages.

## Typical flow to test
Teacher applies at `/teach` → Admin → Teachers approve → create account (activation email) → teacher logs in at `/teacher/login` → Admin assigns teacher to student → Admin → Classes creates weekly schedule (sessions generated, overlaps skipped) → class opens at `/class/<id>` for both → teacher marks attendance, assigns homework, shares ayah → student sees timetable in their own time zone, homework, materials, feedback, certificates, chat.

## Security notes (Part 2)
Teachers can only read/write rows of students assigned to them (RLS `is_assigned`). Chat is readable only by the active teacher–student pair; admins see only a *reported* message. Files live in private buckets and are served through short-lived signed URLs after an authorization check. Rate limits (login, registration, payment, teacher application, uploads, live token) use a database counter, so no extra service is needed. Audit log viewer: Admin → Audit. Run the manual RLS checks in `supabase/tests_rls.sql`.
