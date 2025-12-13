# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### Added

#### Core Features
- JWT-based authentication system with role-based access control
- User registration and login endpoints
- Organization management with multi-tenancy support
- Subscription tier system (FREE, STARTER, PROFESSIONAL, ENTERPRISE)

#### Stripe Integration
- Stripe Checkout session creation
- Customer Portal integration for subscription management
- Webhook handler for subscription events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- Automated subscription tier updates
- Invoice tracking and storage

#### Usage Metrics
- Real-time usage tracking:
  - Document count
  - Storage usage (bytes/MB)
  - Active checklist count
  - Total checklist count
- Historical usage metrics with daily snapshots
- Usage limit enforcement per subscription tier
- Usage history API endpoint

#### Email Service
- AWS SES integration
- HTML and text email templates
- Receipt emails with PDF attachments
- Invitation emails for team members
- Subscription confirmation emails
- Configurable email sender information

#### PDF Generation
- Automated PDF receipt generation using PDFKit
- Professional invoice layout
- S3 storage integration for PDF files
- Line item details and totals

#### Storage
- AWS S3 integration for document storage
- Signed URL generation for secure access
- File upload/download capabilities
- Bucket encryption and versioning support

#### Database
- PostgreSQL database with Prisma ORM
- Complete schema with relationships:
  - Users and Organizations
  - Subscriptions and Invoices
  - Documents and Checklists
  - ChecklistItems
  - UsageMetrics
- Database indexes for performance
- Migration system

#### Logging & Monitoring
- Winston structured logging
- Daily rotating log files
- CloudWatch integration support
- Request/response logging
- Error tracking with stack traces
- Database query logging (debug mode)

#### API Endpoints
- Health check endpoints (`/health`, `/health/ready`, `/health/live`)
- Authentication routes (`/auth/register`, `/auth/login`)
- Stripe routes (checkout, portal, subscription, webhook)
- Usage metrics routes (current, limits, history, record)

#### Security
- Helmet.js security headers
- CORS configuration
- Password hashing with bcrypt (10 rounds)
- JWT token expiration
- Input validation with express-validator
- SQL injection protection via Prisma
- Environment-based secrets management

#### Deployment
- Docker containerization
- Multi-stage Docker builds for optimization
- Docker Compose for local development
- Health checks in containers
- Graceful shutdown handling
- Non-root container user

#### AWS Infrastructure
- Complete Terraform configuration:
  - VPC with public/private subnets
  - RDS PostgreSQL with encryption
  - S3 bucket with versioning and encryption
  - ECR repository for Docker images
  - ECS Fargate cluster
  - Application Load Balancer with HTTPS
  - NAT Gateway for private subnet access
  - Security groups with least-privilege
  - IAM roles for service access
  - CloudWatch log groups

#### Documentation
- Comprehensive API documentation (Markdown)
- OpenAPI 3.0 specification (YAML)
- Deployment guide with AWS instructions
- End-user guide covering all features
- README with quick start guide
- Terraform infrastructure documentation
- Inline code documentation

#### Development Tools
- TypeScript configuration
- ESLint for code linting
- Prettier for code formatting
- Jest for testing
- Database migration scripts
- Development scripts (dev, build, start)

### Technical Details

#### Dependencies
- express: ^4.18.2
- @prisma/client: ^5.7.1
- stripe: ^14.8.0
- aws-sdk: ^2.1505.0
- winston: ^3.11.0
- jsonwebtoken: ^9.0.2
- bcrypt: ^5.1.1
- pdfkit: ^0.14.0
- helmet: ^7.1.0
- cors: ^2.8.5

#### Infrastructure
- Node.js 18+
- PostgreSQL 15+
- AWS ECS/Fargate
- AWS RDS
- AWS S3
- AWS SES
- Docker

#### Performance
- Database connection pooling
- Indexed database queries
- Efficient S3 uploads
- Optimized Docker images
- Daily log rotation to manage disk space

#### Scalability
- Stateless API design
- ECS service auto-scaling ready
- Multi-AZ database deployment
- Load balancer distribution
- CloudWatch metrics integration

### Configuration

#### Environment Variables
- 40+ configurable environment variables
- Separate configurations for dev/prod
- Secrets management via AWS Secrets Manager
- Comprehensive `.env.example` file

#### Subscription Limits
- Configurable tier limits via environment variables
- Default limits for each tier
- Unlimited option for enterprise tier

### Monitoring

#### Logging
- Structured JSON logs
- Multiple log levels (error, warn, info, debug)
- Request/response tracking
- Error context capture
- Database query logging

#### Health Checks
- Kubernetes/ECS compatible health endpoints
- Database connectivity checks
- Liveness and readiness probes

### Security

#### Best Practices
- HTTPS enforcement in production
- Secure session handling
- Password strength requirements
- Token expiration
- CORS restrictions
- Security headers via Helmet
- Private subnets for sensitive resources
- Encrypted storage (RDS, S3)

### Known Limitations
- Rate limiting implementation pending
- API versioning structure prepared but basic
- Test coverage to be expanded
- CDN integration optional
- Redis caching not yet implemented

### Breaking Changes
- Initial release, no breaking changes

### Migration Notes
- Run `npm run db:migrate` to set up database
- Configure all required environment variables
- Set up Stripe products and prices
- Configure AWS services (RDS, S3, SES)
- Set up domain and SSL certificate

### Contributors
- Development Team

### Notes
- Production-ready API
- Comprehensive documentation included
- Infrastructure as Code provided
- Ready for AWS deployment
- Extensible architecture for future features
