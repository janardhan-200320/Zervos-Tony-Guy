# Dashboard Monorepo

This project has been restructured into a monorepo with separate frontend and backend workspaces.

## Structure

```
Dashboard/
├── frontend/              # React + Vite frontend application
│   ├── client/           # Source code
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.ts    # Vite configuration
│   └── tsconfig.json     # Frontend TypeScript config
│
├── backend/              # Express backend server
│   ├── server/          # Server source code
│   ├── shared/          # Shared types and schemas
│   ├── uploads/         # File uploads directory
│   ├── scripts/         # Utility scripts
│   ├── package.json     # Backend dependencies
│   ├── drizzle.config.ts # Database configuration
│   └── tsconfig.json    # Backend TypeScript config
│
└── package.json         # Root workspace configuration

```

## Installation

Install all dependencies for both frontend and backend:

```bash
npm install
```

## Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5001

### Run individually

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Building

Build both frontend and backend:

```bash
npm run build
```

Build individually:

```bash
npm run build:frontend
npm run build:backend
```

## Database

Push database schema changes:

```bash
npm run db:push
```

## Type Checking

Check TypeScript types in both workspaces:

```bash
npm run check
```

## Production

Start the production server:

```bash
npm start
```

## Workspace Structure

This monorepo uses npm workspaces. Each workspace (frontend/backend) has its own:
- `package.json` with specific dependencies
- `tsconfig.json` with appropriate TypeScript configuration
- Independent build and development scripts

The frontend references the backend's `shared/` folder for type sharing.
