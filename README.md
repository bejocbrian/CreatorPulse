# CreatorPulse Authentication System

A production-ready JWT-based authentication system with email/password and Google OAuth integration.

## Features

- **Email/Password Authentication**
  - Secure signup with password hashing (bcrypt)
  - Login with JWT access tokens
  - Refresh token rotation with secure cookie storage
  - Email verification
  - Password reset flow

- **Google OAuth Integration**
  - Server-side OAuth flow
  - Client-side ID token verification
  - Account linking (email + Google)

- **Security Features**
  - JWT access tokens (15min expiry)
  - Refresh tokens (7 days, httpOnly cookies)
  - Password hashing with bcrypt (12 rounds)
  - Rate limiting on auth endpoints
  - CORS configuration
  - Helmet security headers
  - Input validation with Zod

- **Protected Routes**
  - JWT verification middleware
  - User info attached to request
  - Proper error handling

## Tech Stack

### Backend
- Node.js + Express
- Prisma ORM + PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs
- Google Auth Library
- Nodemailer

### Frontend
- React 18 + TypeScript
- React Router v6
- Zustand (state management)
- React Hook Form + Zod (validation)
- Axios (HTTP client)
- TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console project (for OAuth)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:

```bash
npx prisma db push
npx prisma generate
```

4. Start the development servers:

```bash
npm run dev
```

This starts both the backend (port 4000) and frontend (port 3000).

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Login/register with Google ID token |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and revoke refresh token |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user (protected) |

### Request/Response Examples

#### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "creatorType": "YOUTUBE",
  "currency": "USD",
  "payoutRegion": "US"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "creatorType": "YOUTUBE",
    "isVerified": false
  },
  "accessToken": "eyJhbG..."
}
```

#### Google Auth
```bash
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "eyJhbGci..."
}
```

#### Protected Request
```bash
GET /api/auth/me
Authorization: Bearer <access_token>
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/creatorpulse"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@creatorpulse.com"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

## Frontend Integration

### Using the Auth Hook

```tsx
import { useAuth } from './hooks/useAuth';

function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      // Navigate to dashboard
    }
  };
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

<ProtectedRoute redirectTo="/auth/login">
  <Dashboard />
</ProtectedRoute>
```

### Auto-Refresh

The API client automatically handles token refresh on 401 responses:

```tsx
import api from './lib/api';

// Tokens are refreshed automatically
// and requests are retried with new token
```

## Security Considerations

1. **Password Storage**: Passwords are hashed with bcrypt (12 rounds)
2. **Token Security**: 
   - Access tokens are short-lived (15 min)
   - Refresh tokens rotate on each use
   - Refresh tokens stored in httpOnly cookies
3. **Input Validation**: All inputs validated with Zod schemas
4. **Rate Limiting**: 100 requests per 15 minutes on auth endpoints
5. **CORS**: Configured for specific frontend origin
6. **Security Headers**: Helmet middleware enabled

## Production Deployment

1. Set strong secrets for JWT and database
2. Enable HTTPS for cookies
3. Use a production email service (SendGrid, AWS SES)
4. Configure proper CORS for your domain
5. Set up rate limiting for production
6. Monitor and rotate secrets regularly
