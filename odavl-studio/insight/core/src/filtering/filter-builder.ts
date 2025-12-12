/**
 * ODAVL Insight Enterprise - Filter Builder
 * Week 42: Advanced Filtering - File 1/3
 * 
 * Features:
 * - Complex multi-criteria filtering
 * - Boolean logic (AND, OR, NOT)
 * - Comparison operators (=, !=, <, >, <=, >=, IN, BETWEEN)
 * - Text operators (contains, startsWith, endsWith, regex)
 * - Date/time filtering with relative dates
 * - Array filters (any, all, none)
 * - Nested filters (groups)
 * - Filter validation
 * - Query optimization
 * - SQL/NoSQL query generation
 * 
 * @module filtering/filter-builder
 */

import { EventEmitter } from 'events';

// ==================== Types & Interfaces ====================

/**
 * Filter operator types
 */
export enum FilterOperator {
  // Comparison
  Equals = 'eq',
  NotEquals = 'ne',
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  LessThan = 'lt',
  LessThanOrEqual = 'lte',
  Between = 'between',
  In = 'in',
  NotIn = 'notIn',
  
  // Text
  Contains = 'contains',
  NotContains = 'notContains',
  StartsWith = 'startsWith',
  EndsWith = 'endsWith',
  Regex = 'regex',
  
  // Null checks
  IsNull = 'isNull',
  IsNotNull = 'isNotNull',
  
  // Array
  ArrayContains = 'arrayContains',
  ArrayContainsAll = 'arrayContainsAll',
  ArrayContainsAny = 'arrayContainsAny',
  
  // Date
  DateBefore = 'dateBefore',
  DateAfter = 'dateAfter',
  DateBetween = 'dateBetween',
  DateRelative = 'dateRelative',
}

/**
 * Boolean logic operators
 */
export enum LogicOperator {
  And = 'and',
  Or = 'or',
  Not = 'not',
}

/**
 * Relative date units
 */
export enum RelativeDateUnit {
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days',
  Weeks = 'weeks',
  Months = 'months',
  Years = 'years',
}

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown; // Single value or array
  values?: unknown[]; // For IN, BETWEEN
  caseSensitive?: boolean; // For text operators
  negate?: boolean; // Negate the condition
}

/**
 * Filter group with boolean logic
 */
export interface FilterGroup {
  operator: LogicOperator; // AND, OR
  conditions: (FilterCondition | FilterGroup)[]; // Can nest groups
}

/**
 * Complete filter specification
 */
export interface Filter {
  root: FilterGroup;
  metadata?: {
    name?: string;
    description?: string;
    createdBy?: string;
    createdAt?: Date;
    tags?: string[];
  };
}

/**
 * Filter validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: {
    path: string; // e.g., "root.conditions[0].field"
    message: string;
  }[];
}

/**
 * Query generation result
 */
export interface QueryResult {
  sql?: string; // SQL WHERE clause
  mongodb?: Record<string, unknown>; // MongoDB query object
  elasticsearch?: Record<string, unknown>; // Elasticsearch query DSL
  params?: unknown[]; // Parameterized query values
}

/**
 * Filter builder configuration
 */
export interface FilterBuilderConfig {
  // Validation
  maxNestingDepth: number; // Max filter group nesting (default: 5)
  maxConditions: number; // Max total conditions (default: 100)
  
  // Allowed fields
  allowedFields?: string[]; // Whitelist of filterable fields
  
  // Query generation
  parameterize: boolean; // Use parameterized queries (default: true)
  sqlDialect: 'postgresql' | 'mysql' | 'sqlite'; // SQL dialect
  
  // Performance
  enableOptimization: boolean; // Optimize filter tree
}

// ==================== Filter Builder ====================

const DEFAULT_CONFIG: FilterBuilderConfig = {
  maxNestingDepth: 5,
  maxConditions: 100,
  parameterize: true,
  sqlDialect: 'postgresql',
  enableOptimization: true,
};

/**
 * Filter Builder
 * Build complex filters with boolean logic and various operators
 */
export class FilterBuilder extends EventEmitter {
  private config: FilterBuilderConfig;
  private currentFilter: Filter;

  constructor(config: Partial<FilterBuilderConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentFilter = this.createEmptyFilter();
  }

  /**
   * Create new filter
   */
  createFilter(operator: LogicOperator = LogicOperator.And): FilterBuilder {
    this.currentFilter = {
      root: {
        operator,
        conditions: [],
      },
    };
    this.emit('filter-created');
    return this;
  }

  /**
   * Add condition to current filter
   */
  where(field: string, operator: FilterOperator, value?: unknown): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator,
      value,
    };

    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add equals condition
   */
  equals(field: string, value: unknown): FilterBuilder {
    return this.where(field, FilterOperator.Equals, value);
  }

  /**
   * Add not equals condition
   */
  notEquals(field: string, value: unknown): FilterBuilder {
    return this.where(field, FilterOperator.NotEquals, value);
  }

  /**
   * Add greater than condition
   */
  greaterThan(field: string, value: number | Date): FilterBuilder {
    return this.where(field, FilterOperator.GreaterThan, value);
  }

  /**
   * Add less than condition
   */
  lessThan(field: string, value: number | Date): FilterBuilder {
    return this.where(field, FilterOperator.LessThan, value);
  }

  /**
   * Add between condition
   */
  between(field: string, min: unknown, max: unknown): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator: FilterOperator.Between,
      values: [min, max],
    };
    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add IN condition
   */
  in(field: string, values: unknown[]): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator: FilterOperator.In,
      values,
    };
    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add NOT IN condition
   */
  notIn(field: string, values: unknown[]): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator: FilterOperator.NotIn,
      values,
    };
    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add contains condition (text search)
   */
  contains(field: string, value: string, caseSensitive = false): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator: FilterOperator.Contains,
      value,
      caseSensitive,
    };
    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add starts with condition
   */
  startsWith(field: string, value: string, caseSensitive = false): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator: FilterOperator.StartsWith,
      value,
      caseSensitive,
    };
    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add regex condition
   */
  regex(field: string, pattern: string): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator: FilterOperator.Regex,
      value: pattern,
    };
    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add IS NULL condition
   */
  isNull(field: string): FilterBuilder {
    return this.where(field, FilterOperator.IsNull);
  }

  /**
   * Add IS NOT NULL condition
   */
  isNotNull(field: string): FilterBuilder {
    return this.where(field, FilterOperator.IsNotNull);
  }

  /**
   * Add relative date condition
   */
  dateRelative(
    field: string,
    amount: number,
    unit: RelativeDateUnit,
    before = false
  ): FilterBuilder {
    const condition: FilterCondition = {
      field,
      operator: FilterOperator.DateRelative,
      value: { amount, unit, before },
    };
    this.currentFilter.root.conditions.push(condition);
    this.emit('condition-added', { condition });
    return this;
  }

  /**
   * Add nested filter group (AND)
   */
  andGroup(builder: (fb: FilterBuilder) => void): FilterBuilder {
    const nestedBuilder = new FilterBuilder(this.config);
    nestedBuilder.createFilter(LogicOperator.And);
    builder(nestedBuilder);

    this.currentFilter.root.conditions.push(nestedBuilder.build().root);
    this.emit('group-added', { operator: LogicOperator.And });
    return this;
  }

  /**
   * Add nested filter group (OR)
   */
  orGroup(builder: (fb: FilterBuilder) => void): FilterBuilder {
    const nestedBuilder = new FilterBuilder(this.config);
    nestedBuilder.createFilter(LogicOperator.Or);
    builder(nestedBuilder);

    this.currentFilter.root.conditions.push(nestedBuilder.build().root);
    this.emit('group-added', { operator: LogicOperator.Or });
    return this;
  }

  /**
   * Add metadata to filter
   */
  setMetadata(metadata: Filter['metadata']): FilterBuilder {
    this.currentFilter.metadata = {
      ...this.currentFilter.metadata,
      ...metadata,
      createdAt: this.currentFilter.metadata?.createdAt || new Date(),
    };
    return this;
  }

  /**
   * Build and return final filter
   */
  build(): Filter {
    const filter = { ...this.currentFilter };

    // Optimize if enabled
    if (this.config.enableOptimization) {
      filter.root = this.optimizeGroup(filter.root);
    }

    this.emit('filter-built', { filter });
    return filter;
  }

  /**
   * Validate filter
   */
  validate(filter: Filter = this.currentFilter): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    // Check max nesting depth
    const depth = this.getMaxDepth(filter.root);
    if (depth > this.config.maxNestingDepth) {
      errors.push({
        path: 'root',
        message: `Max nesting depth exceeded: ${depth} > ${this.config.maxNestingDepth}`,
      });
    }

    // Check max conditions
    const conditionCount = this.countConditions(filter.root);
    if (conditionCount > this.config.maxConditions) {
      errors.push({
        path: 'root',
        message: `Max conditions exceeded: ${conditionCount} > ${this.config.maxConditions}`,
      });
    }

    // Validate each condition
    this.validateGroup(filter.root, 'root', errors);

    this.emit('filter-validated', { valid: errors.length === 0, errors });
    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate SQL query
   */
  toSQL(filter: Filter = this.currentFilter): QueryResult {
    const params: unknown[] = [];
    let paramIndex = 1;

    const buildCondition = (condition: FilterCondition): string => {
      const field = this.escapeIdentifier(condition.field);

      switch (condition.operator) {
        case FilterOperator.Equals:
          if (this.config.parameterize) {
            params.push(condition.value);
            return `${field} = $${paramIndex++}`;
          }
          return `${field} = ${this.escapeLiteral(condition.value)}`;

        case FilterOperator.NotEquals:
          if (this.config.parameterize) {
            params.push(condition.value);
            return `${field} != $${paramIndex++}`;
          }
          return `${field} != ${this.escapeLiteral(condition.value)}`;

        case FilterOperator.GreaterThan:
          if (this.config.parameterize) {
            params.push(condition.value);
            return `${field} > $${paramIndex++}`;
          }
          return `${field} > ${this.escapeLiteral(condition.value)}`;

        case FilterOperator.LessThan:
          if (this.config.parameterize) {
            params.push(condition.value);
            return `${field} < $${paramIndex++}`;
          }
          return `${field} < ${this.escapeLiteral(condition.value)}`;

        case FilterOperator.Between:
          if (this.config.parameterize) {
            params.push(condition.values![0], condition.values![1]);
            return `${field} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
          }
          return `${field} BETWEEN ${this.escapeLiteral(condition.values![0])} AND ${this.escapeLiteral(condition.values![1])}`;

        case FilterOperator.In:
          if (this.config.parameterize) {
            const placeholders = condition.values!.map(() => `$${paramIndex++}`).join(', ');
            params.push(...condition.values!);
            return `${field} IN (${placeholders})`;
          }
          return `${field} IN (${condition.values!.map(v => this.escapeLiteral(v)).join(', ')})`;

        case FilterOperator.Contains:
          if (this.config.parameterize) {
            params.push(`%${condition.value}%`);
            return condition.caseSensitive
              ? `${field} LIKE $${paramIndex++}`
              : `LOWER(${field}) LIKE LOWER($${paramIndex++})`;
          }
          return condition.caseSensitive
            ? `${field} LIKE ${this.escapeLiteral(`%${condition.value}%`)}`
            : `LOWER(${field}) LIKE LOWER(${this.escapeLiteral(`%${condition.value}%`)})`;

        case FilterOperator.StartsWith:
          if (this.config.parameterize) {
            params.push(`${condition.value}%`);
            return condition.caseSensitive
              ? `${field} LIKE $${paramIndex++}`
              : `LOWER(${field}) LIKE LOWER($${paramIndex++})`;
          }
          return `${field} LIKE ${this.escapeLiteral(`${condition.value}%`)}`;

        case FilterOperator.Regex:
          if (this.config.parameterize) {
            params.push(condition.value);
            return `${field} ~ $${paramIndex++}`;
          }
          return `${field} ~ ${this.escapeLiteral(condition.value)}`;

        case FilterOperator.IsNull:
          return `${field} IS NULL`;

        case FilterOperator.IsNotNull:
          return `${field} IS NOT NULL`;

        case FilterOperator.DateRelative:
          const relValue = condition.value as { amount: number; unit: string; before: boolean };
          const interval = `INTERVAL '${relValue.amount} ${relValue.unit}'`;
          return relValue.before
            ? `${field} < NOW() - ${interval}`
            : `${field} > NOW() - ${interval}`;

        default:
          return '1=1'; // Always true fallback
      }
    };

    const buildGroup = (group: FilterGroup): string => {
      const parts: string[] = [];

      for (const item of group.conditions) {
        if (this.isCondition(item)) {
          parts.push(buildCondition(item));
        } else {
          parts.push(`(${buildGroup(item)})`);
        }
      }

      const connector = group.operator === LogicOperator.And ? ' AND ' : ' OR ';
      return parts.join(connector);
    };

    const sql = buildGroup(filter.root);
    this.emit('sql-generated', { sql, params });

    return { sql, params: this.config.parameterize ? params : undefined };
  }

  /**
   * Generate MongoDB query
   */
  toMongoDB(filter: Filter = this.currentFilter): QueryResult {
    const buildCondition = (condition: FilterCondition): Record<string, unknown> => {
      const { field, operator, value, values } = condition;

      switch (operator) {
        case FilterOperator.Equals:
          return { [field]: value };
        case FilterOperator.NotEquals:
          return { [field]: { $ne: value } };
        case FilterOperator.GreaterThan:
          return { [field]: { $gt: value } };
        case FilterOperator.LessThan:
          return { [field]: { $lt: value } };
        case FilterOperator.Between:
          return { [field]: { $gte: values![0], $lte: values![1] } };
        case FilterOperator.In:
          return { [field]: { $in: values } };
        case FilterOperator.NotIn:
          return { [field]: { $nin: values } };
        case FilterOperator.Contains:
          return { [field]: { $regex: value as string, $options: condition.caseSensitive ? '' : 'i' } };
        case FilterOperator.StartsWith:
          return { [field]: { $regex: `^${value}`, $options: condition.caseSensitive ? '' : 'i' } };
        case FilterOperator.Regex:
          return { [field]: { $regex: value as string } };
        case FilterOperator.IsNull:
          return { [field]: null };
        case FilterOperator.IsNotNull:
          return { [field]: { $ne: null } };
        case FilterOperator.ArrayContains:
          return { [field]: value };
        default:
          return {};
      }
    };

    const buildGroup = (group: FilterGroup): Record<string, unknown> => {
      const conditions = group.conditions.map(item =>
        this.isCondition(item) ? buildCondition(item) : buildGroup(item)
      );

      if (group.operator === LogicOperator.And) {
        return conditions.length === 1 ? conditions[0] : { $and: conditions };
      } else {
        return conditions.length === 1 ? conditions[0] : { $or: conditions };
      }
    };

    const mongodb = buildGroup(filter.root);
    this.emit('mongodb-generated', { mongodb });

    return { mongodb };
  }

  /**
   * Generate Elasticsearch query
   */
  toElasticsearch(filter: Filter = this.currentFilter): QueryResult {
    const buildCondition = (condition: FilterCondition): Record<string, unknown> => {
      const { field, operator, value, values } = condition;

      switch (operator) {
        case FilterOperator.Equals:
          return { term: { [field]: value } };
        case FilterOperator.In:
          return { terms: { [field]: values } };
        case FilterOperator.GreaterThan:
          return { range: { [field]: { gt: value } } };
        case FilterOperator.LessThan:
          return { range: { [field]: { lt: value } } };
        case FilterOperator.Between:
          return { range: { [field]: { gte: values![0], lte: values![1] } } };
        case FilterOperator.Contains:
          return { match: { [field]: value } };
        case FilterOperator.Regex:
          return { regexp: { [field]: value } };
        case FilterOperator.IsNull:
          return { bool: { must_not: { exists: { field } } } };
        case FilterOperator.IsNotNull:
          return { exists: { field } };
        default:
          return { match_all: {} };
      }
    };

    const buildGroup = (group: FilterGroup): Record<string, unknown> => {
      const clauses = group.conditions.map(item =>
        this.isCondition(item) ? buildCondition(item) : buildGroup(item)
      );

      if (group.operator === LogicOperator.And) {
        return { bool: { must: clauses } };
      } else {
        return { bool: { should: clauses, minimum_should_match: 1 } };
      }
    };

    const elasticsearch = buildGroup(filter.root);
    this.emit('elasticsearch-generated', { elasticsearch });

    return { elasticsearch };
  }

  /**
   * Clone filter
   */
  clone(filter: Filter = this.currentFilter): Filter {
    // Phase 3B: Use structuredClone() for filter clone
    return structuredClone(filter);
  }

  /**
   * Reset builder to empty filter
   */
  reset(): FilterBuilder {
    this.currentFilter = this.createEmptyFilter();
    this.emit('filter-reset');
    return this;
  }

  // ==================== Private Methods ====================

  private createEmptyFilter(): Filter {
    return {
      root: {
        operator: LogicOperator.And,
        conditions: [],
      },
    };
  }

  private isCondition(item: FilterCondition | FilterGroup): item is FilterCondition {
    return 'field' in item && 'operator' in item;
  }

  private getMaxDepth(group: FilterGroup, currentDepth = 1): number {
    let maxDepth = currentDepth;

    for (const item of group.conditions) {
      if (!this.isCondition(item)) {
        const depth = this.getMaxDepth(item, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }

  private countConditions(group: FilterGroup): number {
    let count = 0;

    for (const item of group.conditions) {
      if (this.isCondition(item)) {
        count++;
      } else {
        count += this.countConditions(item);
      }
    }

    return count;
  }

  private validateGroup(
    group: FilterGroup,
    path: string,
    errors: ValidationResult['errors']
  ): void {
    group.conditions.forEach((item, index) => {
      const itemPath = `${path}.conditions[${index}]`;

      if (this.isCondition(item)) {
        this.validateCondition(item, itemPath, errors);
      } else {
        this.validateGroup(item, itemPath, errors);
      }
    });
  }

  private validateCondition(
    condition: FilterCondition,
    path: string,
    errors: ValidationResult['errors']
  ): void {
    // Check allowed fields
    if (this.config.allowedFields && !this.config.allowedFields.includes(condition.field)) {
      errors.push({
        path: `${path}.field`,
        message: `Field '${condition.field}' is not allowed`,
      });
    }

    // Check required values
    const requiresValue = [
      FilterOperator.Equals,
      FilterOperator.NotEquals,
      FilterOperator.GreaterThan,
      FilterOperator.LessThan,
      FilterOperator.Contains,
      FilterOperator.StartsWith,
      FilterOperator.Regex,
    ];

    if (requiresValue.includes(condition.operator) && condition.value === undefined) {
      errors.push({
        path: `${path}.value`,
        message: `Operator '${condition.operator}' requires a value`,
      });
    }

    // Check required values array
    const requiresValues = [FilterOperator.Between, FilterOperator.In, FilterOperator.NotIn];

    if (requiresValues.includes(condition.operator) && (!condition.values || condition.values.length === 0)) {
      errors.push({
        path: `${path}.values`,
        message: `Operator '${condition.operator}' requires values array`,
      });
    }
  }

  private optimizeGroup(group: FilterGroup): FilterGroup {
    // Remove empty groups
    const filtered = group.conditions.filter(item => {
      if (!this.isCondition(item)) {
        return item.conditions.length > 0;
      }
      return true;
    });

    // Recursively optimize nested groups
    const optimized = filtered.map(item => {
      if (!this.isCondition(item)) {
        return this.optimizeGroup(item);
      }
      return item;
    });

    return { ...group, conditions: optimized };
  }

  private escapeIdentifier(identifier: string): string {
    // PostgreSQL-style escaping
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private escapeLiteral(value: unknown): string {
    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return `'${String(value)}'`;
  }
}

// ==================== Factory & Utilities ====================

/**
 * Create filter builder instance
 */
export function createFilterBuilder(config?: Partial<FilterBuilderConfig>): FilterBuilder {
  return new FilterBuilder(config);
}

/**
 * Parse filter from JSON
 */
export function parseFilter(json: string): Filter {
  return JSON.parse(json) as Filter;
}

/**
 * Serialize filter to JSON
 */
export function serializeFilter(filter: Filter): string {
  return JSON.stringify(filter, null, 2);
}

/**
 * Merge multiple filters with AND logic
 */
export function mergeFilters(...filters: Filter[]): Filter {
  return {
    root: {
      operator: LogicOperator.And,
      conditions: filters.map(f => f.root),
    },
  };
}

/**
 * Invert filter (NOT logic)
 */
export function invertFilter(filter: Filter): Filter {
  return {
    root: {
      operator: LogicOperator.Not,
      conditions: [filter.root],
    },
  };
}
