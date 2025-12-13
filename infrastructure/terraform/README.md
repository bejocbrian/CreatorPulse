# Terraform Infrastructure

This directory contains Terraform configuration for deploying the Checklist Subscription Backend to AWS.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured
- AWS account with appropriate permissions

## Resources Created

- **VPC** with public and private subnets across 2 availability zones
- **RDS PostgreSQL** instance for database
- **S3 Bucket** for document storage
- **ECR Repository** for Docker images
- **ECS Cluster** with Fargate
- **Application Load Balancer** with HTTPS
- **Security Groups** for each component
- **IAM Roles** with least-privilege permissions
- **CloudWatch Log Groups** for monitoring

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Create Variables File

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Apply Configuration

```bash
terraform apply
```

### 5. Get Outputs

```bash
terraform output
```

## Outputs

- `vpc_id`: VPC ID
- `rds_endpoint`: Database endpoint
- `s3_bucket_name`: S3 bucket name
- `ecr_repository_url`: ECR repository URL
- `alb_dns_name`: Load balancer DNS name
- `ecs_cluster_name`: ECS cluster name

## State Management

Terraform state is stored in an S3 bucket. Create the bucket before running:

```bash
aws s3 mb s3://checklist-terraform-state
aws s3api put-bucket-versioning \
  --bucket checklist-terraform-state \
  --versioning-configuration Status=Enabled
```

## Cost Estimation

Approximate monthly costs (us-east-1):

- RDS db.t3.micro: ~$15
- NAT Gateway: ~$32
- ALB: ~$16
- ECS Fargate (2 tasks): ~$30
- S3 storage: Variable
- CloudWatch Logs: ~$5
- **Total: ~$100/month**

## Security

- All resources are in private subnets except ALB
- Security groups follow least-privilege
- RDS encryption at rest enabled
- S3 bucket encryption enabled
- IAM roles for service-to-service access

## Cleanup

```bash
terraform destroy
```

**Warning**: This will delete all resources including data. Make backups first!
