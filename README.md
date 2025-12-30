# CreatorPulse - Authentication System

Full-stack authentication system for CreatorPulse with JWT-based authentication and Google OAuth integration.

## Overview

This repository contains a complete authentication system with:

- **Backend**: Node.js/Express API with TypeScript
- **Frontend**: React application with TypeScript and TailwindCSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens + Google OAuth
- **Features**: Email verification, password reset, token refresh

## Tech Stack

### Backend
- Node.js & Express
- TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication (jsonwebtoken)
- Google OAuth (google-auth-library)
- Password hashing (bcrypt)
- Email service (nodemailer)
- Validation (zod)
- Security: helmet, cors, rate limiting

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router v6
- TailwindCSS for styling
- react-hook-form for forms
- Zod for validation
- Zustand for state management
- Axios for API calls

## Project Structure

```
creatorpulse/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── config/          # Database, JWT config
│   │   ├── controllers/     # Auth controllers
│   │   ├── middleware/      # Auth middleware, validation
│   │   ├── routes/          # API routes
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── services/        # Email, OAuth services
│   │   ├── utils/           # Password utilities
│   │   └── index.ts         # App entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks (useAuth)
│   │   ├── lib/             # API client
│   │   ├── pages/           # Page components
│   │   ├── schemas/         # Zod validation
│   │   ├── store/           # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials (optional, for Google login)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- SMTP settings for email (Gmail recommended for development)

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Start the development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Features

### Authentication Flows

1. **Email/Password Signup**
   - User provides email, password, name, and creator preferences
   - Password is hashed with bcrypt
   - Verification email is sent
   - JWT and refresh tokens are returned

2. **Email/Password Login**
   - User provides email and password
   - Password is verified
   - JWT and refresh tokens are returned
   - Refresh token stored in httpOnly cookie

3. **Google OAuth**
   - User signs in with Google
   - ID token is verified with Google API
   - User is created or fetched
   - JWT and refresh tokens are returned

4. **Email Verification**
   - User clicks link from email
   - Token is verified
   - Account is marked as verified

5. **Password Reset**
   - User requests reset via email
   - Reset token sent via email
   - User sets new password
   - All refresh tokens are invalidated

6. **Token Refresh**
   - Access token expires after 15 minutes
   - Frontend automatically requests new token using refresh token
   - Refresh token expires after 7 days

### Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Refresh tokens stored in httpOnly, secure cookies
- Token rotation on refresh
- Rate limiting on all auth endpoints
- CORS configured for frontend origin
- Helmet.js security headers
- SQL injection protection via Prisma
- XSS protection via React

## API Endpoints

### Public Routes

- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login with credentials
- `POST /auth/google` - Login with Google OAuth
- `POST /auth/verify-email` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Protected Routes

- `GET /auth/me` - Get current user profile

## Database Schema

### User Model
- `id` - Unique identifier
- `email` - User email (unique)
- `password` - Hashed password (nullable for OAuth users)
- `name` - User's full name
- `creatorType` - Creator type (streamer, youtuber, etc.)
- `currency` - Preferred currency
- `payoutRegion` - Payout region
- `isVerified` - Email verification status
- `googleId` - Google OAuth ID
- `createdAt` - Account creation date

### Related Models
- `RefreshToken` - Stores refresh tokens
- `EmailVerification` - Stores email verification tokens
- `PasswordReset` - Stores password reset tokens

## Google OAuth Setup

### Backend

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to APIs & Services > Credentials
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Frontend

1. Use the same Google OAuth Client ID
2. Add authorized JavaScript origin: `http://localhost:3000`
3. Copy Client ID to frontend `.env`

## Email Configuration

For development, you can use Gmail with an App Password:

1. Go to Google Account > Security
2. Enable 2-Step Verification
3. Generate an App Password
4. Use the App Password in `.env` as `SMTP_PASS`

For production, consider using:
- SendGrid
- Mailgun
- Amazon SES
- Postmark

## Development

### Backend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run prisma:studio  # Open Prisma Studio
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Production Considerations

- Use strong, unique JWT secrets
- Enable HTTPS
- Use environment variables for all sensitive data
- Set `NODE_ENV=production`
- Use a production database (e.g., AWS RDS, Heroku Postgres)
- Use a production email service
- Configure proper CORS origins
- Set secure cookie flags
- Implement proper logging and monitoring
- Set up database backups

## License

Proprietary - All rights reserved
