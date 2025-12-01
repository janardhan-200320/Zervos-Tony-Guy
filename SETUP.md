# Setup Instructions

## Prerequisites
- Node.js 18+ or higher
- npm (comes with Node.js)
- Git

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/janardhan-200320/dashborad.git
cd dashborad
```

### 2. Install Dependencies
```bash
npm install
```
This will automatically install dependencies for both frontend and backend workspaces.

### 3. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update with your configuration
# Minimum required: DATABASE_URL and SESSION_SECRET
```

**Important:** Generate a secure session secret:
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 4. Database Setup
```bash
# Push database schema
npm run db:push
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev
```

### 6. Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001

## Project Structure

```
Dashboard/
├── frontend/              # React + Vite application
│   ├── client/           # Source code
│   │   └── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/              # Express server
│   ├── server/          # Server source code
│   ├── shared/          # Shared types/schemas
│   ├── scripts/         # Utility scripts
│   ├── package.json
│   ├── drizzle.config.ts
│   └── tsconfig.json
│
├── package.json         # Root workspace configuration
├── .env.example         # Environment template
└── README.md
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend concurrently
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run build` - Build both frontend and backend for production
- `npm run build:frontend` - Build frontend only
- `npm run build:backend` - Build backend only
- `npm start` - Start production server
- `npm run check` - Type check both workspaces
- `npm run db:push` - Push database schema changes

### Frontend (cd frontend)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend (cd backend)
- `npm run dev` - Start Express server with tsx
- `npm run build` - Build with esbuild
- `npm run start` - Start production server

## Environment Variables

Required variables in `.env`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=your-generated-secret-key
PORT=5001
NODE_ENV=development
```

Optional payment gateway variables:
- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Stripe: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`

## Database Configuration

This project uses PostgreSQL with Drizzle ORM.

### Using Local PostgreSQL
```bash
# Install PostgreSQL locally
# Update .env with your local database URL
DATABASE_URL=postgresql://postgres:password@localhost:5432/dashboard

# Push schema
npm run db:push
```

### Using Neon (Serverless PostgreSQL)
```bash
# Create account at https://neon.tech
# Create a new project and copy connection string
DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/dbname

# Push schema
npm run db:push
```

## Troubleshooting

### Port Already in Use
If ports 5173 or 5001 are already in use:

**Frontend:** Edit `frontend/vite.config.ts`
```typescript
server: {
  port: 3000, // Change to your preferred port
}
```

**Backend:** Edit `.env`
```env
PORT=5002  # Change to your preferred port
```

Also update the proxy in `frontend/vite.config.ts`:
```typescript
proxy: {
  "/api": {
    target: "http://localhost:5002", // Match your backend port
  }
}
```

### Database Connection Errors
- Verify `DATABASE_URL` is correct in `.env`
- Ensure PostgreSQL is running
- Check network connectivity to database host
- Verify database exists and credentials are correct

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
```

### Build Errors
```bash
# Clear build outputs
rm -rf dist frontend/dist backend/dist

# Type check for errors
npm run check

# Rebuild
npm run build
```

### Vite Config Errors
If you see `Cannot find module vite.config`:
```bash
# Ensure file structure is correct
ls frontend/vite.config.ts  # Should exist
```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   npm run dev  # Test in development
   npm run check  # Type check
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request** on GitHub

## Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
NODE_ENV=production npm start
```

### Environment Variables for Production
Ensure these are set in production:
- `NODE_ENV=production`
- `DATABASE_URL` (production database)
- `SESSION_SECRET` (strong random secret)
- Any payment gateway keys if using payments

## Team Onboarding Checklist

- [ ] Clone repository
- [ ] Install Node.js 18+
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Generate and set `SESSION_SECRET`
- [ ] Configure `DATABASE_URL`
- [ ] Run `npm run db:push`
- [ ] Run `npm run dev`
- [ ] Access http://localhost:5173

## Getting Help

- Check existing issues on GitHub
- Review documentation in `/docs` folder
- Contact team lead or maintainers

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please follow the existing code style and include tests when applicable.
