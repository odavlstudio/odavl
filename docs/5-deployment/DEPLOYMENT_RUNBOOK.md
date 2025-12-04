# ODAVL Studio Deployment Runbook

## Overview

This runbook provides comprehensive deployment procedures for ODAVL Studio to Kubernetes using Helm charts. It covers installation, upgrades, rollbacks, monitoring, and troubleshooting.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Verification](#verification)
6. [Upgrades](#upgrades)
7. [Rollbacks](#rollbacks)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Security](#security)
11. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### Required Tools

- **kubectl** >= 1.25
- **Helm** >= 3.10
- **Docker** >= 24.0 (for local builds)
- **Git** (for version control)

### Cluster Requirements

- **Kubernetes** >= 1.25
- **NGINX Ingress Controller** installed
- **cert-manager** installed (for TLS/SSL)
- **Metrics Server** installed (for HPA)
- **Storage Class** configured (for PVC)

### Access Requirements

- Kubeconfig with admin access to target namespace
- Container registry credentials (GitHub Container Registry)
- DNS control for domain configuration

### Verify Prerequisites

```bash
# Check kubectl version
kubectl version --client

# Check Helm version
helm version

# Check cluster access
kubectl cluster-info

# Check NGINX Ingress Controller
kubectl get pods -n ingress-nginx

# Check cert-manager
kubectl get pods -n cert-manager

# Check Metrics Server
kubectl get deployment metrics-server -n kube-system

# Check storage classes
kubectl get storageclass
```

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/odavl/odavl-studio.git
cd odavl-studio
```

### 2. Create Namespaces

```bash
kubectl apply -f kubernetes/namespace.yaml
```

### 3. Create Secrets

Create Kubernetes secrets for sensitive data:

```bash
# Database secret
kubectl create secret generic odavl-guardian-secrets \
  --from-literal=database-url="postgresql://user:pass@host:5432/db" \
  --from-literal=redis-url="redis://:pass@host:6379" \
  --from-literal=sentry-dsn="https://key@sentry.io/project" \
  --from-literal=api-key="your-api-key-here" \
  --namespace production

# Image pull secret (if using private registry)
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=your-github-username \
  --docker-password=your-github-token \
  --namespace production
```

### 4. Install cert-manager ClusterIssuer

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@odavl.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

---

## Configuration

### Helm Values Customization

Create a custom `values-production.yaml`:

```yaml
replicaCount: 3

image:
  repository: ghcr.io/odavl/odavl-guardian
  tag: "1.0.0"
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: ghcr-secret

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "1000"
  hosts:
    - host: guardian.odavl.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: odavl-guardian-tls
      hosts:
        - guardian.odavl.com

secrets:
  databaseUrl: "postgresql://user:pass@postgres.production.svc.cluster.local:5432/odavl"
  redisUrl: "redis://:pass@redis.production.svc.cluster.local:6379"
  sentryDsn: "https://key@sentry.io/123456"
  apiKey: "prod-api-key-here"

postgresql:
  enabled: true
  auth:
    postgresPassword: "secure-postgres-password"
    username: odavl
    password: "secure-odavl-password"
    database: odavl_guardian

redis:
  enabled: true
  auth:
    password: "secure-redis-password"
  master:
    persistence:
      enabled: true
      size: 20Gi
```

---

## Deployment

### Staging Deployment

```bash
# Deploy to staging namespace
helm install odavl-guardian ./helm/odavl-guardian \
  --namespace staging \
  --create-namespace \
  --values helm/odavl-guardian/values.yaml \
  --set image.tag=latest

# Wait for rollout
kubectl rollout status deployment/odavl-guardian --namespace staging
```

### Production Deployment

```bash
# Deploy to production namespace
helm install odavl-guardian ./helm/odavl-guardian \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.0.0

# Wait for rollout
kubectl rollout status deployment/odavl-guardian --namespace production
```

---

## Verification

### Check Deployment Status

```bash
# Check pods
kubectl get pods -n production -l app.kubernetes.io/name=odavl-guardian

# Check deployment
kubectl get deployment odavl-guardian -n production

# Check service
kubectl get service odavl-guardian -n production

# Check ingress
kubectl get ingress odavl-guardian -n production

# Check HPA
kubectl get hpa odavl-guardian -n production
```

### Health Checks

```bash
# Port-forward to service (testing without ingress)
kubectl port-forward -n production svc/odavl-guardian 8080:80

# Test health endpoint
curl http://localhost:8080/api/health

# Test readiness endpoint
curl http://localhost:8080/api/ready

# Test via ingress (production)
curl https://guardian.odavl.com/api/health
```

### Check Logs

```bash
# Get logs from all pods
kubectl logs -n production -l app.kubernetes.io/name=odavl-guardian --tail=100

# Follow logs from specific pod
kubectl logs -n production -f odavl-guardian-<pod-id>

# Get logs from previous pod instance (if crashed)
kubectl logs -n production odavl-guardian-<pod-id> --previous
```

### SSL Certificate Status

```bash
# Check certificate
kubectl get certificate -n production

# Describe certificate for troubleshooting
kubectl describe certificate odavl-guardian-tls -n production

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

---

## Upgrades

### Rolling Update (Zero Downtime)

```bash
# Update Helm release with new image tag
helm upgrade odavl-guardian ./helm/odavl-guardian \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.1.0 \
  --wait

# Watch rollout progress
kubectl rollout status deployment/odavl-guardian -n production

# Check revision history
helm history odavl-guardian -n production
```

### Configuration Updates

```bash
# Update configuration values
helm upgrade odavl-guardian ./helm/odavl-guardian \
  --namespace production \
  --values values-production.yaml \
  --set autoscaling.maxReplicas=30 \
  --wait
```

---

## Rollbacks

### Automatic Rollback (on failure)

The deployment workflow includes automatic rollback on health check failures.

### Manual Rollback

```bash
# List release history
helm history odavl-guardian -n production

# Rollback to previous revision
helm rollback odavl-guardian -n production

# Rollback to specific revision
helm rollback odavl-guardian 3 -n production

# Verify rollback
kubectl get pods -n production -l app.kubernetes.io/name=odavl-guardian
```

### Emergency Rollback (kubectl)

```bash
# Rollback deployment directly
kubectl rollout undo deployment/odavl-guardian -n production

# Rollback to specific revision
kubectl rollout undo deployment/odavl-guardian -n production --to-revision=2

# Check status
kubectl rollout status deployment/odavl-guardian -n production
```

---

## Monitoring

### Prometheus Metrics

ODAVL Guardian exposes Prometheus metrics on `/metrics`:

```bash
# Access metrics endpoint
curl https://guardian.odavl.com/metrics

# Sample metrics:
# - http_requests_total
# - http_request_duration_seconds
# - odavl_tests_total
# - odavl_test_failures_total
# - odavl_autopilot_cycles_total
# - nodejs_memory_usage_bytes
```

### Grafana Dashboards

Import ODAVL Studio dashboards:

- **ODAVL Guardian Overview**: ID 12345 (CPU, memory, requests, errors)
- **ODAVL Test Metrics**: ID 12346 (test runs, pass/fail rates)
- **Kubernetes Cluster**: ID 12347 (pods, nodes, resource usage)

### Alerting Rules

Configure Prometheus alerts:

```yaml
groups:
  - name: odavl-guardian
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        annotations:
          summary: "Pod is crash looping"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        annotations:
          summary: "Memory usage above 90%"
```

---

## Troubleshooting

### Common Issues

#### 1. ImagePullBackOff

**Symptoms**: Pods stuck in `ImagePullBackOff` status

**Diagnosis**:

```bash
kubectl describe pod <pod-name> -n production
```

**Solutions**:

- Verify image tag exists: `docker pull ghcr.io/odavl/odavl-guardian:1.0.0`
- Check image pull secrets: `kubectl get secret ghcr-secret -n production`
- Verify registry credentials

#### 2. CrashLoopBackOff

**Symptoms**: Pods continuously restarting

**Diagnosis**:

```bash
kubectl logs -n production <pod-name> --previous
kubectl describe pod <pod-name> -n production
```

**Solutions**:

- Check application logs for errors
- Verify environment variables (DATABASE_URL, REDIS_URL)
- Ensure database is accessible
- Check resource limits (OOMKilled)

#### 3. Certificate Not Issued

**Symptoms**: TLS certificate not created

**Diagnosis**:

```bash
kubectl describe certificate odavl-guardian-tls -n production
kubectl get certificaterequest -n production
kubectl logs -n cert-manager -l app=cert-manager
```

**Solutions**:

- Verify ClusterIssuer exists: `kubectl get clusterissuer`
- Check DNS records point to ingress: `nslookup guardian.odavl.com`
- Verify cert-manager webhook is running

#### 4. HPA Not Scaling

**Symptoms**: Pods not auto-scaling

**Diagnosis**:

```bash
kubectl get hpa odavl-guardian -n production
kubectl describe hpa odavl-guardian -n production
```

**Solutions**:

- Verify Metrics Server is running: `kubectl get deployment metrics-server -n kube-system`
- Check pod resource requests are set
- Verify metrics are available: `kubectl top pods -n production`

#### 5. Service Unavailable (503)

**Symptoms**: 503 errors from ingress

**Diagnosis**:

```bash
kubectl get endpoints odavl-guardian -n production
kubectl get pods -n production -l app.kubernetes.io/name=odavl-guardian
```

**Solutions**:

- Verify pods are ready: `kubectl get pods -n production`
- Check service selector matches pod labels
- Test service directly: `kubectl port-forward svc/odavl-guardian 8080:80 -n production`

#### 6. Database Connection Errors

**Symptoms**: Application logs show connection errors

**Diagnosis**:

```bash
kubectl logs -n production -l app.kubernetes.io/name=odavl-guardian | grep -i "database"
```

**Solutions**:

- Verify DATABASE_URL secret is correct
- Check database pod is running: `kubectl get pods -n production -l app=postgresql`
- Test connectivity from pod: `kubectl exec -it <pod-name> -n production -- nc -zv postgres 5432`

---

## Security

### Network Policies

Apply network policies to restrict traffic:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: odavl-guardian-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: odavl-guardian
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 5432  # PostgreSQL
        - protocol: TCP
          port: 6379  # Redis
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 53    # DNS
        - protocol: UDP
          port: 53
```

### Secrets Management

Use external secret managers:

```bash
# Using Sealed Secrets
kubeseal --scope cluster-wide \
  --format yaml \
  < secrets.yaml > sealed-secrets.yaml

# Using External Secrets Operator (AWS Secrets Manager)
cat <<EOF | kubectl apply -f -
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
EOF
```

### RBAC Configuration

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: odavl-guardian-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: odavl-guardian-rolebinding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: odavl-guardian
    namespace: production
roleRef:
  kind: Role
  name: odavl-guardian-role
  apiGroup: rbac.authorization.k8s.io
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup PostgreSQL database
kubectl exec -it <postgres-pod> -n production -- \
  pg_dump -U odavl odavl_guardian > backup-$(date +%Y%m%d).sql

# Restore database
kubectl exec -i <postgres-pod> -n production -- \
  psql -U odavl odavl_guardian < backup-20250109.sql
```

### Persistent Volume Backup

```bash
# Create snapshot of PVC (cloud provider dependent)
# AWS EBS:
aws ec2 create-snapshot --volume-id <volume-id> --description "ODAVL backup"

# GCP Persistent Disk:
gcloud compute disks snapshot <disk-name> --snapshot-names odavl-backup

# Azure Disk:
az snapshot create --resource-group <rg> --name odavl-backup --source <disk-id>
```

### Configuration Backup

```bash
# Export all resources
kubectl get all,secrets,configmaps,pvc -n production -o yaml > backup-all.yaml

# Export Helm values
helm get values odavl-guardian -n production > backup-values.yaml
```

---

## Disaster Recovery

### Complete Cluster Restore

```bash
# 1. Create namespaces
kubectl apply -f kubernetes/namespace.yaml

# 2. Restore secrets
kubectl apply -f backup-secrets.yaml

# 3. Restore PVCs
kubectl apply -f backup-pvc.yaml

# 4. Deploy with Helm
helm install odavl-guardian ./helm/odavl-guardian \
  --namespace production \
  --values backup-values.yaml

# 5. Verify deployment
kubectl get all -n production
```

---

## CI/CD Integration

### GitHub Actions Deployment

The `.github/workflows/deploy.yml` workflow automates deployments:

```yaml
# Trigger manual deployment
gh workflow run deploy.yml \
  --ref main \
  -f environment=production \
  -f image_tag=1.0.0
```

### Deployment Notifications

Configure Slack notifications:

```bash
# Set Slack webhook secret
kubectl create secret generic slack-webhook \
  --from-literal=url="https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  --namespace production
```

---

## Appendix

### Useful Commands Cheat Sheet

```bash
# Quick health check
kubectl get pods -n production -l app.kubernetes.io/name=odavl-guardian

# Watch pod status
kubectl get pods -n production -w

# Get resource usage
kubectl top pods -n production

# Execute command in pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Copy files from pod
kubectl cp production/<pod-name>:/app/.odavl/logs/odavl.log ./local-logs/

# Debug networking
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- /bin/bash
```

### Support Contacts

- **Technical Support**: <support@odavl.com>
- **Emergency Hotline**: +1-555-ODAVL-911
- **Slack Channel**: #odavl-support
- **Documentation**: <https://docs.odavl.com>

---

## Changelog

- **2025-01-09**: Initial runbook creation (v1.0.0)
- Future updates tracked in Git history
