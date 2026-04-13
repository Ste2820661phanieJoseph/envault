import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerTeamCommand } from '../team';
import * as teamsStorage from '../../storage/teams';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTeamCommand(program);
  return program;
}

describe('team command', () => {
  let tmpDir: string;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-team-cmd-'));
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('adds a team member', () => {
    const program = buildProgram();
    program.parse(['node', 'envault', 'team', 'add', 'alice@example.com', '--name', 'Alice', '--role', 'admin', '--id', 'u1']);
    const members = teamsStorage.listMembers(path.join(tmpDir, '.envault'));
    expect(members).toHaveLength(1);
    expect(members[0].email).toBe('alice@example.com');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Added Alice'));
  });

  it('lists team members', () => {
    const vaultDir = path.join(tmpDir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    teamsStorage.addMember(vaultDir, { id: '1', name: 'Bob', email: 'bob@example.com', role: 'member' });
    const program = buildProgram();
    program.parse(['node', 'envault', 'team', 'list']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('bob@example.com'));
  });

  it('shows message when no members', () => {
    const program = buildProgram();
    program.parse(['node', 'envault', 'team', 'list']);
    expect(consoleLogSpy).toHaveBeenCalledWith('No team members found.');
  });

  it('updates member role', () => {
    const vaultDir = path.join(tmpDir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    teamsStorage.addMember(vaultDir, { id: '1', name: 'Carol', email: 'carol@example.com', role: 'viewer' });
    const program = buildProgram();
    program.parse(['node', 'envault', 'team', 'role', 'carol@example.com', 'admin']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Updated carol@example.com to role 'admin'"));
    const members = teamsStorage.listMembers(vaultDir);
    expect(members[0].role).toBe('admin');
  });

  it('removes a team member', () => {
    const vaultDir = path.join(tmpDir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    teamsStorage.addMember(vaultDir, { id: '1', name: 'Dave', email: 'dave@example.com', role: 'member' });
    const program = buildProgram();
    program.parse(['node', 'envault', 'team', 'remove', 'dave@example.com']);
    expect(consoleLogSpy).toHaveBeenCalledWith('Removed member: dave@example.com');
    expect(teamsStorage.listMembers(vaultDir)).toHaveLength(0);
  });
});
