import { Command } from 'commander';
import { registerStatusCommand } from '../status';
import * as vault from '../../storage/vault';
import * as lock from '../../storage/lock';
import * as history from '../../storage/history';
import * as keystore from '../../crypto/keystore';
import * as encryption from '../../crypto/encryption';
import * as fs from 'fs';

jest.mock('../../storage/vault');
jest.mock('../../storage/lock');
jest.mock('../../storage/history');
jest.mock('../../crypto/keystore');
jest.mock('../../crypto/encryption');
jest.mock('fs');

describe('status command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    registerStatusCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should report no vault if vault does not exist', async () => {
    (vault.vaultExists as jest.Mock).mockReturnValue(false);
    await program.parseAsync(['node', 'test', 'status']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('should show locked status when vault is locked', async () => {
    (vault.vaultExists as jest.Mock).mockReturnValue(true);
    (lock.isLocked as jest.Mock).mockReturnValue(true);
    (history.getLatestEntry as jest.Mock).mockReturnValue(null);
    (keystore.retrieveProjectKey as jest.Mock).mockResolvedValue(null);
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    await program.parseAsync(['node', 'test', 'status']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Locked'));
  });

  it('should show last synced info when history exists', async () => {
    (vault.vaultExists as jest.Mock).mockReturnValue(true);
    (lock.isLocked as jest.Mock).mockReturnValue(false);
    (history.getLatestEntry as jest.Mock).mockReturnValue({
      timestamp: new Date('2024-01-01').toISOString(),
      author: 'alice'
    });
    (keystore.retrieveProjectKey as jest.Mock).mockResolvedValue(null);
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    await program.parseAsync(['node', 'test', 'status']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('alice'));
  });

  it('should report in sync when local and vault match', async () => {
    (vault.vaultExists as jest.Mock).mockReturnValue(true);
    (lock.isLocked as jest.Mock).mockReturnValue(false);
    (history.getLatestEntry as jest.Mock).mockReturnValue(null);
    (keystore.retrieveProjectKey as jest.Mock).mockResolvedValue('mock-key');
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('KEY=value\n');
    (vault.getVaultPath as jest.Mock).mockReturnValue('/fake/vault');
    (encryption.decrypt as jest.Mock).mockResolvedValue('KEY=value\n');
    await program.parseAsync(['node', 'test', 'status']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('in sync'));
  });
});
