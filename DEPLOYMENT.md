# Deployment Guide

This guide covers deploying the CreatorPulse authentication system to production.

## Production Checklist

- [ ] Generate strong JWT secrets
- [ ] Configure production database
- [ ] Set up production email service
- [ ] Configure Google OAuth for production
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure environment variables
- [ ] Set up domain and DNS
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Enable database backups

## Deployment Options

### Option 1: Railway (All-in-One)

Railway allows you to deploy both backend, frontend, and database in one place.

#### Deploy Backend
1. Create a Railway account
2. Connect your GitHub repository
3. Add a new service from your repo
4. Select the backend directory
5. Configure environment variables
6. Deploy

#### Deploy Frontend
1. Add another service for frontend
2. Select the frontend directory
3. Configure build command: `npm run build`
4. Configure start command: `npm run preview`
5. Configure environment variables
6. Deploy

#### Deploy Database
1. Add a PostgreSQL service
2. Copy the database connection string
3. Add to backend environment variables as `DATABASE_URL`

### Option 2: Vercel + Render

#### Frontend on Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in frontend directory
3. Configure project settings
4. Add environment variables in Vercel dashboard

#### Backend on Render
1. Create Render account
2. Connect GitHub repository
3. Select backend directory
4. Configure build command: `npm run build`
5. Configure start command: `npm start`
6. Add environment variables
7. Add a PostgreSQL database
8. Deploy

### Option 3: AWS

#### Frontend on AWS Amplify
1. Create Amplify project
2. Connect GitHub repository
4. Configure build settings
5. Add environment variables
6. Deploy

#### Backend on AWS Elastic Beanstalk
1. Create Elastic Beanstalk application
2. Upload backend code
3. Configure environment variables
4. Configure database (RDS)
5. Deploy

### Option 4: Docker Deployment

#### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

#### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=creatorpulse
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Environment Variables for Production

### Backend
```env
NODE_ENV=production
PORT=5000

# Database (use production connection string)
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT Secrets (generate new, secure secrets)
JWT_SECRET=<generate-new-32-char-secret>
JWT_REFRESH_SECRET=<generate-new-32-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback

# Email (use production service)
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
EMAIL_FROM=CreatorPulse <noreply@yourdomain.com>

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Frontend
```env
VITE_API_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=<production-client-id>
```

## Production Database Setup

### Using Supabase
1. Create Supabase account
2. Create a new project
3. Get database connection string
4. Add to backend environment variables
5. Run migrations: `npx prisma db push`

### Using AWS RDS
1. Create RDS instance
2. Configure security groups
3. Get connection string
4. Add to environment variables
5. Run migrations

### Using Railway PostgreSQL
1. Create PostgreSQL service in Railway
2. Get connection string
3. Add to backend service
4. Run migrations in backend deployment

## Email Service for Production

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=<your-mailgun-username>
SMTP_PASS=<your-mailgun-password>
```

### AWS SES
```env
SMTP_HOST=email-smooth.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<your-ses-smtp-username>
SMTP_PASS=<your-ses-smtp-password>
```

## Google OAuth Production Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services > Credentials
4. Edit your OAuth 2.0 Client ID
5. Add production domains to:
   - Authorized JavaScript origins
   - Authorized redirect URIs

### Required Origins:
- `https://yourdomain.com`

### Required Redirect URIs:
- `https://api.yourdomain.com/auth/google/callback`

## SSL/HTTPS Setup

### Vercel (Automatic)
Vercel provides automatic SSL certificates.

### Railway (Automatic)
Railway provides automatic SSL certificates.

### Nginx (Custom)
```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Let's Encrypt (Free)
```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## Monitoring and Logging

### Application Monitoring
- **Sentry**: https://sentry.io/ - Error tracking
- **LogRocket**: https://logrocket.com/ - User session replay
- **Datadog**: https://www.datadoghq.com/ - Full monitoring

### Logging Services
- **Papertrail**: https://papertrailapp.com/
- **Loggly**: https://www.loggly.com/
- **AWS CloudWatch**: https://aws.amazon.com/cloudwatch/

### Uptime Monitoring
- **UptimeRobot**: https://uptimerobot.com/
- **StatusCake**: https://www.statuscake.com/
- **Pingdom**: https://www.pingdom.com/

## Database Backups

### Automated Backups
- **AWS RDS**: Automatic backups enabled
- **Railway**: Daily backups included
- **Supabase**: Point-in-time recovery
- **Manual backups**: Run `pg_dump` regularly

### Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DATABASE_URL="your-database-url"

mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"
```

## Scaling Considerations

### Horizontal Scaling
- Use a load balancer (Nginx, AWS ELB)
- Run multiple backend instances
- Use Redis for session storage (if needed)

### Database Scaling
- Use connection pooling (PgBouncer)
- Read replicas for read-heavy workloads
- Consider sharding for large scale

### CDN for Frontend
- Serve static assets via CDN
- Use Vercel's edge network
- Configure cache headers

## Security Hardening

### Firewall Rules
- Only allow necessary ports (80, 443, SSH)
- Restrict database access
- Use VPN for admin access

### Dependencies
- Regularly update dependencies
- Use `npm audit` to check vulnerabilities
- Automate dependency updates

### Rate Limiting
- Increase rate limits for production
- Implement IP-based blocking for abuse
- Use CAPTCHA for suspicious activity

## Health Checks

Add a health check endpoint (already exists):
```
GET /health
```

Configure load balancer to check this endpoint.

## Rollback Plan

### Database Rollback
1. Keep recent backups
2. Document migration steps
3. Test rollback procedure

### Code Rollback
- Use Git tags for releases
- Keep previous deployments available
- Automate rollback with deployment platform

## Post-Deployment Checklist

- [ ] Test all authentication flows
- [ ] Verify email sending
- [ ] Test Google OAuth
- [ ] Test password reset
- [ ] Verify token refresh
- [ ] Check error logging
- [ ] Test database backups
- [ ] Verify SSL certificates
- [ ] Test CORS configuration
- [ ] Monitor resource usage
- [ ] Set up alerts
- [ ] Document deployment process

## Support Resources

- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app/
- AWS: https://docs.aws.amazon.com/
- Render: https://render.com/docs
- DigitalOcean: https://docs.digitalocean.com/
