import { Command } from 'commander';
import { registerExportCommand } from '../export';
import * as vault from '../../storage/vault';
import * as keystore from '../../crypto/keystore';
import * as crypto from '../../crypto/encryption';
import * as parser from '../../env/parser';
import * as audit from '../../storage/audit';
import * as fs from 'fs';

jest.mock('../../storage/vault');
jest.mock('../../crypto/keystore');
jest.mock('../../crypto/encryption');
jest.mock('../../env/parser');
jest.mock('../../storage/audit');
jest.mock('fs');

const mockVaultExists = vault.vaultExists as jest.Mock;
const mockGetVaultPath = vault.getVaultPath as jest.Mock;
const mockRetrieveKey = keystore.retrieveProjectKey as jest.Mock;
const mockDecrypt = crypto.decrypt as jest.Mock;
const mockParseEnv = parser.parseEnv as jest.Mock;
const mockSerializeEnv = parser.serializeEnv as jest.Mock;
const mockAppendAudit = audit.appendAuditLog as jest.Mock;
const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockWriteFileSync = fs.writeFileSync as jest.Mock;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerExportCommand(program);
  return program;
}

const sampleVars = { API_KEY: 'abc123', DB_HOST: 'localhost' };
const encryptedVaultContent = JSON.stringify({ encrypted: 'enc', iv: 'iv', tag: 'tag' });

beforeEach(() => {
  jest.clearAllMocks();
  mockVaultExists.mockReturnValue(true);
  mockGetVaultPath.mockReturnValue('/mock/vault/default.vault');
  mockRetrieveKey.mockResolvedValue('mockkey');
  mockDecrypt.mockReturnValue('API_KEY=abc123\nDB_HOST=localhost');
  mockParseEnv.mockReturnValue(sampleVars);
  mockSerializeEnv.mockReturnValue('API_KEY=abc123\nDB_HOST=localhost');
  mockAppendAudit.mockResolvedValue(undefined);
  mockReadFileSync.mockReturnValue(encryptedVaultContent);
});

describe('export command', () => {
  it('exports to stdout in dotenv format by default', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'export']);
    expect(mockParseEnv).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('exports to a file when --output is specified', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'export', '-o', '/tmp/out.env']);
    expect(mockWriteFileSync).toHaveBeenCalledWith(expect.stringContaining('out.env'), expect.any(String), 'utf-8');
    consoleSpy.mockRestore();
  });

  it('exports in JSON format', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'export', '-f', 'json']);
    const output = consoleSpy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
    expect(JSON.parse(output)).toEqual(sampleVars);
    consoleSpy.mockRestore();
  });

  it('exports in shell format', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'export', '-f', 'shell']);
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('export API_KEY=');
    consoleSpy.mockRestore();
  });

  it('exits if vault does not exist', async () => {
    mockVaultExists.mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['node', 'envault', 'export'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('appends audit log after export', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await buildProgram().parseAsync(['node', 'envault', 'export']);
    expect(mockAppendAudit).toHaveBeenCalledWith('default', expect.objectContaining({ action: 'export' }));
    consoleSpy.mockRestore();
  });
});
