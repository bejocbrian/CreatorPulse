# CreatorPulse Frontend

React frontend for CreatorPulse with authentication flows.

## Features

- Email/Password authentication
- Google OAuth integration (Google Identity Services)
- Email verification flow
- Password reset flow
- Protected routes
- Automatic token refresh
- Form validation with react-hook-form and Zod
- State management with Zustand
- API client with Axios interceptors

## Tech Stack

- React 18 with TypeScript
- React Router v6
- TailwindCSS for styling
- react-hook-form for form management
- Zod for schema validation
- Zustand for state management
- Axios for API calls

## Prerequisites

- Node.js 18+
- Backend API running

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
- `VITE_API_URL` - Backend API URL
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Pages

### Authentication

- `/auth/login` - Login page with email/password and Google OAuth
- `/auth/signup` - Registration page with creator type selection
- `/auth/verify-email` - Email verification flow
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Reset password with token

### Protected

- `/` - Dashboard (requires authentication)

## Components

- `ProtectedRoute` - Wrapper component for protected routes
- `GoogleOAuthButton` - Google OAuth sign-in button

## Hooks

- `useAuth` - Access auth state and actions

## API Client

The API client (`src/lib/api.ts`) includes:
- Automatic JWT token injection
- Token refresh on 401 errors
- Auto-redirect to login on auth failure

## Environment Variables

Make sure to configure these in your `.env` file:

```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new OAuth 2.0 client ID
3. Add your domain to authorized JavaScript origins
4. Copy the client ID to `.env` as `VITE_GOOGLE_CLIENT_ID`
