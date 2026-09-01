# GymTrack — Web

Web version of the GymTrack mobile app: same features, same dark electric-blue
design, mobile-first. Two packages:

| Folder    | What                                       | Stack                                   |
| --------- | ------------------------------------------ | --------------------------------------- |
| `server/` | REST API (auth + per-user storage sync)    | Node.js, Express, Prisma, Neon Postgres |
| `client/` | The app (Logger / Progress / Calendar)     | React, TypeScript, Vite                 |

All database access goes through **Prisma** (`server/prisma/schema.prisma`,
client generated into `server/src/generated/prisma`). No raw SQL anywhere.

## Architecture

**Server** — layered, one responsibility per layer:

```
server/src/
├── config/env.js          # validated environment (zod) — fails fast at boot
├── lib/                   # prisma client, jwt, logger (infrastructure)
├── errors/api-error.js    # operational error type ({ detail } contract)
├── middleware/            # auth (Bearer), validation (zod), error pipeline
├── modules/
│   ├── auth/              # routes → controller → service (+ schemas)
│   └── storage/           # routes → controller → service (+ schemas)
├── repositories/          # the only code that touches Prisma
├── app.js                 # Express assembly (helmet, cors, routers, errors)
└── index.js               # bootstrap + graceful shutdown
```

Request flow: `routes → validate/auth middleware → controller → service →
repository → Prisma`. Services throw `ApiError`; the central error handler
serializes them and masks anything unexpected as a 500.

**Client** — feature hooks over a typed API layer:

```
client/src/
├── api/                   # http.ts (fetch wrapper) + auth-api + storage-api
├── constants/             # storage-keys.ts — single source of persisted keys
├── hooks/                 # use-logger / use-progress / use-calendar (data)
├── pages/                 # presentational screens (Login/Logger/Progress/Calendar)
├── components/            # reusable UI (logger/, calendar/, charts/, Sheet)
├── context/auth-context.tsx
├── utils/                 # pure domain logic + storage services
└── theme/                 # design tokens (mirrored by theme.css variables)
```

## 1. Set up the database (Neon)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string from **Connection Details**.
3. Put it in `web/server/.env` as `DATABASE_URL`, then sync the schema:

```bash
cd web/server
npm run db:push
```

## 2. Run the server

```bash
cd web/server
cp .env.example .env   # then paste DATABASE_URL and a JWT_SECRET into .env
npm install            # postinstall runs `prisma generate`
npm run db:push        # first time only — creates the tables on Neon
npm run dev
```

The API listens on `http://localhost:8000`.

## 3. Run the client

```bash
cd web/client
npm install
npm run dev
```

Open `http://localhost:3000`. The Vite dev server proxies `/api/*` to the
Express server, so no extra config is needed.

## Production build

```bash
cd web/client
npm run build
```

Serve `client/dist/` from any static host and set `VITE_API_URL` at build time
if the API lives on a different origin (otherwise same-origin `/api` is used).

## API surface

Identical to the original mobile backend:

- `POST /api/auth/register` — `{ username, password }` → `201 { status, username }`
- `POST /api/auth/login` — `{ username, password }` → `{ access_token, token_type, username }`
- `GET /api/storage` (Bearer) → `[{ key, value }]`
- `POST /api/storage` (Bearer) — `{ key, value }` → `{ status }`
- `DELETE /api/storage/:key` (Bearer) → `{ status }`

All app data (workouts, plans, profile, weekly split, cycle prefs, custom
exercises) lives client-side under `fit.*` keys in localStorage and is mirrored
per-user to the `storage` table, exactly like the mobile app's AsyncStorage
sync.
