# API Documentation

## Overview

This API provides endpoints for managing checklist subscriptions, usage metrics, and Stripe payment integration.

**Base URL:** `http://localhost:3000/api/v1`

**Authentication:** Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user and optionally create an organization.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "My Company"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "OWNER",
    "organizationId": "uuid"
  },
  "token": "jwt-token"
}
```

### Login

**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "OWNER",
    "organizationId": "uuid"
  },
  "token": "jwt-token"
}
```

---

## Stripe Subscription Endpoints

### Create Checkout Session

**POST** `/stripe/create-checkout-session`

Create a Stripe Checkout session for subscribing to a plan.

**Authentication:** Required

**Request Body:**
```json
{
  "priceId": "price_1234567890"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/c/pay/cs_test_1234567890"
}
```

### Create Customer Portal Session

**POST** `/stripe/create-portal-session`

Create a Stripe Customer Portal session for managing subscriptions.

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/test_1234567890"
}
```

### Get Subscription

**GET** `/stripe/subscription`

Get the current subscription details for the organization.

**Authentication:** Required

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "organizationId": "uuid",
    "stripeSubscriptionId": "sub_1234567890",
    "stripePriceId": "price_1234567890",
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  }
}
```

### Cancel Subscription

**POST** `/stripe/cancel-subscription`

Cancel the current subscription.

**Authentication:** Required

**Request Body:**
```json
{
  "immediate": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancellation requested"
}
```

### Stripe Webhook

**POST** `/stripe/webhook`

Webhook endpoint for Stripe events. This endpoint should be configured in your Stripe dashboard.

**Headers:**
- `stripe-signature`: Stripe signature for webhook verification

**Note:** This endpoint uses raw body parsing and requires special handling.

---

## Usage Metrics Endpoints

### Get Current Usage

**GET** `/usage/current`

Get current usage metrics for the organization.

**Authentication:** Required

**Response:**
```json
{
  "documentCount": 25,
  "storageUsedBytes": 52428800,
  "storageUsedMB": 50,
  "activeChecklistCount": 8,
  "totalChecklistCount": 12
}
```

### Check Limits

**GET** `/usage/limits`

Check usage against subscription tier limits.

**Authentication:** Required

**Response:**
```json
{
  "usage": {
    "documentCount": 25,
    "storageUsedBytes": 52428800,
    "storageUsedMB": 50,
    "activeChecklistCount": 8,
    "totalChecklistCount": 12
  },
  "limits": {
    "documents": 100,
    "storageMB": 1000,
    "checklists": 50
  },
  "isWithinLimits": {
    "documents": true,
    "storage": true,
    "checklists": true
  },
  "withinAllLimits": true
}
```

### Get Usage History

**GET** `/usage/history?days=30`

Get historical usage metrics.

**Authentication:** Required

**Query Parameters:**
- `days` (optional): Number of days of history to retrieve (default: 30)

**Response:**
```json
[
  {
    "id": "uuid",
    "organizationId": "uuid",
    "documentCount": 25,
    "storageUsedBytes": "52428800",
    "activeChecklistCount": 8,
    "totalChecklistCount": 12,
    "period": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Record Usage Metrics

**POST** `/usage/record`

Manually trigger recording of current usage metrics.

**Authentication:** Required

**Response:**
```json
{
  "documentCount": 25,
  "storageUsedBytes": 52428800,
  "storageUsedMB": 50,
  "activeChecklistCount": 8,
  "totalChecklistCount": 12
}
```

---

## Health Check Endpoints

### Health Check

**GET** `/health`

Check the overall health of the API and database connection.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

### Readiness Probe

**GET** `/health/ready`

Check if the API is ready to accept traffic.

**Response:**
```json
{
  "ready": true
}
```

### Liveness Probe

**GET** `/health/live`

Check if the API is alive.

**Response:**
```json
{
  "alive": true
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "statusCode": 400
}
```

### Common Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or token invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Subscription Tiers

### FREE
- Documents: 10
- Storage: 100 MB
- Checklists: 5

### STARTER
- Documents: 100
- Storage: 1 GB
- Checklists: 50

### PROFESSIONAL
- Documents: 1,000
- Storage: 10 GB
- Checklists: 500

### ENTERPRISE
- Documents: Unlimited
- Storage: Unlimited
- Checklists: Unlimited

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- Window: 15 minutes
- Max Requests: 100 per window

When rate limit is exceeded, the API returns:
```json
{
  "error": "Too many requests",
  "statusCode": 429
}
```

---

## Webhooks

### Stripe Webhook Events

The following Stripe events are processed:

- `checkout.session.completed` - Subscription checkout completed
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.paid` - Invoice paid successfully
- `invoice.payment_failed` - Invoice payment failed

Configure webhook endpoint in Stripe:
```
https://your-domain.com/api/v1/stripe/webhook
```

---

## Examples

### Complete Subscription Flow

1. **Register/Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "organizationName": "My Company"
  }'
```

2. **Create Checkout Session:**
```bash
curl -X POST http://localhost:3000/api/v1/stripe/create-checkout-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_starter_monthly"
  }'
```

3. **Check Usage:**
```bash
curl -X GET http://localhost:3000/api/v1/usage/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Manage Subscription:**
```bash
curl -X POST http://localhost:3000/api/v1/stripe/create-portal-session \
  -H "Authorization: Bearer YOUR_TOKEN"
```
