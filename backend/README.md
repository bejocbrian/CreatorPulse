# CreatorPulse Backend

Authentication API for CreatorPulse with JWT and Google OAuth support.

## Features

- JWT-based authentication
- Email/Password signup and login
- Google OAuth integration
- Email verification
- Password reset flow
- Refresh token rotation
- Protected routes middleware
- Secure httpOnly cookies

## Prerequisites

- Node.js 18+
- PostgreSQL database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database connection string
- JWT secrets (generate secure random strings)
- Google OAuth credentials
- SMTP configuration for emails

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Start development server:
```bash
npm run dev
```

## API Routes

### Authentication

- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Login with Google OAuth
- `POST /auth/verify-email` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (invalidate refresh token)
- `GET /auth/me` - Get current user (protected)

## Database Schema

The application uses Prisma ORM with PostgreSQL. See `prisma/schema.prisma` for the database schema.

## Security

- Passwords are hashed with bcrypt (12 salt rounds)
- JWT tokens with configurable expiration
- Refresh tokens stored in httpOnly cookies
- Rate limiting on API routes
- Helmet.js for security headers
- CORS configured for frontend origin
