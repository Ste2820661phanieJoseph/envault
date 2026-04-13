import * as fs from 'fs';
import * as path from 'path';

export interface Permission {
  user: string;
  role: 'read' | 'write' | 'admin';
  grantedAt: string;
  grantedBy: string;
}

export interface PermissionsStore {
  projectId: string;
  permissions: Permission[];
}

export function getPermissionsPath(vaultDir: string): string {
  return path.join(vaultDir, 'permissions.json');
}

export function loadPermissions(vaultDir: string): PermissionsStore {
  const filePath = getPermissionsPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { projectId: '', permissions: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as PermissionsStore;
}

export function savePermissions(vaultDir: string, store: PermissionsStore): void {
  const filePath = getPermissionsPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addPermission(
  vaultDir: string,
  user: string,
  role: Permission['role'],
  grantedBy: string
): PermissionsStore {
  const store = loadPermissions(vaultDir);
  const existing = store.permissions.findIndex((p) => p.user === user);
  const entry: Permission = {
    user,
    role,
    grantedAt: new Date().toISOString(),
    grantedBy,
  };
  if (existing >= 0) {
    store.permissions[existing] = entry;
  } else {
    store.permissions.push(entry);
  }
  savePermissions(vaultDir, store);
  return store;
}

export function removePermission(vaultDir: string, user: string): PermissionsStore {
  const store = loadPermissions(vaultDir);
  store.permissions = store.permissions.filter((p) => p.user !== user);
  savePermissions(vaultDir, store);
  return store;
}

export function getPermission(vaultDir: string, user: string): Permission | undefined {
  const store = loadPermissions(vaultDir);
  return store.permissions.find((p) => p.user === user);
}

export function hasRole(
  vaultDir: string,
  user: string,
  role: Permission['role']
): boolean {
  const permission = getPermission(vaultDir, user);
  if (!permission) return false;
  const hierarchy: Permission['role'][] = ['read', 'write', 'admin'];
  return hierarchy.indexOf(permission.role) >= hierarchy.indexOf(role);
}
