# Tether Vault

Personal iOS-friendly web app that pulls markdown notes from one private GitHub repository and renders them in a mobile-first file browser.

## What it does

- Uses a fixed repository configured by env vars (no repository picker in UI)
- Loads all `.md` files from your repo and displays folder tree navigation
- Opens and renders markdown, including basic Obsidian `[[wikilink]]` conversion
- Auto-syncs when the app opens and when it returns to foreground
- Keeps your GitHub token server-side through Next.js route handlers
- Includes PWA manifest for install-to-home-screen behavior

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy env template and set your private repository values:

```bash
cp .env.example .env.local
```

Required env vars:

- `GITHUB_TOKEN`: GitHub PAT with read access to your private repo (`repo` scope or fine-grained equivalent)
- `GITHUB_OWNER`: your GitHub username/org
- `GITHUB_REPO`: your vault repository name

3. Start development server:

```bash
pnpm dev
```

4. Open `http://localhost:3000`

## iOS install

1. Deploy this app to your host (Vercel, VPS, etc.) over HTTPS
2. Open the app URL in Safari on iPhone
3. Share -> Add to Home Screen

## Security notes

- `GITHUB_TOKEN` is used only in server route handlers (`src/app/api/vault/*`)
- Do not expose or prefix token with `NEXT_PUBLIC_`
- Keep `.env.local` out of source control

## Scripts

- `pnpm dev` - run dev server
- `pnpm lint` - run linter
- `pnpm build` - production build
- `pnpm start` - start production server
