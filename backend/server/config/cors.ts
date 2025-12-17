import type { CorsOptions } from 'cors';

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5176',
];

export const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') ?? defaultOrigins).filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
