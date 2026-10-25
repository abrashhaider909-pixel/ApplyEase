# ApplyEase — Setup & Operations Guide

ApplyEase is an administrative workflow platform for a university records office:
dynamic application forms, multi-stage approval workflows with SLA escalation,
signature and official-seal management, document issuance, public verification,
and a full audit trail.

- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Data:** Supabase (Postgres + Realtime), connected from configuration
- **Deployment:** any static host — the build is a single `dist/` folder

The backend is deliberately invisible to end users. Students, faculty and
administrators never see a database setting, connection screen or provider name;
they sign in and work. Everything below is an operator task.

---

## 1. Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and sign in.

Account credentials are **not documented in this repository**. The administrator issues
them when provisioning accounts; the operator keeps them in `CREDENTIALS.local.md`
(git-ignored) or a password manager. Sign-in is email + password only — the UI
never displays or pre-fills credentials, and there is no test-role switcher.

The administrator provisions new accounts from **Admin → Users**.

With credentials in `.env` the app reads and writes Supabase directly. Without
them it runs entirely from browser storage — useful for a quick look, but data
is then per-browser.

---

## 2. Configure the backend (operator only)

### Step 1 — Create the schema

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor → New query**.
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**.

The script is idempotent: tables, indexes, demo policies and the realtime
publication can be re-run safely.

### Step 2 — Set the credentials

Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_key"
# Legacy anon JWT also works: VITE_SUPABASE_ANON_KEY="…"
```

Restart `npm run dev`, or set the same two variables in your host's build
environment (Vercel → Project → Settings → Environment Variables) and redeploy.

That is the only step. There is **no in-app connection screen**: the app connects
on boot, seeds an empty database, and streams changes. A deployment cannot be
"connected" by a visitor, which is what keeps the backend out of the product.

Key choice: the publishable key (`sb_publishable_…`) is the current format and is
safe in client code. The legacy anon JWT still works for older projects. Never
put a `service_role` key in `.env` — Vite would inline it into the bundle.

### Step 3 — Verify

```bash
npm run db:check
```

Prints every table with its row count and exits non-zero if anything is missing.
The first connection to an empty database uploads the seed dataset — accounts,
application types, the three demo filings, signatures and seals.

---

## 3. Runtime behaviour

| Behaviour | Detail |
|-----------|--------|
| Write-through | Every mutation (applications, decisions, users, templates, signatures, stamps, audit logs, notifications) is upserted to Supabase. |
| Realtime | `applications`, `notifications`, `audit_logs`, `profiles` changes from other devices arrive live. |
| First run | An empty database is seeded with accounts, application types, the demo filings, signatures and seals. |
| Offline | The app keeps working on local data, retries automatically, and shows one neutral message: “Working offline — changes are saved on this device.” |
| Recovery | No manual sync buttons. The next successful request or sign-in re-establishes the connection and re-sends pending writes. |
| Reset | **Reset Demo Data** (admin) clears local storage, and when connected wipes and reseeds the cloud tables. |

Technical failures are logged to the browser console with an `[ApplyEase Cloud]`
prefix — for operators, not for users.

---

## 4. Administrator tour

| Area | What it does |
|------|--------------|
| **Overview** | Executive KPIs, live department workload computed from workflow stages, audit activity stream. |
| **All Applications** | University-wide registry: search, status/department filters, deadline sorting, CSV export, open any file. |
| **Services & Workflows** | Create a service, then build its route: stages, owning department, assigned officer, SLA, and whether a stage carries a signature and seal. |
| **Form Builder** | Visual field designer with conditional logic, required documents, declarations and fee rules; draft → publish versioning. |
| **Documents** | A4 document designer with dynamic tokens and drag-positioned signature/seal slots. |
| **Signatures** | Issue, preview and revoke department signatures and seals. The administrator provisions them but cannot apply them. |
| **Users** | Provision student and staff accounts, deactivate, delete. |
| **Audit** | Immutable compliance trail with filters and per-application context. |

### Keyboard

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + K` | Command palette: search applications, students, pages and actions |
| `↑` / `↓` / `↵` | Move through palette results / open |
| `Esc` | Close palette, menu or dialog |

---

## 5. Roles, signing authority and records

The workflow has three levels of authority, enforced in the UI **and** in the store:

| Role | Can review live stages | Applies signature & seal | Sees closed student records |
|------|------------------------|--------------------------|-----------------------------|
| Student | no | no | own file only |
| Faculty / officer (e.g. Faculty Advisor) | yes — their department's queue | **no** | **no** |
| Head of department (or officer-in-charge) | yes | **yes — own department only** | **yes — students of that department** |
| Administrator | yes | **no** | **yes — every record** |

- Signature and seal are applied only by the **head of the department that owns the stage**, using **their own** signature asset and **their department's** seal. A HOD never signs with a colleague's signature.
- The administrator issues signature and seal assets in **Signatures**, but that authority is not usable for approving stages — a deliberate separation of duties.
- Titles that carry signing authority: `Head of Department`, `Chief Hostel Warden`, `University Registrar`, `Senior Accounts Officer` (deans and directors too). Set the title correctly when provisioning staff; other titles review and forward only.
- A stage marked “Requires HOD signature / seal” cannot be approved by anyone else. The review pane shows **Awaiting Head of Department signature** and names the department.
- When a file closes, access narrows to the Registrar (admin) and the head of the student's department. Faculty who handled earlier stages lose access and see a closed-record notice.

### Documents

Applicants attach PDFs and images with the application; they travel inside the application record, so every reviewer sees exactly what was submitted. Reviewers open an inline viewer (images render directly, PDFs in an embedded frame) or download the original before verifying or rejecting each document. Students can re-open their own uploads from the tracker.

Documents are stored as data URLs inside the application row. That keeps a single source of truth and needs no bucket setup, but it caps a file at a few MB and inflates the database. For large scans, move uploads to Supabase Storage and keep only the object path in the application.

### Official PDF and verification QR

Orders are drawn as a **vector PDF** with jsPDF — no browser screenshot — so they no longer fail on Tailwind v4 colours (`oklch`) and the text stays selectable and searchable. The renderer:

- places **one signature block per signatory actually applied** (one signer → one block, two → two), with the signature image, printed name, role and date;
- embeds every **department seal** that was applied;
- prints a **real QR code** linking to `/#verify=<code>`, which opens the public verification portal with the code pre-filled;
- compresses embedded images so a signed page stays around 300 KB instead of several megabytes.

The PDF is rendered once at issuance and stored with the record (`pdfVersion` tracks the renderer). If the layout changes, older records are re-rendered on demand instead of serving a stale file.

### Forms and requirements

In **Form Builder → New form** an administrator can create a completely new schema and attach it to a service **by name**; it becomes that service's draft until published. Every document requirement carries a **Mandatory / Optional** switch plus a maximum size, and every field has its own required flag. Optional documents never block submission; mandatory ones do.

### Deadline checks (SLA)

The **Run deadline check** button (admin dashboard and staff queue) executes the SLA scheduler immediately instead of waiting for the next background pass. For every open stage it compares the stage deadline against the clock and:

1. raises staged warnings at 50% / 75% / 90% of the SLA (warning 1–3),
2. marks the case overdue and escalates it to the administrator once the final threshold passes,
3. writes notifications and audit entries for each action.

Nothing is deleted or approved by this pass — it only measures time and records consequences.

---

## 6. Production build

```bash
npm run build     # emits dist/
npm run preview   # serve the production build locally
```

`npm run lint` runs the TypeScript check (`tsc --noEmit`).

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, S3…).
Set the two `VITE_` variables in the host's build environment — they are inlined
at build time, so a redeploy is required after changing them.

---

## 7. Security notes (read before going public)

- Authentication is **application-level**: the app reads the `profiles` table and
  compares a demo password (default `123`) because the brief asked for short
  credentials. This is not production-grade authentication.
- The shipped Row Level Security policies are **permissive for the `anon` role**
  so the app can read and write without a Supabase session. Anyone with the
  publishable (or anon) key can therefore read the tables.
- Those keys are designed to be public, but they are only safe when RLS policies
  restrict what they can do.

Before a real deployment:

1. Move to **Supabase Auth** (`auth.users`) with email/password or SSO.
2. Replace the open policies with per-role policies (students see only their own
   applications; staff see only their department's queue).
3. Store only password hashes, never plaintext.
4. Put the app behind HTTPS and an institutional SSO gateway.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| App works but data is per-browser | `.env` is missing or still has placeholders. Set the URL and publishable key, restart/rebuild. |
| Data stops syncing, “Working offline” toast | Project paused, wrong URL, or network blocked. Check `npm run db:check`; the app keeps working locally meanwhile. |
| `npm run db:check` reports missing tables | `supabase/schema.sql` has not been run on that project. Run it, then retry. |
| Console shows `PGRST205` / schema cache errors | Same cause: the schema was never applied to the project the key belongs to. |
| Login fails for a provisioned account | The account may have been created while offline; re-create it in **Users** once connected. |
| “Awaiting Head of Department signature” on a stage you own | The stage carries a signature/seal and only the department head may approve it. Check the officer's designation and department. |
| A HOD sees no signature in the signing dialog | No active signature is registered for them. Issue one in **Signatures** with the owner's exact name, role and department. |
| Faculty cannot see a completed application | By design: closed records are limited to the Registrar and the student's department head. |
| Port 3000 busy | `npm run dev -- --port 3001` |
