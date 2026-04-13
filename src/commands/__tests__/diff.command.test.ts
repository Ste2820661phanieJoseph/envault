import { Command } from 'commander';
import * as fs from 'fs';
import { registerDiffCommand } from '../diff';
import * as vault from '../../storage/vault';
import * as keystore from '../../crypto/keystore';
import * as encryption from '../../crypto/encryption';
import * as parser from '../../env/parser';
import * as sync from '../../storage/sync';

jest.mock('fs');
jest.mock('../../storage/vault');
jest.mock('../../crypto/keystore');
jest.mock('../../crypto/encryption');
jest.mock('../../env/parser');
jest.mock('../../storage/sync');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockVault = vault as jest.Mocked<typeof vault>;
const mockKeystore = keystore as jest.Mocked<typeof keystore>;
const mockEncryption = encryption as jest.Mocked<typeof encryption>;
const mockParser = parser as jest.Mocked<typeof parser>;
const mockSync = sync as jest.Mocked<typeof sync>;

describe('diff command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerDiffCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exits if vault does not exist', async () => {
    mockVault.vaultExists.mockReturnValue(false);
    await expect(program.parseAsync(['node', 'test', 'diff'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if local env file does not exist', async () => {
    mockVault.vaultExists.mockReturnValue(true);
    mockFs.existsSync.mockReturnValue(false);
    await expect(program.parseAsync(['node', 'test', 'diff'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if no key found', async () => {
    mockVault.vaultExists.mockReturnValue(true);
    mockFs.existsSync.mockReturnValue(true);
    mockKeystore.retrieveProjectKey.mockResolvedValue(null);
    await expect(program.parseAsync(['node', 'test', 'diff'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('reports no differences when envs match', async () => {
    mockVault.vaultExists.mockReturnValue(true);
    mockFs.existsSync.mockReturnValue(true);
    mockKeystore.retrieveProjectKey.mockResolvedValue('mock-key');
    mockVault.getVaultPath.mockReturnValue('/mock/vault.json');
    mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ iv: 'x', data: 'y' })).mockReturnValueOnce('KEY=value');
    mockEncryption.decrypt.mockResolvedValue('KEY=value');
    const env = { KEY: 'value' };
    mockParser.parseEnv.mockReturnValue(env);
    mockSync.diffEnv.mockReturnValue({ added: [], removed: [], modified: [] });

    await program.parseAsync(['node', 'test', 'diff']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No differences'));
  });

  it('displays added, removed, and modified keys', async () => {
    mockVault.vaultExists.mockReturnValue(true);
    mockFs.existsSync.mockReturnValue(true);
    mockKeystore.retrieveProjectKey.mockResolvedValue('mock-key');
    mockVault.getVaultPath.mockReturnValue('/mock/vault.json');
    mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ iv: 'x', data: 'y' })).mockReturnValueOnce('KEY=value');
    mockEncryption.decrypt.mockResolvedValue('KEY=value');
    mockParser.parseEnv.mockReturnValue({ KEY: 'value' });
    mockSync.diffEnv.mockReturnValue({ added: ['NEW_KEY'], removed: ['OLD_KEY'], modified: ['KEY'] });

    await program.parseAsync(['node', 'test', 'diff']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Added'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Removed'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Modified'));
  });
});
