/**
 * @fileoverview Kubernetes Deployment manifest generator
 * Generates production-ready K8s Deployments with best practices
 */

export interface K8sDeploymentOptions {
  name: string;
  namespace?: string;
  replicas?: number;
  image: string;
  imageTag: string;
  imagePullPolicy?: 'Always' | 'IfNotPresent' | 'Never';
  containerPort: number;
  resources?: {
    limits?: { cpu: string; memory: string };
    requests?: { cpu: string; memory: string };
  };
  probes?: {
    liveness?: ProbeConfig;
    readiness?: ProbeConfig;
    startup?: ProbeConfig;
  };
  env?: Array<{ name: string; value: string } | { name: string; valueFrom: any }>;
  volumes?: VolumeConfig[];
  securityContext?: PodSecurityContext;
}

export interface ProbeConfig {
  type: 'http' | 'tcp' | 'exec';
  path?: string;
  port?: number;
  command?: string[];
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

export interface VolumeConfig {
  name: string;
  type: 'emptyDir' | 'configMap' | 'secret' | 'persistentVolumeClaim';
  source?: string;
  mountPath: string;
  readOnly?: boolean;
}

export interface PodSecurityContext {
  runAsNonRoot?: boolean;
  runAsUser?: number;
  fsGroup?: number;
  seccompProfile?: { type: string };
}

export class K8sDeploymentGenerator {
  /**
   * Generate Kubernetes Deployment manifest
   */
  static generate(options: K8sDeploymentOptions): string {
    const {
      name,
      namespace = 'default',
      replicas = 3,
      image,
      imageTag,
      imagePullPolicy = 'IfNotPresent',
      containerPort,
      resources = this.defaultResources(),
      probes,
      env = [],
      volumes = [],
      securityContext = this.defaultSecurityContext(),
    } = options;

    const labels = this.generateLabels(name);
    const volumeMounts = volumes.map((v) => ({ name: v.name, mountPath: v.mountPath, readOnly: v.readOnly }));
    const volumeDefs = volumes.map((v) => this.generateVolume(v));

    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
${this.indent(labels, 4)}
  annotations:
    kubernetes.io/change-cause: "Updated image to ${image}:${imageTag}"
spec:
  replicas: ${replicas}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
${this.indent(this.generateSelectorLabels(name), 6)}
  template:
    metadata:
      labels:
${this.indent(labels, 8)}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "${containerPort}"
    spec:
      securityContext:
        runAsNonRoot: ${securityContext.runAsNonRoot !== false}
        runAsUser: ${securityContext.runAsUser ?? 1001}
        fsGroup: ${securityContext.fsGroup ?? 1001}
        seccompProfile:
          type: ${securityContext.seccompProfile?.type ?? 'RuntimeDefault'}
      containers:
      - name: ${name}
        image: ${image}:${imageTag}
        imagePullPolicy: ${imagePullPolicy}
        ports:
        - name: http
          containerPort: ${containerPort}
          protocol: TCP
${probes ? this.generateProbes(probes) : ''}
        resources:
${this.indent(this.formatResources(resources), 10)}
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
              - ALL
          readOnlyRootFilesystem: true
${env.length > 0 ? this.generateEnvVars(env) : ''}
${volumeMounts.length > 0 ? this.generateVolumeMounts(volumeMounts) : ''}
${volumeDefs.length > 0 ? this.generateVolumes(volumeDefs) : ''}
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
`;
  }

  /**
   * Generate probes (liveness, readiness, startup)
   */
  private static generateProbes(probes: { liveness?: ProbeConfig; readiness?: ProbeConfig; startup?: ProbeConfig }): string {
    let result = '';

    if (probes.liveness) {
      result += `        livenessProbe:\n${this.formatProbe(probes.liveness, 10)}`;
    }

    if (probes.readiness) {
      result += `        readinessProbe:\n${this.formatProbe(probes.readiness, 10)}`;
    }

    if (probes.startup) {
      result += `        startupProbe:\n${this.formatProbe(probes.startup, 10)}`;
    }

    return result;
  }

  /**
   * Format single probe
   */
  private static formatProbe(probe: ProbeConfig, indent: number): string {
    const spaces = ' '.repeat(indent);
    let result = '';

    if (probe.type === 'http') {
      result += `${spaces}httpGet:\n`;
      result += `${spaces}  path: ${probe.path ?? '/health'}\n`;
      result += `${spaces}  port: ${probe.port ?? 'http'}\n`;
    } else if (probe.type === 'tcp') {
      result += `${spaces}tcpSocket:\n`;
      result += `${spaces}  port: ${probe.port ?? 'http'}\n`;
    } else if (probe.type === 'exec') {
      result += `${spaces}exec:\n`;
      result += `${spaces}  command:\n`;
      probe.command?.forEach((cmd) => {
        result += `${spaces}    - ${cmd}\n`;
      });
    }

    result += `${spaces}initialDelaySeconds: ${probe.initialDelaySeconds ?? 30}\n`;
    result += `${spaces}periodSeconds: ${probe.periodSeconds ?? 10}\n`;
    result += `${spaces}timeoutSeconds: ${probe.timeoutSeconds ?? 3}\n`;
    result += `${spaces}successThreshold: ${probe.successThreshold ?? 1}\n`;
    result += `${spaces}failureThreshold: ${probe.failureThreshold ?? 3}\n`;

    return result;
  }

  /**
   * Generate environment variables
   */
  private static generateEnvVars(env: Array<{ name: string; value?: string; valueFrom?: any }>): string {
    let result = '        env:\n';
    env.forEach((e) => {
      result += `        - name: ${e.name}\n`;
      if ('value' in e && e.value !== undefined) {
        result += `          value: ${JSON.stringify(e.value)}\n`;
      } else if (e.valueFrom) {
        result += `          valueFrom:\n`;
        result += this.indent(this.yamlStringify(e.valueFrom), 12);
      }
    });
    return result;
  }

  /**
   * Generate volume mounts
   */
  private static generateVolumeMounts(mounts: Array<{ name: string; mountPath: string; readOnly?: boolean }>): string {
    let result = '        volumeMounts:\n';
    mounts.forEach((m) => {
      result += `        - name: ${m.name}\n`;
      result += `          mountPath: ${m.mountPath}\n`;
      if (m.readOnly) {
        result += `          readOnly: true\n`;
      }
    });
    return result;
  }

  /**
   * Generate volume definitions
   */
  private static generateVolumes(volumes: string[]): string {
    let result = '      volumes:\n';
    volumes.forEach((v) => {
      result += this.indent(v, 6);
    });
    return result;
  }

  /**
   * Generate volume based on type
   */
  private static generateVolume(vol: VolumeConfig): string {
    let result = `- name: ${vol.name}\n`;

    switch (vol.type) {
      case 'emptyDir':
        result += `  emptyDir: {}\n`;
        break;
      case 'configMap':
        result += `  configMap:\n`;
        result += `    name: ${vol.source}\n`;
        break;
      case 'secret':
        result += `  secret:\n`;
        result += `    secretName: ${vol.source}\n`;
        break;
      case 'persistentVolumeClaim':
        result += `  persistentVolumeClaim:\n`;
        result += `    claimName: ${vol.source}\n`;
        break;
    }

    return result;
  }

  /**
   * Generate labels
   */
  private static generateLabels(name: string): string {
    return `app.kubernetes.io/name: ${name}
app.kubernetes.io/instance: ${name}
app.kubernetes.io/version: "1.0.0"
app.kubernetes.io/component: application
app.kubernetes.io/part-of: odavl-insight
app.kubernetes.io/managed-by: helm`;
  }

  /**
   * Generate selector labels
   */
  private static generateSelectorLabels(name: string): string {
    return `app.kubernetes.io/name: ${name}
app.kubernetes.io/instance: ${name}`;
  }

  /**
   * Format resources
   */
  private static formatResources(resources: { limits?: { cpu: string; memory: string }; requests?: { cpu: string; memory: string } }): string {
    let result = '';

    if (resources.limits) {
      result += `limits:\n`;
      result += `  cpu: ${resources.limits.cpu}\n`;
      result += `  memory: ${resources.limits.memory}\n`;
    }

    if (resources.requests) {
      result += `requests:\n`;
      result += `  cpu: ${resources.requests.cpu}\n`;
      result += `  memory: ${resources.requests.memory}\n`;
    }

    return result;
  }

  /**
   * Default resources
   */
  private static defaultResources(): { limits: { cpu: string; memory: string }; requests: { cpu: string; memory: string } } {
    return {
      limits: { cpu: '2000m', memory: '4Gi' },
      requests: { cpu: '500m', memory: '1Gi' },
    };
  }

  /**
   * Default security context
   */
  private static defaultSecurityContext(): PodSecurityContext {
    return {
      runAsNonRoot: true,
      runAsUser: 1001,
      fsGroup: 1001,
      seccompProfile: { type: 'RuntimeDefault' },
    };
  }

  /**
   * Indent text
   */
  private static indent(text: string, spaces: number): string {
    const prefix = ' '.repeat(spaces);
    return text
      .split('\n')
      .map((line) => (line.trim() ? prefix + line : ''))
      .join('\n');
  }

  /**
   * Simple YAML stringify (for valueFrom objects)
   */
  private static yamlStringify(obj: any, indent = 0): string {
    const spaces = ' '.repeat(indent);
    let result = '';

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        result += `${spaces}${key}:\n`;
        result += this.yamlStringify(value, indent + 2);
      } else {
        result += `${spaces}${key}: ${value}\n`;
      }
    }

    return result;
  }

  /**
   * Generate Deployment with common presets
   */
  static generateWebApp(options: { name: string; image: string; tag: string; port: number }): string {
    return this.generate({
      name: options.name,
      image: options.image,
      imageTag: options.tag,
      containerPort: options.port,
      replicas: 3,
      probes: {
        liveness: { type: 'http', path: '/health', port: options.port, initialDelaySeconds: 30, periodSeconds: 10 },
        readiness: { type: 'http', path: '/ready', port: options.port, initialDelaySeconds: 5, periodSeconds: 5 },
      },
      volumes: [
        { name: 'tmp', type: 'emptyDir', mountPath: '/tmp' },
        { name: 'cache', type: 'emptyDir', mountPath: '/app/.cache' },
      ],
    });
  }

  /**
   * Generate Deployment with database connection
   */
  static generateWithDatabase(options: { name: string; image: string; tag: string; port: number; dbSecretName: string }): string {
    return this.generate({
      name: options.name,
      image: options.image,
      imageTag: options.tag,
      containerPort: options.port,
      replicas: 3,
      env: [
        { name: 'NODE_ENV', value: 'production' },
        {
          name: 'DATABASE_URL',
          valueFrom: {
            secretKeyRef: {
              name: options.dbSecretName,
              key: 'database-url',
            },
          },
        },
      ],
      probes: {
        liveness: { type: 'http', path: '/health', port: options.port },
        readiness: { type: 'http', path: '/ready', port: options.port },
      },
      volumes: [
        { name: 'tmp', type: 'emptyDir', mountPath: '/tmp' },
        { name: 'cache', type: 'emptyDir', mountPath: '/app/.cache' },
      ],
    });
  }
}
