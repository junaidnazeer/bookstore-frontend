# Bookstore Frontend

Next.js (Pages Router) + Tailwind CSS frontend for the bookstore project.

## Stack
- Next.js (Pages Router)
- Tailwind CSS
- Axios for API calls

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in real values:
   ```bash
   cp .env.example .env.local
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```
   App runs at http://localhost:3000

## Before your first commit

Run `git status` and confirm `.env.local` does NOT appear in the list of
files to be committed. If it does, stop and check `.gitignore` before
committing anything.

## Project structure

```
pages/          route-based pages (Next.js Pages Router)
components/     reusable UI components
lib/api.js      shared axios instance, reads NEXT_PUBLIC_API_URL
styles/         global Tailwind styles
```

## Backend

This frontend expects the backend API described in `API_CONTRACT.md`
(shared doc) to be running at the URL set in `NEXT_PUBLIC_API_URL`.
See the `bookstore-backend` repo, owned by Murtaza Badam.

## Git identity

Before committing, confirm your git identity is set correctly on this
machine:
```bash
git config user.name
git config user.email
```
Should show your own name and email — not a shared or default account.
