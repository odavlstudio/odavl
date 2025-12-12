/**
 * @fileoverview Kubernetes monitoring integration generators
 * ServiceMonitor, PodMonitor, PrometheusRule for Prometheus Operator
 */

export interface ServiceMonitorOptions {
  name: string;
  namespace?: string;
  serviceName: string;
  port: string;
  path?: string;
  interval?: string;
  scrapeTimeout?: string;
  selector?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface PodMonitorOptions {
  name: string;
  namespace?: string;
  port: string;
  path?: string;
  interval?: string;
  scrapeTimeout?: string;
  selector: Record<string, string>;
  labels?: Record<string, string>;
}

export interface PrometheusRuleOptions {
  name: string;
  namespace?: string;
  groups: AlertGroup[];
}

export interface AlertGroup {
  name: string;
  interval?: string;
  rules: AlertRule[];
}

export interface AlertRule {
  alert: string;
  expr: string;
  for?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export class K8sMonitoringGenerator {
  /**
   * Generate ServiceMonitor for Prometheus Operator
   */
  static generateServiceMonitor(options: ServiceMonitorOptions): string {
    const {
      name,
      namespace = 'default',
      serviceName,
      port,
      path = '/metrics',
      interval = '30s',
      scrapeTimeout = '10s',
      selector = {},
      labels = {},
    } = options;

    return `apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
    release: prometheus
${this.formatLabels(labels, 4)}
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ${serviceName}
${this.formatLabels(selector, 6)}
  endpoints:
  - port: ${port}
    path: ${path}
    interval: ${interval}
    scrapeTimeout: ${scrapeTimeout}
    scheme: http
`;
  }

  /**
   * Generate PodMonitor for direct pod scraping
   */
  static generatePodMonitor(options: PodMonitorOptions): string {
    const {
      name,
      namespace = 'default',
      port,
      path = '/metrics',
      interval = '30s',
      scrapeTimeout = '10s',
      selector,
      labels = {},
    } = options;

    return `apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
    release: prometheus
${this.formatLabels(labels, 4)}
spec:
  selector:
    matchLabels:
${this.formatLabels(selector, 6)}
  podMetricsEndpoints:
  - port: ${port}
    path: ${path}
    interval: ${interval}
    scrapeTimeout: ${scrapeTimeout}
`;
  }

  /**
   * Generate PrometheusRule for alerting
   */
  static generatePrometheusRule(options: PrometheusRuleOptions): string {
    const { name, namespace = 'default', groups } = options;

    let manifest = `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
    release: prometheus
spec:
  groups:
`;

    groups.forEach((group) => {
      manifest += `  - name: ${group.name}\n`;
      if (group.interval) {
        manifest += `    interval: ${group.interval}\n`;
      }
      manifest += `    rules:\n`;

      group.rules.forEach((rule) => {
        manifest += `    - alert: ${rule.alert}\n`;
        manifest += `      expr: ${rule.expr}\n`;
        if (rule.for) {
          manifest += `      for: ${rule.for}\n`;
        }
        if (rule.labels && Object.keys(rule.labels).length > 0) {
          manifest += `      labels:\n`;
          Object.entries(rule.labels).forEach(([key, value]) => {
            manifest += `        ${key}: ${value}\n`;
          });
        }
        if (rule.annotations && Object.keys(rule.annotations).length > 0) {
          manifest += `      annotations:\n`;
          Object.entries(rule.annotations).forEach(([key, value]) => {
            manifest += `        ${key}: ${JSON.stringify(value)}\n`;
          });
        }
      });
    });

    return manifest;
  }

  /**
   * Generate default alerting rules for ODAVL Insight
   */
  static generateDefaultAlertRules(appName: string): string {
    return this.generatePrometheusRule({
      name: `${appName}-alerts`,
      groups: [
        {
          name: `${appName}.availability`,
          rules: [
            {
              alert: 'HighErrorRate',
              expr: `(sum(rate(http_requests_total{job="${appName}",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="${appName}"}[5m]))) > 0.05`,
              for: '5m',
              labels: { severity: 'critical', component: appName },
              annotations: {
                summary: 'High error rate detected',
                description: `Error rate is above 5% for ${appName} (current: {{ $value | humanizePercentage }})`,
              },
            },
            {
              alert: 'ServiceDown',
              expr: `up{job="${appName}"} == 0`,
              for: '2m',
              labels: { severity: 'critical', component: appName },
              annotations: {
                summary: 'Service is down',
                description: `${appName} instance {{ $labels.instance }} is down`,
              },
            },
          ],
        },
        {
          name: `${appName}.performance`,
          rules: [
            {
              alert: 'HighLatency',
              expr: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="${appName}"}[5m])) by (le)) > 1`,
              for: '10m',
              labels: { severity: 'warning', component: appName },
              annotations: {
                summary: 'High request latency detected',
                description: `95th percentile latency is above 1s for ${appName} (current: {{ $value }}s)`,
              },
            },
            {
              alert: 'HighCPUUsage',
              expr: `(sum(rate(container_cpu_usage_seconds_total{pod=~"${appName}.*"}[5m])) by (pod) / sum(container_spec_cpu_quota{pod=~"${appName}.*"}/container_spec_cpu_period{pod=~"${appName}.*"}) by (pod)) > 0.8`,
              for: '15m',
              labels: { severity: 'warning', component: appName },
              annotations: {
                summary: 'High CPU usage detected',
                description: `Pod {{ $labels.pod }} CPU usage is above 80% (current: {{ $value | humanizePercentage }})`,
              },
            },
            {
              alert: 'HighMemoryUsage',
              expr: `(sum(container_memory_working_set_bytes{pod=~"${appName}.*"}) by (pod) / sum(container_spec_memory_limit_bytes{pod=~"${appName}.*"}) by (pod)) > 0.85`,
              for: '15m',
              labels: { severity: 'warning', component: appName },
              annotations: {
                summary: 'High memory usage detected',
                description: `Pod {{ $labels.pod }} memory usage is above 85% (current: {{ $value | humanizePercentage }})`,
              },
            },
          ],
        },
        {
          name: `${appName}.pods`,
          rules: [
            {
              alert: 'PodCrashLooping',
              expr: `rate(kube_pod_container_status_restarts_total{pod=~"${appName}.*"}[15m]) > 0`,
              for: '5m',
              labels: { severity: 'critical', component: appName },
              annotations: {
                summary: 'Pod is crash looping',
                description: `Pod {{ $labels.pod }} is restarting frequently ({{ $value }} restarts/min)`,
              },
            },
            {
              alert: 'PodNotReady',
              expr: `sum(kube_pod_status_phase{pod=~"${appName}.*",phase!="Running"}) by (pod) > 0`,
              for: '10m',
              labels: { severity: 'warning', component: appName },
              annotations: {
                summary: 'Pod not ready',
                description: `Pod {{ $labels.pod }} has been in non-Running state for 10+ minutes`,
              },
            },
          ],
        },
      ],
    });
  }

  /**
   * Generate complete monitoring stack
   */
  static generateMonitoringStack(appName: string, servicePort: string): Record<string, string> {
    return {
      'service-monitor.yaml': this.generateServiceMonitor({
        name: appName,
        serviceName: appName,
        port: servicePort,
        interval: '30s',
        scrapeTimeout: '10s',
        labels: { release: 'prometheus' },
      }),
      'prometheus-rules.yaml': this.generateDefaultAlertRules(appName),
    };
  }

  /**
   * Format labels
   */
  private static formatLabels(labels: Record<string, string>, indent: number): string {
    const spaces = ' '.repeat(indent);
    let result = '';
    Object.entries(labels).forEach(([key, value]) => {
      result += `${spaces}${key}: ${value}\n`;
    });
    return result;
  }
}
