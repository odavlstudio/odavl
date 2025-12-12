/**
 * Organization Model - Multi-tenant organization entity
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  planId: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  isActive: boolean;
}

export class OrgManager {
  private orgs: Map<string, Organization> = new Map();

  createOrganization(params: Omit<Organization, 'id' | 'createdAt'>): Organization {
    const org: Organization = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...params,
    };
    this.orgs.set(org.id, org);
    return org;
  }

  getOrgById(id: string): Organization | undefined {
    return this.orgs.get(id);
  }

  getOrgBySlug(slug: string): Organization | undefined {
    return Array.from(this.orgs.values()).find((o) => o.slug === slug);
  }

  updateOrg(id: string, updates: Partial<Organization>): Organization | null {
    const org = this.orgs.get(id);
    if (!org) return null;
    Object.assign(org, updates);
    return org;
  }

  deleteOrg(id: string): boolean {
    return this.orgs.delete(id);
  }

  listOrgs(ownerId?: string): Organization[] {
    const all = Array.from(this.orgs.values());
    return ownerId ? all.filter((o) => o.ownerId === ownerId) : all;
  }
}
