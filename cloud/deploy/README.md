# ODAVL Cloud Deployment Guide

**Deploy ODAVL Studio to cloud environments (AWS, Azure, GCP).**

## Quick Start (Local Docker)

```bash
# Build API Gateway image
cd cloud/deploy/docker
docker build -f Dockerfile.gateway -t odavl-gateway:latest ../../..

# Run locally
docker run -p 8080:8080 odavl-gateway:latest
```

## Production Deployment

### Prerequisites

- Docker installed
- Cloud provider account (AWS/Azure/GCP)
- GitHub Actions secrets configured

### Environment Variables

```bash
export ODAVL_ENV=production
export ODAVL_PORT=8080
export ODAVL_API_KEY=your-secret-key-min-32-chars
```

### GitHub Actions Workflow

Push to `main` branch triggers automated deployment:

1. Build Docker images
2. Push to container registry
3. Deploy to cloud provider
4. Run smoke tests

See `.github/workflows/deploy-cloud.yml` for details.

## Architecture

- **API Gateway**: Port 8080 (Express REST API)
- **Telemetry Proxy**: Port 8081 (Event ingestion)
- **Autopilot Runner**: Port 8082 (O-D-A-V-L executor)
- **Guardian Runner**: Port 8083 (Website testing)
