import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addMember,
  removeMember,
  updateMemberRole,
  listMembers,
  loadTeams,
} from '../teams';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-teams-'));
}

describe('teams storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty members list when no file exists', () => {
    expect(listMembers(tmpDir)).toEqual([]);
  });

  it('adds a new member', () => {
    const member = addMember(tmpDir, { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' });
    expect(member.email).toBe('alice@example.com');
    expect(member.role).toBe('admin');
    expect(member.addedAt).toBeDefined();
    expect(listMembers(tmpDir)).toHaveLength(1);
  });

  it('throws when adding duplicate email', () => {
    addMember(tmpDir, { id: '1', name: 'Alice', email: 'alice@example.com', role: 'member' });
    expect(() =>
      addMember(tmpDir, { id: '2', name: 'Alice2', email: 'alice@example.com', role: 'viewer' })
    ).toThrow("Member with email 'alice@example.com' already exists.");
  });

  it('removes a member by email', () => {
    addMember(tmpDir, { id: '1', name: 'Bob', email: 'bob@example.com', role: 'member' });
    const removed = removeMember(tmpDir, 'bob@example.com');
    expect(removed).toBe(true);
    expect(listMembers(tmpDir)).toHaveLength(0);
  });

  it('returns false when removing non-existent member', () => {
    expect(removeMember(tmpDir, 'nobody@example.com')).toBe(false);
  });

  it('updates member role', () => {
    addMember(tmpDir, { id: '1', name: 'Carol', email: 'carol@example.com', role: 'viewer' });
    const updated = updateMemberRole(tmpDir, 'carol@example.com', 'admin');
    expect(updated).toBe(true);
    const members = listMembers(tmpDir);
    expect(members[0].role).toBe('admin');
  });

  it('returns false when updating role of non-existent member', () => {
    expect(updateMemberRole(tmpDir, 'ghost@example.com', 'member')).toBe(false);
  });

  it('persists multiple members across loadTeams calls', () => {
    addMember(tmpDir, { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' });
    addMember(tmpDir, { id: '2', name: 'Bob', email: 'bob@example.com', role: 'member' });
    addMember(tmpDir, { id: '3', name: 'Carol', email: 'carol@example.com', role: 'viewer' });

    const loaded = loadTeams(tmpDir);
    expect(loaded.members).toHaveLength(3);
    expect(loaded.members.map((m) => m.email)).toEqual([
      'alice@example.com',
      'bob@example.com',
      'carol@example.com',
    ]);
  });
});
