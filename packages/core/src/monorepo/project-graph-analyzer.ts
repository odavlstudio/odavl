/**
 * Project Graph Analyzer
 * 
 * Builds dependency graph for monorepo packages.
 * Visualizes relationships and detects cycles.
 * 
 * @since Phase 1 Week 21 (December 2025)
 */

import { PackageInfo } from './monorepo-detector';

export interface ProjectGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cycles: string[][]; // Circular dependencies
}

export interface GraphNode {
  id: string; // Package name
  label: string;
  path: string;
  type: 'app' | 'lib' | 'package';
  metadata: {
    version: string;
    scripts: string[];
    dependencies: number;
    dependents: number;
  };
}

export interface GraphEdge {
  from: string; // Source package
  to: string; // Target package
  type: 'dependency' | 'devDependency';
  weight: number; // Dependency strength (1-10)
}

/**
 * Project graph analyzer
 */
export class ProjectGraphAnalyzer {
  private packages: PackageInfo[];

  constructor(packages: PackageInfo[]) {
    this.packages = packages;
  }

  /**
   * Build project dependency graph
   */
  buildGraph(): ProjectGraph {
    const nodes = this.buildNodes();
    const edges = this.buildEdges();
    const cycles = this.detectCycles();

    return {
      nodes,
      edges,
      cycles,
    };
  }

  /**
   * Build graph nodes
   */
  private buildNodes(): GraphNode[] {
    return this.packages.map(pkg => {
      const dependents = this.findDependents(pkg.name);

      return {
        id: pkg.name,
        label: pkg.name,
        path: pkg.path,
        type: this.inferPackageType(pkg),
        metadata: {
          version: pkg.version,
          scripts: Object.keys(pkg.scripts),
          dependencies: pkg.dependencies.length,
          dependents: dependents.length,
        },
      };
    });
  }

  /**
   * Build graph edges
   */
  private buildEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];

    for (const pkg of this.packages) {
      // Add dependency edges
      for (const dep of pkg.dependencies) {
        if (this.isInternalPackage(dep)) {
          edges.push({
            from: pkg.name,
            to: dep,
            type: 'dependency',
            weight: 10, // Production dependency has high weight
          });
        }
      }

      // Add devDependency edges
      for (const dep of pkg.devDependencies) {
        if (this.isInternalPackage(dep)) {
          edges.push({
            from: pkg.name,
            to: dep,
            type: 'devDependency',
            weight: 5, // Dev dependency has lower weight
          });
        }
      }
    }

    return edges;
  }

  /**
   * Detect circular dependencies
   */
  private detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (stack.has(node)) {
        // Found cycle
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart).concat(node);
        cycles.push(cycle);
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      stack.add(node);
      path.push(node);

      const pkg = this.packages.find(p => p.name === node);
      if (pkg) {
        const deps = [...pkg.dependencies, ...pkg.devDependencies]
          .filter(dep => this.isInternalPackage(dep));

        for (const dep of deps) {
          dfs(dep, [...path]);
        }
      }

      stack.delete(node);
    };

    for (const pkg of this.packages) {
      if (!visited.has(pkg.name)) {
        dfs(pkg.name, []);
      }
    }

    return cycles;
  }

  /**
   * Get topological sort order
   */
  getTopologicalOrder(): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize
    for (const pkg of this.packages) {
      inDegree.set(pkg.name, 0);
      adjList.set(pkg.name, []);
    }

    // Build adjacency list
    for (const pkg of this.packages) {
      const deps = [...pkg.dependencies, ...pkg.devDependencies]
        .filter(dep => this.isInternalPackage(dep));

      for (const dep of deps) {
        adjList.get(dep)?.push(pkg.name);
        inDegree.set(pkg.name, (inDegree.get(pkg.name) || 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    for (const [pkg, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(pkg);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const neighbor of adjList.get(current) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  /**
   * Get affected packages
   */
  getAffectedPackages(changedPackages: string[]): string[] {
    const affected = new Set<string>(changedPackages);

    const traverse = (pkgName: string): void => {
      const dependents = this.findDependents(pkgName);

      for (const dependent of dependents) {
        if (!affected.has(dependent)) {
          affected.add(dependent);
          traverse(dependent);
        }
      }
    };

    for (const pkg of changedPackages) {
      traverse(pkg);
    }

    return Array.from(affected);
  }

  /**
   * Get package dependencies (recursive)
   */
  getPackageDependencies(pkgName: string): string[] {
    const deps = new Set<string>();

    const traverse = (name: string): void => {
      const pkg = this.packages.find(p => p.name === name);
      if (!pkg) return;

      const allDeps = [...pkg.dependencies, ...pkg.devDependencies]
        .filter(dep => this.isInternalPackage(dep));

      for (const dep of allDeps) {
        if (!deps.has(dep)) {
          deps.add(dep);
          traverse(dep);
        }
      }
    };

    traverse(pkgName);
    return Array.from(deps);
  }

  /**
   * Export graph to DOT format (Graphviz)
   */
  toDOT(): string {
    const graph = this.buildGraph();

    let dot = 'digraph ProjectGraph {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    // Add nodes
    for (const node of graph.nodes) {
      const color = node.type === 'app' ? 'lightblue' : 'lightgreen';
      dot += `  "${node.id}" [label="${node.label}" fillcolor=${color} style=filled];\n`;
    }

    dot += '\n';

    // Add edges
    for (const edge of graph.edges) {
      const style = edge.type === 'devDependency' ? 'dashed' : 'solid';
      dot += `  "${edge.from}" -> "${edge.to}" [style=${style}];\n`;
    }

    // Highlight cycles
    if (graph.cycles.length > 0) {
      dot += '\n  // Circular dependencies\n';
      for (const cycle of graph.cycles) {
        for (let i = 0; i < cycle.length - 1; i++) {
          dot += `  "${cycle[i]}" -> "${cycle[i + 1]}" [color=red penwidth=2];\n`;
        }
      }
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Export graph to JSON
   */
  toJSON(): string {
    const graph = this.buildGraph();
    return JSON.stringify(graph, null, 2);
  }

  /**
   * Find packages that depend on target
   */
  private findDependents(target: string): string[] {
    return this.packages
      .filter(pkg =>
        pkg.dependencies.includes(target) ||
        pkg.devDependencies.includes(target)
      )
      .map(pkg => pkg.name);
  }

  /**
   * Check if package is internal (part of monorepo)
   */
  private isInternalPackage(pkgName: string): boolean {
    return this.packages.some(pkg => pkg.name === pkgName);
  }

  /**
   * Infer package type from path
   */
  private inferPackageType(pkg: PackageInfo): 'app' | 'lib' | 'package' {
    if (pkg.path.startsWith('apps/')) {
      return 'app';
    }
    if (pkg.path.startsWith('libs/') || pkg.path.startsWith('packages/')) {
      return 'lib';
    }
    return 'package';
  }

  /**
   * Get critical path (longest dependency chain)
   */
  getCriticalPath(): string[] {
    let longestPath: string[] = [];

    const dfs = (node: string, path: string[]): void => {
      if (path.length > longestPath.length) {
        longestPath = [...path];
      }

      const pkg = this.packages.find(p => p.name === node);
      if (!pkg) return;

      const deps = pkg.dependencies.filter(dep => this.isInternalPackage(dep));

      for (const dep of deps) {
        if (!path.includes(dep)) {
          dfs(dep, [...path, dep]);
        }
      }
    };

    for (const pkg of this.packages) {
      dfs(pkg.name, [pkg.name]);
    }

    return longestPath;
  }

  /**
   * Get graph statistics
   */
  getStats() {
    const graph = this.buildGraph();

    return {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      cycles: graph.cycles.length,
      avgDependencies: graph.nodes.reduce((sum, n) => sum + n.metadata.dependencies, 0) / graph.nodes.length,
      maxDependencies: Math.max(...graph.nodes.map(n => n.metadata.dependencies)),
      criticalPathLength: this.getCriticalPath().length,
    };
  }
}

/**
 * Helper: Create project graph analyzer
 */
export function createProjectGraphAnalyzer(packages: PackageInfo[]): ProjectGraphAnalyzer {
  return new ProjectGraphAnalyzer(packages);
}

/**
 * Helper: Build graph from packages
 */
export function buildProjectGraph(packages: PackageInfo[]): ProjectGraph {
  const analyzer = createProjectGraphAnalyzer(packages);
  return analyzer.buildGraph();
}

export default ProjectGraphAnalyzer;
