# CreatorPulse - JWT Authentication System

A production-ready authentication system with JWT tokens, Google OAuth, email verification, and password reset functionality.

## Features

### Backend (Node.js/Express)
- **Email + Password Authentication**
  - User signup with email verification
  - Secure login with bcrypt password hashing
  - JWT access tokens (15 min expiration)
  - Refresh tokens with HTTP-only cookies (7 days)
  
- **Google OAuth**
  - Google ID token verification
  - Automatic account linking
  - One-tap authentication support

- **Security Features**
  - Password strength validation
  - Rate limiting (100 requests per 15 min)
  - CORS protection
  - Helmet.js security headers
  - HTTP-only cookies for refresh tokens

- **Password Management**
  - Forgot password email flow
  - Secure password reset tokens
  - 1-hour reset token expiration

- **Token Management**
  - Refresh token rotation
  - Logout (single device)
  - Logout all devices

### Frontend (React/Vite)
- **Authentication Pages**
  - Login page with email/password + Google OAuth
  - Signup with creator type selection
  - Email verification page
  - Forgot password page
  - Reset password page

- **State Management**
  - Zustand store for auth state
  - useAuth hook for easy access
  - Persistent authentication

- **API Client**
  - Axios interceptors for automatic token injection
  - Automatic token refresh on 401 responses
  - Protected route component

- **Form Validation**
  - react-hook-form integration
  - Zod schema validation
  - Password strength requirements

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Google Auth Library
- Nodemailer
- Zod

### Frontend
- React 18
- Vite
- TypeScript
- React Router DOM
- React Hook Form
- Zod
- Zustand
- Axios

## Installation

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env`:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/creatorpulse

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@creatorpulse.com

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

BCRYPT_ROUNDS=12
```

Start the backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Configure `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Install Tailwind CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Start the frontend:
```bash
npm run dev
```

## API Endpoints

### Authentication

```
POST /auth/signup
Body: { email, password, name, creator_type, currency, payout_region }
Response: { accessToken, user }

POST /auth/login
Body: { email, password }
Response: { accessToken, user }
Cookie: refreshToken (httpOnly)

POST /auth/google
Body: { idToken }
Response: { accessToken, user }
Cookie: refreshToken (httpOnly)

POST /auth/refresh
Body: { refreshToken }
Response: { accessToken }

POST /auth/logout
Headers: Authorization: Bearer <token>
Response: { message }

POST /auth/logout-all
Headers: Authorization: Bearer <token>
Response: { message }

GET /auth/me
Headers: Authorization: Bearer <token>
Response: { user }

POST /auth/verify-email
Body: { token }
Response: { message }

POST /auth/forgot-password
Body: { email }
Response: { message }

POST /auth/reset-password
Body: { token, password }
Response: { message }
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: Add your frontend URL
5. Copy Client ID and Client Secret
6. Add to backend `.env` and frontend `.env`

## Email Service Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `.env` as `SMTP_PASSWORD`

Alternatively, use SendGrid, Mailgun, or any other SMTP service.

## Security Considerations

- All passwords are hashed with bcrypt (12 rounds)
- JWT access tokens expire in 15 minutes
- Refresh tokens are stored in HTTP-only cookies
- CORS is configured to only allow requests from frontend
- Rate limiting prevents brute force attacks
- Input validation with Zod schemas
- Helmet.js adds security headers

## Testing the System

### With Postman
Import the provided Postman collection and test each endpoint.

### Manual Testing
1. Navigate to http://localhost:5173
2. Click "Create account"
3. Fill in the form and submit
4. Check your email for verification link
5. After verification, login with your credentials
6. You should be redirected to the dashboard

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── models/
│   │   │   ├── User.model.ts
│   │   │   └── RefreshToken.model.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── google.service.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── password.ts
│   │   ├── validators/
│   │   │   └── auth.validator.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── googleAuth.ts
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Signup.tsx
│   │   │   │   ├── VerifyEmail.tsx
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── store/
│   │   │   └── auth.store.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── validations/
│   │   │   └── auth.schema.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## License

MIT
