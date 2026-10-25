# EasyApply

EasyApply is a university application workflow platform for students, staff, and administrators.

## Features

- Dynamic application forms and service catalog
- Multi-stage review workflows with SLA tracking
- Document uploads, templates, signatures, seals, and QR verification
- Role-based student, staff, and administrator dashboards
- Notifications, audit logs, reporting, and offline browser storage
- Optional Aria application assistant powered by Google Gemini
- Optional Supabase synchronization with realtime updates

## Technology

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Motion
- Lucide React
- Supabase JavaScript client, PostgreSQL, and Realtime
- Google GenAI SDK and Gemini models
- Express and Vercel server handlers
- jsPDF, html2canvas, and QRCode
- Node.js and npm

## Development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env` and fill in only your local values. The `.env` file is ignored by Git and must never be committed. Never use a Supabase `service_role` key in a client build.

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

For the database schema and operational instructions, see [SETUP.md](SETUP.md).

## Validation

```bash
npm run lint
npm run build
```
