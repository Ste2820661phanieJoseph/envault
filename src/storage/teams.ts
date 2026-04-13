import * as fs from 'fs';
import * as path from 'path';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  addedAt: string;
}

export interface TeamsConfig {
  members: TeamMember[];
}

export function getTeamsPath(vaultDir: string): string {
  return path.join(vaultDir, 'teams.json');
}

export function loadTeams(vaultDir: string): TeamsConfig {
  const teamsPath = getTeamsPath(vaultDir);
  if (!fs.existsSync(teamsPath)) {
    return { members: [] };
  }
  const raw = fs.readFileSync(teamsPath, 'utf-8');
  return JSON.parse(raw) as TeamsConfig;
}

export function saveTeams(vaultDir: string, config: TeamsConfig): void {
  const teamsPath = getTeamsPath(vaultDir);
  fs.writeFileSync(teamsPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function addMember(vaultDir: string, member: Omit<TeamMember, 'addedAt'>): TeamMember {
  const config = loadTeams(vaultDir);
  if (config.members.find((m) => m.email === member.email)) {
    throw new Error(`Member with email '${member.email}' already exists.`);
  }
  const newMember: TeamMember = { ...member, addedAt: new Date().toISOString() };
  config.members.push(newMember);
  saveTeams(vaultDir, config);
  return newMember;
}

export function removeMember(vaultDir: string, email: string): boolean {
  const config = loadTeams(vaultDir);
  const index = config.members.findIndex((m) => m.email === email);
  if (index === -1) return false;
  config.members.splice(index, 1);
  saveTeams(vaultDir, config);
  return true;
}

export function updateMemberRole(vaultDir: string, email: string, role: TeamMember['role']): boolean {
  const config = loadTeams(vaultDir);
  const member = config.members.find((m) => m.email === email);
  if (!member) return false;
  member.role = role;
  saveTeams(vaultDir, config);
  return true;
}

export function listMembers(vaultDir: string): TeamMember[] {
  return loadTeams(vaultDir).members;
}
