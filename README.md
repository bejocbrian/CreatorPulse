# Checklist Subscription Backend

A production-ready backend API for checklist and document management with Stripe subscription integration, usage metrics tracking, and comprehensive AWS deployment support.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Owner, Admin, Member)
- Secure password hashing with bcrypt

### 💳 Stripe Integration
- Subscription management (FREE, STARTER, PROFESSIONAL, ENTERPRISE tiers)
- Checkout session creation
- Customer portal access
- Webhook event processing
- Automated invoice and receipt handling

### 📊 Usage Metrics
- Real-time usage tracking (documents, storage, checklists)
- Historical usage data
- Subscription limit enforcement
- Admin dashboard data endpoints

### 📧 Email Service
- AWS SES integration
- Receipt generation and delivery
- Invitation emails
- Subscription confirmations
- HTML and text email templates

### 📄 PDF Generation
- Automated receipt PDF generation
- S3 storage integration
- Customizable templates

### 🗄️ Database
- PostgreSQL with Prisma ORM
- Type-safe database queries
- Automated migrations
- Connection pooling

### 📝 Logging & Monitoring
- Structured JSON logging with Winston
- Daily log rotation
- CloudWatch integration
- Request/response logging
- Error tracking

### 🚀 Production Ready
- Docker containerization
- AWS ECS/Fargate deployment
- Health check endpoints
- Graceful shutdown handling
- Environment-based configuration

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Stripe
- **Storage**: AWS S3
- **Email**: AWS SES
- **Logging**: Winston
- **Container**: Docker
- **Deployment**: AWS ECS/Fargate

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- AWS Account (for production)
- Stripe Account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd checklist-subscription-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

5. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Project Structure

```
.
├── src/
│   ├── config/           # Configuration management
│   ├── db/               # Database client
│   ├── middleware/       # Express middleware
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── docs/
│   ├── API.md            # API documentation
│   ├── DEPLOYMENT.md     # Deployment guide
│   ├── USER_GUIDE.md     # End-user guide
│   └── openapi.yaml      # OpenAPI specification
├── Dockerfile            # Docker container definition
├── docker-compose.yml    # Docker Compose configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Subscriptions
- `POST /api/v1/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/v1/stripe/create-portal-session` - Access customer portal
- `GET /api/v1/stripe/subscription` - Get subscription details
- `POST /api/v1/stripe/cancel-subscription` - Cancel subscription
- `POST /api/v1/stripe/webhook` - Stripe webhook handler

### Usage Metrics
- `GET /api/v1/usage/current` - Get current usage
- `GET /api/v1/usage/limits` - Check usage limits
- `GET /api/v1/usage/history` - Get usage history
- `POST /api/v1/usage/record` - Record usage metrics

### Health
- `GET /health` - Health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

See [API Documentation](docs/API.md) for detailed endpoint information.

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# S3
S3_BUCKET_NAME=your-bucket

# SES
SES_FROM_EMAIL=noreply@yourdomain.com
```

### Subscription Tiers

Configure limits in environment variables or `src/config/index.ts`:

| Tier | Documents | Storage | Checklists |
|------|-----------|---------|------------|
| FREE | 10 | 100 MB | 5 |
| STARTER | 100 | 1 GB | 50 |
| PROFESSIONAL | 1,000 | 10 GB | 500 |
| ENTERPRISE | Unlimited | Unlimited | Unlimited |

## Database Schema

Key models:
- **User**: User accounts with authentication
- **Organization**: Workspace for teams
- **Subscription**: Stripe subscription data
- **Invoice**: Payment records
- **Document**: File metadata
- **Checklist**: Task lists
- **ChecklistItem**: Individual tasks
- **UsageMetrics**: Usage tracking data

See [Prisma Schema](prisma/schema.prisma) for complete schema definition.

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t checklist-backend .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  checklist-backend
```

### AWS ECS/Fargate

See [Deployment Guide](docs/DEPLOYMENT.md) for comprehensive AWS deployment instructions including:
- RDS setup
- S3 configuration
- SES setup
- ECR image repository
- ECS cluster and service
- Application Load Balancer
- Secrets Manager
- CloudWatch logging

### Environment-specific Builds

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Scripts

```bash
npm run dev           # Start development server with hot reload
npm run build         # Build TypeScript to JavaScript
npm start             # Start production server
npm run db:migrate    # Run database migrations
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes (dev only)
npm run db:studio     # Open Prisma Studio
npm test              # Run tests
npm run lint          # Lint code
npm run format        # Format code
```

## Monitoring & Logging

### Logs

Logs are written to:
- Console (structured JSON)
- Daily rotating files in `./logs/`
- CloudWatch (in production)

Log levels:
- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `debug`: Detailed debug info

### Health Checks

**Kubernetes/ECS:**
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Security

### Best Practices Implemented

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection (Prisma)
- ✅ Input validation (express-validator)
- ✅ Rate limiting ready
- ✅ Secrets management (AWS Secrets Manager)
- ✅ Environment-based configuration
- ✅ HTTPS enforcement (in production)

### Security Checklist

- [ ] Rotate JWT secret regularly
- [ ] Enable rate limiting
- [ ] Configure WAF (AWS)
- [ ] Enable CloudTrail logging
- [ ] Set up security monitoring
- [ ] Regular dependency updates
- [ ] Enable 2FA for admin accounts

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Stripe Webhook Issues

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### Docker Issues

```bash
# Rebuild container
docker-compose up -d --build

# View logs
docker-compose logs -f

# Reset everything
docker-compose down -v
docker-compose up -d
```

## Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [User Guide](docs/USER_GUIDE.md) - End-user documentation
- [OpenAPI Spec](docs/openapi.yaml) - OpenAPI 3.0 specification

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- **Issues**: GitHub Issues
- **Email**: support@checklistapp.com
- **Documentation**: See `/docs` directory

## Acknowledgments

- Built with TypeScript and Express.js
- Database powered by PostgreSQL and Prisma
- Payments by Stripe
- Cloud infrastructure by AWS
- Logging by Winston

---

**Version**: 1.0.0  
**Last Updated**: 2024
