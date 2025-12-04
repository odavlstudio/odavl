# ODAVL Kubernetes Deployment

Complete Kubernetes manifests for deploying ODAVL platform (Guardian, Insight Cloud, CLI Autopilot).

## 📋 Prerequisites

- Kubernetes cluster (1.27+)
- kubectl configured
- kustomize (optional, recommended)
- Docker images built and pushed to ghcr.io

## 🚀 Quick Start

### 1. Build Docker Images

```bash
# Build all images
docker build -f apps/cli/Dockerfile -t ghcr.io/odavl/odavl-cli:latest .
docker build -f apps/guardian/Dockerfile -t ghcr.io/odavl/odavl-guardian:latest .
docker build -f apps/insight-cloud/Dockerfile -t ghcr.io/odavl/odavl-insight-cloud:latest .

# Push to registry
docker push ghcr.io/odavl/odavl-cli:latest
docker push ghcr.io/odavl/odavl-guardian:latest
docker push ghcr.io/odavl/odavl-insight-cloud:latest
```

### 2. Configure Secrets

Create `kubernetes/secrets.env`:

```bash
database-url=postgresql://odavl:password@postgres:5432/odavl_db
redis-url=redis://redis:6379
sentry-dsn=https://your-sentry-dsn
github-token=ghp_yourtoken
npm-token=npm_yourtoken
vscode-marketplace-token=your-vscode-token
open-vsx-token=your-ovsx-token
```

### 3. Deploy with Kustomize (Recommended)

```bash
# Deploy to production
kubectl apply -k kubernetes/

# Verify deployment
kubectl get all -n production
kubectl get pods -n production
```

### 4. Deploy Manually (Alternative)

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Create ConfigMaps and Secrets
kubectl apply -f kubernetes/configmap.yaml

# Deploy Guardian
kubectl apply -f kubernetes/guardian-deployment.yaml

# Deploy Insight Cloud
kubectl apply -f kubernetes/insight-cloud-deployment.yaml

# Deploy CLI CronJob
kubectl apply -f kubernetes/cli-cronjob.yaml

# Deploy Ingress
kubectl apply -f kubernetes/ingress.yaml
```

## 📦 Components

### Guardian (Next.js App)

- **Deployment**: 3 replicas (auto-scales 3-10)
- **Resources**: 512Mi-2Gi RAM, 250m-1000m CPU
- **Storage**: 10Gi PVC for .odavl data
- **Port**: 3000 (HTTP)
- **Health Checks**: /api/health, /api/ready

### Insight Cloud (Next.js App)

- **Deployment**: 2 replicas (auto-scales 2-5)
- **Resources**: 256Mi-1Gi RAM, 100m-500m CPU
- **Port**: 3000 (HTTP)
- **Health Checks**: /api/health

### CLI Autopilot (CronJob)

- **Schedule**: Every 6 hours (`0 */6 * * *`)
- **Resources**: 256Mi-512Mi RAM, 200m-500m CPU
- **Storage**: 5Gi PVC for .odavl data, 20Gi PVC for workspace
- **Concurrency**: Forbid (one job at a time)

## 🔧 Configuration

### Environment Variables (ConfigMap)

```yaml
ODAVL_VERSION: "1.4.1"
MAX_FILES_PER_CYCLE: "10"
MAX_LOC_PER_FILE: "40"
RISK_BUDGET: "100"
RECIPE_TRUST_THRESHOLD: "0.2"
DETECTOR_TIMEOUT_MS: "300000"
```

### Quality Gates (gates.yml)

Mounted as ConfigMap in `.odavl/gates.yml`:

- Risk budget: 100
- Forbidden paths: security/**, auth/**, **/*.test.*
- Max auto changes: 10 files per cycle
- Enforcement: Block if risk exceeded, rollback on failure

## 🔍 Monitoring

### Prometheus Metrics

All services expose metrics at `/api/metrics`:

```bash
# Port-forward to access metrics
kubectl port-forward -n production svc/odavl-guardian 3000:80
curl http://localhost:3000/api/metrics
```

### Logs

```bash
# Guardian logs
kubectl logs -n production -l app=odavl-guardian -f

# Insight Cloud logs
kubectl logs -n production -l app=odavl-insight-cloud -f

# CLI CronJob logs
kubectl logs -n production -l app=odavl-cli --tail=100
```

### Health Checks

```bash
# Check Guardian health
kubectl get pods -n production -l app=odavl-guardian
kubectl exec -it -n production <guardian-pod> -- curl localhost:3000/api/health

# Check Insight Cloud health
kubectl get pods -n production -l app=odavl-insight-cloud
```

## 🛡️ Security

### RBAC (Role-Based Access Control)

Each component has its own ServiceAccount:

- `odavl-guardian` (Guardian deployment)
- `odavl-insight-cloud` (Insight Cloud deployment)
- `odavl-cli` (CLI CronJob)

### Secrets Management

Secrets are stored in Kubernetes Secrets:

- Database credentials
- Redis connection strings
- API tokens (GitHub, npm, VS Code Marketplace)
- Sentry DSN

**Important**: Update `kubernetes/configmap.yaml` with actual secrets before deploying to production.

## 📊 Scaling

### Horizontal Pod Autoscaling (HPA)

**Guardian**:

- Min: 3 replicas
- Max: 10 replicas
- Target CPU: 70%
- Target Memory: 80%

**Insight Cloud**:

- Min: 2 replicas
- Max: 5 replicas
- Target CPU: 70%
- Target Memory: 80%

### Manual Scaling

```bash
# Scale Guardian
kubectl scale deployment odavl-guardian -n production --replicas=5

# Scale Insight Cloud
kubectl scale deployment odavl-insight-cloud -n production --replicas=3
```

## 🔄 Updates & Rollouts

### Rolling Updates

```bash
# Update Guardian image
kubectl set image deployment/odavl-guardian -n production \
  guardian=ghcr.io/odavl/odavl-guardian:v1.4.1

# Check rollout status
kubectl rollout status deployment/odavl-guardian -n production

# Rollback if needed
kubectl rollout undo deployment/odavl-guardian -n production
```

### CI/CD Integration

GitHub Actions automatically builds and pushes Docker images on:

- Push to `main` branch (tags: `latest`, `main-<sha>`)
- Version tags (e.g., `v1.4.1`)

See `.github/workflows/build.yml` for details.

## 🗄️ Persistence

### PersistentVolumeClaims (PVCs)

- **odavl-guardian-pvc**: 10Gi (Guardian .odavl data)
- **odavl-cli-pvc**: 5Gi (CLI .odavl data)
- **odavl-workspace-pvc**: 20Gi (CLI workspace files)

Storage class: `standard-rwo` (ReadWriteMany)

### Backup & Restore

```bash
# Backup .odavl data
kubectl exec -n production <guardian-pod> -- tar czf /tmp/odavl-backup.tar.gz /app/.odavl
kubectl cp production/<guardian-pod>:/tmp/odavl-backup.tar.gz ./odavl-backup.tar.gz

# Restore .odavl data
kubectl cp ./odavl-backup.tar.gz production/<guardian-pod>:/tmp/
kubectl exec -n production <guardian-pod> -- tar xzf /tmp/odavl-backup.tar.gz -C /
```

## 🚨 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod -n production <pod-name>

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'

# Check logs
kubectl logs -n production <pod-name> --previous
```

### Database Connection Issues

```bash
# Verify database secret
kubectl get secret odavl-secrets -n production -o yaml

# Test database connection
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql postgresql://odavl:password@postgres:5432/odavl_db
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n production

# Check PV status
kubectl get pv

# Describe PVC
kubectl describe pvc odavl-guardian-pvc -n production
```

## 📚 Additional Resources

- [ODAVL Documentation](../README.md)
- [GitHub Actions Workflows](../.github/workflows/)
- [Docker Build Guide](../apps/cli/Dockerfile)
- [Development Guide](../DEVELOPER_GUIDE.md)

## 🤝 Support

For issues or questions:

- Create an issue on GitHub
- Check existing issues for solutions
- Refer to the main ODAVL documentation

---

**Version**: 1.4.1  
**Last Updated**: 2025-11-15
