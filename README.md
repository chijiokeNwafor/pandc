# Princess & Chijioke wedding invitations

Next.js App Router application for Vercel, with Neon PostgreSQL guest storage and organizer email/password authentication through Auth.js. Public wedding pages and guest passes do not require login.

## Local development

```sh
nvm use
npm ci
cp .env.example .env.local
npm run admin:password
openssl rand -base64 32
```

Edit `.env.local`: set `ADMIN_EMAIL`, paste the generated `ADMIN_PASSWORD_HASH`, and use the random value as `AUTH_SECRET`. Set `DATABASE_URL` to a Neon development database connection string (or a local PostgreSQL URL). Do not commit credentials. Then run:

```sh
npm run db:migrate
npm run dev
```

Open `http://localhost:3000/organizer` and choose organizer sign in. The VS Code `npm: dev` task loads the Node version in `.nvmrc`. There is no registration or automatic first-visitor ownership. Login accepts only the configured email/password, with up to 10 attempts per minute shared across instances. Sessions last eight hours; changing the password hash invalidates existing sessions.

## Deploy to Vercel

1. In your Vercel project, open **Storage → Create Database → Neon** and connect it to the project. Vercel adds `DATABASE_URL` automatically.
2. Import this Git repository in Vercel. Select **Next.js**, Node **24.x**, and the default output directory. The build command is `npm run build`.
3. Set these server-only environment variables in Vercel:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Added by the Neon integration; keep its SSL parameters |
   | `ADMIN_EMAIL` | Organizer login email |
   | `ADMIN_PASSWORD_HASH` | Output of `npm run admin:password` |
   | `AUTH_SECRET` | Output of `openssl rand -base64 32` |
   | `AUTH_URL` | Exact HTTPS deployment origin |
   | `SITE_ORIGIN` | Exact HTTPS origin used by invitations and mutation checks |

4. Before using the app, run `npm run db:migrate` from a trusted terminal with the target `DATABASE_URL` in its environment. This applies versioned migrations transactionally and can be repeated. Builds do not modify the database.
5. Deploy, then verify organizer login, CSV import, invitation download, and check-in. Use separate Neon databases or branches and matching origins for preview deployments.

The repository is prepared for deployment; it does not provision a Neon database or Vercel project. Never prefix any of the variables above with `NEXT_PUBLIC_`.

### Existing Cloudflare or Turso data

The active schema is PostgreSQL; its versioned migrations live in `drizzle/postgres/`. Older SQLite migrations remain in `drizzle/` for reference and are never executed by the current migration command. Existing D1/Turso records are not copied automatically.

Before switching a live site, back up the old database, initialize an empty Neon database with `npm run db:migrate`, and transfer `guests` and `placement` data using PostgreSQL-compatible inserts or CSV import. Preserve guest tokens and check-in timestamps, and omit the new `guests.id` column so PostgreSQL assigns it. Leave `organizer` empty so the configured admin can bind to the new login. Do not execute a SQLite SQL dump against PostgreSQL.

If invitations have already been distributed, retain their original domain and `/pass/<token>` URLs, or arrange redirects from the original site. A different Vercel domain does not update printed QR codes. Stop writes to the old site during the final data transfer to avoid losing check-ins.

## Verification

```sh
npm run build
npm test
npm run test:gallery
npm run lint
```

`npm test` requires Docker. It starts a disposable PostgreSQL 17 container and the production build on port 3107 with generated test credentials, then removes the container. It checks login rejection, forged-header rejection, mutation origin enforcement, import deduplication, atomic check-in, and exported QR decoding. It does not use the configured live Neon database. Test artifacts are written under ignored `work/`.

Gallery files are documented in [GALLERY.md](GALLERY.md). Run `npm run gallery:refresh` after changing images while the dev server is running; dev startup and production builds refresh them automatically.

Deployment references: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Vercel Storage](https://vercel.com/docs/storage), [Auth.js credentials](https://authjs.dev/getting-started/providers/credentials).
