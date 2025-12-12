/**
 * @fileoverview Kubernetes Service, Ingress, ConfigMap, Secret generators
 * Complete service configuration utilities
 */

export interface ServiceOptions {
  name: string;
  namespace?: string;
  type?: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  port: number;
  targetPort: number;
  selector: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface IngressOptions {
  name: string;
  namespace?: string;
  className?: string;
  host: string;
  path?: string;
  pathType?: 'Prefix' | 'Exact';
  serviceName: string;
  servicePort: number;
  tls?: boolean;
  tlsSecretName?: string;
  annotations?: Record<string, string>;
}

export interface ConfigMapOptions {
  name: string;
  namespace?: string;
  data: Record<string, string>;
  binaryData?: Record<string, string>;
}

export interface SecretOptions {
  name: string;
  namespace?: string;
  type?: 'Opaque' | 'kubernetes.io/tls' | 'kubernetes.io/dockerconfigjson';
  stringData?: Record<string, string>;
  data?: Record<string, string>;
}

export class K8sServiceGenerator {
  /**
   * Generate Service manifest
   */
  static generate(options: ServiceOptions): string {
    const { name, namespace = 'default', type = 'ClusterIP', port, targetPort, selector, annotations = {} } = options;

    let manifest = `apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/component: service
`;

    if (Object.keys(annotations).length > 0) {
      manifest += `  annotations:\n`;
      Object.entries(annotations).forEach(([key, value]) => {
        manifest += `    ${key}: ${JSON.stringify(value)}\n`;
      });
    }

    manifest += `spec:
  type: ${type}
  ports:
    - port: ${port}
      targetPort: ${targetPort}
      protocol: TCP
      name: http
`;

    if (type === 'NodePort') {
      manifest += `      nodePort: 30080\n`;
    }

    manifest += `  selector:\n`;
    Object.entries(selector).forEach(([key, value]) => {
      manifest += `    ${key}: ${value}\n`;
    });

    return manifest;
  }

  /**
   * Generate ClusterIP Service
   */
  static generateClusterIP(name: string, port: number): string {
    return this.generate({
      name,
      type: 'ClusterIP',
      port,
      targetPort: port,
      selector: {
        'app.kubernetes.io/name': name,
        'app.kubernetes.io/instance': name,
      },
    });
  }

  /**
   * Generate LoadBalancer Service
   */
  static generateLoadBalancer(name: string, port: number): string {
    return this.generate({
      name,
      type: 'LoadBalancer',
      port,
      targetPort: port,
      selector: {
        'app.kubernetes.io/name': name,
        'app.kubernetes.io/instance': name,
      },
      annotations: {
        'service.beta.kubernetes.io/aws-load-balancer-type': 'nlb',
      },
    });
  }

  /**
   * Generate Service with metrics port
   */
  static generateWithMetrics(name: string, appPort: number, metricsPort: number): string {
    const { namespace = 'default', selector } = {
      namespace: 'default',
      selector: {
        'app.kubernetes.io/name': name,
        'app.kubernetes.io/instance': name,
      },
    };

    return `apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
spec:
  type: ClusterIP
  ports:
    - port: ${appPort}
      targetPort: ${appPort}
      protocol: TCP
      name: http
    - port: ${metricsPort}
      targetPort: ${metricsPort}
      protocol: TCP
      name: metrics
  selector:
${Object.entries(selector)
  .map(([k, v]) => `    ${k}: ${v}`)
  .join('\n')}
`;
  }
}

export class K8sIngressGenerator {
  /**
   * Generate Ingress manifest
   */
  static generate(options: IngressOptions): string {
    const {
      name,
      namespace = 'default',
      className = 'nginx',
      host,
      path = '/',
      pathType = 'Prefix',
      serviceName,
      servicePort,
      tls = true,
      tlsSecretName = `${name}-tls`,
      annotations = {},
    } = options;

    let manifest = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
`;

    Object.entries(annotations).forEach(([key, value]) => {
      manifest += `    ${key}: ${JSON.stringify(value)}\n`;
    });

    manifest += `spec:
  ingressClassName: ${className}
`;

    if (tls) {
      manifest += `  tls:
    - hosts:
        - ${host}
      secretName: ${tlsSecretName}
`;
    }

    manifest += `  rules:
    - host: ${host}
      http:
        paths:
          - path: ${path}
            pathType: ${pathType}
            backend:
              service:
                name: ${serviceName}
                port:
                  number: ${servicePort}
`;

    return manifest;
  }

  /**
   * Generate Ingress with rate limiting
   */
  static generateWithRateLimit(options: IngressOptions & { rateLimit: string }): string {
    return this.generate({
      ...options,
      annotations: {
        ...options.annotations,
        'nginx.ingress.kubernetes.io/limit-rps': options.rateLimit,
      },
    });
  }

  /**
   * Generate Ingress with custom timeout
   */
  static generateWithTimeout(options: IngressOptions & { timeout: string }): string {
    return this.generate({
      ...options,
      annotations: {
        ...options.annotations,
        'nginx.ingress.kubernetes.io/proxy-connect-timeout': options.timeout,
        'nginx.ingress.kubernetes.io/proxy-send-timeout': options.timeout,
        'nginx.ingress.kubernetes.io/proxy-read-timeout': options.timeout,
      },
    });
  }
}

export class K8sConfigMapGenerator {
  /**
   * Generate ConfigMap manifest
   */
  static generate(options: ConfigMapOptions): string {
    const { name, namespace = 'default', data, binaryData } = options;

    let manifest = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
`;

    if (data && Object.keys(data).length > 0) {
      manifest += `data:\n`;
      Object.entries(data).forEach(([key, value]) => {
        if (value.includes('\n')) {
          manifest += `  ${key}: |\n`;
          value.split('\n').forEach((line) => {
            manifest += `    ${line}\n`;
          });
        } else {
          manifest += `  ${key}: ${JSON.stringify(value)}\n`;
        }
      });
    }

    if (binaryData && Object.keys(binaryData).length > 0) {
      manifest += `binaryData:\n`;
      Object.entries(binaryData).forEach(([key, value]) => {
        manifest += `  ${key}: ${value}\n`;
      });
    }

    return manifest;
  }

  /**
   * Generate ConfigMap from JSON config
   */
  static generateFromJSON(name: string, config: Record<string, any>): string {
    return this.generate({
      name,
      data: {
        'config.json': JSON.stringify(config, null, 2),
      },
    });
  }

  /**
   * Generate ConfigMap from environment variables
   */
  static generateEnvConfig(name: string, env: Record<string, string>): string {
    return this.generate({
      name: `${name}-env`,
      data: env,
    });
  }
}

export class K8sSecretGenerator {
  /**
   * Generate Secret manifest
   */
  static generate(options: SecretOptions): string {
    const { name, namespace = 'default', type = 'Opaque', stringData, data } = options;

    let manifest = `apiVersion: v1
kind: Secret
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
type: ${type}
`;

    if (stringData && Object.keys(stringData).length > 0) {
      manifest += `stringData:\n`;
      Object.entries(stringData).forEach(([key, value]) => {
        manifest += `  ${key}: ${JSON.stringify(value)}\n`;
      });
    }

    if (data && Object.keys(data).length > 0) {
      manifest += `data:\n`;
      Object.entries(data).forEach(([key, value]) => {
        manifest += `  ${key}: ${value}\n`;
      });
    }

    return manifest;
  }

  /**
   * Generate Secret for database credentials
   */
  static generateDatabaseSecret(name: string, url: string): string {
    return this.generate({
      name: `${name}-db`,
      type: 'Opaque',
      stringData: {
        'database-url': url,
      },
    });
  }

  /**
   * Generate Secret for Redis
   */
  static generateRedisSecret(name: string, url: string): string {
    return this.generate({
      name: `${name}-redis`,
      type: 'Opaque',
      stringData: {
        'redis-url': url,
      },
    });
  }

  /**
   * Generate TLS Secret
   */
  static generateTLSSecret(name: string, cert: string, key: string): string {
    return this.generate({
      name: `${name}-tls`,
      type: 'kubernetes.io/tls',
      data: {
        'tls.crt': cert, // Base64-encoded
        'tls.key': key, // Base64-encoded
      },
    });
  }

  /**
   * Generate Docker registry secret
   */
  static generateDockerConfigSecret(name: string, registry: string, username: string, password: string, email: string): string {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const dockerConfig = {
      auths: {
        [registry]: {
          username,
          password,
          email,
          auth,
        },
      },
    };

    return this.generate({
      name: `${name}-registry`,
      type: 'kubernetes.io/dockerconfigjson',
      stringData: {
        '.dockerconfigjson': JSON.stringify(dockerConfig),
      },
    });
  }
}
