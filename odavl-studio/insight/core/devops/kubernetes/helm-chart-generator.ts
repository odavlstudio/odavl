/**
 * @fileoverview Kubernetes Helm chart generator for ODAVL Insight
 * Generates production-ready Helm charts with best practices
 */

export interface HelmChartOptions {
  appName: string;
  namespace?: string;
  replicaCount?: number;
  imageRepository: string;
  imageTag: string;
  imagePullPolicy?: 'Always' | 'IfNotPresent' | 'Never';
  enableHPA?: boolean;
  enableIngress?: boolean;
  enableServiceMonitor?: boolean;
  environment?: 'development' | 'staging' | 'production';
}

export class HelmChartGenerator {
  /**
   * Generate complete Helm chart structure
   */
  static generate(options: HelmChartOptions): Record<string, string> {
    return {
      'Chart.yaml': this.generateChartYaml(options),
      'values.yaml': this.generateValuesYaml(options),
      'templates/deployment.yaml': this.generateDeployment(options),
      'templates/service.yaml': this.generateService(options),
      'templates/ingress.yaml': this.generateIngress(options),
      'templates/hpa.yaml': this.generateHPA(options),
      'templates/configmap.yaml': this.generateConfigMap(options),
      'templates/secret.yaml': this.generateSecret(options),
      'templates/serviceaccount.yaml': this.generateServiceAccount(options),
      'templates/servicemonitor.yaml': this.generateServiceMonitor(options),
      'templates/_helpers.tpl': this.generateHelpers(options),
      'templates/NOTES.txt': this.generateNotes(options),
    };
  }

  /**
   * Generate Chart.yaml
   */
  private static generateChartYaml(options: HelmChartOptions): string {
    const { appName } = options;

    return `apiVersion: v2
name: ${appName}
description: ODAVL Insight - Multi-Language Static Analysis Platform
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - static-analysis
  - code-quality
  - security
  - linting
home: https://odavl.studio
sources:
  - https://github.com/odavlstudio/odavl
maintainers:
  - name: ODAVL Team
    email: support@odavl.studio
dependencies:
  - name: postgresql
    version: 12.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: 17.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
`;
  }

  /**
   * Generate values.yaml
   */
  private static generateValuesYaml(options: HelmChartOptions): string {
    const {
      replicaCount = 3,
      imageRepository,
      imageTag,
      imagePullPolicy = 'IfNotPresent',
      enableHPA = true,
      enableIngress = true,
      environment = 'production',
    } = options;

    return `# Default values for ODAVL Insight

replicaCount: ${replicaCount}

image:
  repository: ${imageRepository}
  pullPolicy: ${imagePullPolicy}
  tag: "${imageTag}"

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001
  seccompProfile:
    type: RuntimeDefault

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: true

service:
  type: ClusterIP
  port: 3001
  targetPort: 3001
  annotations: {}

ingress:
  enabled: ${enableIngress}
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
  hosts:
    - host: insight.odavl.studio
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: odavl-insight-tls
      hosts:
        - insight.odavl.studio

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: ${enableHPA}
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - odavl-insight
          topologyKey: kubernetes.io/hostname

livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

env:
  NODE_ENV: ${environment}
  LOG_LEVEL: info
  PROMETHEUS_PORT: "9090"

postgresql:
  enabled: true
  auth:
    username: postgres
    password: postgres
    database: odavl_insight
  primary:
    persistence:
      enabled: true
      size: 20Gi
    resources:
      limits:
        memory: 2Gi
        cpu: 1000m
      requests:
        memory: 512Mi
        cpu: 250m

redis:
  enabled: true
  auth:
    enabled: false
  master:
    persistence:
      enabled: true
      size: 8Gi
    resources:
      limits:
        memory: 1Gi
        cpu: 500m
      requests:
        memory: 256Mi
        cpu: 100m

serviceMonitor:
  enabled: true
  interval: 30s
  scrapeTimeout: 10s
  labels:
    release: prometheus
`;
  }

  /**
   * Generate Deployment
   */
  private static generateDeployment(options: HelmChartOptions): string {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "odavl-insight.fullname" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "odavl-insight.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "odavl-insight.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "odavl-insight.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
      - name: {{ .Chart.Name }}
        securityContext:
          {{- toYaml .Values.securityContext | nindent 12 }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: 3001
          protocol: TCP
        - name: metrics
          containerPort: 9090
          protocol: TCP
        livenessProbe:
          {{- toYaml .Values.livenessProbe | nindent 12 }}
        readinessProbe:
          {{- toYaml .Values.readinessProbe | nindent 12 }}
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
        env:
        - name: NODE_ENV
          value: {{ .Values.env.NODE_ENV }}
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "odavl-insight.fullname" . }}
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "odavl-insight.fullname" . }}
              key: redis-url
        - name: LOG_LEVEL
          value: {{ .Values.env.LOG_LEVEL }}
        - name: PROMETHEUS_PORT
          value: {{ .Values.env.PROMETHEUS_PORT | quote }}
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/.cache
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
`;
  }

  /**
   * Generate Service
   */
  private static generateService(options: HelmChartOptions): string {
    return `apiVersion: v1
kind: Service
metadata:
  name: {{ include "odavl-insight.fullname" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
  {{- with .Values.service.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
    - port: 9090
      targetPort: metrics
      protocol: TCP
      name: metrics
  selector:
    {{- include "odavl-insight.selectorLabels" . | nindent 4 }}
`;
  }

  /**
   * Generate Ingress
   */
  private static generateIngress(options: HelmChartOptions): string {
    return `{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "odavl-insight.fullname" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
  {{- end }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "odavl-insight.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
`;
  }

  /**
   * Generate HPA (Horizontal Pod Autoscaler)
   */
  private static generateHPA(options: HelmChartOptions): string {
    return `{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "odavl-insight.fullname" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "odavl-insight.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
`;
  }

  /**
   * Generate ConfigMap
   */
  private static generateConfigMap(options: HelmChartOptions): string {
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "odavl-insight.fullname" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
data:
  app-config.json: |
    {
      "environment": "{{ .Values.env.NODE_ENV }}",
      "logLevel": "{{ .Values.env.LOG_LEVEL }}",
      "metrics": {
        "enabled": true,
        "port": {{ .Values.env.PROMETHEUS_PORT }}
      }
    }
`;
  }

  /**
   * Generate Secret
   */
  private static generateSecret(options: HelmChartOptions): string {
    return `apiVersion: v1
kind: Secret
metadata:
  name: {{ include "odavl-insight.fullname" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
type: Opaque
stringData:
  database-url: "postgresql://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ include "odavl-insight.fullname" . }}-postgresql:5432/{{ .Values.postgresql.auth.database }}"
  redis-url: "redis://{{ include "odavl-insight.fullname" . }}-redis-master:6379"
`;
  }

  /**
   * Generate ServiceAccount
   */
  private static generateServiceAccount(options: HelmChartOptions): string {
    return `{{- if .Values.serviceAccount.create -}}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "odavl-insight.serviceAccountName" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
  {{- with .Values.serviceAccount.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
`;
  }

  /**
   * Generate ServiceMonitor (Prometheus)
   */
  private static generateServiceMonitor(options: HelmChartOptions): string {
    return `{{- if .Values.serviceMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "odavl-insight.fullname" . }}
  labels:
    {{- include "odavl-insight.labels" . | nindent 4 }}
    {{- with .Values.serviceMonitor.labels }}
    {{- toYaml . | nindent 4 }}
    {{- end }}
spec:
  selector:
    matchLabels:
      {{- include "odavl-insight.selectorLabels" . | nindent 6 }}
  endpoints:
  - port: metrics
    interval: {{ .Values.serviceMonitor.interval }}
    scrapeTimeout: {{ .Values.serviceMonitor.scrapeTimeout }}
    path: /metrics
{{- end }}
`;
  }

  /**
   * Generate _helpers.tpl
   */
  private static generateHelpers(options: HelmChartOptions): string {
    return `{{/*
Expand the name of the chart.
*/}}
{{- define "odavl-insight.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "odavl-insight.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "odavl-insight.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "odavl-insight.labels" -}}
helm.sh/chart: {{ include "odavl-insight.chart" . }}
{{ include "odavl-insight.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "odavl-insight.selectorLabels" -}}
app.kubernetes.io/name: {{ include "odavl-insight.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "odavl-insight.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "odavl-insight.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
`;
  }

  /**
   * Generate NOTES.txt
   */
  private static generateNotes(options: HelmChartOptions): string {
    return `ODAVL Insight has been installed!

1. Get the application URL by running these commands:
{{- if .Values.ingress.enabled }}
  {{- range $host := .Values.ingress.hosts }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ $host.host }}{{ (index $host.paths 0).path }}
  {{- end }}
{{- else if contains "NodePort" .Values.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "odavl-insight.fullname" . }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "LoadBalancer" .Values.service.type }}
  NOTE: It may take a few minutes for the LoadBalancer IP to be available.
  You can watch the status by running: kubectl get --namespace {{ .Release.Namespace }} svc -w {{ include "odavl-insight.fullname" . }}
  export SERVICE_IP=$(kubectl get svc --namespace {{ .Release.Namespace }} {{ include "odavl-insight.fullname" . }} --template "{{"{{ range (index .status.loadBalancer.ingress 0) }}{{.}}{{ end }}"}}")
  echo http://$SERVICE_IP:{{ .Values.service.port }}
{{- else if contains "ClusterIP" .Values.service.type }}
  export POD_NAME=$(kubectl get pods --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "odavl-insight.name" . }},app.kubernetes.io/instance={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")
  kubectl --namespace {{ .Release.Namespace }} port-forward $POD_NAME 3001:3001
  echo "Visit http://127.0.0.1:3001 to use your application"
{{- end }}

2. Check the deployment status:
  kubectl get pods --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "odavl-insight.name" . }},app.kubernetes.io/instance={{ .Release.Name }}"

3. View logs:
  kubectl logs --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "odavl-insight.name" . }}" --all-containers=true --follow

4. Access metrics:
  kubectl port-forward --namespace {{ .Release.Namespace }} svc/{{ include "odavl-insight.fullname" . }} 9090:9090
  Visit http://127.0.0.1:9090/metrics
`;
  }
}
