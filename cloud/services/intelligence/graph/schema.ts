/**
 * Knowledge Graph Schema
 * Entity and relationship definitions
 */

export type EntityType = 'File' | 'Detector' | 'Issue' | 'Fix' | 'Service' | 'Event';
export type RelationType = 'FILE_HAS_ISSUE' | 'ISSUE_DETECTED_BY' | 'FIX_MODIFIES_FILE' | 'EVENT_FROM_SERVICE';

export interface Entity {
  id: string;
  type: EntityType;
  properties: Record<string, unknown>;
  createdAt: string;
}

export interface Relationship {
  id: string;
  type: RelationType;
  sourceId: string;
  targetId: string;
  properties?: Record<string, unknown>;
  createdAt: string;
}

export interface GraphQuery {
  entityType?: EntityType;
  relationshipType?: RelationType;
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface QueryResult {
  entities: Entity[];
  relationships: Relationship[];
}
