# Deployment Guide

This guide provides comprehensive instructions for deploying the Checklist Subscription Backend to production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Database Setup](#database-setup)
7. [Stripe Configuration](#stripe-configuration)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+
- AWS CLI (for AWS deployment)
- Git

### Required Accounts

- AWS Account (for ECS, RDS, S3, SES)
- Stripe Account (for payments)
- Domain name (optional but recommended)

---

## Environment Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

#### Server Configuration
```env
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

#### Database
```env
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

#### JWT
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
```

#### Stripe
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_STARTER=price_starter_id
STRIPE_PRICE_ID_PROFESSIONAL=price_pro_id
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_id
```

#### AWS
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### S3
```env
S3_BUCKET_NAME=your-bucket-name
S3_BUCKET_REGION=us-east-1
```

#### SES
```env
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=Your App Name
SES_REGION=us-east-1
```

#### Frontend
```env
FRONTEND_URL=https://your-frontend-domain.com
```

---

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Start PostgreSQL using Docker:

```bash
docker-compose up -d postgres
```

Run migrations:

```bash
npm run db:migrate
```

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 4. Test the API

```bash
curl http://localhost:3000/health
```

---

## Docker Deployment

### Build and Run with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3000

### Build Production Image

```bash
docker build -t checklist-backend:latest .
```

### Run Production Container

```bash
docker run -d \
  --name checklist-backend \
  -p 3000:3000 \
  --env-file .env \
  checklist-backend:latest
```

---

## AWS Deployment

### Architecture Overview

- **Compute:** AWS ECS/Fargate
- **Database:** AWS RDS (PostgreSQL)
- **Storage:** AWS S3
- **Email:** AWS SES
- **Load Balancer:** AWS ALB
- **DNS:** Route 53
- **SSL:** AWS Certificate Manager

### 1. Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier checklist-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted \
  --publicly-accessible false
```

Get the endpoint:
```bash
aws rds describe-db-instances \
  --db-instance-identifier checklist-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

Update `DATABASE_URL` with the RDS endpoint.

### 2. Create S3 Bucket

```bash
aws s3 mb s3://checklist-documents --region us-east-1

aws s3api put-bucket-versioning \
  --bucket checklist-documents \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket checklist-documents \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

Set CORS configuration:
```bash
cat > cors.json << EOF
{
  "CORSRules": [{
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket checklist-documents \
  --cors-configuration file://cors.json
```

### 3. Configure SES

Verify your domain:
```bash
aws ses verify-domain-identity --domain yourdomain.com
```

Add DNS records (TXT and DKIM) to your domain as instructed by AWS.

Move out of sandbox mode by requesting production access in the AWS Console.

### 4. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name checklist-backend \
  --region us-east-1
```

### 5. Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t checklist-backend .

# Tag image
docker tag checklist-backend:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/checklist-backend:latest

# Push image
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/checklist-backend:latest
```

### 6. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name checklist-cluster
```

### 7. Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "checklist-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "checklist-backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/checklist-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:DATABASE_URL"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:JWT_SECRET"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:STRIPE_SECRET_KEY"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/checklist-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### 8. Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name checklist-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application
```

Create target group:
```bash
aws elbv2 create-target-group \
  --name checklist-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2
```

Create listener:
```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### 9. Create ECS Service

```bash
aws ecs create-service \
  --cluster checklist-cluster \
  --service-name checklist-service \
  --task-definition checklist-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxxxx,subnet-yyyyy],
    securityGroups=[sg-xxxxx],
    assignPublicIp=ENABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=checklist-backend,containerPort=3000"
```

### 10. Store Secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name DATABASE_URL \
  --secret-string "postgresql://..."

aws secretsmanager create-secret \
  --name JWT_SECRET \
  --secret-string "your-jwt-secret"

aws secretsmanager create-secret \
  --name STRIPE_SECRET_KEY \
  --secret-string "sk_live_..."
```

### 11. Run Database Migrations

Connect to the ECS task and run migrations:

```bash
aws ecs run-task \
  --cluster checklist-cluster \
  --task-definition checklist-backend \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={...}" \
  --overrides '{
    "containerOverrides": [{
      "name": "checklist-backend",
      "command": ["npx", "prisma", "migrate", "deploy"]
    }]
  }'
```

---

## Database Setup

### Running Migrations

Development:
```bash
npm run db:migrate
```

Production (via Docker):
```bash
docker exec -it checklist-backend npx prisma migrate deploy
```

### Creating New Migrations

```bash
npx prisma migrate dev --name add_new_feature
```

### Database Backup

Automated backups are configured for RDS with 7-day retention.

Manual backup:
```bash
pg_dump $DATABASE_URL > backup.sql
```

Restore:
```bash
psql $DATABASE_URL < backup.sql
```

---

## Stripe Configuration

### 1. Create Products and Prices

In Stripe Dashboard:
- Create products: Starter, Professional, Enterprise
- Create monthly recurring prices for each
- Copy price IDs to environment variables

### 2. Configure Webhook

In Stripe Dashboard → Webhooks:
- Endpoint URL: `https://api.yourdomain.com/api/v1/stripe/webhook`
- Events to listen:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

### 3. Test Webhooks

```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook
```

---

## Monitoring and Logging

### CloudWatch Logs

Logs are automatically sent to CloudWatch Logs from ECS tasks.

View logs:
```bash
aws logs tail /ecs/checklist-backend --follow
```

### CloudWatch Alarms

Create alarms for:
- High CPU usage
- High memory usage
- Error rate
- Response time

Example:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name checklist-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Application Logs

Structured JSON logs are written to:
- Console (captured by CloudWatch)
- Daily rotating files in `/app/logs` (if volume mounted)

Log levels:
- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `debug`: Detailed debug information

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: checklist-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster checklist-cluster \
            --service checklist-service \
            --force-new-deployment
```

---

## Frontend Deployment Options

### Option 1: Vercel

1. Connect GitHub repository to Vercel
2. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
3. Deploy automatically on push

### Option 2: AWS CloudFront + S3

Build frontend:
```bash
npm run build
```

Upload to S3:
```bash
aws s3 sync ./dist s3://your-frontend-bucket --delete
```

Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id E123456 \
  --paths "/*"
```

---

## Troubleshooting

### Database Connection Issues

Check security group allows connections from ECS tasks:
```bash
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

Test connection:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### ECS Task Not Starting

Check logs:
```bash
aws logs tail /ecs/checklist-backend --since 30m
```

Check task events:
```bash
aws ecs describe-tasks \
  --cluster checklist-cluster \
  --tasks task-id
```

### Stripe Webhook Failures

Check webhook logs in Stripe Dashboard.

Verify webhook secret matches environment variable.

Test locally:
```bash
stripe trigger checkout.session.completed
```

### S3 Upload Issues

Check IAM permissions for ECS task role:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ],
    "Resource": "arn:aws:s3:::checklist-documents/*"
  }]
}
```

### Email Sending Issues

Verify SES domain:
```bash
aws ses get-identity-verification-attributes \
  --identities yourdomain.com
```

Check if out of sandbox mode.

Test sending:
```bash
aws ses send-email \
  --from noreply@yourdomain.com \
  --to test@example.com \
  --subject "Test" \
  --text "Test email"
```

---

## Performance Optimization

### Database Indexing

Indexes are defined in Prisma schema. Run migrations to create them.

### Caching

Consider adding Redis for:
- Session storage
- Rate limiting
- API response caching

### CDN

Use CloudFront for:
- Static assets
- API response caching (GET requests)

### Auto Scaling

Configure ECS service auto-scaling:
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/checklist-cluster/checklist-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

---

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Rotate secrets regularly
- [ ] Enable VPC Flow Logs
- [ ] Use AWS WAF for API protection
- [ ] Enable CloudTrail for audit logging
- [ ] Implement rate limiting
- [ ] Use least-privilege IAM policies
- [ ] Enable database encryption at rest
- [ ] Enable S3 bucket versioning and encryption
- [ ] Regular security updates for dependencies
- [ ] Implement CORS properly
- [ ] Use helmet.js for security headers
- [ ] Validate and sanitize all inputs
- [ ] Implement proper error handling (don't leak sensitive info)

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.
