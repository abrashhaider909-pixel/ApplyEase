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

## Configuration and security

Runtime configuration is managed outside the repository through the local
development environment or the deployment platform's protected configuration
store. Never commit credentials, access tokens, private keys, or connection
strings to source control.

The application uses public client configuration for browser integrations and
server-side configuration for protected operations. Supabase service-role
credentials must never be exposed to the browser or included in a client build.
For database setup and operational guidance, see [SETUP.md](SETUP.md).

## AI Tools and Development Acknowledgments

The development of EasyApply was supported by the following tools:

- **Kiro IDE** — Used as the development environment for building and refining the application.
- **Kiro AI features** — Used for AI-assisted development tasks, where applicable.
- **GitHub Copilot** — Used for coding assistance, code suggestions, and implementation support.

These tools assisted the development process. The developer remains responsible
for reviewing the code, testing the application, and making final implementation
decisions.

## Validation

```bash
npm run lint
npm run build
```
