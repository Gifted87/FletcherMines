# Fletcher Mines

Fletcher Mines is a Next.js web application prototype for a cloud-mining dashboard. It includes account flows, a mining-block portfolio, yield calculators, referral and daily-task interfaces, treasury workflows, and an administrative console. The application uses SQLite for local persistence.

> **Prototype notice:** This repository contains demonstration data and simulated financial balances and activity. It does not connect to a verified mining operation or provide real deposits, withdrawals, or investment returns. Do not send funds or use this software to make financial decisions. The displayed rates and balances are application data, not promises or evidence of real returns.

## Features

- Next.js App Router interface built with React and TypeScript
- Signup, login, session cookies, referral handling, and dashboard views
- SQLite-backed account, task, transaction, mining-block, and admin data
- Administrative screens for account review, announcements, treasury queues, and settings
- TRON/TRC-20 themed deposit interface; treasury actions are application workflows and are not on-chain integrations

## Technology

- Node.js
- Next.js 16
- React 19
- TypeScript
- SQLite through `better-sqlite3`
- `bcryptjs` for password hashing

## Getting started

Use a supported Node.js release, then install dependencies and start the development server:

```bash
npm install
cp .env.example .env.local
```

Set a unique, strong `ADMIN_PASSWORD` in `.env.local` before opening the admin interface. Never commit `.env.local` or real credentials.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database is stored at `data/fletcher_mines.db` during local development. The application initializes its schema when the database module is loaded. Treat the database as local development data; it may contain seeded demonstration records.

## Available scripts

```bash
npm run dev    # Start the development server
npm run build  # Build the application
npm start      # Start the production server
npm run lint   # Run ESLint
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password used by the administrative login flow; configure a strong, unique value outside source control. |
| `NODE_ENV` | Node.js runtime mode. |

## Security and deployment

This codebase is a prototype, not a production financial service. Review authentication, session signing, authorization, database persistence, input validation, and treasury handling before any deployment. In particular, the session token implementation should not be treated as secure authentication for a public service, and SQLite storage in serverless environments is ephemeral. Do not deploy this application with real users, funds, credentials, or financial records without a thorough independent security and operational review.

## License

No license is currently specified. All rights remain with the copyright holder unless a license is added.
