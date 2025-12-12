/**
 * Team Model - Organization sub-groups
 */

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: Date;
}

export class TeamManager {
  private teams: Map<string, Team> = new Map();

  createTeam(params: Omit<Team, 'id' | 'createdAt'>): Team {
    const team: Team = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...params,
    };
    this.teams.set(team.id, team);
    return team;
  }

  getTeamById(id: string): Team | undefined {
    return this.teams.get(id);
  }

  listTeams(organizationId: string): Team[] {
    return Array.from(this.teams.values()).filter((t) => t.organizationId === organizationId);
  }

  addMember(teamId: string, userId: string): boolean {
    const team = this.teams.get(teamId);
    if (!team || team.memberIds.includes(userId)) return false;
    team.memberIds.push(userId);
    return true;
  }

  removeMember(teamId: string, userId: string): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;
    team.memberIds = team.memberIds.filter((id) => id !== userId);
    return true;
  }
}
