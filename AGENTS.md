# Repository Guidelines

## Project Structure

- `src/App.jsx` contains the React application, screens, dialogs, and user interactions.
- `src/lib/backend.js` handles Supabase authentication and data operations; `src/lib/legacySpreadsheet.js` parses the roster workbook.
- `src/styles.css` contains global, responsive, and light/dark theme styles. `src/main.jsx` starts the app.
- `public/` holds PWA icons, manifest, and service worker.
- `supabase/migrations/` contains ordered SQL migrations. Add schema changes as a new timestamped migration; do not edit an already deployed migration.

## Development and Build Commands

- `npm install` installs the dependencies declared in `package-lock.json`.
- `npm run dev` starts the Vite development server.
- `npm run build` creates the production bundle in `dist/`.
- `npm run preview` serves the built bundle locally.

Node.js must satisfy the version range in `package.json`; `.node-version` specifies the repository’s preferred version. No automated test or lint command is currently configured.

## Code Style and Naming

Use JavaScript ES modules and React function components. Follow the existing two-space indentation. Name React components in `PascalCase`, variables and functions in `camelCase`, CSS classes in `kebab-case`, and PostgreSQL tables/columns in `snake_case`. Keep Supabase queries in `src/lib/backend.js` rather than embedding database calls in UI components. Match existing Portuguese interface wording and support both themes and narrow screens when changing UI.

## Testing and Review

There is no test suite yet. For code changes, run `npm run build` and manually review affected screens in the browser. For database changes, inspect the migration and confirm it applies in order before relying on the feature.

## Commits and Pull Requests

Recent commits use short imperative subjects, such as `Add configurable event types` and `Prevent production demo fallback`. Keep commits focused and describe the user-visible change. Pull requests should explain behavior changes, include screenshots for visual updates, list migration or configuration steps, and report the build result.

## Security and Configuration

Use `.env.local` for local Supabase credentials; it is ignored by Git. Only the project URL and publishable client key belong in `VITE_*` variables. Never expose a Supabase secret or service-role key in browser code. Commit new database migrations with the application changes that depend on them.
