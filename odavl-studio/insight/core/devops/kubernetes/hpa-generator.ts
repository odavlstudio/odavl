/**
 * @fileoverview Kubernetes Horizontal Pod Autoscaler (HPA) generator
 * Generates HPA with CPU/memory metrics and custom behavior
 */

export interface HPAOptions {
  name: string;
  namespace?: string;
  targetDeployment: string;
  minReplicas?: number;
  maxReplicas?: number;
  cpuTargetUtilization?: number;
  memoryTargetUtilization?: number;
  customMetrics?: CustomMetric[];
  behavior?: ScalingBehavior;
}

export interface CustomMetric {
  type: 'Pods' | 'Object' | 'External';
  name: string;
  target: {
    type: 'Value' | 'AverageValue' | 'Utilization';
    value?: string;
    averageValue?: string;
    averageUtilization?: number;
  };
  selector?: Record<string, string>;
}

export interface ScalingBehavior {
  scaleUp?: ScalingPolicy;
  scaleDown?: ScalingPolicy;
}

export interface ScalingPolicy {
  stabilizationWindowSeconds?: number;
  policies?: Array<{
    type: 'Pods' | 'Percent';
    value: number;
    periodSeconds: number;
  }>;
  selectPolicy?: 'Max' | 'Min' | 'Disabled';
}

export class K8sHPAGenerator {
  /**
   * Generate HPA manifest
   */
  static generate(options: HPAOptions): string {
    const {
      name,
      namespace = 'default',
      targetDeployment,
      minReplicas = 2,
      maxReplicas = 10,
      cpuTargetUtilization = 70,
      memoryTargetUtilization = 80,
      customMetrics = [],
      behavior,
    } = options;

    let manifest = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/component: autoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${targetDeployment}
  minReplicas: ${minReplicas}
  maxReplicas: ${maxReplicas}
  metrics:
`;

    // CPU metric
    if (cpuTargetUtilization) {
      manifest += `    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${cpuTargetUtilization}
`;
    }

    // Memory metric
    if (memoryTargetUtilization) {
      manifest += `    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: ${memoryTargetUtilization}
`;
    }

    // Custom metrics
    customMetrics.forEach((metric) => {
      manifest += this.formatCustomMetric(metric);
    });

    // Behavior (scaling policies)
    if (behavior) {
      manifest += `  behavior:\n`;
      if (behavior.scaleUp) {
        manifest += this.formatScalingBehavior('scaleUp', behavior.scaleUp);
      }
      if (behavior.scaleDown) {
        manifest += this.formatScalingBehavior('scaleDown', behavior.scaleDown);
      }
    }

    return manifest;
  }

  /**
   * Format custom metric
   */
  private static formatCustomMetric(metric: CustomMetric): string {
    let result = `    - type: ${metric.type}\n`;

    if (metric.type === 'Pods') {
      result += `      pods:\n`;
      result += `        metric:\n`;
      result += `          name: ${metric.name}\n`;
      if (metric.selector) {
        result += `          selector:\n`;
        result += `            matchLabels:\n`;
        Object.entries(metric.selector).forEach(([key, value]) => {
          result += `              ${key}: ${value}\n`;
        });
      }
      result += `        target:\n`;
      result += `          type: ${metric.target.type}\n`;
      if (metric.target.averageValue) {
        result += `          averageValue: ${metric.target.averageValue}\n`;
      }
    } else if (metric.type === 'External') {
      result += `      external:\n`;
      result += `        metric:\n`;
      result += `          name: ${metric.name}\n`;
      result += `        target:\n`;
      result += `          type: ${metric.target.type}\n`;
      if (metric.target.value) {
        result += `          value: ${metric.target.value}\n`;
      }
    }

    return result;
  }

  /**
   * Format scaling behavior
   */
  private static formatScalingBehavior(direction: 'scaleUp' | 'scaleDown', behavior: ScalingPolicy): string {
    let result = `    ${direction}:\n`;

    if (behavior.stabilizationWindowSeconds !== undefined) {
      result += `      stabilizationWindowSeconds: ${behavior.stabilizationWindowSeconds}\n`;
    }

    if (behavior.selectPolicy) {
      result += `      selectPolicy: ${behavior.selectPolicy}\n`;
    }

    if (behavior.policies && behavior.policies.length > 0) {
      result += `      policies:\n`;
      behavior.policies.forEach((policy) => {
        result += `        - type: ${policy.type}\n`;
        result += `          value: ${policy.value}\n`;
        result += `          periodSeconds: ${policy.periodSeconds}\n`;
      });
    }

    return result;
  }

  /**
   * Generate HPA with default CPU/Memory metrics
   */
  static generateDefault(name: string, targetDeployment: string): string {
    return this.generate({
      name,
      targetDeployment,
      minReplicas: 2,
      maxReplicas: 10,
      cpuTargetUtilization: 70,
      memoryTargetUtilization: 80,
    });
  }

  /**
   * Generate HPA with aggressive scaling
   */
  static generateAggressive(name: string, targetDeployment: string): string {
    return this.generate({
      name,
      targetDeployment,
      minReplicas: 3,
      maxReplicas: 20,
      cpuTargetUtilization: 60,
      memoryTargetUtilization: 70,
      behavior: {
        scaleUp: {
          stabilizationWindowSeconds: 0,
          policies: [
            { type: 'Percent', value: 100, periodSeconds: 15 },
            { type: 'Pods', value: 4, periodSeconds: 15 },
          ],
          selectPolicy: 'Max',
        },
        scaleDown: {
          stabilizationWindowSeconds: 300,
          policies: [{ type: 'Percent', value: 10, periodSeconds: 60 }],
          selectPolicy: 'Min',
        },
      },
    });
  }

  /**
   * Generate HPA with conservative scaling
   */
  static generateConservative(name: string, targetDeployment: string): string {
    return this.generate({
      name,
      targetDeployment,
      minReplicas: 2,
      maxReplicas: 6,
      cpuTargetUtilization: 80,
      memoryTargetUtilization: 85,
      behavior: {
        scaleUp: {
          stabilizationWindowSeconds: 60,
          policies: [
            { type: 'Percent', value: 50, periodSeconds: 60 },
            { type: 'Pods', value: 2, periodSeconds: 60 },
          ],
          selectPolicy: 'Min',
        },
        scaleDown: {
          stabilizationWindowSeconds: 600,
          policies: [{ type: 'Pods', value: 1, periodSeconds: 120 }],
          selectPolicy: 'Min',
        },
      },
    });
  }

  /**
   * Generate HPA with custom metrics (e.g., requests per second)
   */
  static generateWithCustomMetrics(
    name: string,
    targetDeployment: string,
    customMetrics: Array<{ name: string; targetValue: string }>
  ): string {
    return this.generate({
      name,
      targetDeployment,
      minReplicas: 2,
      maxReplicas: 15,
      cpuTargetUtilization: 70,
      customMetrics: customMetrics.map((m) => ({
        type: 'Pods',
        name: m.name,
        target: {
          type: 'AverageValue',
          averageValue: m.targetValue,
        },
      })),
    });
  }
}
