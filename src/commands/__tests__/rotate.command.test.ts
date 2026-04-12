import { Command } from 'commander';
import { registerRotateCommand } from '../rotate';
import * as vault from '../../storage/vault';
import * as lock from '../../storage/lock';
import * as crypto from '../../crypto/encryption';
import * as fs from 'fs';

jest.mock('../../storage/vault');
jest.mock('../../storage/lock');
jest.mock('../../crypto/encryption');
jest.mock('../../crypto/keystore');
jest.mock('fs');

const mockPrompt = jest.fn();
jest.mock('prompts', () => mockPrompt);

describe('rotate command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerRotateCommand(program);
    jest.clearAllMocks();
  });

  it('registers the rotate command', () => {
    const cmd = program.commands.find((c) => c.name() === 'rotate');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toBe('Rotate the encryption key for the current project vault');
  });

  it('exits if vault does not exist', async () => {
    (vault.vaultExists as jest.Mock).mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(program.parseAsync(['node', 'envault', 'rotate', '-p', 'myproject']))
      .rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('exits if new passphrases do not match', async () => {
    (vault.vaultExists as jest.Mock).mockReturnValue(true);
    mockPrompt
      .mockResolvedValueOnce({ oldPassphrase: 'old' })
      .mockResolvedValueOnce({ newPassphrase: 'new1' })
      .mockResolvedValueOnce({ confirmPassphrase: 'new2' });

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(program.parseAsync(['node', 'envault', 'rotate', '-p', 'myproject']))
      .rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('rotates the key successfully', async () => {
    (vault.vaultExists as jest.Mock).mockReturnValue(true);
    (vault.getVaultPath as jest.Mock).mockReturnValue('/fake/.envault/myproject.vault');
    (lock.withLock as jest.Mock).mockImplementation(async (_name: string, fn: () => Promise<void>) => fn());
    (fs.readFileSync as jest.Mock).mockReturnValue('encrypted-data');
    (crypto.deriveKey as jest.Mock).mockResolvedValue('derived-key');
    (crypto.decrypt as jest.Mock).mockResolvedValue('plain-text');
    (crypto.encrypt as jest.Mock).mockResolvedValue('new-encrypted-data');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    mockPrompt
      .mockResolvedValueOnce({ oldPassphrase: 'old' })
      .mockResolvedValueOnce({ newPassphrase: 'newpass' })
      .mockResolvedValueOnce({ confirmPassphrase: 'newpass' });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envault', 'rotate', '-p', 'myproject']);

    expect(crypto.decrypt).toHaveBeenCalledWith('encrypted-data', 'derived-key');
    expect(crypto.encrypt).toHaveBeenCalledWith('plain-text', 'derived-key');
    expect(fs.writeFileSync).toHaveBeenCalledWith('/fake/.envault/myproject.vault', 'new-encrypted-data', 'utf-8');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Key rotated successfully'));

    consoleSpy.mockRestore();
  });
});
