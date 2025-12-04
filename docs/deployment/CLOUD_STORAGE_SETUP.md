# Cloud Storage Environment Variables Guide

## Quick Setup

### Option 1: AWS S3 (Production)

```bash
# 1. Create S3 bucket
aws s3 mb s3://odavl-storage --region us-east-1

# 2. Create IAM user with S3 access
aws iam create-user --user-name odavl-storage-service

# 3. Attach S3 policy
aws iam attach-user-policy \
  --user-name odavl-storage-service \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# 4. Create access keys
aws iam create-access-key --user-name odavl-storage-service

# 5. Copy credentials to .env.local
cp .env.s3.example apps/studio-hub/.env.local
# Edit with your actual credentials
```

### Option 2: MinIO (Local Development)

```bash
# 1. Start MinIO container
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  --name minio \
  minio/minio server /data --console-address ":9001"

# 2. Set environment variables
cat >> apps/studio-hub/.env.local << EOF
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=odavl-storage
AWS_ENDPOINT_URL=http://localhost:9000
INTERNAL_API_KEY=$(openssl rand -base64 32)
EOF

# 3. Create bucket (via MinIO Console at http://localhost:9001)
# Or via AWS CLI:
aws --endpoint-url http://localhost:9000 \
    s3 mb s3://odavl-storage
```

### Option 3: DigitalOcean Spaces

```bash
# 1. Create Space at https://cloud.digitalocean.com/spaces
#    Name: odavl-storage
#    Region: NYC3 (or nearest)

# 2. Generate API Keys (Settings → API → Spaces Keys)

# 3. Set environment variables
cat >> apps/studio-hub/.env.local << EOF
AWS_ACCESS_KEY_ID=your_spaces_key
AWS_SECRET_ACCESS_KEY=your_spaces_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=odavl-storage
AWS_ENDPOINT_URL=https://nyc3.digitaloceanspaces.com
INTERNAL_API_KEY=$(openssl rand -base64 32)
EOF
```

## Testing Storage

```bash
# Test upload URL generation
curl -X POST http://localhost:3000/api/v1/storage/upload-url \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "product": "insight",
    "filename": "test.json",
    "contentType": "application/json"
  }'

# Test file listing
curl http://localhost:3000/api/v1/storage/files?product=insight \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Test storage stats
curl http://localhost:3000/api/v1/storage/stats \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | ✅ Yes | AWS/S3 access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | ✅ Yes | AWS/S3 secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | ✅ Yes | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | ✅ Yes | S3 bucket name | `odavl-storage` |
| `AWS_ENDPOINT_URL` | ❌ No | Custom S3 endpoint | `http://localhost:9000` |
| `INTERNAL_API_KEY` | ✅ Yes | Internal API auth | `openssl rand -base64 32` |

## S3 Bucket Configuration

### Minimal IAM Policy (Least Privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::odavl-storage",
        "arn:aws:s3:::odavl-storage/*"
      ]
    }
  ]
}
```

### CORS Configuration (for browser uploads)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://odavl.studio",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag", "x-amz-meta-*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Lifecycle Policy (auto-cleanup old files)

```json
{
  "Rules": [
    {
      "Id": "Move to Glacier after 90 days",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "Id": "Delete incomplete uploads",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

## Cost Estimation

### AWS S3 Pricing (us-east-1, after free tier)

- **Storage**: $0.023/GB/month
- **PUT/POST**: $0.005 per 1,000 requests
- **GET**: $0.0004 per 1,000 requests
- **Data transfer out**: $0.09/GB (first 10 TB)

**Example**: 100 GB storage + 50K uploads + 500K downloads/month
- Storage: 100 GB × $0.023 = $2.30
- Uploads: 50,000 × $0.000005 = $0.25
- Downloads: 500,000 × $0.0000004 = $0.20
- Transfer (10 GB): 10 GB × $0.09 = $0.90
- **Total**: ~$3.65/month

### DigitalOcean Spaces Pricing

- **Fixed**: $5/month
- **Includes**: 250 GB storage + 1 TB transfer
- **Overage**: $0.02/GB storage, $0.01/GB transfer
- **Simple billing**, no per-request charges

**Recommended for**: Predictable costs, easy setup

### MinIO (Self-Hosted)

- **Free** (open source)
- **Costs**: Server hosting only
- **Use case**: Development, on-premise deployments

## Troubleshooting

### Error: "AWS credentials not configured"

```bash
# Verify environment variables are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Check .env.local exists
ls -la apps/studio-hub/.env.local

# Restart Next.js dev server
pnpm hub:dev
```

### Error: "Access Denied" (403)

```bash
# Check IAM policy allows s3:PutObject, s3:GetObject
aws iam list-attached-user-policies --user-name odavl-storage-service

# Verify bucket name matches
aws s3 ls s3://odavl-storage

# Test credentials
aws s3 ls --profile odavl
```

### Error: "Bucket does not exist"

```bash
# Create bucket
aws s3 mb s3://odavl-storage --region us-east-1

# Or via MinIO console
# http://localhost:9001 → Buckets → Create Bucket
```

### Error: CORS issues in browser

```bash
# Add CORS configuration to bucket
aws s3api put-bucket-cors \
  --bucket odavl-storage \
  --cors-configuration file://cors.json

# Verify CORS
aws s3api get-bucket-cors --bucket odavl-storage
```

## Security Best Practices

1. **Never commit credentials** to git
   - Add `.env.local` to `.gitignore`
   - Use `.env.example` for templates

2. **Use IAM roles** in production (AWS ECS/EC2)
   - No need to store credentials
   - Automatic key rotation

3. **Enable S3 encryption** at rest
   - SSE-S3 (free) or SSE-KMS ($)
   - Configured in bucket settings

4. **Enable access logging**
   - Track all S3 operations
   - Store logs in separate bucket

5. **Set bucket policies** for least privilege
   - Deny public access
   - Allow only necessary actions

6. **Use presigned URLs** with expiration
   - Default: 1 hour
   - Never expose direct S3 URLs

7. **Monitor costs** with AWS Budgets
   - Set alerts at $10, $50, $100
   - Review monthly usage

## Next Steps

1. ✅ Set environment variables (choose AWS/MinIO/Spaces)
2. ✅ Test storage API endpoints
3. ⏳ Update CLI to use presigned URLs
4. ⏳ Add storage dashboard UI
5. ⏳ Configure backup automation
