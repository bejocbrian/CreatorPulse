# CreatorPulse Authentication System - Setup Guide

This guide will help you set up the complete authentication system with JWT and Google OAuth.

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:migrate
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## Detailed Setup

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or cloud)
- Google Cloud account (for OAuth)

### Environment Configuration

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/creatorpulse"

# Server
PORT=5000
NODE_ENV=development

# JWT Secrets (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=CreatorPulse <noreply@creatorpulse.com>

# Frontend
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API

2. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure consent screen (External, add your domain)
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5000/auth/google/callback` (development)
     - `https://api.yourdomain.com/auth/google/callback` (production)

3. **Copy Credentials**
   - Copy Client ID and Client Secret
   - Add to backend `.env` and frontend `.env`

### Email Configuration

#### Gmail (Development)

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password:
   - Go to Account > Security > 2-Step Verification
   - Select "App passwords"
   - Generate a new password for "Mail"
3. Use the app password in `.env` as `SMTP_PASS`

#### Production Email Services

For production, consider using:
- **SendGrid**: https://sendgrid.com/
- **Mailgun**: https://www.mailgun.com/
- **AWS SES**: https://aws.amazon.com/ses/
- **Postmark**: https://postmarkapp.com/

Update your `.env` with the appropriate SMTP settings.

### Database Setup

#### Using Local PostgreSQL

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE creatorpulse;
   ```
3. Update `DATABASE_URL` in `.env`

#### Using Cloud PostgreSQL

Options:
- **Supabase**: https://supabase.com/ (Free tier available)
- **Neon**: https://neon.tech/ (Free tier available)
- **Render**: https://render.com/
- **AWS RDS**: https://aws.amazon.com/rds/

After setting up your database, run migrations:
```bash
cd backend
npm run prisma:migrate
```

### Running the Application

#### Development Mode

Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

#### Production Mode

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting
```

## Testing the Authentication

### 1. Email/Password Signup
- Navigate to `http://localhost:3000/auth/signup`
- Fill in the form
- Check your email for verification link
- Click the link to verify

### 2. Email/Password Login
- Navigate to `http://localhost:3000/auth/login`
- Enter your credentials
- You'll be redirected to the dashboard

### 3. Google OAuth
- Click "Continue with Google"
- You'll be redirected to Google
- Authorize the application
- You'll be redirected back and logged in

### 4. Password Reset
- Click "Forgot your password?" on login page
- Enter your email
- Check your email for reset link
- Set a new password

### 5. Token Refresh
- The system automatically refreshes tokens
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days

## API Endpoints

### Public
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /auth/google` - Google OAuth (ID token flow)
- `GET /auth/google` - Initiate server-side OAuth
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/verify-email` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Protected
- `GET /auth/me` - Get current user

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

### Email Not Sending
- Check SMTP credentials
- For Gmail, use an App Password
- Check spam folder
- Verify SMTP port (587 for TLS, 465 for SSL)

### Google OAuth Fails
- Verify Client ID and Secret
- Check redirect URIs match exactly
- Ensure OAuth consent screen is configured
- Check browser console for errors

### JWT Token Issues
- Verify JWT secrets are set
- Check token expiration times
- Clear browser cookies and localStorage
- Ensure both frontend and backend use same secrets

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env`
- Check CORS configuration in backend
- Ensure both are using same protocol (http/https)

## Security Best Practices

1. **Never commit `.env` files to git**
2. **Use strong, random JWT secrets** (min 32 characters)
3. **Enable HTTPS in production**
4. **Use environment variables for all sensitive data**
5. **Set `NODE_ENV=production` in production**
6. **Use a production email service**
7. **Implement proper logging and monitoring**
8. **Regularly update dependencies**
9. **Set up database backups**
10. **Use a secrets manager** (AWS Secrets Manager, HashiCorp Vault)

## Deployment

### Backend Deployment Options
- **Railway**: https://railway.app/
- **Render**: https://render.com/
- **Heroku**: https://www.heroku.com/
- **AWS Elastic Beanstalk**: https://aws.amazon.com/elasticbeanstalk/
- **DigitalOcean App Platform**: https://www.digitalocean.com/

### Frontend Deployment Options
- **Vercel**: https://vercel.com/
- **Netlify**: https://www.netlify.com/
- **AWS Amplify**: https://aws.amazon.com/amplify/
- **Cloudflare Pages**: https://pages.cloudflare.com/

### Database Deployment
- **Supabase**: https://supabase.com/
- **Neon**: https://neon.tech/
- **AWS RDS**: https://aws.amazon.com/rds/
- **Google Cloud SQL**: https://cloud.google.com/sql

## Support

For issues or questions:
1. Check the README.md
2. Review this setup guide
3. Check error logs
4. Verify environment configuration
5. Ensure all prerequisites are met
