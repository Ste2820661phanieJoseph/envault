import * as fs from 'fs';
import * as path from 'path';
import { pushEnv, pullEnv, diffEnv } from '../sync';
import { encrypt, decrypt } from '../../crypto/encryption';
import { retrieveProjectKey } from '../../crypto/keystore';
import { getVaultPath, ensureVaultDir } from '../vault';

jest.mock('../../crypto/keystore');
jest.mock('../vault');
jest.mock('fs');

const mockRetrieveProjectKey = retrieveProjectKey as jest.MockedFunction<typeof retrieveProjectKey>;
const mockGetVaultPath = getVaultPath as jest.MockedFunction<typeof getVaultPath>;
const mockEnsureVaultDir = ensureVaultDir as jest.MockedFunction<typeof ensureVaultDir>;

const MOCK_KEY = 'mock-key-32-bytes-long-padding!!!';
const MOCK_PROJECT_ID = 'test-project';
const MOCK_ENV_CONTENT = 'API_KEY=secret\nDB_URL=postgres://localhost/db';
const MOCK_VAULT_PATH = '/mock/.envault/test-project.vault';

describe('sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVaultPath.mockReturnValue(MOCK_VAULT_PATH);
    mockEnsureVaultDir.mockImplementation(() => {});
  });

  describe('pushEnv', () => {
    it('should throw if env file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await expect(pushEnv({ projectId: MOCK_PROJECT_ID })).rejects.toThrow('Environment file not found');
    });

    it('should throw if no key found for project', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRetrieveProjectKey.mockResolvedValue(null);
      await expect(pushEnv({ projectId: MOCK_PROJECT_ID })).rejects.toThrow('No encryption key found');
    });

    it('should write encrypted content to vault', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(MOCK_ENV_CONTENT);
      mockRetrieveProjectKey.mockResolvedValue(MOCK_KEY);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await pushEnv({ projectId: MOCK_PROJECT_ID });

      expect(fs.writeFileSync).toHaveBeenCalledWith(MOCK_VAULT_PATH, expect.any(String), 'utf-8');
    });
  });

  describe('diffEnv', () => {
    it('should return lines present in incoming but not in current', () => {
      const current = 'API_KEY=old\nDB_URL=postgres://localhost/db';
      const incoming = 'API_KEY=old\nDB_URL=postgres://localhost/db\nNEW_VAR=value';
      const diff = diffEnv(current, incoming);
      expect(diff).toEqual(['NEW_VAR=value']);
    });

    it('should return empty array when files are identical', () => {
      const diff = diffEnv(MOCK_ENV_CONTENT, MOCK_ENV_CONTENT);
      expect(diff).toHaveLength(0);
    });
  });
});
